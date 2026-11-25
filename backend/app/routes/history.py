from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..main import get_history as get_scan_history
from ..main import get_history_item as get_scan_history_item

router = APIRouter()


@router.get("/history", tags=["History"])
def get_history(user_id: Optional[int] = None, db: Session = Depends(get_db)):
    return get_scan_history(user_id=user_id, db=db)


@router.get("/history/{scan_id}", tags=["History"])
def get_history_item(scan_id: int, db: Session = Depends(get_db)):
    return get_scan_history_item(scan_id=scan_id, db=db)
