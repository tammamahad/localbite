from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import MenuItem, Restaurant, User
from app.routers.auth import require_admin
from app.schemas import (
    MenuItemCreateForRestaurant,
    MenuItemResponse,
    RestaurantCreate,
    RestaurantResponse,
)


router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("", response_model=list[RestaurantResponse])
def list_restaurants(db: Session = Depends(get_db)):
    return db.scalars(select(Restaurant).order_by(Restaurant.name)).all()


@router.get("/{restaurant_id}", response_model=RestaurantResponse)
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.get(Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    return restaurant


@router.post("", response_model=RestaurantResponse, status_code=status.HTTP_201_CREATED)
def create_restaurant(
    payload: RestaurantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    restaurant = Restaurant(
        name=payload.name,
        address=payload.address,
        cuisine_type=payload.cuisine_type,
    )
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)

    return restaurant


@router.get("/{restaurant_id}/menu-items", response_model=list[MenuItemResponse])
def list_menu_items_for_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.get(Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    return db.scalars(
        select(MenuItem)
        .where(MenuItem.restaurant_id == restaurant_id)
        .order_by(MenuItem.name)
    ).all()


@router.post(
    "/{restaurant_id}/menu-items",
    response_model=MenuItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_menu_item_for_restaurant(
    restaurant_id: int,
    payload: MenuItemCreateForRestaurant,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    restaurant = db.get(Restaurant, restaurant_id)
    if not restaurant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Restaurant not found",
        )

    menu_item = MenuItem(
        restaurant_id=restaurant_id,
        name=payload.name,
        description=payload.description,
    )
    db.add(menu_item)
    db.commit()
    db.refresh(menu_item)

    return menu_item
