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

    # Interception for mock simulations to work offline
    lower_url = url.lower()
    if "mockbank.internal" in lower_url:
        mock_data = {
            "transactions": [
                {"id": "T001", "amount": 1200000, "country": "NG", "category": "Transfer", "account": "ACC-8821"},
                {"id": "T002", "amount": 45000, "country": "KE", "category": "Purchase", "account": "ACC-1134"},
                {"id": "T003", "amount": 890000, "country": "KE", "category": "Transfer", "account": "ACC-4492"},
                {"id": "T004", "amount": 12000, "country": "KE", "category": "Purchase", "account": "ACC-2201"},
                {"id": "T005", "amount": 670000, "country": "ZA", "category": "Withdrawal", "account": "ACC-9981"}
            ]
        }
        context.add_log("HTTP Request intercepted (simulation). Fetched 5 transactions from mock bank API (200 OK)", node_id, "success")
        return {"status": 200, "body": mock_data, "headers": {}}

    elif "security.internal" in lower_url:
        mock_data = {
            "ip": "197.254.88.41",
            "failed_count": 7,
            "first_seen": "2026-06-15T09:05:12Z",
            "attempts": [
                {"timestamp": "2026-06-15T09:05:12Z", "user": "admin@company.co.ke"},
                {"timestamp": "2026-06-15T09:07:44Z", "user": "admin@company.co.ke"},
                {"timestamp": "2026-06-15T09:09:21Z", "user": "root@company.co.ke"},
                {"timestamp": "2026-06-15T09:11:05Z", "user": "admin@company.co.ke"},
                {"timestamp": "2026-06-15T09:12:18Z", "user": "admin@company.co.ke"},
                {"timestamp": "2026-06-15T09:13:55Z", "user": "superuser@company.co.ke"},
                {"timestamp": "2026-06-15T09:14:33Z", "user": "admin@company.co.ke"}
            ]
        }
        context.add_log("HTTP Request intercepted (simulation). IP history fetched: 7 failed attempts in last 10 minutes (200 OK)", node_id, "success")
        return {"status": 200, "body": mock_data, "headers": {}}

    elif "firewall.internal" in lower_url:
        context.add_log("HTTP Request intercepted (simulation). IP 197.254.88.41 added to firewall blocklist for 24 hours (200 OK)", node_id, "success")
        return {"status": 200, "body": {"blocked": True, "ip": "197.254.88.41"}, "headers": {}}

    elif "jira.internal" in lower_url:
        context.add_log("HTTP Request intercepted (simulation). Incident ticket SEC-2847 created in Jira (201 Created)", node_id, "success")
        return {"status": 201, "body": {"ticket_id": "SEC-2847", "status": "created"}, "headers": {}}

    elif "hooks.slack.com" in lower_url:
        context.add_log("HTTP Request intercepted (simulation). Slack notification delivered to #soc-alerts channel (200 OK)", node_id, "success")
        return {"status": 200, "body": "ok", "headers": {}}

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
