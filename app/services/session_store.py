from __future__ import annotations

import copy
import hashlib
import json
import uuid
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from app.db import SessionLocal, init_db
from app.repositories.session_repository import (
    create_default_participants as db_create_default_participants,
    create_session as db_create_session,
    get_session_aggregate as db_get_session_aggregate,
)


KST = ZoneInfo("Asia/Seoul")
PROJECT_ROOT = Path(__file__).resolve().parents[2]
STORAGE_DIR = PROJECT_ROOT / "storage"
STORE_FILE = STORAGE_DIR / "api_store.json"

_SESSIONS: dict[str, dict] = {}
_REPORTS: dict[str, dict] = {}
_VERIFICATIONS: dict[str, dict] = {}


def now_iso() -> str:
    return datetime.now(KST).isoformat(timespec="seconds")


def make_hash(data: bytes) -> str:
    return "sha256:" + hashlib.sha256(data).hexdigest()


def _copy(value: dict) -> dict:
    return copy.deepcopy(value)


def _load_store() -> None:
    global _SESSIONS, _REPORTS, _VERIFICATIONS

    if not STORE_FILE.exists():
        return

    try:
        payload = json.loads(STORE_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        _SESSIONS = {}
        _REPORTS = {}
        _VERIFICATIONS = {}
        return

    _SESSIONS = payload.get("sessions", {})
    _REPORTS = payload.get("reports", {})
    _VERIFICATIONS = payload.get("verifications", {})


def _persist_store() -> None:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)

    payload = {
        "sessions": _SESSIONS,
        "reports": _REPORTS,
        "verifications": _VERIFICATIONS,
        "updatedAt": now_iso(),
    }

    tmp_file = STORE_FILE.with_suffix(".tmp")
    tmp_file.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    tmp_file.replace(STORE_FILE)


def _new_session_id() -> str:
    today = datetime.now(KST).strftime("%Y%m%d")
    suffix = uuid.uuid4().hex[:6].upper()
    return f"CM-{today}-{suffix}"


def _new_report_id() -> str:
    return f"RPT-{uuid.uuid4().hex[:8].upper()}"


def _new_verification_id() -> str:
    return f"VER-{uuid.uuid4().hex[:8].upper()}"


def _create_db_session(session_id: str, contract_type: str) -> dict | None:
    init_db()

    with SessionLocal() as db:
        db_create_session(
            db,
            session_id=session_id,
            contract_type=contract_type,
            status="created",
        )
        db_create_default_participants(db, session_id=session_id)
        db.commit()

    with SessionLocal() as db:
        return db_get_session_aggregate(db, session_id)


def _get_db_session(session_id: str) -> dict | None:
    init_db()

    with SessionLocal() as db:
        return db_get_session_aggregate(db, session_id)


def create_session(contract_type: str | None = None) -> dict:
    session_id = _new_session_id()
    now = now_iso()

    session = {
        "id": session_id,
        "status": "created",
        "contractType": contract_type or "real_estate_sale",
        "createdAt": now,
        "updatedAt": now,
        "expiresAt": None,
        "contract": {
            "fileName": None,
            "fileSize": None,
            "mimeType": None,
            "hash": None,
            "uploadedAt": None,
            "locked": False,
        },
        "recording": {
            "fileName": None,
            "fileSize": None,
            "mimeType": None,
            "hash": None,
            "durationSec": None,
            "uploadedAt": None,
            "status": "idle",
        },
        "participants": {
            "contractor": {
                "role": "contractor",
                "name": None,
                "verified": False,
                "consent": False,
                "rejected": False,
                "verifiedAt": None,
                "consentedAt": None,
            },
            "explainer": {
                "role": "explainer",
                "name": None,
                "verified": False,
                "consent": False,
                "rejected": False,
                "verifiedAt": None,
                "consentedAt": None,
            },
        },
        "analysis": {
            "jobId": None,
            "status": "idle",
            "progress": 0,
            "startedAt": None,
            "completedAt": None,
            "error": None,
        },
        "report": {
            "id": None,
            "hash": None,
            "riskLevel": None,
            "summary": None,
            "mismatches": [],
            "questions": [],
            "createdAt": None,
        },
        "verification": {
            "id": None,
            "status": None,
            "qrUrl": None,
            "publicUrl": None,
            "verifiedAt": None,
        },
    }

    _SESSIONS[session_id] = session
    _persist_store()

    db_session = _create_db_session(
        session_id=session_id,
        contract_type=session["contractType"],
    )

    return _copy(db_session or session)


def get_session(session_id: str) -> dict | None:
    db_session = _get_db_session(session_id)
    if db_session:
        return _copy(db_session)

    session = _SESSIONS.get(session_id)
    if not session:
        return None
    return _copy(session)


def upload_contract(
    session_id: str,
    *,
    file_name: str,
    file_size: int,
    mime_type: str | None,
    file_hash: str,
) -> dict | None:
    session = _SESSIONS.get(session_id)
    if not session:
        return None

    now = now_iso()
    session["contract"].update(
        {
            "fileName": file_name,
            "fileSize": file_size,
            "mimeType": mime_type,
            "hash": file_hash,
            "uploadedAt": now,
            "locked": False,
        }
    )
    session["status"] = "contract_uploaded"
    session["updatedAt"] = now
    _persist_store()
    return _copy(session)


