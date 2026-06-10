# Architecture Notes

## What I built and why

### Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Fast dev loop, wide ecosystem |
| Rich text editor | TipTap (ProseMirror) | Best-in-class React editor with first-class extension API; easier to style and extend than Quill or Draft.js |
| Backend | Node.js + Express | JavaScript throughout removes context-switching; faster to ship in a 4-6h window than FastAPI |
| Database | SQLite (better-sqlite3) | Zero config, no external service needed for reviewers, sync API fits Express's synchronous style well |
| Auth | JWT in localStorage | Sufficient for this scope; avoids OAuth complexity while still demonstrating the full auth flow |
| Deployment | Render (single service) | Express serves the React build in production — one URL, one service, no cross-origin complexity |

### Key decisions

**TipTap over Quill/Slate:** TipTap has TypeScript support, a well-documented extension API, and auto-save works naturally with `onUpdate`. Content is stored as ProseMirror JSON, which is stable and easily round-trips through the DB.

**SQLite over Postgres:** No external DB setup required for reviewers. `better-sqlite3` is synchronous, which plays well with Express middleware patterns. Swapping to Postgres would only require changing the `getDb()` function — the rest of the code is SQL-agnostic.

**Single Render service:** Express serves `client/dist` as static files in production. This avoids CORS entirely and simplifies deployment to a single URL. The tradeoff is a slightly slower cold start on the free tier.

**Seeded users over real registration:** A registration flow would add ~30-45 min of UI/validation work with minimal benefit for reviewers. The three seeded accounts cover the sharing demo fully.

---

## What I deliberately left out

| Feature | Why skipped |
|---|---|
| Real-time collaboration (Yjs/WebSockets) | Would require a fundamentally different data model (CRDTs); not feasible within the timebox |
| Version history | Would need either event sourcing or periodic snapshots; out of scope |
| Export to PDF/Markdown | Nice-to-have, but adds dependencies without demonstrating new architectural patterns |
| Role-based permissions | Owner vs. editor is sufficient to demonstrate the sharing model |
| Comments / suggestions | Out of scope for the timebox |

---

## Data model

```
users
  id, email, name, password_hash, created_at

documents
  id, title, content (TipTap JSON string), owner_id → users.id,
  created_at, updated_at

document_shares
  id, document_id → documents.id (CASCADE DELETE),
  shared_with_user_id → users.id, permission ('view'|'edit'),
  created_at
  UNIQUE(document_id, shared_with_user_id)
```

---

## Auto-save design

The editor debounces `onUpdate` with a 1000ms delay before firing a `PUT /api/documents/:id` request. The save status indicator cycles: `saved → saving → saved` (or `error` on failure). This means at most one in-flight save per second — fine for this scale and avoids race conditions from rapid typing.

---

## File upload flow

1. Client posts `multipart/form-data` to `POST /api/documents/upload`
2. Multer buffers to `server/uploads/` temporarily
3. For `.docx`: mammoth extracts raw text
4. For `.txt`/`.md`: read as UTF-8 string
5. Text is split on newlines and wrapped in TipTap paragraph nodes
6. Temp file is deleted, new document row is created, doc ID returned
7. Client navigates directly to the new document's editor
