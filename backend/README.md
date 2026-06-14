# 🔧 ProcessFlow Studio — Backend

> **Async Python execution engine** for visual workflow automation.  
> Receives workflow definitions from the frontend canvas, stores them in PostgreSQL, and executes each node in sequence via a Celery task queue.

---

## 🏗️ Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │ ───► │   FastAPI    │ ───► │   Celery     │
│  (Next.js)   │ REST │  (Async)     │ Task │  (Worker)    │
└──────────────┘      └──────┬───────┘      └──────┬───────┘
                             │                     │
                    ┌────────▼────────┐    ┌───────▼───────┐
                    │  PostgreSQL     │    │    Redis      │
                    │  (SQLAlchemy)   │    │   (Broker)    │
                    └─────────────────┘    └───────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Async everywhere** | `asyncpg` + `aiosqlite` + async SQLAlchemy for non-blocking I/O |
| **UUID primary keys** | Prevents enumeration attacks, safe for distributed systems |
| **JSONB definitions** | Canvas node/edge graphs stored as flexible JSON — no rigid schema for workflow shapes |
| **BFS engine traversal** | Supports conditional branching (if/else) and parallel paths |
| **Celery + Redis** | Background execution with automatic fallback to FastAPI BackgroundTasks |
| **SSE streaming** | Real-time log delivery to frontend without WebSocket complexity |

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                    # FastAPI app, CORS, lifespan hooks
│   ├── config.py                  # Pydantic Settings (reads .env)
│   ├── database.py                # Async SQLAlchemy engine + session factory
│   ├── celery_app.py              # Celery configuration
│   ├── tasks.py                   # Async-to-sync Celery task wrapper
│   ├── models/
│   │   ├── user.py                # User ORM (UUID pk, email, hashed_password)
│   │   ├── workflow.py            # Workflow ORM (JSONB definition, soft-delete)
│   │   └── run.py                 # RunRecord ORM (status, JSONB logs, result)
│   ├── schemas/
│   │   ├── user.py                # Pydantic v2: Register, Login, Token, UserOut
│   │   ├── workflow.py            # Pydantic v2: Create, Update, WorkflowOut
│   │   └── run.py                 # Pydantic v2: RunRecordOut
│   ├── routers/
│   │   ├── auth.py                # POST /register, /login, GET /me
│   │   ├── workflows.py           # Full CRUD + ownership validation
│   │   └── runs.py                # Trigger, history, detail, SSE stream
│   └── services/
│       ├── auth_service.py        # bcrypt hashing + JWT encode/decode
│       ├── execution_engine.py    # BFS graph traversal + node execution
│       └── node_runners/
│           ├── __init__.py        # ExecutionContext + template interpolation
│           ├── http_request.py    # httpx async HTTP calls
│           ├── send_email.py      # aiosmtplib email dispatch
│           ├── condition.py       # Operator-based branching (==, >, contains, etc.)
│           ├── data_transform.py  # Key extraction & field mapping
│           ├── log_result.py      # Template interpolation + logging
│           └── scheduler.py       # Cron schedule trigger stub
├── alembic/                       # Database migration scripts
├── tests/
│   ├── conftest.py                # In-memory SQLite fixtures + async client
│   ├── test_auth.py               # 6 auth endpoint tests
│   ├── test_workflows.py          # 2 CRUD + ownership tests
│   └── test_execution.py          # 2 engine execution tests
├── requirements.txt               # Pinned Python dependencies
├── pytest.ini                     # Async test configuration
├── Dockerfile                     # Multi-stage production image
├── docker-compose.yml             # Full stack orchestration
└── .env.example                   # Environment variable template
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 14+ (or use SQLite for development)
- Redis 7+ (optional — auto-fallback to BackgroundTasks)

### 1. Clone & Setup

```bash
cd processflow-studio/backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials, JWT secret, etc.
```

### 3. Run Migrations

```bash
alembic upgrade head
```

### 4. Start the Server

```bash
uvicorn app.main:app --reload --port 8000
```

### 5. Start Celery Worker (optional)

```bash
celery -A app.celery_app worker --loglevel=info
```

> **Note:** If Redis is not running, the API automatically falls back to FastAPI `BackgroundTasks` for workflow execution.

---

## 🐳 Docker Deployment

```bash
# Start all services (API + Worker + PostgreSQL + Redis)
docker-compose up --build -d

# View logs
docker-compose logs -f api

# Run migrations inside container
docker-compose exec api alembic upgrade head
```

---

## 📡 API Reference

Base URL: `http://localhost:8000/api/v1`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Create new user account |
| `POST` | `/auth/login` | Get JWT access token |
| `GET` | `/auth/me` | Get current user profile |

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/workflows/` | List user's workflows |
| `POST` | `/workflows/` | Create new workflow |
| `GET` | `/workflows/{id}` | Get workflow details |
| `PUT` | `/workflows/{id}` | Update workflow |
| `DELETE` | `/workflows/{id}` | Soft-delete workflow |

### Runs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/runs/{workflow_id}/trigger` | Trigger workflow execution |
| `GET` | `/runs/workflow/{workflow_id}` | List run history |
| `GET` | `/runs/detail/{run_id}` | Get run details + logs |
| `GET` | `/runs/detail/{run_id}/stream` | SSE real-time log stream |

### Interactive Docs

- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🧪 Testing

```bash
# Run full test suite (10 tests)
python -m pytest -v

# Run specific test file
python -m pytest tests/test_auth.py -v

# Run with coverage
python -m pytest --cov=app --cov-report=term-missing
```

### Test Coverage

| Module | Tests | Coverage |
|--------|-------|----------|
| Auth (register, login, profile) | 6 | Endpoints + error handling |
| Workflows (CRUD, ownership) | 2 | Full lifecycle + security |
| Execution (trigger, engine) | 2 | Run creation + BFS engine |

---

## ⚙️ Node Runners

The execution engine supports 6 node types:

| Node Type | Runner | Description |
|-----------|--------|-------------|
| **HTTP Request** | `http_request.py` | Make async HTTP calls via httpx |
| **Send Email** | `send_email.py` | Dispatch emails via SMTP |
| **Condition** | `condition.py` | Branch on operators (==, >, <, contains) |
| **Data Transform** | `data_transform.py` | Extract/map fields between nodes |
| **Log Result** | `log_result.py` | Template interpolation + log output |
| **Scheduler** | `scheduler.py` | Cron-based trigger configuration |

### Template Interpolation

Node configs support Mustache-style templates referencing upstream data:

```json
{
  "message": "Result from API: {{data.n1.response.status}}"
}
```

---

## 🔐 Security

- **JWT authentication** on all protected endpoints
- **Ownership validation** — users can only access their own workflows/runs
- **Password hashing** via bcrypt (12 rounds)
- **CORS** configured for frontend origin only
- **UUID primary keys** prevent ID enumeration

---

## 📝 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | FastAPI | 0.115 |
| ORM | SQLAlchemy (async) | 2.0 |
| Database | PostgreSQL | 16 |
| Migrations | Alembic | 1.16 |
| Task Queue | Celery + Redis | 5.5 |
| Auth | python-jose + bcrypt | — |
| HTTP Client | httpx | 0.28 |
| Validation | Pydantic v2 | 2.11 |
| Testing | pytest + pytest-asyncio | 8.4 |
| Server | Uvicorn | 0.34 |

---

## 📄 License

MIT — built as a portfolio project for Software & RPA Graduate Trainee roles.
