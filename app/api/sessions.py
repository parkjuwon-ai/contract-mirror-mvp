from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.services import session_store


router = APIRouter(prefix="/api/sessions", tags=["sessions"])


class CreateSessionRequest(BaseModel):
    contractType: str | None = "real_estate_sale"


class ParticipantPatchRequest(BaseModel):
    name: str | None = None
    verified: bool | None = None
    consent: bool | None = None
    rejected: bool | None = None


def ok(data: dict) -> dict:
    return {"ok": True, "data": data}


def not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")


@router.post("")
def create_session(payload: CreateSessionRequest) -> dict:
    session = session_store.create_session(payload.contractType)
    return ok({"session": session})


@router.get("/{session_id}")
def get_session(session_id: str) -> dict:
    session = session_store.get_session(session_id)
    if not session:
        raise not_found()
    return ok({"session": session})


@router.post("/{session_id}/contract")
async def upload_contract(session_id: str, file: UploadFile = File(...)) -> dict:
    content = await file.read()
    file_hash = session_store.make_hash(content)

    session = session_store.upload_contract(
        session_id,
        file_name=file.filename or "contract",
        file_size=len(content),
        mime_type=file.content_type,
        file_hash=file_hash,
    )

    if not session:
        raise not_found()

    return ok({"session": session})


@router.post("/{session_id}/contract/lock")
def lock_contract(session_id: str) -> dict:
    try:
        session = session_store.lock_contract(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not session:
        raise not_found()

    return ok({"session": session})


@router.patch("/{session_id}/participants/{role}")
def update_participant(
    session_id: str,
    role: str,
    payload: ParticipantPatchRequest,
) -> dict:
    patch = payload.model_dump(exclude_unset=True)

    try:
        session = session_store.update_participant(session_id, role, patch)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not session:
        raise not_found()

    return ok({"session": session})


@router.post("/{session_id}/recording")
async def upload_recording(session_id: str, file: UploadFile = File(...)) -> dict:
    content = await file.read()
    file_hash = session_store.make_hash(content)

    session = session_store.upload_recording(
        session_id,
        file_name=file.filename or "recording",
        file_size=len(content),
        mime_type=file.content_type,
        file_hash=file_hash,
    )

    if not session:
        raise not_found()

    return ok({"session": session})


@router.post("/{session_id}/analysis")
def start_analysis(session_id: str) -> dict:
    try:
        session = session_store.start_analysis(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not session:
        raise not_found()

    return ok({"session": session})


@router.get("/{session_id}/analysis/status")
def get_analysis_status(session_id: str) -> dict:
    analysis = session_store.get_analysis_status(session_id)
    if not analysis:
        raise not_found()

    return ok({"analysis": analysis})
