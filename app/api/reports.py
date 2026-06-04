from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services import session_store


router = APIRouter(prefix="/api/reports", tags=["reports"])


def ok(data: dict) -> dict:
    return {"ok": True, "data": data}


@router.get("/{report_id}")
def get_report(report_id: str) -> dict:
    report = session_store.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="리포트를 찾을 수 없습니다.")

    return ok({"report": report})
