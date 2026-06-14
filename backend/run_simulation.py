"""
ProcessFlow Studio — End-to-End Simulation Runner
This script seeds/retrieves the default Finance and Cybersecurity templates for a simulation user,
executes them using the WorkflowEngine, and prints the live execution logs to the console.
"""

import asyncio
import json
import uuid
from sqlalchemy import select
from app.database import async_session_factory
from app.models.user import User
from app.models.workflow import Workflow
from app.models.run import RunRecord
from app.services.execution_engine import WorkflowEngine
from app.services.auth_service import get_password_hash

async def run_simulation():
    print("=============================================================")
    print(">>> Starting ProcessFlow Studio E2E Simulation Run")
    print("=============================================================\n")

    async with async_session_factory() as db:
        # 1. Create or retrieve test simulation user
        email = "simulation_user@processflow.co.ke"
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            print(f"[USER] Creating simulation user: {email}...")
            user = User(
                email=email,
                hashed_password=get_password_hash("password123"),
                full_name="Simulation Operator",
            )
            db.add(user)
            await db.flush()
        else:
            print(f"[USER] Simulation user exists: {user.email}")

        # Force clean re-seeding of updated workflow definitions
        from sqlalchemy import delete
        await db.execute(delete(RunRecord).where(RunRecord.user_id == user.id))
        await db.execute(delete(Workflow).where(Workflow.user_id == user.id))
        await db.commit()

        # 2. Check if workflows are seeded. If not, auto-seed them using list_workflows logic
        result = await db.execute(
            select(Workflow)
            .where(Workflow.user_id == user.id, Workflow.is_active == True)
        )
        workflows = list(result.scalars().all())

        if not workflows:
            print("[DB] Seeding default templates for simulation user...")
            from app.routers.workflows import list_workflows
            workflows = await list_workflows(current_user=user, db=db)
            print(f"[DB] Successfully seeded {len(workflows)} templates.")
        else:
            print(f"[DB] Found {len(workflows)} active workflows.")

        # Let's commit and refresh
        await db.commit()

        # Let's run both workflows
        for wf in workflows:
            print(f"\n-------------------------------------------------------------")
            print(f"Workflow: '{wf.name}'")
            print(f"Description: {wf.description}")
            print(f"-------------------------------------------------------------")

            # Create run record
            run_record = RunRecord(
                workflow_id=wf.id,
                user_id=user.id,
                status="idle",
                logs=[],
            )
            db.add(run_record)
            await db.flush()
            
            run_id = run_record.id
            await db.commit()

            print(f"Executing Workflow run {run_id}...")
            engine = WorkflowEngine(db)
            
            # Execute the engine
            await engine.execute(run_id)

            # Retrieve final run record with logs
            await db.refresh(run_record)
            
            print(f"\nRun Status: {run_record.status.upper()}")
            print(f"Logs for run:")
            for log in (run_record.logs or []):
                level_prefix = {
                    "info": "[INFO]",
                    "success": "[SUCCESS]",
                    "warning": "[WARNING]",
                    "error": "[ERROR]"
                }.get(log.get("level"), "[LOG]")
                
                node_part = f"[{log.get('nodeId')}]" if log.get('nodeId') else ""
                print(f"  {level_prefix} {log.get('timestamp')} {node_part}: {log.get('message')}")
            
            if run_record.status == "error":
                print(f"Execution failed.")
            else:
                print(f"Run completed successfully.")

if __name__ == "__main__":
    asyncio.run(run_simulation())
