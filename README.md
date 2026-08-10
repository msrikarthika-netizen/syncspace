# SyncSpace

<p align="center">
  <img src="./frontend/src/assets/ai-workspace-hero.png" alt="SyncSpace AI workspace hero screen" width="960" />
</p>

<p align="center">
  <strong>AI-powered task orchestration for teams that want live progress, specialist agents, and downloadable reports in one workspace.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=000" alt="React badge" />
  <img src="https://img.shields.io/badge/Bundler-Vite-646CFF?logo=vite&logoColor=fff" alt="Vite badge" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwindcss&logoColor=fff" alt="Tailwind CSS badge" />
  <img src="https://img.shields.io/badge/UI-Radix%20UI-161618?logo=radixui&logoColor=fff" alt="Radix UI badge" />
  <img src="https://img.shields.io/badge/State-TanStack%20Query-FF4154?logo=reactquery&logoColor=fff" alt="TanStack Query badge" />
  <img src="https://img.shields.io/badge/Routing-React%20Router-CA4245?logo=reactrouter&logoColor=fff" alt="React Router badge" />
  <img src="https://img.shields.io/badge/API-Axios-5A29E4?logo=axios&logoColor=fff" alt="Axios badge" />
  <img src="https://img.shields.io/badge/Animation-GSAP-88CE02?logo=greensock&logoColor=000" alt="GSAP badge" />
  <img src="https://img.shields.io/badge/Backend-Node.js-339933?logo=nodedotjs&logoColor=fff" alt="Node.js badge" />
  <img src="https://img.shields.io/badge/API-Express-000000?logo=express&logoColor=fff" alt="Express badge" />
  <img src="https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socketdotio&logoColor=fff" alt="Socket.IO badge" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql&logoColor=fff" alt="PostgreSQL badge" />
  <img src="https://img.shields.io/badge/Queue-Redis-DC382D?logo=redis&logoColor=fff" alt="Redis badge" />
  <img src="https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=fff" alt="JWT badge" />
  <img src="https://img.shields.io/badge/Validation-Zod-3E67B1?logo=zod&logoColor=fff" alt="Zod badge" />
  <img src="https://img.shields.io/badge/AI-Python-3776AB?logo=python&logoColor=fff" alt="Python badge" />
  <img src="https://img.shields.io/badge/API-FastAPI-009688?logo=fastapi&logoColor=fff" alt="FastAPI badge" />
  <img src="https://img.shields.io/badge/LLM-Hugging%20Face-FFD21E?logo=huggingface&logoColor=000" alt="Hugging Face badge" />
  <img src="https://img.shields.io/badge/Workflow-LangGraph-1C3C3C" alt="LangGraph badge" />
  <img src="https://img.shields.io/badge/Containers-Docker-2496ED?logo=docker&logoColor=fff" alt="Docker badge" />
</p>

## Overview

SyncSpace turns a manager's request into a tracked AI workflow. The frontend captures the task, the backend stores and coordinates it, the AI service breaks it into specialist steps, and the user sees live updates through Socket.IO before reviewing the final report.

## Highlights

- Product landing page, authentication, dashboard, task manager, agent monitor, and reports workspace.
- AI orchestration service with specialist-agent workflow, Hugging Face integration, and persisted task/report state.
- Backend API for auth, task lifecycle, report management, internal AI webhooks, and realtime updates.
- PostgreSQL for core data, Redis for queue/realtime infrastructure, and Docker Compose for full-stack startup.
- Downloadable sample AI reports included in the repository.

## Architecture

```text
syncspace/
├── frontend/   React + Vite + Tailwind CSS + Socket.IO client
├── backend/    Node.js + Express + PostgreSQL + Redis + Socket.IO
└── ai/         Python + FastAPI + Hugging Face + LangGraph
```

```mermaid
flowchart LR
  U[Manager / Browser] --> F[Frontend]
  F --> B[Backend API]
  B --> P[(PostgreSQL)]
  B --> R[(Redis)]
  B --> S[Socket.IO]
  B --> A[AI Service]
  A --> H[Hugging Face]
  A --> B
  S --> U
```

## Screenshots

### AI Dashboard

<p align="center">
  <img src="./frontend/src/assets/ai-dashboard-screen.png" alt="SyncSpace AI dashboard with task metrics and workflow activity" width="960" />
</p>

### Team Workflow

<p align="center">
  <img src="./frontend/src/assets/ai-workspace-collaboration.png" alt="SyncSpace workspace collaboration and task planning screen" width="960" />
</p>

### AI Operations Room

<p align="center">
  <img src="./frontend/src/assets/ai-operations-room.png" alt="SyncSpace AI operations room showing active agents" width="960" />
</p>

### Agent Output

<p align="center">
  <img src="./frontend/src/assets/ai-output-screen.png" alt="SyncSpace generated AI output and report view" width="960" />
</p>

## Download Sample AI Reports

