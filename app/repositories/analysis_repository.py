from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AnalysisJobModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat(timespec="seconds")


def create_analysis_job(
    db: Session,
    *,
    job_id: str,
    session_id: str,
    status: str = "pending",
    progress: int = 0,
) -> AnalysisJobModel:
    now = utc_now()

    job = AnalysisJobModel(
        id=job_id,
        session_id=session_id,
        status=status,
        progress=progress,
        started_at=now if status in {"processing", "completed"} else None,
        completed_at=now if status == "completed" else None,
        error_message=None,
        created_at=now,
        updated_at=now,
    )

    db.add(job)
    db.flush()

    return job


def update_analysis_job(
    db: Session,
    *,
    job_id: str,
    status: str,
    progress: int,
    error_message: Optional[str] = None,
) -> Optional[AnalysisJobModel]:
    job = db.get(AnalysisJobModel, job_id)

    if job is None:
        return None

    now = utc_now()

    job.status = status
    job.progress = progress
    job.error_message = error_message
    job.updated_at = now

    if status in {"processing", "completed"} and job.started_at is None:
        job.started_at = now

    if status == "completed":
        job.completed_at = now

    db.flush()

    return job


def get_analysis_job(db: Session, job_id: str) -> Optional[AnalysisJobModel]:
    return db.get(AnalysisJobModel, job_id)


def get_latest_analysis_job_by_session(
    db: Session,
    session_id: str,
) -> Optional[AnalysisJobModel]:
    statement = (
        select(AnalysisJobModel)
        .where(AnalysisJobModel.session_id == session_id)
        .order_by(AnalysisJobModel.created_at.desc())
        .limit(1)
    )

    return db.scalars(statement).first()


def analysis_job_to_dict(job: AnalysisJobModel) -> dict:
    return {
        "jobId": job.id,
        "status": job.status,
        "progress": job.progress,
        "startedAt": to_iso(job.started_at),
        "completedAt": to_iso(job.completed_at),
        "error": job.error_message,
    }
