"""
ProcessFlow Studio — Workflows Router

Defines CRUD endpoints for workflow resource management.
"""

from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowOut, WorkflowUpdate
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post(
    "/",
    response_model=WorkflowOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workflow canvas",
)
async def create_workflow(
    workflow_in: WorkflowCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Create a new workflow canvas for the currently logged-in user.
    """
    new_workflow = Workflow(
        user_id=current_user.id,
        name=workflow_in.name,
        description=workflow_in.description,
        definition=workflow_in.definition,
    )
    db.add(new_workflow)
    await db.flush()
    return new_workflow


@router.get(
    "/",
    response_model=list[WorkflowOut],
    summary="List all workflows owned by the current user",
)
async def list_workflows(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Return all active workflows owned by the authenticated user.
    If the user has zero workflows, automatically seeds the default Finance Fraud Detection
    and Cybersecurity Incident Response templates.
    """
    result = await db.execute(
        select(Workflow)
        .where(Workflow.user_id == current_user.id, Workflow.is_active == True)
        .order_by(Workflow.created_at.desc())
    )
    workflows = list(result.scalars().all())

    if not workflows:
        # 1. Finance Simulation Workflow Definition
        finance_definition = {
            "nodes": [
                {
                    "id": "f1",
                    "type": "trigger",
                    "label": "Scheduler trigger",
                    "description": "Fires every Monday at 8:00 AM EAT",
                    "position": {"x": 100, "y": 200},
                    "config": {
                        "cron": "0 8 * * MON",
                        "timezone": "Africa/Nairobi",
                        "description": "Fires every Monday at 8:00 AM EAT"
                    }
                },
                {
                    "id": "f2",
                    "type": "action",
                    "label": "HTTP request — fetch transactions",
                    "description": "Pulls all transactions from the past 7 days",
                    "position": {"x": 350, "y": 200},
                    "config": {
                        "url": "https://mockbank.internal/api/transactions?period=last_7_days",
                        "method": "GET",
                        "headers": "{\"Authorization\": \"Bearer {{env.BANK_API_KEY}}\"}",
                        "description": "Pulls all transactions from the past 7 days"
                    }
                },
                {
                    "id": "f3",
                    "type": "logic",
                    "label": "Data transform — extract suspicious",
                    "description": "Flags transactions from outside Kenya",
                    "position": {"x": 600, "y": 200},
                    "config": {
                        "operation": "filter_list",
                        "source": "{{data.f2.body.transactions}}",
                        "key": "country",
                        "operator": "neq",
                        "value": "KE",
                        "description": "Flags transactions from outside Kenya"
                    }
                },
                {
                    "id": "f4",
                    "type": "logic",
                    "label": "Condition — any suspicious found?",
                    "description": "Branches based on whether fraud was detected",
                    "position": {"x": 850, "y": 200},
                    "config": {
                        "field": "{{data.f3.list.length}}",
                        "operator": "gt",
                        "value": "0",
                        "description": "Branches based on whether fraud was detected"
                    }
                },
                {
                    "id": "f5",
                    "type": "action",
                    "label": "Send email — compliance alert",
                    "description": "Sends fraud alert only if suspicious transactions exist",
                    "position": {"x": 1100, "y": 50},
                    "config": {
                        "to": "compliance@company.co.ke",
                        "subject": "🚨 ALERT: Suspicious transactions detected outside Kenya",
                        "body_template": "Dear Compliance Team,\n\nOur automated system has flagged {{data.f3.list.length}} suspicious international transactions this week.\n\nPlease review immediately: {{data.f3.list}}\n\nProcessFlow Studio — Automated Alert",
                        "description": "Sends fraud alert only if suspicious transactions exist"
                    }
                },
                {
                    "id": "f6",
                    "type": "logic",
                    "label": "Data transform — compute report",
                    "description": "Extracts transactions list for summary stats",
                    "position": {"x": 1100, "y": 350},
                    "config": {
                        "operation": "extract_field",
                        "source": "{{data.f2.body}}",
                        "field_name": "transactions",
                        "description": "Extracts transactions list for summary stats"
                    }
                },
                {
                    "id": "f7",
                    "type": "output",
                    "label": "Send email — weekly report",
                    "description": "Weekly report to management regardless of fraud status",
                    "position": {"x": 1350, "y": 200},
                    "config": {
                        "to": "cfo@company.co.ke, management@company.co.ke",
                        "subject": "📊 Weekly Transaction Report",
                        "body_template": "Weekly Financial Summary\n\nTotal Transactions: {{data.f6.value.length}}\nSuspicious Flagged: {{data.f3.list.length}}\n\n— ProcessFlow Studio",
                        "description": "Weekly report to management regardless of fraud status"
                    }
                },
                {
                    "id": "f8",
                    "type": "output",
                    "label": "Log result",
                    "description": "Final audit log entry",
                    "position": {"x": 1600, "y": 200},
                    "config": {
                        "message": "Weekly financial audit execution completed successfully. {{data.f6.value.length}} transactions processed. {{data.f3.list.length}} flagged.",
                        "description": "Final audit log entry"
                    }
                }
            ],
            "edges": [
                {"id": "fe1", "source": "f1", "target": "f2"},
                {"id": "fe2", "source": "f2", "target": "f3"},
                {"id": "fe3", "source": "f3", "target": "f4"},
                {"id": "fe4", "source": "f4", "target": "f5", "sourceHandle": "true", "label": "Yes — fraud found"},
                {"id": "fe5", "source": "f4", "target": "f6", "sourceHandle": "false", "label": "No — clean week"},
                {"id": "fe6", "source": "f5", "target": "f6"},
                {"id": "fe7", "source": "f6", "target": "f7"},
                {"id": "fe8", "source": "f7", "target": "f8"}
            ]
        }

        # 2. Cybersecurity Simulation Workflow Definition
        cyber_definition = {
            "nodes": [
                {
                    "id": "c1",
                    "type": "trigger",
                    "label": "Webhook trigger — auth log event",
                    "description": "Receives failed login events in real time",
                    "position": {"x": 100, "y": 200},
                    "config": {
                        "endpoint": "/webhooks/auth-events",
                        "method": "POST",
                        "expected_payload": "{\"event\": \"login_failed\", \"ip\": \"string\", \"user\": \"string\", \"timestamp\": \"ISO8601\"}",
                        "mock_payload": {
                            "ip": "197.254.88.41",
                            "user": "admin@company.co.ke",
                            "event": "login_failed"
                        },
                        "description": "Receives every failed login event from the auth system in real time"
                    }
                },
                {
                    "id": "c2",
                    "type": "action",
                    "label": "HTTP request — fetch IP history",
                    "description": "Checks how many times this IP has failed in the last 10 minutes",
                    "position": {"x": 350, "y": 200},
                    "config": {
                        "url": "https://security.internal/api/failed-logins?ip={{data.c1.ip}}&window=10m",
                        "method": "GET",
                        "description": "Checks how many times this IP has failed in the last 10 minutes"
                    }
                },
                {
                    "id": "c3",
                    "type": "logic",
                    "label": "Condition — threshold breached?",
                    "description": "Triggers response only if 5 or more failures detected",
                    "position": {"x": 600, "y": 200},
                    "config": {
                        "field": "{{data.c2.body.failed_count}}",
                        "operator": "gte",
                        "value": "5",
                        "description": "Triggers response only if 5 or more failures detected"
                    }
                },
                {
                    "id": "c4",
                    "type": "action",
                    "label": "HTTP request — block IP",
                    "description": "Adds the offending IP to the firewall blocklist for 24 hours",
                    "position": {"x": 850, "y": 50},
                    "config": {
                        "url": "https://firewall.internal/api/blocklist",
                        "method": "POST",
                        "body": "{\"ip\": \"{{data.c1.ip}}\", \"reason\": \"Brute force detected\", \"duration_hours\": 24}",
                        "description": "Adds the offending IP to the firewall blocklist for 24 hours"
                    }
                },
                {
                    "id": "c5",
                    "type": "action",
                    "label": "HTTP request — create incident ticket",
                    "description": "Creates a tracked security incident in the ticketing system",
                    "position": {"x": 1100, "y": 50},
                    "config": {
                        "url": "https://jira.internal/api/issues",
                        "method": "POST",
                        "body": "{\"project\": \"SEC\", \"type\": \"Security Incident\", \"priority\": \"High\", \"title\": \"Brute force attempt from {{data.c1.ip}}\", \"description\": \"{{data.c2.body.failed_count}} failed logins in 10 minutes targeting user {{data.c1.user}}\"}",
                        "description": "Creates a tracked security incident in the ticketing system"
                    }
                },
                {
                    "id": "c6",
                    "type": "logic",
                    "label": "Data transform — enrich IP data",
                    "description": "Extracts the IP field from request",
                    "position": {"x": 1350, "y": 50},
                    "config": {
                        "operation": "extract_field",
                        "source": "{{data.c1}}",
                        "field_name": "ip",
                        "description": "Extracts the IP field from request"
                    }
                },
                {
                    "id": "c7",
                    "type": "output",
                    "label": "Send email — SOC alert",
                    "description": "Detailed alert to the security operations center",
                    "position": {"x": 1600, "y": 50},
                    "config": {
                        "to": "soc-team@company.co.ke",
                        "subject": "🔴 SECURITY ALERT: Brute force from {{data.c1.ip}}",
                        "body_template": "SECURITY ALERT — IMMEDIATE ACTION REQUIRED\n\nIncident Type : Brute Force Attack\nOffending IP  : {{data.c1.ip}}\nFailed Logins : {{data.c2.body.failed_count}} in 10 minutes\nTarget User   : {{data.c1.user}}\nAction Taken  : IP blocked for 24 hours\n\n— ProcessFlow Studio Security Automation",
                        "description": "Detailed alert to the security operations center"
                    }
                },
                {
                    "id": "c8",
                    "type": "output",
                    "label": "Send webhook — Slack SOC channel",
                    "description": "Instant Slack ping to SOC channel for fastest response",
                    "position": {"x": 1850, "y": 50},
                    "config": {
                        "url": "https://hooks.slack.com/services/mock-webhook",
                        "method": "POST",
                        "body": "{\"text\": \":red_circle: *Brute force blocked* — IP `{{data.c1.ip}}` made {{data.c2.body.failed_count}} failed attempts on `{{data.c1.user}}`. Blocked 24h.\"}",
                        "description": "Instant Slack ping to SOC channel for fastest response"
                    }
                },
                {
                    "id": "c9",
                    "type": "output",
                    "label": "Log result",
                    "description": "Audit trail entry for compliance and forensics",
                    "position": {"x": 2100, "y": 200},
                    "config": {
                        "message": "Incident response complete. IP {{data.c1.ip}} blocked. Ticket SEC-2847 created. SOC notified via email + Slack.",
                        "description": "Audit trail entry for compliance and forensics"
                    }
                }
            ],
            "edges": [
                {"id": "ce1", "source": "c1", "target": "c2"},
                {"id": "ce2", "source": "c2", "target": "c3"},
                {"id": "ce3", "source": "c3", "target": "c4", "sourceHandle": "true", "label": ">=5 failures — respond"},
                {"id": "ce4", "source": "c3", "target": "c9", "sourceHandle": "false", "label": "< 5 failures — log only"},
                {"id": "ce5", "source": "c4", "target": "c5"},
                {"id": "ce6", "source": "c5", "target": "c6"},
                {"id": "ce7", "source": "c6", "target": "c7"},
                {"id": "ce8", "source": "c7", "target": "c8"},
                {"id": "ce9", "source": "c8", "target": "c9"}
            ]
        }

        # Save seeded templates to DB
        seeded_wf1 = Workflow(
            user_id=current_user.id,
            name="Finance Fraud Detection & Weekly Report",
            description="Weekly fraud transaction matching, compliance alerts, and analytics summaries.",
            definition=finance_definition,
        )
        seeded_wf2 = Workflow(
            user_id=current_user.id,
            name="Suspicious Login Detection & Automated Response",
            description="Cybersecurity login threat analytics, automatic firewall blocking, and Slack operations warning.",
            definition=cyber_definition,
        )
        db.add(seeded_wf1)
        db.add(seeded_wf2)
        await db.commit()

        # Query again to retrieve with database populated attributes
        result = await db.execute(
            select(Workflow)
            .where(Workflow.user_id == current_user.id, Workflow.is_active == True)
            .order_by(Workflow.created_at.desc())
        )
        workflows = list(result.scalars().all())

    return workflows



@router.get(
    "/{workflow_id}",
    response_model=WorkflowOut,
    summary="Get workflow details by ID",
)
async def get_workflow(
    workflow_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Fetch details of a single workflow. Checks ownership and checks that the workflow is active.
    """
    result = await db.execute(
        select(Workflow)
        .where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id,
            Workflow.is_active == True,
        )
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to view it.",
        )
    return workflow


@router.put(
    "/{workflow_id}",
    response_model=WorkflowOut,
    summary="Update workflow meta info and canvas definition",
)
async def update_workflow(
    workflow_id: uuid.UUID,
    workflow_in: WorkflowUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update details (name, description, canvas nodes/edges) of a workflow. Validates ownership.
    """
    result = await db.execute(
        select(Workflow)
        .where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id,
            Workflow.is_active == True,
        )
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to update it.",
        )

    # Apply updates
    update_data = workflow_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(workflow, field, val)

    await db.flush()
    return workflow


@router.delete(
    "/{workflow_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a workflow by ID",
)
async def delete_workflow(
    workflow_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Soft-delete a workflow by setting is_active = False. Validates ownership.
    """
    result = await db.execute(
        select(Workflow)
        .where(
            Workflow.id == workflow_id,
            Workflow.user_id == current_user.id,
            Workflow.is_active == True,
        )
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to delete it.",
        )

    # Perform soft-delete
    workflow.is_active = False
    await db.flush()
    return
