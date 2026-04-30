from datetime import datetime

from pydantic import BaseModel, ConfigDict


class RestaurantBase(BaseModel):
    name: str
    address: str
    cuisine_type: str


class RestaurantCreate(RestaurantBase):
    pass


class RestaurantResponse(RestaurantBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
