from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ParticipantModel, SessionModel


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

    return {
        "id": session.id,
        "status": session.status,
        "contractType": session.contract_type,
        "createdAt": to_iso(session.created_at),
        "updatedAt": to_iso(session.updated_at),
        "expiresAt": to_iso(session.expires_at),
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
        "participants": participants,
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


def get_session_aggregate(db: Session, session_id: str) -> Optional[dict]:
    session = get_session(db, session_id)

    if session is None:
        return None

    return session_to_aggregate(db, session)
