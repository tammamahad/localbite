from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MenuItem, Submission, User, Vote
from app.routers.auth import get_current_user
from app.schemas import (
    BestEstimateResponse,
    MenuItemResponse,
    SubmissionCreateForMenuItem,
    SubmissionResponse,
)


router = APIRouter(prefix="/menu-items", tags=["menu-items"])


@router.get("/{menu_item_id}", response_model=MenuItemResponse)
def get_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    menu_item = db.get(MenuItem, menu_item_id)
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    return menu_item


@router.post(
    "/{menu_item_id}/submissions",
    response_model=SubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_submission_for_menu_item(
    menu_item_id: int,
    payload: SubmissionCreateForMenuItem,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    menu_item = db.get(MenuItem, menu_item_id)
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    submission = Submission(
        menu_item_id=menu_item_id,
        user_id=current_user.id,
        calories=payload.calories,
        protein_g=payload.protein_g,
        carbs_g=payload.carbs_g,
        fat_g=payload.fat_g,
        justification=payload.justification,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    return _submission_response(submission, helpful_count=0, not_helpful_count=0)


@router.get("/{menu_item_id}/submissions", response_model=list[SubmissionResponse])
def list_submissions_for_menu_item(menu_item_id: int, db: Session = Depends(get_db)):
    _get_menu_item_or_404(menu_item_id, db)

    submissions = db.scalars(
        select(Submission)
        .where(Submission.menu_item_id == menu_item_id)
        .order_by(Submission.created_at.desc())
    ).all()

    vote_counts = _vote_counts_for_submissions([submission.id for submission in submissions], db)
    return [
        _submission_response(
            submission,
            helpful_count=vote_counts.get(submission.id, {}).get("helpful", 0),
            not_helpful_count=vote_counts.get(submission.id, {}).get("not_helpful", 0),
        )
        for submission in submissions
    ]


@router.get("/{menu_item_id}/best-estimate", response_model=BestEstimateResponse)
def get_best_estimate(menu_item_id: int, db: Session = Depends(get_db)):
    _get_menu_item_or_404(menu_item_id, db)
    submissions = db.scalars(
        select(Submission).where(Submission.menu_item_id == menu_item_id)
    ).all()

    if not submissions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No submissions found for this menu item",
        )

    filtered_submissions = _filter_outliers(submissions)

    return BestEstimateResponse(
        menu_item_id=menu_item_id,
        submission_count=len(submissions),
        included_submission_count=len(filtered_submissions),
        calories=round(_average([submission.calories for submission in filtered_submissions]), 1),
        protein_g=round(_average([submission.protein_g for submission in filtered_submissions]), 1),
        carbs_g=round(_average([submission.carbs_g for submission in filtered_submissions]), 1),
        fat_g=round(_average([submission.fat_g for submission in filtered_submissions]), 1),
        method="Average after filtering submissions with calories more than 50% away from the median.",
    )


def _get_menu_item_or_404(menu_item_id: int, db: Session) -> MenuItem:
    menu_item = db.get(MenuItem, menu_item_id)
    if not menu_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Menu item not found",
        )

    return menu_item


def _filter_outliers(submissions: list[Submission]) -> list[Submission]:
    if len(submissions) < 3:
        return submissions

    median_calories = _median([submission.calories for submission in submissions])
    if median_calories == 0:
        filtered = [submission for submission in submissions if submission.calories == 0]
    else:
        minimum_calories = median_calories * 0.5
        maximum_calories = median_calories * 1.5
        filtered = [
            submission
            for submission in submissions
            if minimum_calories <= submission.calories <= maximum_calories
        ]

    return filtered or submissions


def _average(values: list[int | float]) -> float:
    return sum(values) / len(values)


def _median(values: list[int | float]) -> float:
    ordered_values = sorted(values)
    midpoint = len(ordered_values) // 2
    if len(ordered_values) % 2 == 1:
        return float(ordered_values[midpoint])

    return (ordered_values[midpoint - 1] + ordered_values[midpoint]) / 2


def _vote_counts_for_submissions(submission_ids: list[int], db: Session) -> dict[int, dict[str, int]]:
    if not submission_ids:
        return {}

    rows = db.execute(
        select(Vote.submission_id, Vote.vote_type, func.count(Vote.id))
        .where(Vote.submission_id.in_(submission_ids))
        .group_by(Vote.submission_id, Vote.vote_type)
    ).all()
    vote_counts: dict[int, dict[str, int]] = {}
    for submission_id, vote_type, count in rows:
        vote_counts.setdefault(submission_id, {})[vote_type] = count

    return vote_counts


def _submission_response(
    submission: Submission,
    helpful_count: int,
    not_helpful_count: int,
) -> SubmissionResponse:
    return SubmissionResponse.model_validate(submission).model_copy(
        update={
            "helpful_count": helpful_count,
            "not_helpful_count": not_helpful_count,
            "username": submission.user.username if submission.user else "",
        }
    )
