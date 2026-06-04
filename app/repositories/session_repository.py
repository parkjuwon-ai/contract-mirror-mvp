from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ParticipantModel, SessionModel
from app.repositories.analysis_repository import analysis_job_to_dict, get_latest_analysis_job_by_session
from app.repositories.file_repository import get_latest_file_by_type
from app.repositories.report_repository import get_latest_report_by_session, report_to_dict
from app.repositories.verification_repository import get_latest_verification_by_session, verification_to_dict


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat(timespec="seconds")


def create_session(
    db: Session,
    *,
    session_id: str,
    contract_type: str = "real_estate_sale",
    status: str = "created",
) -> SessionModel:
    session = SessionModel(
        id=session_id,
        contract_type=contract_type,
        status=status,
        created_at=utc_now(),
        updated_at=utc_now(),
        expires_at=None,
    )

    db.add(session)
    db.flush()

    return session


def get_session(db: Session, session_id: str) -> Optional[SessionModel]:
    return db.get(SessionModel, session_id)




def update_session_status(
    db: Session,
    *,
    session_id: str,
    status: str,
) -> Optional[SessionModel]:
    session = get_session(db, session_id)

    if session is None:
        return None

    session.status = status
    session.updated_at = utc_now()

    db.flush()

    return session


def create_default_participants(db: Session, *, session_id: str) -> list[ParticipantModel]:
    participants = [
        ParticipantModel(
            session_id=session_id,
            role="contractor",
            name=None,
            verified=False,
            consent=False,
            rejected=False,
            created_at=utc_now(),
            updated_at=utc_now(),
        ),
        ParticipantModel(
            session_id=session_id,
            role="explainer",
            name=None,
            verified=False,
            consent=False,
            rejected=False,
            created_at=utc_now(),
            updated_at=utc_now(),
        ),
    ]

    db.add_all(participants)
    db.flush()

    return participants


def get_participants(db: Session, session_id: str) -> list[ParticipantModel]:
    statement = (
        select(ParticipantModel)
        .where(ParticipantModel.session_id == session_id)
        .order_by(ParticipantModel.role.asc())
    )

    return list(db.scalars(statement).all())




def file_record_to_session_file(file_record, *, locked: bool | None = None, status: str | None = None) -> dict:
    if file_record is None:
        return {}

    payload = {
        "fileName": file_record.original_name,
        "fileSize": file_record.size_bytes,
        "mimeType": file_record.mime_type,
        "hash": file_record.sha256_hash,
        "uploadedAt": to_iso(file_record.uploaded_at),
    }

    if locked is not None:
        payload["locked"] = locked

    if status is not None:
        payload["status"] = status

    return payload


def empty_contract_payload() -> dict:
    return {
        "fileName": None,
        "fileSize": None,
        "mimeType": None,
        "hash": None,
        "uploadedAt": None,
        "locked": False,
    }


def empty_recording_payload() -> dict:
    return {
        "fileName": None,
        "fileSize": None,
        "mimeType": None,
        "hash": None,
        "durationSec": None,
        "uploadedAt": None,
        "status": "idle",
    }


def empty_analysis_payload() -> dict:
    return {
        "jobId": None,
        "status": "idle",
        "progress": 0,
        "startedAt": None,
        "completedAt": None,
        "error": None,
    }


def empty_report_payload() -> dict:
    return {
        "id": None,
        "hash": None,
        "riskLevel": None,
        "summary": None,
        "mismatches": [],
        "questions": [],
        "createdAt": None,
    }


def empty_verification_payload() -> dict:
    return {
        "id": None,
        "status": None,
        "qrUrl": None,
        "publicUrl": None,
        "verifiedAt": None,
    }




def get_participant(
    db: Session,
    *,
    session_id: str,
    role: str,
) -> Optional[ParticipantModel]:
    statement = (
        select(ParticipantModel)
        .where(ParticipantModel.session_id == session_id)
        .where(ParticipantModel.role == role)
        .limit(1)
    )

    return db.scalars(statement).first()


