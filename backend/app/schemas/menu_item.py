from pydantic import BaseModel, ConfigDict


class MenuItemBase(BaseModel):
    restaurant_id: int
    name: str
    description: str


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemCreateForRestaurant(BaseModel):
    name: str
    description: str


class MenuItemResponse(MenuItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
