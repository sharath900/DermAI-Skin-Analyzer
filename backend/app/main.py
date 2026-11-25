import json
import uuid
import hashlib
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import UnidentifiedImageError
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import engine, get_db, Base, migrate_legacy_schema
from app.model import User, ScanRecord
from app.predicted import predict_skin_disease

Base.metadata.create_all(bind=engine)
migrate_legacy_schema()

app = FastAPI(title="DermAI Milestone 3 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@app.get("/")
def root():
    return {"message": "Derm AI API & SQLite connected!"}

@app.post("/auth/register")
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered.")
    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "full_name": user.full_name, "email": user.email}

@app.post("/auth/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or user.password_hash != hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return {"id": user.id, "full_name": user.full_name, "email": user.email}

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    user_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are accepted.",
        )

    image_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image size must be under 10 MB.")

    try:
        result = predict_skin_disease(image_bytes)
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.") from exc

    scan_uuid = uuid.uuid4().hex
    ext = Path(file.filename or "").suffix.lower()
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        ext = ".png"

    orig_filename = f"{scan_uuid}_orig{ext}"
    prep_filename = f"{scan_uuid}_prep.png"
    cam_filename = f"{scan_uuid}_cam.png"

    with open(UPLOAD_DIR / orig_filename, "wb") as f:
        f.write(image_bytes)

    with open(UPLOAD_DIR / prep_filename, "wb") as f:
        f.write(result["preprocessed_bytes"])

    with open(UPLOAD_DIR / cam_filename, "wb") as f:
        f.write(result["gradcam_bytes"])

    record = ScanRecord(
        user_id=user_id,
        original_filename=file.filename or orig_filename,
        saved_image_url=f"/uploads/{orig_filename}",
        preprocessed_image_url=f"/uploads/{prep_filename}",
        gradcam_image_url=f"/uploads/{cam_filename}",
        predicted_code=result["predicted_code"],
        predicted_class=result["predicted_class"],
        confidence=result["confidence"],
        risk_level=result["risk_level"],
        risk_note=result["risk_note"],
        top_predictions_json=json.dumps(result["top_predictions"]),
        model_version=result["model_version"],
        analyzed_at=result["analyzed_at"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return format_scan_record(record)

@app.get("/history")
def get_history(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(ScanRecord)
    if user_id is not None:
        query = query.filter(ScanRecord.user_id == user_id)
    records = query.order_by(ScanRecord.id.desc()).all()
    return [format_scan_record(r) for r in records]

@app.get("/history/{scan_id}")
def get_history_item(scan_id: int, db: Session = Depends(get_db)):
    record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Scan record not found.")
    return format_scan_record(record)

def format_scan_record(r: ScanRecord) -> dict:
    return {
        "id": r.id,
        "user_id": r.user_id,
        "original_filename": r.original_filename,
        "saved_image_url": r.saved_image_url,
        "preprocessed_image_url": r.preprocessed_image_url,
        "gradcam_image_url": r.gradcam_image_url,
        "predicted_code": r.predicted_code,
        "predicted_class": r.predicted_class,
        "confidence": r.confidence,
        "risk_level": r.risk_level,
        "risk_note": r.risk_note,
        "top_predictions": json.loads(r.top_predictions_json),
        "model_version": r.model_version,
        "analyzed_at": r.analyzed_at,
    }
