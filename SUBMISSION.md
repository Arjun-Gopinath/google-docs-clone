# Submission Checklist

## What's included

| Item                     | Location                                                    |
| ------------------------ | ----------------------------------------------------------- |
| Source code              | `/client`, `/server`, `/cypress`                            |
| Local setup instructions | `README.md`                                                 |
| Architecture note        | `ARCHITECTURE.md`                                           |
| AI workflow note         | `AI_WORKFLOW.md`                                            |
| This checklist           | `SUBMISSION.md`                                             |
| Live deployment URL      | https://google-docs-clone-dwbs.onrender.com/                |
| Walkthrough video        | https://www.loom.com/share/922b65ce3a674c0980fd888e0b38017b |
| Test accounts            | alice / bob / charlie @example.com, password: `password123` |

---

## Feature status

| Feature                                                      | Status      | Notes                                                               |
| ------------------------------------------------------------ | ----------- | ------------------------------------------------------------------- |
| Create / rename / delete documents                           | ✅ Complete |                                                                     |
| Rich text editing (Bold, Italic, Underline, Headings, Lists) | ✅ Complete | TipTap + StarterKit                                                 |
| Auto-save with status indicator                              | ✅ Complete | 1s debounce                                                         |
| File upload (.txt, .md, .docx)                               | ✅ Complete | .pdf and others return 400                                          |
| Document sharing (grant / revoke)                            | ✅ Complete | Owner can share by email                                            |
| Owned vs shared distinction                                  | ✅ Complete | Dashboard sections + Shared badge                                   |
| Persistence after refresh                                    | ✅ Complete | SQLite + TipTap JSON; resets on redeploy (free tier ephemeral disk) |
| Backend tests (Jest + Supertest)                             | ✅ Complete | 19 tests                                                            |
| Frontend component tests (Vitest + RTL)                      | ✅ Complete | 14 tests                                                            |
| E2E tests (Cypress)                                          | ✅ Complete | 4 spec files                                                        |
| Deployment                                                   | ✅ Complete | Render single service                                               |

## What was intentionally skipped

| Feature                 | Reason                                                           |
| ----------------------- | ---------------------------------------------------------------- |
| Real-time collaboration | Requires CRDT/WebSocket infrastructure; out of scope for timebox |
| Version history         | Would need event sourcing or snapshot model                      |
| Export to PDF/Markdown  | No new architectural patterns demonstrated                       |
| Comments / suggestions  | Out of scope                                                     |

## What I would build next (with 2-4 more hours)

1. **Real-time presence indicators** — show who else has the doc open (WebSocket + server-sent events)
2. **Document version history** — snapshot on each save, restore from history panel
3. **Export to Markdown** — serialize TipTap JSON → Markdown using a simple visitor
4. **Email notifications on share** — trigger on `POST /api/documents/:id/share`