def update_participant_state(
    db: Session,
    *,
    session_id: str,
    role: str,
    patch: dict,
) -> Optional[ParticipantModel]:
    participant = get_participant(
        db,
        session_id=session_id,
        role=role,
    )

    if participant is None:
        return None

    now = utc_now()

    if "name" in patch:
        participant.name = patch.get("name")

    if "verified" in patch:
        participant.verified = bool(patch.get("verified"))
        if participant.verified and participant.verified_at is None:
            participant.verified_at = now
        if not participant.verified:
            participant.verified_at = None

    if "consent" in patch:
        participant.consent = bool(patch.get("consent"))
        if participant.consent and participant.consented_at is None:
            participant.consented_at = now
        if not participant.consent:
            participant.consented_at = None

    if "rejected" in patch:
        participant.rejected = bool(patch.get("rejected"))

    if participant.rejected:
        participant.consent = False
        participant.consented_at = None

    participant.updated_at = now

    db.flush()

    return participant


def participants_are_ready(db: Session, session_id: str) -> bool:
    participants = get_participants(db, session_id)

    if len(participants) < 2:
        return False

    by_role = {participant.role: participant for participant in participants}

    contractor = by_role.get("contractor")
    explainer = by_role.get("explainer")

    if contractor is None or explainer is None:
        return False

    return all(
        [
            contractor.verified,
            contractor.consent,
            not contractor.rejected,
            explainer.verified,
            explainer.consent,
            not explainer.rejected,
        ]
    )


def participants_have_rejection(db: Session, session_id: str) -> bool:
    return any(participant.rejected for participant in get_participants(db, session_id))


def participant_to_dict(participant: ParticipantModel) -> dict:
    return {
        "role": participant.role,
        "name": participant.name,
        "verified": participant.verified,
        "consent": participant.consent,
        "rejected": participant.rejected,
        "verifiedAt": to_iso(participant.verified_at),
        "consentedAt": to_iso(participant.consented_at),
    }


def session_to_aggregate(db: Session, session: SessionModel) -> dict:
    participants = {
        participant.role: participant_to_dict(participant)
        for participant in get_participants(db, session.id)
    }

    participants.setdefault(
        "contractor",
        {
            "role": "contractor",
            "name": None,
            "verified": False,
            "consent": False,
            "rejected": False,
            "verifiedAt": None,
            "consentedAt": None,
        },
    )

    participants.setdefault(
        "explainer",
        {
            "role": "explainer",
            "name": None,
            "verified": False,
            "consent": False,
            "rejected": False,
            "verifiedAt": None,
            "consentedAt": None,
        },
    )

    contract_file = get_latest_file_by_type(
        db,
        session_id=session.id,
        file_type="contract",
    )
    recording_file = get_latest_file_by_type(
        db,
        session_id=session.id,
        file_type="recording",
    )
    latest_analysis = get_latest_analysis_job_by_session(db, session.id)
    latest_report = get_latest_report_by_session(db, session.id)
    latest_verification = get_latest_verification_by_session(db, session.id)

    contract = empty_contract_payload()
    if contract_file is not None:
        contract.update(
            file_record_to_session_file(
                contract_file,
                locked=session.status in {
                    "contract_locked",
                    "participants_pending",
                    "participants_ready",
                    "recording_uploaded",
                    "analysis_pending",
                    "analysis_processing",
                    "analysis_completed",
                    "report_ready",
                    "verified",
                },
            )
        )

    recording = empty_recording_payload()
    if recording_file is not None:
        recording.update(
            file_record_to_session_file(
                recording_file,
                locked=None,
                status="uploaded",
            )
        )
        recording["durationSec"] = None

    analysis = empty_analysis_payload()
    if latest_analysis is not None:
        analysis.update(analysis_job_to_dict(latest_analysis))

    report = empty_report_payload()
    if latest_report is not None:
        report.update(report_to_dict(db, latest_report))

    verification = empty_verification_payload()
    if latest_verification is not None:
        verification_dict = verification_to_dict(latest_verification)
        verification.update(
            {
                "id": verification_dict["id"],
                "status": verification_dict["status"],
                "qrUrl": f"/verify/{verification_dict['id']}",
                "publicUrl": f"/verify/{verification_dict['id']}",
                "verifiedAt": verification_dict["verifiedAt"],
            }
        )

    return {
        "id": session.id,
        "status": session.status,
        "contractType": session.contract_type,
        "createdAt": to_iso(session.created_at),
        "updatedAt": to_iso(session.updated_at),
        "expiresAt": to_iso(session.expires_at),
        "contract": contract,
        "recording": recording,
        "participants": participants,
        "analysis": analysis,
        "report": report,
        "verification": verification,
    }

def get_session_aggregate(db: Session, session_id: str) -> Optional[dict]:
    session = get_session(db, session_id)

    if session is None:
        return None

    return session_to_aggregate(db, session)
