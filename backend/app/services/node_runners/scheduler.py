"""
ProcessFlow Studio — Scheduler Node Runner

Handles configuration stubs for scheduled trigger nodes.
"""

from typing import Any
from app.services.node_runners import ExecutionContext


async def run(node_id: str, config: dict, context: ExecutionContext) -> dict[str, Any]:
    """
    A scheduler node is typically a trigger node that fires execution
    on a cron/interval. When encountered in the pipeline execution (e.g. as root),
    it simply logs execution details.
    """
    cron = config.get("cron", "* * * * *")
    context.add_log(f"Scheduler trigger details: CRON ({cron})", node_id, "info")
    return {"cron": cron, "triggered": True}
