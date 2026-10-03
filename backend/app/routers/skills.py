from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_admin_user, get_current_user
from app.crud.skill import (
    create_skill,
    create_user_skill,
    delete_skill,
    delete_user_skill,
    get_skill_by_id,
    get_skill_by_name,
    get_skills,
    get_user_skill,
    get_user_skills,
    update_skill,
    update_user_skill,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.user import (
    SkillCreate,
    SkillResponse,
    UserSkillCreate,
    UserSkillResponse,
    UserSkillUpdate,
)

router = APIRouter(
    prefix="/api/v1",
    tags=["Skills"],
)


# ============================================================
# SKILLS
# ============================================================


@router.get(
    "/skills",
    response_model=list[SkillResponse],
)
def list_skills(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = Query(None, max_length=100),
    db: Session = Depends(get_db),
):
    return get_skills(db, offset, limit, search)


@router.get(
    "/skills/{skill_id}",
    response_model=SkillResponse,
)
def get_skill(
    skill_id: int,
    db: Session = Depends(get_db),
):
    skill = get_skill_by_id(
        db,
        skill_id,
    )

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    return skill


@router.post(
    "/skills",
    dependencies=[Depends(get_admin_user)],
    response_model=SkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_skill(
    skill_data: SkillCreate,
    db: Session = Depends(get_db),
):
    existing_skill = get_skill_by_name(
        db,
        skill_data.name,
    )

    if existing_skill:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Skill already exists",
        )

    return create_skill(
        db=db,
        name=skill_data.name,
        category=skill_data.category,
        description=skill_data.description,
    )


@router.patch(
    "/skills/{skill_id}",
    dependencies=[Depends(get_admin_user)],
    response_model=SkillResponse,
)
def edit_skill(
    skill_id: int,
    skill_data: SkillCreate,
    db: Session = Depends(get_db),
):
    skill = get_skill_by_id(
        db,
        skill_id,
    )

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    if skill_data.name != skill.name:
        existing_skill = get_skill_by_name(
            db,
            skill_data.name,
        )

        if existing_skill:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Skill name is already taken",
            )

    return update_skill(
        db=db,
        skill=skill,
        name=skill_data.name,
        category=skill_data.category,
        description=skill_data.description,
    )


@router.delete(
    "/skills/{skill_id}",
    dependencies=[Depends(get_admin_user)],
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_skill(
    skill_id: int,
    db: Session = Depends(get_db),
):
    skill = get_skill_by_id(
        db,
        skill_id,
    )

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    delete_skill(
        db,
        skill,
    )


# ============================================================
# USER SKILLS
# ============================================================


@router.get(
    "/users/me/skills",
    response_model=list[UserSkillResponse],
)
def list_my_skills(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_skills(
        db,
        current_user.id,
        offset,
        limit,
    )


@router.post(
    "/users/me/skills",
    response_model=UserSkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_my_skill(
    skill_data: UserSkillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skill = get_skill_by_id(
        db,
        skill_data.skill_id,
    )

    if not skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill not found",
        )

    existing_user_skill = get_user_skill(
        db,
        current_user.id,
        skill_data.skill_id,
    )

    if existing_user_skill:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Skill is already added to your profile",
        )

    return create_user_skill(
        db=db,
        user_id=current_user.id,
        skill_id=skill_data.skill_id,
        proficiency=skill_data.proficiency.value,
    )


@router.patch(
    "/users/me/skills/{skill_id}",
    response_model=UserSkillResponse,
)
def edit_my_skill(
    skill_id: int,
    skill_data: UserSkillUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_skill = get_user_skill(
        db,
        current_user.id,
        skill_id,
    )

    if not user_skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill is not in your profile",
        )

    return update_user_skill(
        db=db,
        user_skill=user_skill,
        proficiency=skill_data.proficiency.value,
    )


@router.delete(
    "/users/me/skills/{skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_my_skill(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_skill = get_user_skill(
        db,
        current_user.id,
        skill_id,
    )

    if not user_skill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Skill is not in your profile",
        )

    delete_user_skill(
        db,
        user_skill,
    )