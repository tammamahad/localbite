from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Report, Submission, User, Vote
from app.routers.auth import require_admin
from app.schemas import ReportResponse, ReportStatusUpdate


router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/reports", response_model=list[ReportResponse])
def list_pending_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return db.scalars(
        select(Report)
        .where(Report.status == "pending")
        .order_by(Report.created_at.desc())
    ).all()


@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    return _get_report_or_404(report_id, db)


@router.patch("/reports/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    payload: ReportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    report = _get_report_or_404(report_id, db)
    report.status = payload.status
    db.commit()
    db.refresh(report)

    return report


@router.delete("/submissions/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reported_submission(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    submission = db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    has_report = db.scalar(select(Report.id).where(Report.submission_id == submission_id))
    if not has_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission has not been reported",
        )

    db.execute(delete(Report).where(Report.submission_id == submission_id))
    db.execute(delete(Vote).where(Vote.submission_id == submission_id))
    db.delete(submission)
    db.commit()


def _get_report_or_404(report_id: int, db: Session) -> Report:
    report = db.get(Report, report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found",
        )

    return report
