import pytest


@pytest.mark.parametrize(
    "path,payload",
    [
        ("/api/v1/users/me/roadmaps", {"title": " "}),
        ("/api/v1/users/me/roadmaps", {"title": "Test", "user_id": 999}),
        ("/api/v1/users/me/roadmaps", {"title": "Test", "status": "unknown"}),
        ("/api/v1/users/me/projects", {"title": " "}),
        ("/api/v1/users/me/projects", {"title": "Test", "url": "javascript:alert(1)"}),
        ("/api/v1/users/me/assessments", {"skill_id": 1, "score": -1}),
        ("/api/v1/users/me/assessments", {"skill_id": 1, "score": 101}),
    ],
)
def test_validation(client, account, path, payload):
    assert client.post(path, headers=account()["headers"], json=payload).status_code == 422


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/users/me/topics",
        "/api/v1/users/me/roadmaps",
        "/api/v1/users/me/projects",
        "/api/v1/users/me/assessments",
        "/api/v1/users/me/notifications",
        "/api/v1/users/me/analytics",
        "/api/v1/users/me/goals/1/recommendations",
    ],
)
def test_private_lists_require_authentication(client, path):
    assert client.get(path).status_code == 401
