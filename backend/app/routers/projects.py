from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.api import required, write
from app.core.dependencies import get_current_user
from app.crud import project as crud
from app.crud.learning import delete_record
from app.crud.skill import get_skill_by_id
from app.db.database import get_db
from app.models.user import User
from app.schemas.project import (
    AssessmentCreate,
    AssessmentResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectSkillCreate,
    ProjectSkillResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/api/v1/users/me", tags=["Projects and assessments"])


@router.post("/projects", response_model=ProjectResponse, status_code=201)
def create_project(
    data: ProjectCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return write(crud.create_project, db, user.id, data.model_dump(mode="json"))


@router.get("/projects", response_model=list[ProjectResponse])
def list_projects(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: str | None = Query(None, max_length=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.list_projects(db, user.id, offset, limit, search)


@router.get("/projects/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return required(crud.get_project(db, user.id, project_id))


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return write(
        crud.update_project,
        db,
        user.id,
        project_id,
        data.model_dump(mode="json", exclude_unset=True),
    )


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(
    project_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    delete_record(db, required(crud.get_project(db, user.id, project_id)))
    return Response(status_code=204)


@router.post("/projects/{project_id}/skills", response_model=ProjectSkillResponse, status_code=201)
def add_skill(
    project_id: int,
    data: ProjectSkillCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    required(crud.get_project(db, user.id, project_id))
    skill = get_skill_by_id(db, data.skill_id)
    if skill is None:
        raise HTTPException(404, "Skill not found")
    record = write(crud.create_project_skill, db, user.id, project_id, data.skill_id)
    return {"id": record.id, "skill": skill}


@router.get("/projects/{project_id}/skills", response_model=list[ProjectSkillResponse])
def list_skills(
    project_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    required(crud.get_project(db, user.id, project_id))
    return crud.list_project_skills(db, user.id, project_id, offset, limit)


@router.delete("/projects/{project_id}/skills/{skill_id}", status_code=204)
def remove_skill(
    project_id: int,
    skill_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    delete_record(db, required(crud.get_project_skill(db, user.id, project_id, skill_id)))
    return Response(status_code=204)


@router.post("/assessments", response_model=AssessmentResponse, status_code=201)
def create_assessment(
    data: AssessmentCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    if get_skill_by_id(db, data.skill_id) is None:
        raise HTTPException(404, "Skill not found")
    return write(crud.create_assessment, db, user.id, data.model_dump())


@router.get("/assessments", response_model=list[AssessmentResponse])
def list_assessments(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    skill_id: int | None = Query(None, gt=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.list_assessments(db, user.id, offset, limit, skill_id)


@router.get("/assessments/{assessment_id}", response_model=AssessmentResponse)
def get_assessment(
    assessment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    return required(crud.get_assessment(db, user.id, assessment_id))


@router.delete("/assessments/{assessment_id}", status_code=204)
def delete_assessment(
    assessment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    delete_record(db, required(crud.get_assessment(db, user.id, assessment_id)))
    return Response(status_code=204)
