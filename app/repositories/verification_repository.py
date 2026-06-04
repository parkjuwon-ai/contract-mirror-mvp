from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import VerificationModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat(timespec="seconds")


def create_verification(
    db: Session,
    *,
    verification_id: str,
    session_id: str,
    report_id: str,
    status: str,
    contract_hash: str,
    recording_hash: str,
    report_hash: str,
    risk_summary: Optional[str],
    tampered: bool = False,
) -> VerificationModel:
    now = utc_now()

    verification = VerificationModel(
        id=verification_id,
        session_id=session_id,
        report_id=report_id,
        status=status,
        contract_hash=contract_hash,
        recording_hash=recording_hash,
        report_hash=report_hash,
        risk_summary=risk_summary,
        tampered=tampered,
        created_at=now,
        verified_at=now if status == "valid" else None,
    )

    db.add(verification)
    db.flush()

    return verification


def get_verification(
    db: Session,
    verification_id: str,
) -> Optional[VerificationModel]:
    return db.get(VerificationModel, verification_id)


def get_latest_verification_by_session(
    db: Session,
    session_id: str,
) -> Optional[VerificationModel]:
    statement = (
        select(VerificationModel)
        .where(VerificationModel.session_id == session_id)
        .order_by(VerificationModel.created_at.desc())
        .limit(1)
    )

    return db.scalars(statement).first()


def verification_to_dict(verification: VerificationModel) -> dict:
    return {
        "id": verification.id,
        "sessionId": verification.session_id,
        "status": verification.status,
        "contractHash": verification.contract_hash,
        "recordingHash": verification.recording_hash,
        "reportHash": verification.report_hash,
        "createdAt": to_iso(verification.created_at),
        "verifiedAt": to_iso(verification.verified_at),
        "riskSummary": verification.risk_summary,
        "tampered": verification.tampered,
    }
