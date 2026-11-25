from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

DATABASE_PATH = Path(__file__).resolve().parents[1] / "dermai.db"
SQLALCHEMY_DATABASE_URL = URL.create("sqlite", database=str(DATABASE_PATH))

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def migrate_legacy_schema():
    with engine.begin() as connection:
        user_columns = {
            row[1] for row in connection.exec_driver_sql('PRAGMA table_info("users")')
        }
        for column, definition in {
            "full_name": "VARCHAR",
            "password_hash": "VARCHAR",
            "created_at": "VARCHAR",
        }.items():
            if column not in user_columns:
                connection.exec_driver_sql(
                    f'ALTER TABLE users ADD COLUMN "{column}" {definition}'
                )

        if "name" in user_columns:
            connection.exec_driver_sql(
                "UPDATE users SET full_name = COALESCE(full_name, name)"
            )
        if "hashed_password" in user_columns:
            connection.exec_driver_sql(
                "UPDATE users SET password_hash = COALESCE(password_hash, hashed_password)"
            )

        scan_columns = {
            row[1]
            for row in connection.exec_driver_sql('PRAGMA table_info("scan_records")')
        }
        migrate_legacy_scans = "image_path" in scan_columns and any(
            column not in scan_columns
            for column in (
                "user_id",
                "original_filename",
                "saved_image_url",
                "preprocessed_image_url",
                "predicted_code",
                "predicted_class",
                "risk_level",
                "risk_note",
                "top_predictions_json",
                "model_version",
                "analyzed_at",
            )
        )
        for column, definition in {
            "user_id": "INTEGER",
            "original_filename": "VARCHAR",
            "saved_image_url": "VARCHAR",
            "preprocessed_image_url": "VARCHAR",
            "gradcam_image_url": "VARCHAR",
            "predicted_code": "VARCHAR",
            "predicted_class": "VARCHAR",
            "risk_level": "VARCHAR",
            "risk_note": "TEXT",
            "top_predictions_json": "TEXT",
            "model_version": "VARCHAR",
            "analyzed_at": "VARCHAR",
        }.items():
            if column not in scan_columns:
                connection.exec_driver_sql(
                    f'ALTER TABLE scan_records ADD COLUMN "{column}" {definition}'
                )

        if migrate_legacy_scans:
            records = connection.exec_driver_sql(
                "SELECT id, user_email, image_path, condition, created_at FROM scan_records"
            ).mappings()
            for record in records:
                image_path = str(record["image_path"] or "")
                filename = Path(image_path).name or f"legacy-scan-{record['id']}.png"
                image_url = (
                    image_path
                    if image_path.startswith("/uploads/")
                    else f"/uploads/{filename}"
                )
                user_id = None
                if record["user_email"]:
                    user_id = connection.exec_driver_sql(
                        "SELECT id FROM users WHERE email = ? LIMIT 1",
                        (record["user_email"],),
                    ).scalar()
                analyzed_at = record["created_at"] or datetime.now(
                    timezone.utc
                ).isoformat()
                connection.exec_driver_sql(
                    """
                    UPDATE scan_records
                    SET user_id = ?, original_filename = ?, saved_image_url = ?,
                        preprocessed_image_url = ?, predicted_code = 'LEGACY',
                        predicted_class = ?, risk_level = 'LEGACY',
                        risk_note = 'Imported from the legacy scan schema.',
                        top_predictions_json = '[]', model_version = 'legacy',
                        analyzed_at = ?
                    WHERE id = ?
                    """,
                    (
                        user_id,
                        filename,
                        image_url,
                        image_url,
                        record["condition"] or "Unknown",
                        analyzed_at,
                        record["id"],
                    ),
                )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
