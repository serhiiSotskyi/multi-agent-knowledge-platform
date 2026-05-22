# Project Memory

Last updated: 2026-05-22

## Purpose

Persistent working memory for this diploma project. Future Codex sessions should read this file before making changes and update it after meaningful work so project context is not lost.

## Project Path

`/Users/sergeysotskiy/Documents/poly/дипломна робота`

## GitHub Repository

`https://github.com/serhiiSotskyi/multi-agent-knowledge-platform`

Visibility: public

## Current Project Shape

This project is currently a document workspace being initialized as a git repository for the planned multi-agent knowledge platform.

Known top-level files:
- `README.md`
- `.gitignore`
- `.env.example`
- `.env` - local only, ignored by git
- `Diploma Plan (English).docx`
- `План дипломної роботи.docx`
- `План дипломної роботи (Українська).docx`
- `Правила/` - rule/template documents for diploma formatting
- `data/synthetic-corpus/` - fully mock PPC/SEO agency documents for RAG demos

Known rule/template documents:
- `Правила/dodatok_a_-_zrazok_oformlennya_tytulnogo_arkusha.docx`
- `Правила/dodatok_b_-_zrazok_oformlennya_anotaciy.docx`
- `Правила/dodatok_v_-_zrazok_oformlennya_zmistu.docx`
- `Правила/dodatok_g_-_zrazok_oformlennya_vstupu.docx`

## Working Conventions

- Preserve original `.docx` files unless the user explicitly asks to edit them.
- If extracting, converting, or generating document content, note the source and output file here.
- For document edits, prefer tools that preserve Word document structure and formatting.
- Keep generated support files minimal and clearly named.
- Use absolute paths when referencing project files in final responses.
- Do not use real company data. Demo documents must be synthetic, anonymized, or academic mock data only.
- Do not commit `.env` or secrets.

## Decisions

- 2026-05-21: Added this project memory system so future sessions can track context, decisions, changes, checks, and next steps.
- 2026-05-21: Added `AGENTS.md` to instruct future agents to read and update `PROJECT_MEMORY.md`.
- 2026-05-21: Updated `AGENTS.md` so agents must keep task progress current throughout work, including current status, completed steps, blockers, and next actions.
- 2026-05-22: Chosen GitHub repository name: `multi-agent-knowledge-platform`.
- 2026-05-22: Approved diploma title is fixed and cannot be changed: "Creating a service-oriented architecture for scalable use of language models in commercial solutions."
- 2026-05-22: Working app name chosen: `ModelWeave`.
- 2026-05-22: Main demo is a web app where users can add documents to a database, create agents, and run agent workflows.
- 2026-05-22: Primary LLM provider will be Anthropic API.
- 2026-05-22: Target deployment split: frontend on Vercel, backend on Railway, metadata DB on Supabase Postgres, vector store on Qdrant Cloud.
- 2026-05-22: Demo corpus domain is a fictional PPC/SEO agency and must have no real company data.
- 2026-05-22: Supervisor name: Грішина Віра Олександрівна.
- 2026-05-22: No external connectors are needed for this academic version.
- 2026-05-22: MVP must have real open registration/login through Supabase Auth.
- 2026-05-22: Users must bring their own Anthropic API key for agent runs. Do not make the app rely on the owner's Anthropic key as a shared provider key for all users.
- 2026-05-22: Document upload support required in MVP: PDF, TXT, Markdown, and DOCX.
- 2026-05-22: Agent builder must include a full visual drag-and-drop workflow builder plus predefined cooperative pipelines and editable agents.
- 2026-05-22: UI language is English only.
- 2026-05-22: Generated reports must export as DOCX.
- 2026-05-22: References used in the thesis must be English-language sources only.
- 2026-05-22: Academic writing must include enough mathematical content: RAG formalization, embeddings, vectorization, cosine similarity, graph/workflow model, retrieval metrics, complexity, and LaTeX-style formulas suitable for Word equation rendering.
- 2026-05-22: Store evidence during development: test outputs, deployment outputs, benchmark results, generated reports, screenshots/graphs where available, and references.

## Activity Log

### 2026-05-21

- Created `PROJECT_MEMORY.md`.
- Created `AGENTS.md`.
- Checked that the project directory is not currently a git repository.
- Captured initial file inventory.
- Updated `AGENTS.md` with an explicit progress-tracking requirement.

### 2026-05-22

- Started repository initialization for GitHub publishing.
- Confirmed the folder was not previously a git repository.
- Confirmed GitHub CLI is installed but not authenticated.
- Added `.gitignore` to exclude local/system noise.
- Added `README.md` describing the academic project scope and planned stack.
- Initialized a local git repository and set the default branch to `main`.
- Created the initial local commit with the diploma workspace.
- Created private GitHub repository `serhiiSotskyi/multi-agent-knowledge-platform`.
- Pushed local `main` branch to GitHub and set upstream tracking.
- Changed GitHub repository visibility from private to public at the user's request.
- Added `.env.example` and local ignored `.env` for Anthropic, Supabase, Qdrant, Redis, and app configuration.
- Updated default Anthropic model from obsolete `claude-3-5-sonnet-latest` to account-available `claude-sonnet-4-6`.
- Updated README with approved title, app name, supervisor, planned deployment, and data-safety rule.
- Generated a fully synthetic PPC/SEO agency corpus under `data/synthetic-corpus/`.
- Installed Vercel CLI 54.3.0 and Railway CLI 4.59.0 locally under `~/.npm-global`.
- Added symlinks for `vercel`, `vc`, and `railway` into `/opt/homebrew/bin` so they are available on PATH.

