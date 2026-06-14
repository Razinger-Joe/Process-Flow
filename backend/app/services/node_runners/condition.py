"""
ProcessFlow Studio — Condition Node Runner

Evaluates comparison logic (if/else) based on input fields and operators.
"""

from typing import Any
from app.services.node_runners import ExecutionContext, interpolate_object


async def run(node_id: str, config: dict, context: ExecutionContext) -> dict[str, Any]:
    """
    Evaluates comparison logic.
    Config parameters:
      - field: Left-hand value or path (interpolated)
      - operator: eq, neq, gt, lt, contains
      - value: Right-hand value to compare against (interpolated)
    
    Returns:
      - {"result": True} or {"result": False}
    """
    # Interpolate fields
    interpolated_config = interpolate_object(config, {"data": context.data})
    
    left_val = interpolated_config.get("field")
    operator = interpolated_config.get("operator", "eq").lower()
    right_val = interpolated_config.get("value")

    context.add_log(f"Condition: evaluating ({left_val} {operator} {right_val})", node_id, "info")

    result = False
    try:
        if operator == "eq":
            # Direct comparison (try to match types or stringify)
            result = str(left_val) == str(right_val)
        elif operator == "neq":
            result = str(left_val) != str(right_val)
        elif operator == "gt":
            result = float(left_val) > float(right_val)
        elif operator == "lt":
            result = float(left_val) < float(right_val)
        elif operator == "gte":
            result = float(left_val) >= float(right_val)
        elif operator == "lte":
            result = float(left_val) <= float(right_val)
        elif operator == "contains":
            if left_val is None:
                result = False
            elif isinstance(left_val, list):
                result = right_val in left_val
            else:
                result = str(right_val) in str(left_val)
        else:
            context.add_log(f"Condition error: Unknown operator '{operator}'", node_id, "warning")
            result = False
            
    except (ValueError, TypeError) as exc:
        context.add_log(f"Condition evaluation warning: {exc}", node_id, "warning")
        result = False

    context.add_log(f"Condition result: {result}", node_id, "success")
    return {"result": result}
