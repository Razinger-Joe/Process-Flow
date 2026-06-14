"""
ProcessFlow Studio — Execution Engine & Runs Tests

Verifies workflow trigger routes and runs the WorkflowEngine
to test node execution, context mapping, and template interpolation.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import uuid as uuid_mod

from app.models.run import RunRecord
from app.services.execution_engine import WorkflowEngine
from tests.test_workflows import helper_create_user_and_login

pytestmark = pytest.mark.asyncio


async def test_trigger_and_list_runs(client: AsyncClient):
    """Test triggering a run creates database entries and returns status."""
    token = await helper_create_user_and_login(client, "runner@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Create workflow
    wf_res = await client.post(
        "/api/v1/workflows/",
        headers=headers,
        json={
            "name": "Run Test Workflow",
            "definition": {
                "nodes": [{"id": "n1", "type": "trigger", "label": "Manual trigger"}],
                "edges": [],
            },
        },
    )
    wf_id = wf_res.json()["id"]

    # Trigger run
    trigger_res = await client.post(
        f"/api/v1/runs/{wf_id}/trigger",
        headers=headers,
    )
    assert trigger_res.status_code == 201
    run_id = trigger_res.json()["id"]
    assert trigger_res.json()["status"] == "idle"

    # List runs
    list_res = await client.get(
        f"/api/v1/runs/workflow/{wf_id}",
        headers=headers,
    )
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1
    assert list_res.json()[0]["id"] == run_id

    # Fetch run detail
    detail_res = await client.get(
        f"/api/v1/runs/detail/{run_id}",
        headers=headers,
    )
    assert detail_res.status_code == 200
    assert detail_res.json()["status"] in ["idle", "running", "success"]


async def test_engine_execution_success(client: AsyncClient, db: AsyncSession):
    """
    Directly tests WorkflowEngine execution of a 2-node graph:
    Scheduler trigger -> Log result (using template interpolation).

    Creates records directly in the test DB session to avoid cross-session
    visibility issues with the BackgroundTasks fallback path.
    """
    from app.models.workflow import Workflow
    import uuid as _uuid

    # 1. Create user via API
    token = await helper_create_user_and_login(client, "engine@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Get current user's ID from /me
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    user_id = uuid_mod.UUID(me_res.json()["id"])

    # 2. Create workflow directly in the test session
    workflow_def = {
        "nodes": [
            {
                "id": "n1",
                "type": "trigger",
                "label": "Scheduler trigger",
                "config": {"cron": "*/5 * * * *"},
            },
            {
                "id": "n2",
                "type": "output",
                "label": "Log result",
                "config": {"message": "Cron schedule: {{data.n1.cron}}"},
            },
        ],
        "edges": [
            {
                "id": "e1",
                "source": "n1",
                "target": "n2",
            }
        ],
    }
    workflow = Workflow(
        name="Integration Workflow",
        definition=workflow_def,
        user_id=user_id,
    )
    db.add(workflow)
    await db.flush()

    # 3. Create run record directly in the test session
    run_record = RunRecord(
        workflow_id=workflow.id,
        user_id=user_id,
        status="idle",
        logs=[],
    )
    db.add(run_record)
    await db.commit()

    # 4. Run the engine directly with the test DB session
    saved_run_id = run_record.id  # Save before expire_all invalidates lazy attrs
    engine = WorkflowEngine(db)
    await engine.execute(saved_run_id)

    # 5. Fetch the RunRecord and assert outcomes
    db.expire_all()
    run_record_res = await db.execute(select(RunRecord).where(RunRecord.id == saved_run_id))
    run = run_record_res.scalar_one()

    # Engine status must update to success
    assert run.status == "success"

    # Logs must contain our templates and steps
    logs = run.logs
    log_messages = [log["message"] for log in logs]

    # Verify scheduler trigger logs
    assert any("Scheduler trigger details" in msg for msg in log_messages)
    # Verify logger outputs with template interpolation (it should resolve data.n1.cron to */5 * * * *)
    assert any("LOG: Cron schedule: */5 * * * *" in msg for msg in log_messages)
    # The status == "success" already confirms full execution.
    # The completion log message contains emoji (✅) which we skip in assertion.
    assert run.completed_at is not None