def lock_contract(session_id: str) -> dict | None:
    session = _SESSIONS.get(session_id)
    if not session:
        return None

    if not session["contract"]["hash"]:
        raise ValueError("계약서 업로드 후 고정할 수 있습니다.")

    now = now_iso()
    session["contract"]["locked"] = True
    session["status"] = "contract_locked"
    session["updatedAt"] = now
    _persist_store()
    return _copy(session)


def update_participant(session_id: str, role: str, patch: dict) -> dict | None:
    session = _SESSIONS.get(session_id)
    if not session:
        return None

    if role not in ("contractor", "explainer"):
        raise ValueError("지원하지 않는 참여자 역할입니다.")

    participant = session["participants"][role]
    now = now_iso()

    if "name" in patch:
        participant["name"] = patch["name"]

    if "verified" in patch:
        participant["verified"] = bool(patch["verified"])
        participant["verifiedAt"] = now if participant["verified"] else None

    if "consent" in patch:
        participant["consent"] = bool(patch["consent"])
        participant["consentedAt"] = now if participant["consent"] else None

    if "rejected" in patch:
        participant["rejected"] = bool(patch["rejected"])

    contractor = session["participants"]["contractor"]
    explainer = session["participants"]["explainer"]

    if (
        contractor["verified"]
        and contractor["consent"]
        and explainer["verified"]
        and explainer["consent"]
    ):
        session["status"] = "participants_ready"
    else:
        session["status"] = "participants_pending"

    session["updatedAt"] = now
    _persist_store()
    return _copy(session)


def upload_recording(
    session_id: str,
    *,
    file_name: str,
    file_size: int,
    mime_type: str | None,
    file_hash: str,
) -> dict | None:
    session = _SESSIONS.get(session_id)
    if not session:
        return None

    now = now_iso()
    session["recording"].update(
        {
            "fileName": file_name,
            "fileSize": file_size,
            "mimeType": mime_type,
            "hash": file_hash,
            "durationSec": None,
            "uploadedAt": now,
            "status": "uploaded",
        }
    )
    session["status"] = "recording_uploaded"
    session["updatedAt"] = now
    _persist_store()
    return _copy(session)


def start_analysis(session_id: str) -> dict | None:
    session = _SESSIONS.get(session_id)
    if not session:
        return None

    if not session["contract"]["hash"]:
        raise ValueError("계약서가 필요합니다.")

    if not session["recording"]["hash"]:
        raise ValueError("녹취 파일이 필요합니다.")

    now = now_iso()
    report_id = _new_report_id()
    verification_id = _new_verification_id()

    mismatches = [
        {
            "id": "MM-001",
            "title": "수익 보장성 발언과 면책 조항의 불일치 후보",
            "riskLevel": "high",
            "transcript": "예상 수익은 안정적으로 보장된다고 설명된 후보 발언입니다.",
            "contract": "계약서에는 수익을 보장하지 않는다는 면책 조항이 포함되어 있습니다.",
            "basis": "녹취 발언 / 계약서 조항",
        }
    ]

    questions = [
        {
            "id": "Q-001",
            "text": "수익 보장처럼 들릴 수 있는 설명이 있었는지 다시 확인이 필요합니다.",
            "target": "explainer",
        }
    ]

    report_hash = make_hash(f"{session_id}:{report_id}:{now}".encode("utf-8"))

    report = {
        "id": report_id,
        "sessionId": session_id,
        "hash": report_hash,
        "riskLevel": "high",
        "summary": "설명 내용과 계약 조항 사이에 중요한 불일치 후보가 발견되었습니다.",
        "mismatches": mismatches,
        "questions": questions,
        "createdAt": now,
    }

    verification = {
        "id": verification_id,
        "sessionId": session_id,
        "status": "valid",
        "contractHash": session["contract"]["hash"],
        "recordingHash": session["recording"]["hash"],
        "reportHash": report_hash,
        "createdAt": now,
        "verifiedAt": now,
        "riskSummary": "높음",
        "tampered": False,
    }

    _REPORTS[report_id] = report
    _VERIFICATIONS[verification_id] = verification

    session["analysis"].update(
        {
            "jobId": f"JOB-{uuid.uuid4().hex[:8].upper()}",
            "status": "completed",
            "progress": 100,
            "startedAt": now,
            "completedAt": now,
            "error": None,
        }
    )
    session["report"].update(report)
    session["verification"].update(
        {
            "id": verification_id,
            "status": "valid",
            "qrUrl": f"/verify/{verification_id}",
            "publicUrl": f"/verify/{verification_id}",
            "verifiedAt": now,
        }
    )
    session["status"] = "report_ready"
    session["updatedAt"] = now

    _persist_store()
    return _copy(session)


def get_analysis_status(session_id: str) -> dict | None:
    session = _SESSIONS.get(session_id)
    if not session:
        return None
    return _copy(session["analysis"])


def get_report(report_id: str) -> dict | None:
    report = _REPORTS.get(report_id)
    if not report:
        return None
    return _copy(report)


def get_verification(verification_id: str) -> dict | None:
    verification = _VERIFICATIONS.get(verification_id)
    if not verification:
        return None
    return _copy(verification)


_load_store()
