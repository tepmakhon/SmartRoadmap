import pytest

URL = "/api/v1/users/me/topics"


def test_topics_resources_lifecycle(client, account):
    alice, bob = account(), account("bob")
    headers = alice["headers"]
    response = client.post(URL, headers=headers, json={"name": "Python APIs"})
    assert response.status_code == 201, response.text
    topic = response.json()
    path = f"{URL}/{topic['id']}"
    assert client.post(URL, headers=headers, json={"name": "Python APIs"}).status_code == 409
    assert len(client.get(URL + "?search=Python", headers=headers).json()) == 1
    assert client.get(URL, headers=bob["headers"]).json() == []
    assert client.get(path, headers=bob["headers"]).status_code == 404
    assert client.patch(path, headers=bob["headers"], json={"name": "Stolen"}).status_code == 404
    assert client.delete(path, headers=bob["headers"]).status_code == 404
    resource_path = path + "/resources"
    resource = client.post(
        resource_path,
        headers=headers,
        json={
            "title": "FastAPI Docs",
            "url": "https://fastapi.tiangolo.com",
            "kind": "documentation",
        },
    )
    assert resource.status_code == 201, resource.text
    item = resource_path + f"/{resource.json()['id']}"
    assert len(client.get(resource_path, headers=headers).json()) == 1
    assert client.get(item, headers=bob["headers"]).status_code == 404
    assert client.patch(item, headers=bob["headers"], json={"title": "Stolen"}).status_code == 404
    assert client.delete(item, headers=bob["headers"]).status_code == 404
    assert (
        client.post(
            resource_path,
            headers=bob["headers"],
            json={"title": "Bad", "url": "https://example.com"},
        ).status_code
        == 404
    )
    assert (
        client.patch(item, headers=headers, json={"description": "Official"}).json()["description"]
        == "Official"
    )
    assert (
        client.patch(path, headers=headers, json={"name": "API basics"}).json()["name"]
        == "API basics"
    )
    assert client.delete(path, headers=headers).status_code == 204
    assert client.get(item, headers=headers).status_code == 404


@pytest.mark.parametrize(
    "payload", [{"name": " "}, {"name": "x" * 151}, {"name": "Test", "user_id": 1}]
)
def test_topic_validation(client, account, payload):
    assert client.post(URL, headers=account()["headers"], json=payload).status_code == 422


def test_invalid_resource_and_skill(client, account):
    headers = account()["headers"]
    assert (
        client.post(URL, headers=headers, json={"name": "Test", "skill_id": 9999}).status_code
        == 404
    )
    topic = client.post(URL, headers=headers, json={"name": "Test"}).json()
    path = f"{URL}/{topic['id']}/resources"
    for url in ["javascript:alert(1)", "file:///etc/passwd", "invalid"]:
        assert (
            client.post(path, headers=headers, json={"title": "Test", "url": url}).status_code
            == 422
        )
    assert client.post(URL, json={"name": "Test"}).status_code == 401
