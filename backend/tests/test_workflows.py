"""
ProcessFlow Studio — Workflows Router Tests

Verifies workflows CRUD operations and user ownership validation boundaries.
"""

import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def helper_create_user_and_login(client: AsyncClient, email: str) -> str:
    """Helper to register and login a user, returning their access token."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123"},
    )
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password123"},
    )
    return login_res.json()["access_token"]


async def test_workflow_crud_success(client: AsyncClient):
    """Test full workflow CRUD lifecycle."""
    token = await helper_create_user_and_login(client, "user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Workflow
    create_res = await client.post(
        "/api/v1/workflows/",
        headers=headers,
        json={
            "name": "New Workflow",
            "description": "My first workflow",
            "definition": {
                "nodes": [{"id": "n1", "type": "trigger", "label": "Manual trigger"}],
                "edges": [],
            },
        },
    )
    assert create_res.status_code == 201
    wf_id = create_res.json()["id"]
    assert create_res.json()["name"] == "New Workflow"

    # 2. List Workflows
    list_res = await client.get("/api/v1/workflows/", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
    assert list_res.json()[0]["id"] == wf_id

    # 3. Get Single Workflow
    get_res = await client.get(f"/api/v1/workflows/{wf_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "New Workflow"

    # 4. Update Workflow
    update_res = await client.put(
        f"/api/v1/workflows/{wf_id}",
        headers=headers,
        json={"name": "Updated Workflow Name"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Updated Workflow Name"

    # 5. Delete Workflow
    delete_res = await client.delete(f"/api/v1/workflows/{wf_id}", headers=headers)
    assert delete_res.status_code == 204

    # 6. Verify Deleted (returns 404)
    verify_res = await client.get(f"/api/v1/workflows/{wf_id}", headers=headers)
    assert verify_res.status_code == 404


async def test_workflow_ownership_security(client: AsyncClient):
    """Test user cannot access or modify workflows owned by another user."""
    # Register & Login User A
    token_a = await helper_create_user_and_login(client, "usera@example.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Register & Login User B
    token_b = await helper_create_user_and_login(client, "userb@example.com")
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a workflow
    create_res = await client.post(
        "/api/v1/workflows/",
        headers=headers_a,
        json={"name": "User A's Secret Workflow"},
    )
    wf_id = create_res.json()["id"]

    # User B tries to view User A's workflow (fails 404)
    get_res = await client.get(f"/api/v1/workflows/{wf_id}", headers=headers_b)
    assert get_res.status_code == 404

    # User B tries to update User A's workflow (fails 404)
    update_res = await client.put(
        f"/api/v1/workflows/{wf_id}",
        headers=headers_b,
        json={"name": "Hacked Name"},
    )
    assert update_res.status_code == 404

    # User B tries to delete User A's workflow (fails 404)
    delete_res = await client.delete(f"/api/v1/workflows/{wf_id}", headers=headers_b)
    assert delete_res.status_code == 404
