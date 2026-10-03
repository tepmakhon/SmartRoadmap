"""Exercise the running Compose API; create and deactivate dedicated smoke accounts."""

import json
import secrets
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = "http://127.0.0.1:8001"
RUN = secrets.token_hex(5)


def request(method, path, payload=None, token=None, expected=200):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        response = urllib.request.urlopen(req, timeout=15)
    except urllib.error.HTTPError as exc:
        response = exc
    status = response.status
    body = response.read()
    assert status == expected, f"{method} {path}: expected {expected}, got {status}"
    return json.loads(body) if body else None


tokens = []
skill_id = None
try:
    for path in ["/api/v1/health", "/api/v1/database", "/openapi.json"]:
        request("GET", path)
    assert urllib.request.urlopen(BASE + "/docs", timeout=15).status == 200
    for name in ["owner", "other"]:
        username = f"smoke_{name}_{RUN}"
        email = username + "@example.com"
        password = secrets.token_urlsafe(24)
        request(
            "POST",
            "/api/v1/auth/register",
            {"username": username, "email": email, "password": password},
            expected=201,
        )
        login = request("POST", "/api/v1/auth/login", {"email": email, "password": password})
        tokens.append(login["access_token"])
        if name == "owner":
            subprocess.run(
                [
                    "docker",
                    "compose",
                    "--env-file",
                    ".env.docker",
                    "exec",
                    "-T",
                    "api",
                    "python",
                    "-m",
                    "app.admin",
                    email,
                ],
                cwd=ROOT,
                check=True,
                capture_output=True,
            )
    owner, other = tokens
    skill = request("POST", "/api/v1/skills", {"name": "Smoke Python " + RUN}, owner, 201)
    skill_id = skill["id"]
    goal = request(
        "POST",
        "/api/v1/users/me/goals",
        {"title": "Smoke goal", "target_date": "2027-01-01"},
        owner,
        201,
    )
    goal_path = "/api/v1/users/me/goals/" + str(goal["id"])
    request("GET", goal_path, token=other, expected=404)
    request("PATCH", goal_path, {"title": "Stolen"}, other, 404)
    request("DELETE", goal_path, token=other, expected=404)
    request("GET", goal_path, expected=401)
    request(
        "POST",
        goal_path + "/skills",
        {"skill_id": skill_id, "position": 0, "required_proficiency": "advanced"},
        owner,
        201,
    )
    roadmap = request("POST", goal_path + "/generate-roadmap", token=owner, expected=201)
    roadmap_path = "/api/v1/users/me/roadmaps/" + str(roadmap["id"])
    milestone = request("GET", roadmap_path + "/milestones", token=owner)[0]
    task_base = roadmap_path + f"/milestones/{milestone['id']}/tasks"
    tasks = request("GET", task_base, token=owner)
    request("PATCH", task_base + f"/{tasks[0]['id']}", {"status": "completed"}, owner)
    assert request("GET", roadmap_path + "/progress", token=owner)["percent_complete"] == 50
    request("GET", "/api/v1/users/me/notifications", token=owner)
    request("GET", "/api/v1/users/me/analytics", token=owner)
    request("DELETE", roadmap_path, token=owner, expected=204)
    request("DELETE", goal_path, token=owner, expected=204)
    request("GET", goal_path, token=owner, expected=404)
    print(
        "Live Docker smoke checks passed: health, database, Swagger, authentication, ownership, goals, generation, task progress, notifications, analytics"
    )
finally:
    if skill_id is not None and tokens:
        request("DELETE", f"/api/v1/skills/{skill_id}", token=tokens[0], expected=204)
    for token in tokens:
        request("DELETE", "/api/v1/users/me", token=token)
