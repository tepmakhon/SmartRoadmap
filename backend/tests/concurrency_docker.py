"""Verify refresh/credential races against the running Docker PostgreSQL stack."""

import secrets
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from threading import Barrier

import httpx

BASE = "http://127.0.0.1:8001"


def account():
    suffix = secrets.token_hex(6)
    data = {
        "username": "race_" + suffix,
        "email": f"race_{suffix}@example.com",
        "password": secrets.token_urlsafe(24),
    }
    assert httpx.post(BASE + "/api/v1/auth/register", json=data).status_code == 201
    response = httpx.post(BASE + "/api/v1/auth/login", json=data)
    assert response.status_code == 200
    return data, response.json()


def parallel(first, second):
    barrier = Barrier(2)

    def run(operation):
        barrier.wait(timeout=10)
        return operation()

    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = [pool.submit(run, operation) for operation in (first, second)]
        return [future.result(timeout=30) for future in futures]


for _ in range(3):
    data, tokens = account()
    headers = {"Authorization": "Bearer " + tokens["access_token"]}
    try:
        refresh = partial(
            httpx.post,
            BASE + "/api/v1/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
            timeout=20,
        )

        responses = parallel(refresh, refresh)
        assert sorted(response.status_code for response in responses) == [200, 401]
        winner = next(response.json() for response in responses if response.status_code == 200)
        assert (
            httpx.post(
                BASE + "/api/v1/auth/refresh", json={"refresh_token": winner["refresh_token"]}
            ).status_code
            == 401
        )
    finally:
        assert httpx.delete(BASE + "/api/v1/users/me", headers=headers).status_code == 200

    data, tokens = account()
    headers = {"Authorization": "Bearer " + tokens["access_token"]}
    new_password = secrets.token_urlsafe(24)
    try:
        refresh = partial(
            httpx.post,
            BASE + "/api/v1/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
            timeout=20,
        )
        change_password = partial(
            httpx.post,
            BASE + "/api/v1/auth/change-password",
            headers=headers,
            json={"current_password": data["password"], "new_password": new_password},
            timeout=20,
        )

        refresh_response, changed = parallel(refresh, change_password)
        assert changed.status_code == 200
        assert refresh_response.status_code in (200, 401)
        if refresh_response.status_code == 200:
            rotated = refresh_response.json()
            assert (
                httpx.get(
                    BASE + "/api/v1/users/me",
                    headers={"Authorization": "Bearer " + rotated["access_token"]},
                ).status_code
                == 401
            )
            assert (
                httpx.post(
                    BASE + "/api/v1/auth/refresh", json={"refresh_token": rotated["refresh_token"]}
                ).status_code
                == 401
            )
        assert httpx.get(BASE + "/api/v1/users/me", headers=headers).status_code == 401
    finally:
        login = httpx.post(BASE + "/api/v1/auth/login", json={**data, "password": new_password})
        assert login.status_code == 200
        assert (
            httpx.delete(
                BASE + "/api/v1/users/me",
                headers={"Authorization": "Bearer " + login.json()["access_token"]},
            ).status_code
            == 200
        )

print("Concurrent refresh replay and password-change/refresh race checks passed")
