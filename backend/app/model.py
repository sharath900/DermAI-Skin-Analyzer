from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())

class ScanRecord(Base):
    __tablename__ = "scan_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    original_filename = Column(String, nullable=False)
    saved_image_url = Column(String, nullable=False)
    preprocessed_image_url = Column(String, nullable=False)
    gradcam_image_url = Column(String, nullable=True)
    predicted_code = Column(String, nullable=False)
    predicted_class = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    risk_note = Column(Text, nullable=False)
    top_predictions_json = Column(Text, nullable=False)
    model_version = Column(String, nullable=False)
    analyzed_at = Column(String, nullable=False)
