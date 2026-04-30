from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Report, Submission, User, Vote
from app.routers.auth import get_current_user
from app.schemas import ReportRequest, ReportResponse, VoteRequest, VoteResponse


router = APIRouter(prefix="/submissions", tags=["submissions"])


@router.post("/{submission_id}/vote", response_model=VoteResponse)
def vote_on_submission(
    submission_id: int,
    payload: VoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_submission_or_404(submission_id, db)

    vote = db.scalar(
        select(Vote).where(
            Vote.submission_id == submission_id,
            Vote.user_id == current_user.id,
        )
    )
    if vote:
        vote.vote_type = payload.vote_type
    else:
        vote = Vote(
            submission_id=submission_id,
            user_id=current_user.id,
            vote_type=payload.vote_type,
        )
        db.add(vote)

    db.commit()
    db.refresh(vote)

    return vote


@router.post("/{submission_id}/report", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def report_submission(
    submission_id: int,
    payload: ReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_submission_or_404(submission_id, db)

    report = Report(
        submission_id=submission_id,
        user_id=current_user.id,
        reason=payload.reason,
        status="pending",
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


def _get_submission_or_404(submission_id: int, db: Session) -> Submission:
    submission = db.get(Submission, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found",
        )

    return submission
