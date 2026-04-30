from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.create_admin import create_admin
from app.database import init_db
from app.routers import admin, auth, health, menu_items, restaurants, submissions
from app.seed_demo_data import seed_demo_data


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_origin_regex=settings.frontend_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    seed_demo_data()
    create_admin()

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(restaurants.router)
app.include_router(menu_items.router)
app.include_router(submissions.router)
app.include_router(admin.router)
