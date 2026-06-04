from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ReportMismatchModel, ReportModel, ReportQuestionModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_iso(value: Optional[datetime]) -> Optional[str]:
    if value is None:
        return None
    return value.isoformat(timespec="seconds")


def create_report(
    db: Session,
    *,
    report_id: str,
    session_id: str,
    analysis_job_id: Optional[str],
    report_hash: str,
    risk_level: str,
    summary: str,
) -> ReportModel:
    report = ReportModel(
        id=report_id,
        session_id=session_id,
        analysis_job_id=analysis_job_id,
        hash=report_hash,
        risk_level=risk_level,
        summary=summary,
        created_at=utc_now(),
    )

    db.add(report)
    db.flush()

    return report


def get_report(db: Session, report_id: str) -> Optional[ReportModel]:
    return db.get(ReportModel, report_id)


def get_latest_report_by_session(
    db: Session,
    session_id: str,
) -> Optional[ReportModel]:
    statement = (
        select(ReportModel)
        .where(ReportModel.session_id == session_id)
        .order_by(ReportModel.created_at.desc())
        .limit(1)
    )

    return db.scalars(statement).first()


def create_report_mismatch(
    db: Session,
    *,
    mismatch_id: str,
    report_id: str,
    title: str,
    risk_level: str,
    transcript_text: Optional[str],
    contract_text: Optional[str],
    basis: Optional[str],
    display_order: int = 0,
) -> ReportMismatchModel:
    mismatch = ReportMismatchModel(
        id=mismatch_id,
        report_id=report_id,
        title=title,
        risk_level=risk_level,
        transcript_text=transcript_text,
        contract_text=contract_text,
        basis=basis,
        display_order=display_order,
    )

    db.add(mismatch)
    db.flush()

    return mismatch


def create_report_question(
    db: Session,
    *,
    question_id: str,
    report_id: str,
    text: str,
    target: Optional[str],
    display_order: int = 0,
) -> ReportQuestionModel:
    question = ReportQuestionModel(
        id=question_id,
        report_id=report_id,
        text=text,
        target=target,
        display_order=display_order,
    )

    db.add(question)
    db.flush()

    return question


def get_report_mismatches(
    db: Session,
    report_id: str,
) -> list[ReportMismatchModel]:
    statement = (
        select(ReportMismatchModel)
        .where(ReportMismatchModel.report_id == report_id)
        .order_by(ReportMismatchModel.display_order.asc())
    )

    return list(db.scalars(statement).all())


def get_report_questions(
    db: Session,
    report_id: str,
) -> list[ReportQuestionModel]:
    statement = (
        select(ReportQuestionModel)
        .where(ReportQuestionModel.report_id == report_id)
        .order_by(ReportQuestionModel.display_order.asc())
    )

    return list(db.scalars(statement).all())


def mismatch_to_dict(mismatch: ReportMismatchModel) -> dict:
    return {
        "id": mismatch.id,
        "title": mismatch.title,
        "riskLevel": mismatch.risk_level,
        "transcript": mismatch.transcript_text,
        "contract": mismatch.contract_text,
        "basis": mismatch.basis,
    }


def question_to_dict(question: ReportQuestionModel) -> dict:
    return {
        "id": question.id,
        "text": question.text,
        "target": question.target,
    }


def report_to_dict(db: Session, report: ReportModel) -> dict:
    return {
        "id": report.id,
        "sessionId": report.session_id,
        "hash": report.hash,
        "riskLevel": report.risk_level,
        "summary": report.summary,
        "mismatches": [
            mismatch_to_dict(item)
            for item in get_report_mismatches(db, report.id)
        ],
        "questions": [
            question_to_dict(item)
            for item in get_report_questions(db, report.id)
        ],
        "createdAt": to_iso(report.created_at),
    }