| Report | File |
|--------|------|
| Build a user authentication API | [Download TXT](./frontend/src/assets/AI_Report__Build_a_user_authentication_API.txt) |
| Create login page | [Download TXT](./frontend/src/assets/AI_Report__Create_login_page.txt) |

## User Flow

```mermaid
sequenceDiagram
  participant Manager
  participant Frontend
  participant Backend
  participant AI as AI Service
  participant DB as PostgreSQL
  participant Live as Socket.IO

  Manager->>Frontend: Create a task
  Frontend->>Backend: POST /api/v1/tasks
  Backend->>DB: Save task
  Backend->>AI: Start orchestration
  AI->>Backend: Send progress webhooks
  Backend->>Live: Broadcast task updates
  AI->>Backend: Save final report
  Backend->>DB: Persist report
  Backend->>Live: Notify completion
  Live-->>Manager: Display report and result
```

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | React 19, Vite, Tailwind CSS, Radix UI, TanStack Query, React Router, Axios, GSAP, Lenis, Lucide React, Socket.IO Client |
| Backend | Node.js, Express 5, PostgreSQL, pg, JWT, bcryptjs, Zod, Bull, ioredis, Socket.IO, Nodemailer |
| AI Service | Python, FastAPI, Uvicorn, Pydantic, Hugging Face Hub, LangGraph, aiohttp, Celery, Redis |
| Infrastructure | Docker, Docker Compose, PostgreSQL, Redis |

## Run With Docker

Docker Compose is the quickest way to run the complete stack.

### 1. Create Environment Files

Create these files before starting the services:

```text
backend/.env
ai/.env
frontend/.env
```

Minimum example values:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/syncspace_dev
REDIS_URL=redis://redis:6379
AI_SERVICE_URL=http://ai:8000
BACKEND_URL=http://backend:3000
FRONTEND_URL=http://localhost:5173
INTERNAL_WEBHOOK_SECRET=change_me_to_the_same_value_in_backend_and_ai
HUGGINGFACE_API_KEY=hf_your_key_here
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_AI_URL=http://localhost:8000
```

Important notes:

- Keep `INTERNAL_WEBHOOK_SECRET` identical in `backend/.env` and `ai/.env`.
- `HUGGINGFACE_API_KEY` is required for real AI output.
- PostgreSQL and Redis are already provided by `docker-compose.yml`.

### 2. Start The Stack

```powershell
docker compose up --build
```

### 3. Open Services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend health | http://localhost:3000/health |
| AI health | http://localhost:8000/health |

### 4. Useful Commands

```powershell
docker compose logs -f backend
docker compose logs -f ai
docker compose ps
docker compose down
```

## Core Flow

1. A manager lands on the public site and enters the workspace.
2. The frontend sends a task to the backend API.
3. The backend saves the task in PostgreSQL and triggers the AI service.
4. The AI orchestrator splits the task into specialist work.
5. Progress updates are pushed through internal webhooks and Socket.IO.
6. The final report is saved and attached to the task.
7. The manager reviews the completed result in the reports area.

## API Routes

### Backend

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register a user |
| POST | `/api/v1/auth/login` | Log in |
| GET | `/api/v1/auth/profile` | Read the current profile |
| POST | `/api/v1/tasks` | Create and queue a task |
| GET | `/api/v1/tasks` | List tasks |
| GET | `/api/v1/tasks/stats` | Read dashboard stats |
| GET | `/api/v1/tasks/:id` | Read task details |
| DELETE | `/api/v1/tasks/:id` | Delete a task |
| POST | `/api/v1/tasks/:taskId/subtask-update` | Receive internal AI progress updates |
| GET | `/api/v1/reports` | List reports |
| GET | `/api/v1/reports/task/:taskId` | Read a report by task |
| GET | `/api/v1/reports/:id` | Read report details |
| POST | `/api/v1/reports/task/:taskId/save` | Save an internal AI report |

### AI Service

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/tasks/process` | Start AI processing |
| GET | `/api/tasks/:taskId/status` | Read processing status |

## Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join:task` | Client -> Server | Subscribe to task updates |
| `task:queued` | Server -> Client | Task accepted |
| `task:processing` | Server -> Client | Orchestrator started |
| `task:progress` | Server -> Client | Live progress update |
| `task:completed` | Server -> Client | Work finished |
| `task:failed` | Server -> Client | Error occurred |
| `subtask:completed` | Server -> Client | Single specialist finished |
| `report:ready` | Server -> Client | Report available |

## Repository Map

- `frontend/` contains the public landing page, auth pages, dashboard, task manager, agent monitor, reports UI, and static assets.
- `backend/` contains API routes, controllers, services, repositories, models, middleware, database config, Redis config, and Socket.IO setup.
- `ai/` contains FastAPI routes, orchestrator logic, specialist agents, LLM integration, workflow models, and tests.

## Notes

- README screenshots use repository-relative paths so they render correctly on GitHub and locally.
- Sample report links point to the two TXT files currently stored in `frontend/src/assets/`.
- Keep secrets and service credentials in local `.env` files only.
