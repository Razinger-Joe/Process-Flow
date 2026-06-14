"""
ProcessFlow Studio — Auth Router Tests

Verifies user registration, login, and profile authorization retrieval.
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_register_user_success(client: AsyncClient):
    """Test registering a new user is successful."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "testuser@example.com",
            "password": "strongpassword123",
            "full_name": "Test User",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["full_name"] == "Test User"
    assert "id" in data
    assert "hashed_password" not in data  # password hash must never be returned


async def test_register_duplicate_email_fails(client: AsyncClient):
    """Test duplicate registration returns a 400 bad request."""
    # First registration
    await client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.com",
            "password": "password123",
        },
    )
    
    # Second registration with same email
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "dup@example.com",
            "password": "differentpassword",
        },
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


async def test_login_success(client: AsyncClient):
    """Test authenticating with valid credentials returns a access token."""
    # Register user
    email = "login@example.com"
    password = "secretpassword"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password},
    )

    # Login
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},  # OAuth2 password form-data
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


async def test_login_invalid_password_fails(client: AsyncClient):
    """Test login fails with incorrect password."""
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "login@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


async def test_get_profile_me_success(client: AsyncClient):
    """Test retrieving profile data using a Bearer token."""
    # Register & Login
    email = "me@example.com"
    password = "secretpassword"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "full_name": "Me"},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    token = login_res.json()["access_token"]

    # Get profile
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["full_name"] == "Me"


async def test_get_profile_unauthorized_fails(client: AsyncClient):
    """Test profile route rejects unauthorized requests."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
