"""
ProcessFlow Studio — Log Result Node Runner

Appends custom formatted message templates to execution logs.
"""

from typing import Any
from app.services.node_runners import ExecutionContext, interpolate_object


async def run(node_id: str, config: dict, context: ExecutionContext) -> dict[str, Any]:
    """
    Interpolates a message and appends it to execution log context.
    Config parameters:
      - message: String template (interpolated)
    """
    interpolated_config = interpolate_object(config, {"data": context.data})
    message = interpolated_config.get("message", "")

    context.add_log(f"LOG: {message}", node_id, "success")
    return {"message": message}
