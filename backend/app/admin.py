"""Explicit operator command: python -m app.admin user@example.com."""

import argparse

from app.crud.user import get_user_by_email
from app.db.database import SessionLocal


def main():
    parser = argparse.ArgumentParser(
        description="Grant administrator access to an existing account"
    )
    parser.add_argument("email")
    args = parser.parse_args()
    with SessionLocal() as db:
        user = get_user_by_email(db, args.email)
        if user is None or not user.is_active:
            parser.error("An active registered account is required")
        user.is_admin = True
        db.commit()
        print("Administrator access granted")


if __name__ == "__main__":
    main()
