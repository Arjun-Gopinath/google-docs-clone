# Google Docs Clone

A lightweight collaborative document editor built for a full-stack take-home assignment. Supports rich-text editing, file upload, document sharing, and persistence — all running from a single deployable service.

**Live demo:** _[Render URL — see SUBMISSION.md]_

---

## Test accounts

| Email | Password |
|---|---|
| alice@example.com | password123 |
| bob@example.com | password123 |
| charlie@example.com | password123 |

---

## Local setup

### Prerequisites
- Node.js 18+ (22 recommended)
- npm 9+

### 1. Clone and install

```bash
git clone https://github.com/Arjun-Gopinath/google-docs-clone.git
cd google-docs-clone

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
# Edit server/.env if needed — defaults work for local dev
```

### 3. Start the server

```bash
cd server
npm start
# Server runs on http://localhost:3001
# Auto-seeds alice, bob, charlie on first run
```

### 4. Start the client (separate terminal)

```bash
cd client
npm run dev
# Client runs on http://localhost:5173
# /api requests proxy to localhost:3001 automatically
```

Open [http://localhost:5173](http://localhost:5173) and sign in with any test account.

---

## Running tests

### Backend (Jest + Supertest)
```bash
cd server
npm test
# Runs against in-memory SQLite — no server needed
```

### Frontend (Vitest + React Testing Library)
```bash
cd client
npm test
```

### E2E (Cypress)
Requires both server and client dev servers running on their default ports.

```bash
# Headless
npm run cy:run

# Interactive
npm run cy:open
```

---

## Supported file upload types

| Extension | Handling |
|---|---|
| `.txt` | Read as plain text → document paragraphs |
| `.md` | Read as plain text → document paragraphs |
| `.docx` | Raw text extraction via mammoth → document paragraphs |

Other types return a 400 error with a clear message.

---

## Deployment (Render)

A single Render **Web Service** serves both the API and the React build.

**Build command:**
```
cd client && npm install && npm run build && cd ../server && npm install
```

**Start command:**
```
node server/src/index.js
```

**Environment variables to set in Render dashboard:**
- `JWT_SECRET` — any long random string
- `NODE_ENV` — `production`
- `PORT` — leave unset (Render sets this automatically)

**Persistent disk:** Mount at `/opt/render/project/src/server/data` so the SQLite DB survives deploys.

After first deploy, run the seed manually via Render Shell:
```bash
node server/src/db/seed.js
```
