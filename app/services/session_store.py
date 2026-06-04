from __future__ import annotations

import copy
import hashlib
import json
import uuid
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from app.db import SessionLocal, init_db
from app.repositories.analysis_repository import (
    analysis_job_to_dict as db_analysis_job_to_dict,
    create_analysis_job as db_create_analysis_job,
    get_latest_analysis_job_by_session as db_get_latest_analysis_job_by_session,
    update_analysis_job as db_update_analysis_job,
)
from app.repositories.report_repository import (
    create_report as db_create_report,
    create_report_mismatch as db_create_report_mismatch,
    create_report_question as db_create_report_question,
    get_report as db_get_report,
    report_to_dict as db_report_to_dict,
)
from app.repositories.verification_repository import (
    create_verification as db_create_verification,
    get_verification as db_get_verification,
    verification_to_dict as db_verification_to_dict,
)
from app.repositories.file_repository import create_file_record as db_create_file_record
from app.repositories.session_repository import (
    create_default_participants as db_create_default_participants,
    create_session as db_create_session,
    get_session_aggregate as db_get_session_aggregate,
    participants_are_ready as db_participants_are_ready,
    participants_have_rejection as db_participants_have_rejection,
    update_participant_state as db_update_participant_state,
    update_session_status as db_update_session_status,
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


def _new_analysis_job_id() -> str:
    return f"JOB-{uuid.uuid4().hex[:8].upper()}"


def _new_mismatch_id() -> str:
    return f"MM-{uuid.uuid4().hex[:8].upper()}"


def _new_question_id() -> str:
    return f"Q-{uuid.uuid4().hex[:8].upper()}"


def _new_verification_id() -> str:
    return f"VER-{uuid.uuid4().hex[:8].upper()}"


def _new_file_id() -> str:
    return f"FILE-{uuid.uuid4().hex[:8].upper()}"


def _storage_path_for(session_id: str, file_name: str) -> str:
    safe_name = Path(file_name).name or "uploaded_file"
    return f"storage/uploads/{session_id}/{safe_name}"


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


def _upload_db_contract(
    session_id: str,
    *,
    file_name: str,
    file_size: int,
    mime_type: str | None,
    file_hash: str,
) -> dict | None:
    init_db()

    with SessionLocal() as db:
        current = db_get_session_aggregate(db, session_id)
        if current is None:
            return None

        db_create_file_record(
            db,
            file_id=_new_file_id(),
            session_id=session_id,
            file_type="contract",
            original_name=file_name,
            mime_type=mime_type,
            size_bytes=file_size,
            sha256_hash=file_hash,
            storage_path=_storage_path_for(session_id, file_name),
        )
        db_update_session_status(
            db,
            session_id=session_id,
            status="contract_uploaded",
        )
        db.commit()

    with SessionLocal() as db:
        return db_get_session_aggregate(db, session_id)


def _lock_db_contract(session_id: str) -> dict | None:
    init_db()

    with SessionLocal() as db:
        current = db_get_session_aggregate(db, session_id)
        if current is None:
            return None

        if not current["contract"]["hash"]:
            raise ValueError("계약서 업로드 후 고정할 수 있습니다.")

        db_update_session_status(
            db,
            session_id=session_id,
            status="contract_locked",
        )
        db.commit()

    with SessionLocal() as db:
        return db_get_session_aggregate(db, session_id)


def _update_db_participant(
    session_id: str,
    role: str,
    patch: dict,
) -> dict | None:
    init_db()

    with SessionLocal() as db:
        current = db_get_session_aggregate(db, session_id)
        if current is None:
            return None

        participant = db_update_participant_state(
            db,
            session_id=session_id,
            role=role,
            patch=patch,
        )

        if participant is None:
            raise ValueError("지원하지 않는 참여자 역할입니다.")

        if db_participants_have_rejection(db, session_id):
            db_update_session_status(
                db,
                session_id=session_id,
                status="participants_pending",
            )
        elif db_participants_are_ready(db, session_id):
            db_update_session_status(
                db,
                session_id=session_id,
                status="participants_ready",
            )
        else:
            db_update_session_status(
                db,
                session_id=session_id,
                status="participants_pending",
            )

        db.commit()

    with SessionLocal() as db:
        return db_get_session_aggregate(db, session_id)


def _upload_db_recording(
    session_id: str,
    *,
    file_name: str,
    file_size: int,
    mime_type: str | None,
    file_hash: str,
    duration_sec: int | None = None,
) -> dict | None:
    init_db()

    with SessionLocal() as db:
        current = db_get_session_aggregate(db, session_id)
        if current is None:
            return None

        db_create_file_record(
            db,
            file_id=_new_file_id(),
            session_id=session_id,
            file_type="recording",
            original_name=file_name,
            mime_type=mime_type,
            size_bytes=file_size,
            sha256_hash=file_hash,
            storage_path=_storage_path_for(session_id, file_name),
        )
        db_update_session_status(
            db,
            session_id=session_id,
            status="recording_uploaded",
        )
        db.commit()

    with SessionLocal() as db:
        return db_get_session_aggregate(db, session_id)


def _start_db_analysis(session_id: str) -> dict | None:
    init_db()

    with SessionLocal() as db:
        current = db_get_session_aggregate(db, session_id)
        if current is None:
            return None

        if not current["recording"]["hash"]:
            raise ValueError("녹취 업로드 후 분석할 수 있습니다.")

        job_id = _new_analysis_job_id()
        report_id = _new_report_id()
        verification_id = _new_verification_id()

        report_hash = make_hash(
            f"{session_id}:{job_id}:{current['contract']['hash']}:{current['recording']['hash']}".encode("utf-8")
        )

        db_create_analysis_job(
            db,
            job_id=job_id,
            session_id=session_id,
            status="processing",
            progress=50,
        )
        db_update_analysis_job(
            db,
            job_id=job_id,
            status="completed",
            progress=100,
        )

        db_create_report(
            db,
            report_id=report_id,
            session_id=session_id,
            analysis_job_id=job_id,
            report_hash=report_hash,
            risk_level="high",
            summary="설명 내용과 계약 조항 사이에 중요한 불일치 후보가 발견되었습니다.",
        )

        db_create_report_mismatch(
            db,
            mismatch_id=_new_mismatch_id(),
            report_id=report_id,
            title="수익 보장성 발언과 면책 조항의 불일치 후보",
            risk_level="high",
            transcript_text="예상 수익은 안정적으로 보장된다고 설명된 후보 발언입니다.",
            contract_text="계약서에는 수익을 보장하지 않는다는 면책 조항이 포함되어 있습니다.",
            basis="녹취 발언 / 계약서 조항",
            display_order=1,
        )

        db_create_report_question(
            db,
            question_id=_new_question_id(),
            report_id=report_id,
            text="수익 보장처럼 들릴 수 있는 설명이 있었는지 다시 확인이 필요합니다.",
            target="explainer",
            display_order=1,
        )

        db_create_verification(
            db,
            verification_id=verification_id,
            session_id=session_id,
            report_id=report_id,
            status="valid",
            contract_hash=current["contract"]["hash"],
            recording_hash=current["recording"]["hash"],
            report_hash=report_hash,
            risk_summary="높음",
            tampered=False,
        )

        db_update_session_status(
            db,
            session_id=session_id,
            status="report_ready",
        )

        db.commit()

    with SessionLocal() as db:
        return db_get_session_aggregate(db, session_id)


def _get_db_analysis_status(session_id: str) -> dict | None:
    init_db()

    with SessionLocal() as db:
        job = db_get_latest_analysis_job_by_session(db, session_id)
        if job is None:
            return None
        return db_analysis_job_to_dict(job)


def _get_db_report(report_id: str) -> dict | None:
    init_db()

    with SessionLocal() as db:
        report = db_get_report(db, report_id)
        if report is None:
            return None
        return db_report_to_dict(db, report)


def _get_db_verification(verification_id: str) -> dict | None:
    init_db()

    with SessionLocal() as db:
        verification = db_get_verification(db, verification_id)
        if verification is None:
            return None
        return db_verification_to_dict(verification)


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
    db_session = _upload_db_contract(
        session_id,
        file_name=file_name,
        file_size=file_size,
        mime_type=mime_type,
        file_hash=file_hash,
    )

    if db_session is not None:
        session = _SESSIONS.get(session_id)
        if session is not None:
            session["contract"].update(
                {
                    "fileName": file_name,
                    "fileSize": file_size,
                    "mimeType": mime_type,
                    "hash": file_hash,
                    "uploadedAt": db_session["contract"]["uploadedAt"],
                    "locked": False,
                }
            )
            session["status"] = "contract_uploaded"
            session["updatedAt"] = now_iso()
            _persist_store()

        return _copy(db_session)

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
    db_session = _lock_db_contract(session_id)

    if db_session is not None:
        session = _SESSIONS.get(session_id)
        if session is not None:
            session["contract"]["locked"] = True
            session["status"] = "contract_locked"
            session["updatedAt"] = now_iso()
            _persist_store()

        return _copy(db_session)

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
    db_session = _update_db_participant(
        session_id=session_id,
        role=role,
        patch=patch,
    )

    if db_session is not None:
        session = _SESSIONS.get(session_id)
        if session is not None:
            if role not in session["participants"]:
                raise ValueError("지원하지 않는 참여자 역할입니다.")

            participant = session["participants"][role]

            if "name" in patch:
                participant["name"] = patch.get("name")

            if "verified" in patch:
                participant["verified"] = bool(patch["verified"])
                participant["verifiedAt"] = db_session["participants"][role]["verifiedAt"]

            if "consent" in patch:
                participant["consent"] = bool(patch["consent"])
                participant["consentedAt"] = db_session["participants"][role]["consentedAt"]

            if "rejected" in patch:
                participant["rejected"] = bool(patch["rejected"])

            if participant["rejected"]:
                participant["consent"] = False
                participant["consentedAt"] = None

            session["status"] = db_session["status"]
            session["updatedAt"] = now_iso()
            _persist_store()

        return _copy(db_session)

    session = _SESSIONS.get(session_id)
    if not session:
        return None

    if role not in session["participants"]:
        raise ValueError("지원하지 않는 참여자 역할입니다.")

    participant = session["participants"][role]
    now = now_iso()

    if "name" in patch:
        participant["name"] = patch.get("name")

    if "verified" in patch:
        participant["verified"] = bool(patch["verified"])
        participant["verifiedAt"] = now if participant["verified"] else None

    if "consent" in patch:
        participant["consent"] = bool(patch["consent"])
        participant["consentedAt"] = now if participant["consent"] else None

    if "rejected" in patch:
        participant["rejected"] = bool(patch["rejected"])

    if participant["rejected"]:
        participant["consent"] = False
        participant["consentedAt"] = None

    contractor = session["participants"]["contractor"]
    explainer = session["participants"]["explainer"]

    if contractor["rejected"] or explainer["rejected"]:
        session["status"] = "participants_pending"
    elif (
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
    duration_sec: int | None = None,
) -> dict | None:
    db_session = _upload_db_recording(
        session_id,
        file_name=file_name,
        file_size=file_size,
        mime_type=mime_type,
        file_hash=file_hash,
        duration_sec=duration_sec,
    )

    if db_session is not None:
        session = _SESSIONS.get(session_id)
        if session is not None:
            session["recording"].update(
                {
                    "fileName": file_name,
                    "fileSize": file_size,
                    "mimeType": mime_type,
                    "hash": file_hash,
                    "durationSec": duration_sec,
                    "uploadedAt": db_session["recording"]["uploadedAt"],
                    "status": "uploaded",
                }
            )
            session["status"] = "recording_uploaded"
            session["updatedAt"] = now_iso()
            _persist_store()

        return _copy(db_session)

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
            "durationSec": duration_sec,
            "uploadedAt": now,
            "status": "uploaded",
        }
    )
    session["status"] = "recording_uploaded"
    session["updatedAt"] = now
    _persist_store()
    return _copy(session)

