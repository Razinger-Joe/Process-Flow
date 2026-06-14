"""
ProcessFlow Studio — Runs Router

Handles workflow execution triggers and run history.
Endpoints: POST /{workflow_id}/trigger, GET /{workflow_id},
           GET /detail/{run_id}, GET /detail/{run_id}/stream
"""

from fastapi import APIRouter

router = APIRouter()
