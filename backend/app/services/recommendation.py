from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.crud.goal import get_user_goal
from app.models.goal import Goal, GoalStatus
from app.models.learning import LearningTopic
from app.models.project import Project, ProjectSkill, SkillAssessment
from app.models.recommendation import GoalSkill, Notification
from app.models.roadmap import LearningTask, Milestone, Roadmap, TaskStatus
from app.models.skill import Skill
from app.models.user_skill import UserSkill

LEVELS = {"beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4}


def recommendations(db, user_id, goal_id):
    goal = get_user_goal(db, user_id, goal_id)
    if goal is None:
        return None
    requirements = db.execute(
        select(GoalSkill, Skill)
        .join(Skill)
        .join(Goal)
        .where(Goal.user_id == user_id, Goal.id == goal_id)
        .order_by(GoalSkill.position)
    ).all()
    current = {
        item.skill_id: item.proficiency
        for item in db.scalars(select(UserSkill).where(UserSkill.user_id == user_id)).all()
    }
    assessments = {}
    for item in db.scalars(
        select(SkillAssessment)
        .where(SkillAssessment.user_id == user_id)
        .order_by(SkillAssessment.id.desc())
    ).all():
        assessments.setdefault(item.skill_id, item.score)
    project_counts = dict(
        db.execute(
            select(ProjectSkill.skill_id, func.count(ProjectSkill.id))
            .join(Project)
            .where(Project.user_id == user_id, Project.completed_at.is_not(None))
            .group_by(ProjectSkill.skill_id)
        ).all()
    )
    topics = db.scalars(
        select(LearningTopic)
        .options(selectinload(LearningTopic.resources))
        .where(LearningTopic.user_id == user_id)
    ).all()
    result = []
    for requirement, skill in requirements:
        proficiency = current.get(skill.id)
        score = assessments.get(skill.id)
        assessed = (
            4
            if score is not None and score >= 90
            else 3
            if score is not None and score >= 75
            else 2
            if score is not None and score >= 50
            else 1
        )
        level = LEVELS.get(proficiency, 0)
        if score is not None:
            level = min(level, assessed) if level else assessed
            proficiency = next(name for name, number in LEVELS.items() if number == level)
        gap = max(0, LEVELS[requirement.required_proficiency] - level)
        if gap == 0:
            continue
        relevant = [topic for topic in topics if topic.skill_id == skill.id]
        result.append(
            {
                "skill_id": skill.id,
                "skill_name": skill.name,
                "current_proficiency": proficiency,
                "required_proficiency": requirement.required_proficiency,
                "gap": gap,
                "position": requirement.position,
                "completed_projects": project_counts.get(skill.id, 0),
                "latest_assessment_score": score,
                "topic_ids": [topic.id for topic in relevant],
                "resource_ids": [resource.id for topic in relevant for resource in topic.resources],
            }
        )
    return result


def generate_roadmap(db, user_id, goal_id):
    goal = get_user_goal(db, user_id, goal_id)
    if goal is None:
        return None
    if goal.status != GoalStatus.active:
        raise ValueError("Only active goals can generate roadmaps")
    items = recommendations(db, user_id, goal_id)
    if not items:
        raise ValueError(
            "Add required skills with unmet proficiency targets before generating a roadmap"
        )
    roadmap = Roadmap(
        user_id=user_id,
        goal_id=goal_id,
        title=goal.title,
        description=f"Personalized learning plan for {goal.target_role or goal.title}",
    )
    try:
        db.add(roadmap)
        db.flush()
        for position, item in enumerate(items):
            milestone = Milestone(
                roadmap_id=roadmap.id,
                title=f"Learn {item['skill_name']}"[:200],
                description=f"Reach {item['required_proficiency']}; proficiency gap: {item['gap']}",
                position=position,
                target_date=goal.target_date,
            )
            db.add(milestone)
            db.flush()
            db.add(
                LearningTask(
                    milestone_id=milestone.id,
                    title=f"Study {item['skill_name']}"[:200],
                    description=f"Build toward {item['required_proficiency']} proficiency",
                    position=0,
                    topic_id=item["topic_ids"][0] if item["topic_ids"] else None,
                    target_date=goal.target_date,
                )
            )
            for task_position, resource_id in enumerate(item["resource_ids"], start=1):
                db.add(
                    LearningTask(
                        milestone_id=milestone.id,
                        title=f"Review resource for {item['skill_name']}"[:200],
                        resource_id=resource_id,
                        position=task_position,
                        target_date=goal.target_date,
                    )
                )
            db.add(
                LearningTask(
                    milestone_id=milestone.id,
                    title=(
                        f"Extend your {item['skill_name']} project"
                        if item["completed_projects"]
                        else f"Build a {item['skill_name']} practice project"
                    )[:200],
                    position=len(item["resource_ids"]) + 1,
                    target_date=goal.target_date,
                )
            )
        db.add(Notification(user_id=user_id, message=f'Your roadmap "{goal.title}" is ready.'))
        db.commit()
        db.refresh(roadmap)
        return roadmap
    except Exception:
        db.rollback()
        raise


def analytics(db, user_id):
    def count(model, *conditions):
        return db.scalar(select(func.count(model.id)).where(model.user_id == user_id, *conditions))

    task_statement = (
        select(func.count(LearningTask.id))
        .join(Milestone)
        .join(Roadmap)
        .where(Roadmap.user_id == user_id)
    )
    return {
        "goals": count(Goal),
        "roadmaps": count(Roadmap),
        "projects": count(Project),
        "completed_projects": count(Project, Project.completed_at.is_not(None)),
        "assessments": count(SkillAssessment),
        "total_tasks": db.scalar(task_statement),
        "completed_tasks": db.scalar(
            task_statement.where(LearningTask.status == TaskStatus.completed)
        ),
    }
