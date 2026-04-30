from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SubmissionBase(BaseModel):
    menu_item_id: int
    user_id: int
    calories: int
    protein_g: float
    carbs_g: float
    fat_g: float
    justification: str


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionCreateForMenuItem(BaseModel):
    calories: int = Field(ge=0)
    protein_g: float = Field(ge=0)
    carbs_g: float = Field(ge=0)
    fat_g: float = Field(ge=0)
    justification: str = Field(min_length=1)


class SubmissionResponse(SubmissionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    helpful_count: int = 0
    not_helpful_count: int = 0
    username: str = ""


class UserSubmissionResponse(BaseModel):
    id: int
    menu_item_name: str
    restaurant_name: str
    calories: int
    created_at: datetime


class BestEstimateResponse(BaseModel):
    menu_item_id: int
    submission_count: int
    included_submission_count: int
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    method: str