def start_analysis(session_id: str) -> dict | None:
    db_session = _start_db_analysis(session_id)

    if db_session is not None:
        session = _SESSIONS.get(session_id)
        if session is not None:
            session["analysis"] = _copy(db_session["analysis"])
            session["report"] = _copy(db_session["report"])
            session["verification"] = _copy(db_session["verification"])
            session["status"] = db_session["status"]
            session["updatedAt"] = now_iso()

            if db_session["report"]["id"]:
                _REPORTS[db_session["report"]["id"]] = _copy(db_session["report"])

            if db_session["verification"]["id"]:
                verification_id = db_session["verification"]["id"]
                _VERIFICATIONS[verification_id] = {
                    "id": verification_id,
                    "sessionId": db_session["id"],
                    "status": db_session["verification"]["status"],
                    "contractHash": db_session["contract"]["hash"],
                    "recordingHash": db_session["recording"]["hash"],
                    "reportHash": db_session["report"]["hash"],
                    "createdAt": db_session["verification"]["verifiedAt"],
                    "verifiedAt": db_session["verification"]["verifiedAt"],
                    "riskSummary": "높음",
                    "tampered": False,
                }

            _persist_store()

        return _copy(db_session)

    session = _SESSIONS.get(session_id)
    if not session:
        return None

    if not session["recording"]["hash"]:
        raise ValueError("녹취 업로드 후 분석할 수 있습니다.")

    now = now_iso()
    job_id = _new_analysis_job_id()
    report_id = _new_report_id()
    verification_id = _new_verification_id()

    report = {
        "id": report_id,
        "hash": make_hash(f"{session_id}:{job_id}:{session['recording']['hash']}".encode("utf-8")),
        "riskLevel": "high",
        "summary": "설명 내용과 계약 조항 사이에 중요한 불일치 후보가 발견되었습니다.",
        "mismatches": [
            {
                "id": _new_mismatch_id(),
                "title": "수익 보장성 발언과 면책 조항의 불일치 후보",
                "riskLevel": "high",
                "transcript": "예상 수익은 안정적으로 보장된다고 설명된 후보 발언입니다.",
                "contract": "계약서에는 수익을 보장하지 않는다는 면책 조항이 포함되어 있습니다.",
                "basis": "녹취 발언 / 계약서 조항",
            }
        ],
        "questions": [
            {
                "id": _new_question_id(),
                "text": "수익 보장처럼 들릴 수 있는 설명이 있었는지 다시 확인이 필요합니다.",
                "target": "explainer",
            }
        ],
        "createdAt": now,
        "sessionId": session_id,
    }

    verification = {
        "id": verification_id,
        "sessionId": session_id,
        "status": "valid",
        "contractHash": session["contract"]["hash"],
        "recordingHash": session["recording"]["hash"],
        "reportHash": report["hash"],
        "createdAt": now,
        "verifiedAt": now,
        "riskSummary": "높음",
        "tampered": False,
    }

    session["analysis"] = {
        "jobId": job_id,
        "status": "completed",
        "progress": 100,
        "startedAt": now,
        "completedAt": now,
        "error": None,
    }
    session["report"] = _copy(report)
    session["verification"] = {
        "id": verification_id,
        "status": "valid",
        "qrUrl": f"/verify/{verification_id}",
        "publicUrl": f"/verify/{verification_id}",
        "verifiedAt": now,
    }
    session["status"] = "report_ready"
    session["updatedAt"] = now

    _REPORTS[report_id] = _copy(report)
    _VERIFICATIONS[verification_id] = verification

    _persist_store()
    return _copy(session)

def get_analysis_status(session_id: str) -> dict | None:
    db_analysis = _get_db_analysis_status(session_id)
    if db_analysis is not None:
        return _copy(db_analysis)

    session = _SESSIONS.get(session_id)
    if not session:
        return None
    return _copy(session["analysis"])

def get_report(report_id: str) -> dict | None:
    db_report = _get_db_report(report_id)
    if db_report is not None:
        return _copy(db_report)

    report = _REPORTS.get(report_id)
    if not report:
        return None
    return _copy(report)

def get_verification(verification_id: str) -> dict | None:
    db_verification = _get_db_verification(verification_id)
    if db_verification is not None:
        return _copy(db_verification)

    verification = _VERIFICATIONS.get(verification_id)
    if not verification:
        return None
    return _copy(verification)

