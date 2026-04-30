from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ReportBase(BaseModel):
    submission_id: int
    user_id: int
    reason: str
    status: str


class ReportCreate(ReportBase):
    pass


class ReportRequest(BaseModel):
    reason: str = Field(min_length=1)


class ReportStatusUpdate(BaseModel):
    status: Literal["pending", "reviewed"]


class ReportResponse(ReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
