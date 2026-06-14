"""
ProcessFlow Studio — Data Transform Node Runner

Performs structural data manipulations between workflow steps.
"""

from typing import Any
from app.services.node_runners import ExecutionContext, interpolate_object


async def run(node_id: str, config: dict, context: ExecutionContext) -> dict[str, Any]:
    """
    Performs data transformation.
    Config parameters:
      - operation: extract_field, rename_field, filter_list
      - source: The target list/dict to operate on (interpolated)
      - key / field_name: The key name
      - new_key: The target name for rename operation
      - operator / value: Comparison fields for list filters
    """
    interpolated_config = interpolate_object(config, {"data": context.data})
    
    operation = interpolated_config.get("operation", "extract_field")
    source = interpolated_config.get("source")

    context.add_log(f"Data Transform starting operation '{operation}'", node_id, "info")

    if source is None:
        context.add_log("Data Transform skipped: source is None", node_id, "warning")
        return {}

    try:
        if operation == "extract_field":
            # Extract key from dictionary
            field_name = interpolated_config.get("field_name") or interpolated_config.get("key")
            if not field_name:
                context.add_log("Data Transform error: missing 'field_name'", node_id, "error")
                return {"error": "missing field_name"}
            
            if isinstance(source, dict):
                extracted = source.get(field_name)
                context.add_log(f"Data Transform: extracted field '{field_name}'", node_id, "success")
                return {"value": extracted}
            else:
                context.add_log("Data Transform warning: source is not a dictionary", node_id, "warning")
                return {"value": None}

        elif operation == "rename_field":
            key = interpolated_config.get("key") or interpolated_config.get("field_name")
            new_key = interpolated_config.get("new_key")
            if not key or not new_key:
                context.add_log("Data Transform error: missing 'key' or 'new_key'", node_id, "error")
                return {"error": "missing key or new_key"}

            if isinstance(source, dict):
                copied = source.copy()
                if key in copied:
                    copied[new_key] = copied.pop(key)
                    context.add_log(f"Data Transform: renamed field '{key}' to '{new_key}'", node_id, "success")
                else:
                    context.add_log(f"Data Transform: field '{key}' not found in dict", node_id, "warning")
                return copied
            else:
                context.add_log("Data Transform warning: source is not a dictionary", node_id, "warning")
                return {}

        elif operation == "filter_list":
            key = interpolated_config.get("key") or interpolated_config.get("field_name")
            operator = interpolated_config.get("operator", "eq").lower()
            val = interpolated_config.get("value")

            if not isinstance(source, list):
                context.add_log("Data Transform warning: source is not a list", node_id, "warning")
                return {"list": []}

            filtered = []
            for item in source:
                if not isinstance(item, dict) or key not in item:
                    continue
                
                left = item.get(key)
                matched = False
                
                # Comparison logic
                if operator == "eq" and str(left) == str(val):
                    matched = True
                elif operator == "neq" and str(left) != str(val):
                    matched = True
                elif operator == "contains" and str(val) in str(left):
                    matched = True
                
                if matched:
                    filtered.append(item)

            context.add_log(f"Data Transform: filtered list from {len(source)} to {len(filtered)} items", node_id, "success")
            return {"list": filtered}

        else:
            context.add_log(f"Data Transform error: Unknown operation '{operation}'", node_id, "error")
            return {"error": f"unknown operation {operation}"}

    except Exception as exc:
        context.add_log(f"Data Transform exception: {exc}", node_id, "error")
        return {"error": str(exc)}