Current status:
- Repository setup and public visibility are complete.
- Deployment CLIs are installed locally but provider login still needs user authentication.
- Backend MVP scaffold is implemented: FastAPI, Supabase auth validation, encrypted BYOK Anthropic key storage, document parsing, Qdrant indexing/retrieval, cooperative workflow execution, and DOCX export.
- Frontend MVP scaffold is implemented: Next.js, Supabase login/register, API key setup, document upload/seed, agent creation, React Flow workflow builder, workflow runner, run history, and DOCX download.
- Local backend health check passed at `http://127.0.0.1:8000/api/health`.
- Frontend production build passed with `next build --webpack`. Webpack is required locally because Turbopack panics on the Cyrillic workspace path.
- Local authenticated e2e test passed: Supabase test user, encrypted Anthropic key save, default agents/workflow bootstrap, synthetic corpus seed, five-agent workflow run, six citations, DOCX export.
- Production backend is live on Railway: `https://api-production-e70a9.up.railway.app`.
- Production frontend is live on Vercel: `https://modelweave-six.vercel.app`.

Next actions:
- Commit MVP implementation and evidence artifacts.
- Deploy backend to Railway.
- Deploy frontend to Vercel.
- Replace or update diploma plan text later so it uses the approved title while preserving the multi-agent/RAG implementation idea.
- User should run `vercel login` and `railway login` when ready to authenticate deployment providers.

Configuration check results:
- Vercel CLI authenticated as `serhiisotskyi`.
- Railway CLI authenticated as `Serhii Sotskyi`.
- Anthropic API key works with `claude-sonnet-4-6`.
- Qdrant Cloud API key works; current cluster has zero collections.
- Supabase service-role key works against REST.
- Supabase publishable key works for client/Auth use when sent as `apikey` only. Do not send publishable keys as `Authorization: Bearer ...`; authenticated user JWTs go in Authorization later.
- Supabase `DATABASE_URL` now uses the pooler host `aws-0-eu-west-1.pooler.supabase.com`, resolves over IPv4, and `psql` connects successfully.
- Qdrant requires a `user_id` payload index for filtered retrieval; startup now creates it.

Evidence artifacts:
- `evidence/tests/e2e-local-summary.json`
- `evidence/tests/e2e-local-run.json`
- `evidence/reports/modelweave-e2e-report.docx`

Deployment artifacts:
- Railway backend health check passed: `GET https://api-production-e70a9.up.railway.app/api/health`.
- Vercel frontend health check passed: `GET https://modelweave-six.vercel.app`.
- CORS check passed for origin `https://modelweave-six.vercel.app` against the Railway backend.
- 2026-05-22: Fixed production email confirmation redirect by passing `emailRedirectTo` from the browser origin during Supabase signup.
- 2026-05-22: Revoked one exposed Supabase refresh token and removed one active session after a confirmation link containing tokens was pasted into the chat.
- 2026-05-22: Hardened backend auth by checking the JWT `session_id` against `auth.sessions` after Supabase token validation; revoked sessions now return 401 immediately from protected API routes.
- 2026-05-22: Verified session hardening with a temporary confirmed test user: protected API returned 200 before session deletion and 401 after deleting the same session.

Deployment changes made:
- Added backend CORS regex support for Vercel preview/production domains.
- Added `backend/data/synthetic-corpus/` so Railway can seed demo documents from the deployed backend.
- Set Vercel project framework to Next.js and disabled SSO deployment protection so the production URL is public.
- Added `frontend/vercel.json` with explicit build and install commands.

Commands or checks run:
- `vercel project inspect modelweave`
- `vercel project protection disable modelweave --sso`
- `vercel deploy --prod --yes --project modelweave --force`
- `curl -sS https://api-production-e70a9.up.railway.app/api/health`
- `curl -sS https://modelweave-six.vercel.app`
- `npm run build` from `frontend/`
- `backend/.venv/bin/python -m compileall backend/app`
- `railway up --service api`
- Supabase Auth REST temporary user/session test; results saved in `evidence/tests/auth-redirect-session-fix-2026-05-22.json`

Current auth deployment note:
- New registration emails should be generated from `https://modelweave-six.vercel.app` because the app now passes the current origin as `emailRedirectTo`.
- If Supabase still rejects redirects after the rate limit clears, set Supabase Dashboard -> Authentication -> URL Configuration -> Site URL to `https://modelweave-six.vercel.app` and add the same URL under Redirect URLs.
- A direct live signup-email redirect probe was blocked by Supabase email rate limiting immediately after the issue was found.

Implementation security decision:
- Use Supabase Auth for real registration and login.
- For BYOK agent execution, prefer storing user Anthropic keys encrypted server-side using `API_KEY_ENCRYPTION_SECRET`; if schedule pressure requires a temporary fallback, pass the key per run and never persist it.

## Open Items

- Add a short summary of the diploma topic, requirements, supervisor feedback, and current writing status when those are available.
- Track future document edits with source file, output file, and verification steps.
