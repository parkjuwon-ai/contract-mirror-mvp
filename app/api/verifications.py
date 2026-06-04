from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.services import session_store


router = APIRouter(prefix="/api/verifications", tags=["verifications"])


def ok(data: dict) -> dict:
    return {"ok": True, "data": data}


@router.get("/{verification_id}")
def get_verification(verification_id: str) -> dict:
    verification = session_store.get_verification(verification_id)
    if not verification:
        raise HTTPException(status_code=404, detail="검증 정보를 찾을 수 없습니다.")

    return ok({"verification": verification})
