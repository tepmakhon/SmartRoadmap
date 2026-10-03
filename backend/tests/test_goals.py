from datetime import date

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.goal import Goal

URL = "/api/v1/users/me/goals"


def test_goal_lifecycle(client, account, db):
    user = account()
    headers = user["headers"]
    response = client.post(
        URL,
        headers=headers,
        json={
            "title": "  Become a backend engineer  ",
            "description": "Study APIs",
            "target_role": "Backend engineer",
            "target_date": "2027-04-01",
            "priority": "high",
        },
    )
    assert response.status_code == 201, response.text
    goal = response.json()
    assert goal["title"] == "Become a backend engineer"
    assert goal["status"] == "active"
    assert goal["target_date"] == "2027-04-01"
    assert "user_id" not in goal
    goal_url = f"{URL}/{goal['id']}"
    assert client.get(goal_url, headers=headers).json() == goal
    assert client.get(URL, headers=headers).json() == [goal]
    response = client.patch(
        goal_url, headers=headers, json={"status": "completed", "description": None}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    assert response.json()["description"] is None
    assert response.json()["title"] == goal["title"]
    assert client.patch(goal_url, headers=headers, json={}).status_code == 200
    db.expire_all()
    stored = db.scalar(select(Goal).where(Goal.id == goal["id"]))
    assert stored.target_date == date(2027, 4, 1)
    assert stored.status == "completed"
    assert client.delete(goal_url, headers=headers).status_code == 204
    assert client.get(goal_url, headers=headers).status_code == 404
    assert client.delete(goal_url, headers=headers).status_code == 404
    assert client.patch(goal_url, headers=headers, json={"title": "Missing"}).status_code == 404


def test_ownership(client, account):
    alice, bob = account(), account("bob")
    goal = client.post(URL, headers=alice["headers"], json={"title": "Private"}).json()
    goal_url = f"{URL}/{goal['id']}"
    assert client.get(URL, headers=bob["headers"]).json() == []
    assert client.get(goal_url, headers=bob["headers"]).status_code == 404
    assert (
        client.patch(goal_url, headers=bob["headers"], json={"title": "Stolen"}).status_code == 404
    )
    assert client.delete(goal_url, headers=bob["headers"]).status_code == 404
    assert client.get(goal_url, headers=alice["headers"]).json()["title"] == "Private"


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"title": ""},
        {"title": " \t\n "},
        {"title": "x" * 201},
        {"title": None},
        {"title": "Valid", "status": "invalid"},
        {"title": "Valid", "priority": "urgent"},
        {"title": "Valid", "target_date": "2027-02-30"},
        {"title": "Valid", "user_id": 2},
        {"title": "Valid", "description": "x" * 5001},
        {"title": "Valid", "target_role": "x" * 151},
    ],
)
def test_create_validation(client, account, payload):
    assert client.post(URL, headers=account()["headers"], json=payload).status_code == 422


@pytest.mark.parametrize(
    "payload",
    [
        {"title": None},
        {"title": " "},
        {"title": "x" * 201},
        {"priority": None},
        {"status": None},
        {"user_id": 2},
        {"target_date": "bad"},
    ],
)
def test_update_validation(client, account, payload):
    headers = account()["headers"]
    goal = client.post(URL, headers=headers, json={"title": "Valid"}).json()
    assert client.patch(f"{URL}/{goal['id']}", headers=headers, json=payload).status_code == 422


def test_filters_pagination_and_enums(client, account):
    headers = account()["headers"]
    for index, status in enumerate(["active", "completed", "paused", "cancelled"]):
        response = client.post(
            URL,
            headers=headers,
            json={
                "title": str(index),
                "status": status,
                "priority": ["low", "medium", "high", "low"][index],
            },
        )
        assert response.status_code == 201
    assert len(client.get(URL, headers=headers).json()) == 4
    assert len(client.get(URL + "?status=paused", headers=headers).json()) == 1
    assert len(client.get(URL + "?priority=low", headers=headers).json()) == 2
    assert len(client.get(URL + "?offset=1&limit=2", headers=headers).json()) == 2
    for query in ["limit=101", "limit=0", "offset=-1", "status=bad", "priority=bad"]:
        assert client.get(URL + "?" + query, headers=headers).status_code == 422


@pytest.mark.parametrize(
    "method,path,payload",
    [
        ("get", URL, None),
        ("post", URL, {"title": "Test"}),
        ("get", URL + "/1", None),
        ("patch", URL + "/1", {"title": "Test"}),
        ("delete", URL + "/1", None),
    ],
)
def test_authentication_required(client, method, path, payload):
    assert client.request(method, path, json=payload).status_code == 401
    assert (
        client.request(
            method, path, json=payload, headers={"Authorization": "Bearer invalid"}
        ).status_code
        == 401
    )


def test_inactive_user(client, account):
    headers = account()["headers"]
    assert client.delete("/api/v1/users/me", headers=headers).status_code == 200
    assert client.post(URL, headers=headers, json={"title": "Test"}).status_code == 403


def test_database_constraints_and_cascade(client, account, db):
    user = account()
    goal = client.post(URL, headers=user["headers"], json={"title": "Test"}).json()
    from app.models.user import User

    owner = db.get(User, user["user"]["id"])
    db.delete(owner)
    db.commit()
    assert db.get(Goal, goal["id"]) is None
    db.add(Goal(user_id=999999, title="Orphan"))
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_swagger(client):
    assert client.get("/docs").status_code == 200
    spec = client.get("/openapi.json").json()
    assert spec["paths"][URL]["post"]["security"]
    assert set(spec["paths"][URL + "/{goal_id}"]) == {"get", "patch", "delete"}
