def test_auth_profile_skills(client, account, catalog_headers):
    user = account()
    headers = user["headers"]
    assert "hashed_password" not in user["user"]
    assert client.post("/api/v1/auth/register", json=user["data"]).status_code == 409
    assert (
        client.post("/api/v1/auth/login", json={**user["data"], "password": "wrong"}).status_code
        == 401
    )
    assert client.get("/api/v1/users/me", headers=headers).status_code == 200
    profile = client.get("/api/v1/users/me/profile", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["user_id"] == user["user"]["id"]
    assert (
        client.put(
            "/api/v1/users/me/profile",
            headers=headers,
            json={"bio": "Learning", "date_of_birth": "2000-01-02"},
        ).json()["date_of_birth"]
        == "2000-01-02"
    )
    skill = client.post("/api/v1/skills", headers=catalog_headers, json={"name": "Python"}).json()
    response = client.post(
        "/api/v1/users/me/skills",
        headers=headers,
        json={"skill_id": skill["id"], "proficiency": "expert"},
    )
    assert response.status_code == 201
    assert response.json()["skill"]["name"] == "Python"
    assert (
        client.get("/api/v1/users/me/skills", headers=headers).json()[0]["proficiency"] == "expert"
    )
    assert (
        client.patch(
            f"/api/v1/users/me/skills/{skill['id']}",
            headers=headers,
            json={"proficiency": "advanced"},
        ).status_code
        == 200
    )
    assert (
        client.delete(f"/api/v1/users/me/skills/{skill['id']}", headers=headers).status_code == 204
    )
    assert client.get("/api/v1/users/me/skills", headers=headers).json() == []


def test_refresh_rotation_and_reuse(client, account):
    user = account()
    old = user["tokens"]["refresh_token"]
    rotated = client.post("/api/v1/auth/refresh", json={"refresh_token": old})
    assert rotated.status_code == 200
    new = rotated.json()["refresh_token"]
    assert new != old
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": old}).status_code == 401
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": new}).status_code == 401
    sessions = client.get("/api/v1/auth/sessions", headers=user["headers"]).json()
    assert not any(session["is_active"] for session in sessions)
    assert all("token_hash" not in session for session in sessions)


def test_password_errors_and_session_revocation(client, account):
    user = account()
    path = "/api/v1/auth/change-password"
    response = client.post(
        path,
        headers=user["headers"],
        json={"current_password": "wrong", "new_password": "AnotherPassword123!"},
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Current password is incorrect"
    response = client.post(
        path,
        headers=user["headers"],
        json={
            "current_password": user["data"]["password"],
            "new_password": user["data"]["password"],
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "New password must be different from current password"
    assert (
        client.post(
            path,
            headers=user["headers"],
            json={
                "current_password": user["data"]["password"],
                "new_password": "AnotherPassword123!",
            },
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/v1/auth/refresh", json={"refresh_token": user["tokens"]["refresh_token"]}
        ).status_code
        == 401
    )


def test_session_ownership_and_logout(client, account):
    alice, bob = account(), account("bob")
    sessions = client.get("/api/v1/auth/sessions", headers=alice["headers"]).json()
    assert (
        client.delete(
            f"/api/v1/auth/sessions/{sessions[0]['id']}", headers=bob["headers"]
        ).status_code
        == 404
    )
    token = alice["tokens"]["refresh_token"]
    assert client.post("/api/v1/auth/logout", json={"refresh_token": token}).status_code == 200
    assert client.post("/api/v1/auth/logout", json={"refresh_token": token}).status_code == 200
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": token}).status_code == 401
