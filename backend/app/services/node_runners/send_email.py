"""
ProcessFlow Studio — Send Email Node Runner

Sends automated emails via SMTP using template interpolation.
"""

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any
import aiosmtplib

from app.config import settings
from app.services.node_runners import ExecutionContext, interpolate_object


async def run(node_id: str, config: dict, context: ExecutionContext) -> dict[str, Any]:
    """
    Sends email notifications.
    Config parameters:
      - to: Recipient email address (interpolated)
      - subject: Email subject line (interpolated)
      - body: Email body content (interpolated)
    """
    interpolated_config = interpolate_object(config, {"data": context.data})
    
    to_email = interpolated_config.get("to")
    subject = interpolated_config.get("subject", "ProcessFlow Studio Notification")
    body = interpolated_config.get("body", "")

    if not to_email:
        context.add_log("Send Email failed: 'to' recipient address is missing.", node_id, "error")
        return {"error": "to recipient address is missing"}

    context.add_log(f"Send Email: preparing message to {to_email}", node_id, "info")

    # Check if SMTP is configured
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        # Dry-run / Fallback log
        log_msg = (
            f"[SMTP DRY-RUN] Email successfully generated!\n"
            f"  To: {to_email}\n"
            f"  Subject: {subject}\n"
            f"  Content: {body}"
        )
        context.add_log(log_msg, node_id, "success")
        return {"sent": True, "dry_run": True}

    # Construct email message
    message = MIMEMultipart()
    message["From"] = settings.SMTP_USER
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain", "utf-8"))

    try:
        context.add_log(f"Send Email: connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}", node_id, "info")
        
        # Connect and send
        await aiosmtplib.send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=settings.SMTP_PORT == 465,
            start_tls=settings.SMTP_PORT == 587,
        )

        context.add_log(f"Send Email: successfully sent message to {to_email}", node_id, "success")
        return {"sent": True, "recipient": to_email}

    except Exception as exc:
        error_msg = f"SMTP error: failed to send email to {to_email} via {settings.SMTP_HOST}. Error: {exc}"
        context.add_log(error_msg, node_id, "error")
        return {"sent": False, "error": error_msg}
