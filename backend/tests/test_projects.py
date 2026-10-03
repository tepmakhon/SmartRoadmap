def test_projects_assessments_and_ownership(client, account, catalog_headers):
    alice, bob = account(), account("bob")
    headers = alice["headers"]
    skill = client.post("/api/v1/skills", headers=catalog_headers, json={"name": "Python"}).json()
    projects = "/api/v1/users/me/projects"
    response = client.post(
        projects, headers=headers, json={"title": "API", "url": "https://example.com"}
    )
    assert response.status_code == 201, response.text
    path = projects + f"/{response.json()['id']}"
    assert (
        client.post(path + "/skills", headers=headers, json={"skill_id": skill["id"]}).status_code
        == 201
    )
    assert (
        client.post(path + "/skills", headers=headers, json={"skill_id": skill["id"]}).status_code
        == 409
    )
    assert client.get(path + "/skills", headers=headers).json()[0]["skill"]["name"] == "Python"
    assert client.patch(path, headers=headers, json={"completed": True}).json()["completed_at"]
    assert client.get(projects + "?search=API", headers=headers).json()
    for method in ["get", "patch", "delete"]:
        assert (
            client.request(
                method, path, headers=bob["headers"], json={"title": "Stolen"}
            ).status_code
            == 404
        )
    assessments = "/api/v1/users/me/assessments"
    response = client.post(
        assessments, headers=headers, json={"skill_id": skill["id"], "score": 85}
    )
    assert response.status_code == 201
    assessment_path = assessments + f"/{response.json()['id']}"
    assert client.get(assessment_path, headers=bob["headers"]).status_code == 404
    assert client.delete(assessment_path, headers=bob["headers"]).status_code == 404
    assert client.get(assessments, headers=bob["headers"]).json() == []
    assert (
        client.post(
            assessments, headers=headers, json={"skill_id": skill["id"], "score": 101}
        ).status_code
        == 422
    )
    assert (
        client.post(assessments, headers=headers, json={"skill_id": 999, "score": 85}).status_code
        == 404
    )
    assert client.delete(assessment_path, headers=headers).status_code == 204
    assert client.delete(path + f"/skills/{skill['id']}", headers=headers).status_code == 204
    assert client.delete(path, headers=headers).status_code == 204
