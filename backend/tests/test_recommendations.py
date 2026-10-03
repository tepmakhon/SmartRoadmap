def test_generation_recommendations_notifications_analytics(client, account, catalog_headers):
    alice, bob = account(), account("bob")
    headers = alice["headers"]
    skill = client.post("/api/v1/skills", headers=catalog_headers, json={"name": "Python"}).json()
    goals = "/api/v1/users/me/goals"
    goal = client.post(
        goals,
        headers=headers,
        json={"title": "Backend", "target_role": "Backend developer", "target_date": "2027-01-01"},
    ).json()
    path = goals + f"/{goal['id']}"
    assert client.post(path + "/generate-roadmap", headers=headers).status_code == 422
    assert (
        client.post(
            path + "/skills",
            headers=headers,
            json={"skill_id": skill["id"], "position": 0, "required_proficiency": "advanced"},
        ).status_code
        == 201
    )
    assert (
        client.post(
            path + "/skills", headers=headers, json={"skill_id": skill["id"], "position": 1}
        ).status_code
        == 409
    )
    client.post(
        "/api/v1/users/me/skills",
        headers=headers,
        json={"skill_id": skill["id"], "proficiency": "expert"},
    )
    assert client.get(path + "/recommendations", headers=headers).json() == []
    client.post(
        "/api/v1/users/me/assessments", headers=headers, json={"skill_id": skill["id"], "score": 55}
    )
    topic = client.post(
        "/api/v1/users/me/topics", headers=headers, json={"name": "Python", "skill_id": skill["id"]}
    ).json()
    client.post(
        f"/api/v1/users/me/topics/{topic['id']}/resources",
        headers=headers,
        json={"title": "Docs", "url": "https://docs.python.org"},
    )
    recommendation = client.get(path + "/recommendations", headers=headers).json()[0]
    assert recommendation["gap"] == 1
    assert recommendation["current_proficiency"] == "intermediate"
    assert recommendation["resource_ids"]
    response = client.post(path + "/generate-roadmap", headers=headers)
    assert response.status_code == 201, response.text
    roadmap = "/api/v1/users/me/roadmaps/" + str(response.json()["id"])
    milestone = client.get(roadmap + "/milestones", headers=headers).json()[0]
    assert milestone["target_date"] == "2027-01-01"
    tasks = client.get(roadmap + f"/milestones/{milestone['id']}/tasks", headers=headers).json()
    assert len(tasks) == 3
    assert any(task["resource_id"] for task in tasks)
    notifications = "/api/v1/users/me/notifications"
    notification = client.get(notifications + "?unread=true", headers=headers).json()[0]
    read = notifications + f"/{notification['id']}/read"
    assert client.patch(read, headers=bob["headers"]).status_code == 404
    assert client.patch(read, headers=headers).json()["read_at"]
    assert client.get(notifications + "?unread=true", headers=headers).json() == []
    assert client.get(notifications, headers=bob["headers"]).json() == []
    assert client.get(path + "/recommendations", headers=bob["headers"]).status_code == 404
    assert client.post(path + "/generate-roadmap", headers=bob["headers"]).status_code == 404
    analytics = client.get("/api/v1/users/me/analytics", headers=headers).json()
    assert analytics["total_tasks"] == 3
    assert analytics["roadmaps"] == 1
    assert (
        client.get("/api/v1/users/me/analytics", headers=bob["headers"]).json()["total_tasks"] == 0
    )
    assert client.delete(path + f"/skills/{skill['id']}", headers=bob["headers"]).status_code == 404
