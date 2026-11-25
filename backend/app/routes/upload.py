from typing import Optional

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from ..database import get_db
from ..main import predict as predict_scan

router = APIRouter()


@router.post("/predict", tags=["Prediction"])
async def predict_skin(
    file: UploadFile = File(...),
    user_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    return await predict_scan(file=file, user_id=user_id, db=db)
