# AI Workflow Notes

## Tools used

- **Claude Code (claude-sonnet-4-6)** — primary coding assistant, used throughout
- **GitHub Copilot** — occasional inline completions in the editor

---

## Where AI materially accelerated the work

**Boilerplate elimination:** The Express route handlers, SQLite schema, and JWT middleware are patterns I've written before, but AI generated the initial drafts in seconds. I would estimate this saved 45–60 minutes of mechanical typing and lookup time.

**TipTap configuration:** The placeholder extension configuration and the `onUpdate` debounce pattern came directly from AI — I knew what I wanted but would have spent time digging through TipTap's docs to find the exact API shape.

**CSS module styling:** The Google Docs-inspired layout (sticky header, page-card on grey background, toolbar active states) was generated quickly and mostly correct. Tweaking colors and spacing took about 10 minutes total rather than the usual 30+.

**Test scaffolding:** The Jest + Supertest test structure and the Vitest + RTL component test wiring were both generated as complete files. I reviewed each test for correctness and added cases that were missing (e.g., the `role: 'shared'` assertion on the document fetch).

---

## What I changed or rejected

**Multer error handling:** The initial `upload.single('file')` middleware didn't handle fileFilter rejections — it returned 500 instead of 400. AI generated the original pattern; I caught this in the test run and fixed it by wrapping multer in an explicit error callback.

**`require.main === module` pattern:** The initial server startup check didn't work reliably in the WSL shell environment. I diagnosed this by running inline Node.js test snippets and switched to a `process.argv[1]` comparison that works consistently.

**LoginPage test:** The first version used `vi.mock('react-router-dom', ...)` which caused a Vitest worker timeout in WSL. I simplified to avoid the mock entirely and assert on `login()` being called rather than on navigation.

**Dashboard rename UX:** AI's first draft showed the rename input on a separate "settings" page. I changed it to an inline edit triggered by a pencil icon on the card — closer to Google Docs' actual behavior and simpler to implement.

---

## How I verified correctness

- Ran `npm test` in `server/` after every route change — 19 tests, all green
- Ran `npm test` in `client/` after writing component tests — 14 tests, all green
- Manually stepped through the full user flow in the browser: login → create doc → type + format → refresh (content persists) → share with bob → log in as bob → open shared doc
- Verified file upload with a real `.txt` file and a `.docx` sample
- Verified Charlie cannot access Alice's unshared documents (404 in API, redirect in UI)

---

## Judgment calls I made myself (not AI)

- Chose SQLite over Postgres to minimize reviewer setup friction
- Chose a single Render service over separate frontend/backend deploys
- Decided to skip real-time collaboration entirely rather than do a shallow mock
- Chose TipTap over Quill after comparing the two — TipTap's extension API and JSON storage model fit better with auto-save
- Kept the sharing model simple (owner + edit access) — role-based permissions would add UI complexity without demonstrating new concepts
