from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.core.time import utcnow
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.user import UserCreate


def get_user_by_id(
    db: Session,
    user_id: int,
    lock: bool = False,
) -> User | None:
    statement = select(User).where(User.id == user_id)
    if lock:
        statement = statement.with_for_update().execution_options(populate_existing=True)

    return db.scalar(statement)


def get_user_by_email(
    db: Session,
    email: str,
    lock: bool = False,
) -> User | None:
    statement = select(User).where(User.email == email)
    if lock:
        statement = statement.with_for_update().execution_options(populate_existing=True)

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

    try:
        db.add(user)
        db.flush()

        profile = UserProfile(
            user_id=user.id,
            full_name=user_data.full_name,
        )

        db.add(profile)

        db.commit()
        db.refresh(user)

        return user

    except Exception:
        db.rollback()
        raise


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
    lock: bool = False,
) -> RefreshToken | None:
    statement = select(RefreshToken).where(
        RefreshToken.token_hash == token_hash
    )

    if lock:
        statement = statement.with_for_update().execution_options(populate_existing=True)
    return db.scalar(statement)


def revoke_refresh_token(
    db: Session,
    refresh_token: RefreshToken,
) -> RefreshToken:
    refresh_token.revoked_at = utcnow()

    db.commit()
    db.refresh(refresh_token)

    return refresh_token

def get_user_refresh_tokens(
    db: Session,
    user_id: int,
    offset: int = 0,
    limit: int = 50,
) -> list[RefreshToken]:
    statement = (
        select(RefreshToken)
        .where(RefreshToken.user_id == user_id)
        .order_by(RefreshToken.created_at.desc(), RefreshToken.id.desc())
        .offset(offset).limit(limit)
    )

    return list(db.scalars(statement).all())


def revoke_user_refresh_token(
    db: Session,
    user_id: int,
    token_id: int,
) -> RefreshToken | None:
    get_user_by_id(db, user_id, lock=True)
    statement = select(RefreshToken).where(
        RefreshToken.id == token_id,
        RefreshToken.user_id == user_id,
    )

    refresh_token = db.scalar(statement)

    if refresh_token is None:
        return None

    if refresh_token.revoked_at is None:
        refresh_token.revoked_at = utcnow()
        db.commit()
        db.refresh(refresh_token)

    return refresh_token


def revoke_all_user_refresh_tokens(
    db: Session,
    user_id: int,
) -> int:
    get_user_by_id(db, user_id, lock=True)
    statement = select(RefreshToken).where(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None),
    )

    tokens = list(db.scalars(statement).all())

    now = utcnow()

    for token in tokens:
        token.revoked_at = now

    db.commit()

    return len(tokens)

def commit_identity_change(db: Session, user: User) -> None:
    """Persist identity changes and session revocation under the same user lock."""
    try:
        db.flush()
        db.execute(update(RefreshToken).where(
            RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None)
        ).values(revoked_at=utcnow()))
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise


def update_user_password(
    db: Session,
    user: User,
    hashed_password: str,
) -> User:
    user.hashed_password = hashed_password
    user.token_version += 1

    commit_identity_change(db, user)

    return user

def deactivate_user(
    db: Session,
    user: User,
) -> User:
    user.is_active = False
    user.token_version += 1

    commit_identity_change(db, user)

    return user

def update_user_email(
    db: Session,
    user: User,
    new_email: str,
) -> User:
    user.email = new_email
    user.token_version += 1

    commit_identity_change(db, user)

    return user

def update_user_username(
    db: Session,
    user: User,
    username: str,
) -> User:
    user.username = username
    user.token_version += 1

    commit_identity_change(db, user)

    return user

def get_user_profile(
    db: Session,
    user_id: int,
) -> UserProfile | None:
    statement = select(UserProfile).where(
        UserProfile.user_id == user_id
    )

    return db.scalar(statement)

def create_user_profile(
    db: Session,
    user_id: int,
    profile_data: dict,
) -> UserProfile:
    profile = UserProfile(
        user_id=user_id,
        **profile_data,
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    return profile

def update_user_profile(
    db: Session,
    profile: UserProfile,
    profile_data: dict,
) -> UserProfile:
    for field, value in profile_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    return profile