# ============================================================
# Stage 1: Builder – install Python dependencies
# ============================================================
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build-time OS deps (gcc needed for some Python C-extensions)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ============================================================
# Stage 2: Production – lean runtime image
# ============================================================
FROM python:3.11-slim AS production

LABEL maintainer="processflow-studio"
LABEL description="FastAPI + Celery backend for Intelligent Process Automation"

# Runtime OS deps only (libpq for psycopg2, curl for healthcheck)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 curl && \
    rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder
COPY --from=builder /install /usr/local

# Create a non-root user
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/bash --create-home appuser

WORKDIR /home/appuser/backend

# Copy application code
COPY --chown=appuser:appuser app/ ./app/

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
