from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AuditEventModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat(timespec="seconds")


def create_audit_event(
    db: Session,
    *,
    session_id: str,
    event_type: str,
    message: Optional[str] = None,
) -> AuditEventModel:
    event = AuditEventModel(
        session_id=session_id,
        event_type=event_type,
        message=message,
        created_at=utc_now(),
    )

    db.add(event)
    db.flush()

    return event


def get_audit_events(
    db: Session,
    session_id: str,
    *,
    limit: int = 100,
) -> list[AuditEventModel]:
    statement = (
        select(AuditEventModel)
        .where(AuditEventModel.session_id == session_id)
        .order_by(AuditEventModel.created_at.asc())
        .limit(limit)
    )

    return list(db.scalars(statement).all())


def audit_event_to_dict(event: AuditEventModel) -> dict:
    return {
        "id": event.id,
        "sessionId": event.session_id,
        "eventType": event.event_type,
        "message": event.message,
        "createdAt": to_iso(event.created_at),
    }
