from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.skill import Skill
from app.models.user_skill import UserSkill


def get_skill_by_id(
    db: Session,
    skill_id: int,
) -> Skill | None:
    statement = select(Skill).where(
        Skill.id == skill_id
    )

    return db.scalar(statement)


def get_skill_by_name(
    db: Session,
    name: str,
) -> Skill | None:
    statement = select(Skill).where(
        Skill.name == name
    )

    return db.scalar(statement)


def get_skills(
    db: Session,
) -> list[Skill]:
    statement = (
        select(Skill)
        .order_by(Skill.name.asc())
    )

    return list(db.scalars(statement).all())


def create_skill(
    db: Session,
    name: str,
    category: str | None = None,
    description: str | None = None,
) -> Skill:
    skill = Skill(
        name=name,
        category=category,
        description=description,
    )

    db.add(skill)
    db.commit()
    db.refresh(skill)

    return skill


def update_skill(
    db: Session,
    skill: Skill,
    name: str | None = None,
    category: str | None = None,
    description: str | None = None,
) -> Skill:
    if name is not None:
        skill.name = name

    if category is not None:
        skill.category = category

    if description is not None:
        skill.description = description

    db.commit()
    db.refresh(skill)

    return skill


def delete_skill(
    db: Session,
    skill: Skill,
) -> None:
    db.delete(skill)
    db.commit()


def get_user_skill(
    db: Session,
    user_id: int,
    skill_id: int,
) -> UserSkill | None:
    statement = select(UserSkill).where(
        UserSkill.user_id == user_id,
        UserSkill.skill_id == skill_id,
    )

    return db.scalar(statement)


def get_user_skills(
    db: Session,
    user_id: int,
) -> list[UserSkill]:
    statement = (
        select(UserSkill)
        .where(UserSkill.user_id == user_id)
        .order_by(UserSkill.created_at.desc())
    )

    return list(db.scalars(statement).all())


def create_user_skill(
    db: Session,
    user_id: int,
    skill_id: int,
    proficiency: str,
) -> UserSkill:
    user_skill = UserSkill(
        user_id=user_id,
        skill_id=skill_id,
        proficiency=proficiency,
    )

    db.add(user_skill)
    db.commit()
    db.refresh(user_skill)

    return user_skill


def update_user_skill(
    db: Session,
    user_skill: UserSkill,
    proficiency: str,
) -> UserSkill:
    user_skill.proficiency = proficiency

    db.commit()
    db.refresh(user_skill)

    return user_skill


def delete_user_skill(
    db: Session,
    user_skill: UserSkill,
) -> None:
    db.delete(user_skill)
    db.commit()