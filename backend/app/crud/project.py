from sqlalchemy import select

from app.core.time import utcnow
from app.crud.learning import save
from app.crud.roadmap import update
from app.models.project import Project, ProjectSkill, SkillAssessment
from app.models.skill import Skill


def get_project(db, user_id, project_id):
    return db.scalar(select(Project).where(Project.user_id == user_id, Project.id == project_id))


def list_projects(db, user_id, offset, limit, search=None):
    statement = select(Project).where(Project.user_id == user_id)
    if search:
        statement = statement.where(Project.title.contains(search, autoescape=True))
    return list(db.scalars(statement.order_by(Project.id.desc()).offset(offset).limit(limit)).all())


def create_project(db, user_id, data):
    return save(db, Project(user_id=user_id, **data))


def update_project(db, user_id, project_id, data):
    project = get_project(db, user_id, project_id)
    if project is None:
        return None
    completed = data.pop("completed", None)
    if completed is not None:
        data["completed_at"] = (project.completed_at or utcnow()) if completed else None
    return update(db, project, data)


def list_project_skills(db, user_id, project_id, offset, limit):
    rows = db.execute(
        select(ProjectSkill.id, Skill)
        .join(Skill)
        .join(Project, Project.id == ProjectSkill.project_id)
        .where(Project.user_id == user_id, Project.id == project_id)
        .order_by(ProjectSkill.id)
        .offset(offset)
        .limit(limit)
    ).all()
    return [{"id": row[0], "skill": row[1]} for row in rows]


def create_project_skill(db, user_id, project_id, skill_id):
    if get_project(db, user_id, project_id) is None:
        return None
    return save(db, ProjectSkill(project_id=project_id, skill_id=skill_id))


def get_project_skill(db, user_id, project_id, skill_id):
    return db.scalar(
        select(ProjectSkill)
        .join(Project)
        .where(
            Project.user_id == user_id, Project.id == project_id, ProjectSkill.skill_id == skill_id
        )
    )


def get_assessment(db, user_id, assessment_id):
    return db.scalar(
        select(SkillAssessment).where(
            SkillAssessment.user_id == user_id, SkillAssessment.id == assessment_id
        )
    )


def list_assessments(db, user_id, offset, limit, skill_id=None):
    statement = select(SkillAssessment).where(SkillAssessment.user_id == user_id)
    if skill_id is not None:
        statement = statement.where(SkillAssessment.skill_id == skill_id)
    return list(
        db.scalars(statement.order_by(SkillAssessment.id.desc()).offset(offset).limit(limit)).all()
    )


def create_assessment(db, user_id, data):
    return save(db, SkillAssessment(user_id=user_id, **data))
