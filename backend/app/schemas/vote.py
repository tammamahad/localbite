from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class VoteBase(BaseModel):
    submission_id: int
    user_id: int
    vote_type: str


class VoteCreate(VoteBase):
    pass


class VoteRequest(BaseModel):
    vote_type: Literal["helpful", "not_helpful"]


class VoteResponse(VoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
