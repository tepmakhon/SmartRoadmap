from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.user import UserCreate


def get_user_by_id(
    db: Session,
    user_id: int,
) -> User | None:
    statement = select(User).where(User.id == user_id)

    return db.scalar(statement)


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    statement = select(User).where(User.email == email)

    return db.scalar(statement)


def get_user_by_username(
    db: Session,
    username: str,
) -> User | None:
    statement = select(User).where(User.username == username)

    return db.scalar(statement)


def create_user(
    db: Session,
    user_data: UserCreate,
) -> User:
    user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def create_refresh_token(
    db: Session,
    user_id: int,
    token_hash: str,
    expires_at: datetime,
) -> RefreshToken:
    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)

    return refresh_token

def get_refresh_token(
    db: Session,
    token_hash: str,
) -> RefreshToken | None:
    statement = select(RefreshToken).where(
        RefreshToken.token_hash == token_hash
    )

    return db.scalar(statement)


def revoke_refresh_token(
    db: Session,
    refresh_token: RefreshToken,
) -> RefreshToken:
    refresh_token.revoked_at = datetime.utcnow()

    db.commit()
    db.refresh(refresh_token)

    return refresh_token

def revoke_all_user_refresh_tokens(
    db: Session,
    user_id: int,
) -> None:
    statement = select(RefreshToken).where(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None),
    )

    tokens = db.scalars(statement).all()

    for token in tokens:
        token.revoked_at = datetime.utcnow()

    db.commit()


def get_user_refresh_tokens(
    db: Session,
    user_id: int,
) -> list[RefreshToken]:
    statement = (
        select(RefreshToken)
        .where(RefreshToken.user_id == user_id)
        .order_by(RefreshToken.created_at.desc())
    )

    return list(db.scalars(statement).all())


def revoke_user_refresh_token(
    db: Session,
    user_id: int,
    token_id: int,
) -> RefreshToken | None:
    statement = select(RefreshToken).where(
        RefreshToken.id == token_id,
        RefreshToken.user_id == user_id,
    )

    refresh_token = db.scalar(statement)

    if refresh_token is None:
        return None

    if refresh_token.revoked_at is None:
        refresh_token.revoked_at = datetime.utcnow()
        db.commit()
        db.refresh(refresh_token)

    return refresh_token


def revoke_all_user_refresh_tokens(
    db: Session,
    user_id: int,
) -> int:
    statement = select(RefreshToken).where(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None),
    )

    tokens = list(db.scalars(statement).all())

    now = datetime.utcnow()

    for token in tokens:
        token.revoked_at = now

    db.commit()

    return len(tokens)

def update_user_password(
    db: Session,
    user: User,
    hashed_password: str,
) -> User:
    user.hashed_password = hashed_password

    db.commit()
    db.refresh(user)

    return user

def deactivate_user(
    db: Session,
    user: User,
) -> User:
    user.is_active = False

    db.commit()
    db.refresh(user)

    return user

def update_user_email(
    db: Session,
    user: User,
    new_email: str,
) -> User:
    user.email = new_email

    db.commit()
    db.refresh(user)

    return user

def update_user_username(
    db: Session,
    user: User,
    username: str,
) -> User:
    user.username = username

    db.commit()
    db.refresh(user)

    return user