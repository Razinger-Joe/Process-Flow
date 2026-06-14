"""
ProcessFlow Studio — HTTP Request Node Runner

Executes HTTP requests to external APIs using httpx.
"""

from typing import Any
import httpx

from app.services.node_runners import ExecutionContext, interpolate_object


async def run(node_id: str, config: dict, context: ExecutionContext) -> dict[str, Any]:
    """
    Executes an HTTP request.
    Supported config fields:
      - url (str)
      - method (str: GET, POST, PUT, DELETE)
      - headers (dict, optional)
      - body (dict/str, optional)
    """
    # Interpolate config values from context data
    interpolated_config = interpolate_object(config, {"data": context.data})
    
    url = interpolated_config.get("url")
    method = interpolated_config.get("method", "GET").upper()
    headers = interpolated_config.get("headers", {})
    body = interpolated_config.get("body")

    if not url:
        context.add_log("HTTP Request failed: 'url' parameter is missing.", node_id, "error")
        return {"error": "url parameter is missing"}

    context.add_log(f"HTTP Request starting: {method} {url}", node_id, "info")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Prepare arguments
            request_kwargs = {"headers": headers}
            if body is not None:
                if isinstance(body, dict):
                    request_kwargs["json"] = body
                else:
                    request_kwargs["content"] = str(body)

            # Fire request
            response = await client.request(method, url, **request_kwargs)
            
            # Read body
            try:
                response_body = response.json()
            except Exception:
                response_body = response.text

            context.add_log(
                f"HTTP Request completed: Status {response.status_code}",
                node_id,
                "success" if response.status_code < 400 else "warning",
            )
            
            return {
                "status": response.status_code,
                "body": response_body,
                "headers": dict(response.headers),
            }

    except httpx.RequestError as exc:
        error_msg = f"An error occurred while requesting {exc.request.url!r}: {exc}"
        context.add_log(f"HTTP Request exception: {error_msg}", node_id, "error")
        return {"error": error_msg, "status": 500}
