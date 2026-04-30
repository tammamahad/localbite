import os

from sqlalchemy import or_, select

from app.core.security import hash_password
from app.database import SessionLocal, init_db
from app.models import User


ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@localbite.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "adminpassword123")


def create_admin():
    init_db()
    db = SessionLocal()
    try:
        user = db.scalar(
            select(User).where(or_(User.username == ADMIN_USERNAME, User.email == ADMIN_EMAIL))
        )
        if user:
            user.username = ADMIN_USERNAME
            user.email = ADMIN_EMAIL
            user.role = "admin"
            user.password_hash = hash_password(ADMIN_PASSWORD)
        else:
            db.add(
                User(
                    username=ADMIN_USERNAME,
                    email=ADMIN_EMAIL,
                    password_hash=hash_password(ADMIN_PASSWORD),
                    role="admin",
                )
            )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
    print(f"Admin ready: {ADMIN_USERNAME} / {ADMIN_PASSWORD}")
