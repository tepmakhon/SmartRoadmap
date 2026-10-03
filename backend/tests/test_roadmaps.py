URL = "/api/v1/users/me/roadmaps"


def test_roadmap_tasks_progress_and_ownership(client, account):
    alice, bob = account(), account("bob")
    headers = alice["headers"]
    goal = client.post("/api/v1/users/me/goals", headers=headers, json={"title": "Engineer"}).json()
    response = client.post(
        URL, headers=headers, json={"title": "My roadmap", "goal_id": goal["id"]}
    )
    assert response.status_code == 201, response.text
    path = f"{URL}/{response.json()['id']}"
    assert client.get(path + "/progress", headers=headers).json()["percent_complete"] == 0
    milestone = client.post(
        path + "/milestones", headers=headers, json={"title": "Foundation", "position": 0}
    )
    assert milestone.status_code == 201
    milestone_path = path + f"/milestones/{milestone.json()['id']}"
    tasks_path = milestone_path + "/tasks"
    first = client.post(tasks_path, headers=headers, json={"title": "Learn", "position": 0})
    assert first.status_code == 201, first.text
    task_path = tasks_path + f"/{first.json()['id']}"
    second = client.post(tasks_path, headers=headers, json={"title": "Build", "position": 1})
    assert second.status_code == 201
    assert (
        client.post(
            tasks_path, headers=headers, json={"title": "Duplicate", "position": 0}
        ).status_code
        == 409
    )
    assert client.patch(task_path, headers=headers, json={"status": "completed"}).json()[
        "completed_at"
    ]
    progress = client.get(path + "/progress", headers=headers).json()
    assert progress["percent_complete"] == 50
    assert progress["total_tasks"] == 2
    assert (
        client.patch(task_path, headers=headers, json={"status": "in_progress"}).json()[
            "completed_at"
        ]
        is None
    )
    assert client.get(path + "/progress", headers=headers).json()["in_progress_tasks"] == 1
    for item in [path, milestone_path, task_path]:
        assert client.get(item, headers=bob["headers"]).status_code == 404
        assert (
            client.patch(item, headers=bob["headers"], json={"title": "Stolen"}).status_code == 404
        )
        assert client.delete(item, headers=bob["headers"]).status_code == 404
    assert client.get(path + "/progress", headers=bob["headers"]).status_code == 404
    assert client.get(URL, headers=bob["headers"]).json() == []
    assert (
        client.post(
            URL, headers=bob["headers"], json={"title": "Bad", "goal_id": goal["id"]}
        ).status_code
        == 404
    )
    assert client.patch(task_path, headers=headers, json={"title": None}).status_code == 422
    assert client.patch(task_path, headers=headers, json={"topic_id": 999}).status_code == 404
    assert client.patch(path, headers=headers, json={"goal_id": None}).json()["goal_id"] is None
    assert client.get(path + "/milestones", headers=headers).status_code == 200
    assert len(client.get(tasks_path, headers=headers).json()) == 2
    assert client.delete(path, headers=headers).status_code == 204
    assert client.get(task_path, headers=headers).status_code == 404


def test_parent_mismatch_and_resource_ownership(client, account):
    alice, bob = account(), account("bob")
    headers = alice["headers"]
    roadmap = client.post(URL, headers=headers, json={"title": "Test"}).json()
    path = f"{URL}/{roadmap['id']}"
    milestone = client.post(
        path + "/milestones", headers=headers, json={"title": "Test", "position": 0}
    ).json()
    tasks = path + f"/milestones/{milestone['id']}/tasks"
    topic = client.post(
        "/api/v1/users/me/topics", headers=bob["headers"], json={"name": "Private"}
    ).json()
    assert (
        client.post(
            tasks, headers=headers, json={"title": "Bad", "position": 0, "topic_id": topic["id"]}
        ).status_code
        == 404
    )
    assert client.get(f"{URL}/999/milestones/{milestone['id']}", headers=headers).status_code == 404
    assert client.post(URL, json={"title": "Test"}).status_code == 401
