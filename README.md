# Geo Spotter

Geo Spotter is a monorepo for a geography game where players find real-world objects in Mapillary street-level imagery. The project combines a React frontend, a NestJS backend, and a separate AI verification service that checks user selections.

## What the project includes

- Solo game sessions with task progression
- Multiplayer lobbies and live match flow over WebSocket
- Authentication with access and refresh tokens
- Friends list and friend request flow
- User profile with avatar upload
- AI-based verification of selected map fragments
- Progress tracking: attempts, sessions, XP, and match results

## Tech stack

- Frontend: React 19, TypeScript, Vite, Redux Toolkit, Chakra UI, React Router, Socket.IO client, Mapillary JS, MapLibre
- Backend: NestJS, TypeScript, Prisma, PostgreSQL, Redis, Socket.IO
- AI service: FastAPI, Ultralytics YOLO, optional VLM integration

## Repository structure

```text
.
├── backend/              # NestJS API, WebSocket gateway, Prisma schema
├── frontend/             # React + Vite client
├── services/
│   └── ai-service/       # FastAPI service for selection verification
└── AGENTS.md             # Local development instructions
```

## Core modules

### Backend

- `auth` - registration, login, token refresh
- `users` - profile data and avatar upload
- `friends` - friend requests and contact list
- `game` - solo sessions, multiplayer lobbies, recent history, selection submission
- `redis` - runtime state for active game sessions
- `prisma` - database access layer

### Frontend routes

- `/` - landing page
- `/auth` - login and registration
- `/home` - home dashboard, profile, friends, recent games
- `/game` - active game session

## How the game works

1. A player starts a solo session or creates a multiplayer lobby.
2. The backend creates a session with ordered tasks.
3. The frontend shows Mapillary imagery and lets the player mark a region on the scene.
4. The backend sends the selection to the AI service.
5. The AI service verifies whether the cropped area matches the task target.
6. The backend stores the attempt and updates session progress.

## Requirements

- Node.js 20+
- npm
- Docker and Docker Compose
- Python 3.11+ for the AI service if you run it outside Docker
- Mapillary access token

## Quick start

### 1. Install dependencies

Each package is installed separately:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../services/ai-service && python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment variables

Backend:

```bash
cp backend/.env.example backend/.env
```

AI service:

```bash
cp services/ai-service/.env.example services/ai-service/.env
```

### 3. Start infrastructure

The repository includes PostgreSQL, Redis, and the AI service in Docker Compose:

```bash
cd backend
docker compose up -d
```

### 4. Generate Prisma client

```bash
cd backend
npx prisma generate
```

If you already have migrations in the project, apply them:

```bash
npx prisma migrate deploy
```

For local schema changes during development:

```bash
npx prisma migrate dev
```

### 5. Run backend and frontend

Backend:

```bash
cd backend
npm run start:dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000`
- AI service: `http://localhost:8000`
- PostgreSQL: `localhost:13000`
- Redis: `localhost:6379`

## Development commands

### Backend

```bash
npm run start:dev
npm run build
npm run lint
npm test
npm run test:e2e
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### AI service

```bash
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

## Database overview

Prisma schema includes:

- `User`
- `Friendship`
- `GameTask`
- `GameSession`
- `GameSessionTask`
- `TaskAttempt`
- `MultiplayerLobby`
- `MultiplayerMatch`
- `Achievement`

This means the project already models both solo progression and multiplayer sessions with persisted attempt history.

## API overview

Main backend endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /users`
- `POST /users/avatar`
- `GET /friends/requests`
- `POST /friends/request`
- `POST /friends/respond`
- `POST /game/sessions/solo/start`
- `POST /game/lobbies`
- `GET /game/lobbies/pending`
- `GET /game/sessions/active`
- `GET /game/sessions/recent`
- `POST /game/tasks/submit-selection`
