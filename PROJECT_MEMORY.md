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

### 2026-06-05

Current task update:
- Pushed the product simplification commit `da54aed` to `main`.
- Verified the new Vercel frontend deployment at `https://modelweave-two.vercel.app`; backend health is OK at Railway, but Railway CLI auth is expired locally, so backend redeploy still needs user re-login.
- Started final artifact update for the Ukrainian diploma thesis and English defense presentation.
- Created `scripts/build_final_thesis_docx_ua.py` to regenerate the Ukrainian final thesis with the current document-agent product framing, updated screenshots, real Word equations, English abstract, production links, and references.
- Removed raw Markdown-looking snippets from the thesis generator before final render QA.

Checks run in this update:
- `git status --short`
- `git branch --show-current`
- `git log -1 --oneline`
- `python3 scripts/build_final_thesis_docx_ua.py`
- `rg` checks for old PPC/SEO/campaign/Summon wording and raw Markdown markers in the final thesis generator.

Next actions in this update:
- Render the regenerated Ukrainian thesis to PDF/PNGs and verify page count, screenshots, formulas, old wording, and rule compliance.
- Update the English presentation with 1-2 mathematical slides and current screenshots.
- Run QA/subagent review against the updated artifacts.
- Commit and push final thesis/presentation artifacts to `main`.

Final artifact update completed:
- Regenerated `ModelWeave_Diploma_Thesis_UA_Full.docx` as the final Ukrainian diploma thesis.
- Rendered the thesis to PDF/PNGs in `evidence/rendered-thesis-ua-final-2026-06-05/`.
- Verified rendered thesis page count: 63 total pages; 46 main-body pages from `ВСТУП` to before references.
- Verified DOCX structure includes title page, Ukrainian annotation, English abstract, contents, introduction, numbered chapters, conclusions after each chapter, general conclusions, references, and appendices.
- Verified final thesis DOCX contains 126 Word equation objects, 12 tables, and 22 drawings.
- Verified no old PPC/SEO/Harbor/campaign/Agency Runs/Summon wording and no raw Markdown markers in the final thesis text/XML.
- Updated `ModelWeave_Small_Defense_Presentation_EN.pptx` to 10 slides with two applied-math slides covering RAG/vectorization/embeddings and workflow/state/cost/quality formulas.
- Updated presentation screenshots, product framing, QR code, and speaker notes; note length is about 1715 words, estimated under 15 minutes with transitions.
- Exported presentation previews/contact sheet and a fresh 10-page PDF under `outputs/manual-20260527-defense/presentations/modelweave-small-defense/`.
- Verified production frontend `https://modelweave-two.vercel.app` with HTTP 200 and Playwright screenshot `evidence/screenshots/production-frontend-2026-06-05.png`.
- Verified production backend health endpoint returns `{"ok":true,"app":"ModelWeave"}`.
- QA subagent independently confirmed thesis and PPTX structure, math slides, page count, stale-term scans, and deployment caveat.

Final checks run:
- `backend/.venv/bin/python -m compileall backend/app`
- `npm run build` from `frontend/`
- DOCX render: `render_docx.py ModelWeave_Diploma_Thesis_UA_Full.docx --output_dir evidence/rendered-thesis-ua-final-2026-06-05 --emit_pdf`
- `pdfinfo` and `pdftotext` on rendered thesis.
- DOCX ZIP/XML inspection for equation/table/drawing counts and stale terms.
- Presentation artifact build with `build_artifact_deck.mjs --slide-count 10`.
- Presentation PDF export with LibreOffice.
- Production checks with `curl` and Playwright.

Open deployment item:
- Railway CLI is unauthorized locally, so the production backend health endpoint works but forced redeploy of the latest backend code still requires `railway login`.

Current task:
- Implementing the ModelWeave product simplification and agent execution upgrade.
- Pivoting the visible app from PPC/SEO campaign operations to an academic document-agent platform centered on Database, Agents, Workflows, Runs, Approvals, Tasks, and Reports.

Planned changes in progress:
- Remove Campaigns and Agency Runs from the user-facing navigation while keeping legacy campaign tables/endpoints for compatibility.
- Rename Documents to Database in the UI and keep upload/open/edit/delete/seed behavior.
- Extend agents with description, system prompt, trigger configuration, status, and permission mode.
- Simplify default workflow nodes to retrieve, agent, create_task, approval, evaluate, and export_docx.
- Ensure manual runs leave queued/pending state immediately and only pause for approvals.

Checks run so far:
- Read current project memory.
- Inspected current git status and searched frontend/backend for campaign, run, agent, and workflow surfaces.
- `backend/.venv/bin/python -m compileall backend/app`
- `npm run build` from `frontend/`
- Local backend started on `http://127.0.0.1:8000` with CORS for `localhost:3001`.
- Local frontend started on `http://localhost:3001`.
- Browser QA confirmed navigation now shows Setup, Database, Agents, Workflows, Runs, Approvals, Tasks, Reports.
- Browser QA confirmed Workflows defaults to `Document Operations Review`, with generic retrieve/task/approval/evaluate/export nodes and no visible campaign update node.

Completed so far:
- Added migration `004_agent_execution_metadata.sql` for richer agent metadata and run trigger metadata.
- Changed default bootstrap to create a generic document operations workflow and document/database agents.
- Stopped default workspace bootstrap from creating campaigns.
- Added backend support for queued workflow runs, single-agent runs, and scheduled-agent run creation.
- Changed task proposals to document-grounded research/operations/reporting tasks instead of campaign actions.
- Removed Campaigns, Clients, and Agency Runs from the frontend navigation.
- Renamed Documents to Database in the visible UI.
- Added a plain-English agent creation flow with manual/scheduled trigger controls, draft/active/paused status, detail inspector, recent runs, Run now, and Run due schedules.
- Unified run inspection into the Runs screen for manual and scheduled runs.
- Removed campaign fields from visible task tables and approval copy.
- Hid legacy generated PPC/SEO specialist agents from visible agent lists while preserving stored data.

Next actions:
- Optional: deploy backend to Railway so migration `004_agent_execution_metadata.sql` applies in production, then deploy frontend to Vercel.
- Optional: clean or archive older historical demo runs/workflows if the demo account should not show previous PPC/SEO prompts in run history.

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

### 2026-05-25

Current task:
- Implementing the PPC/SEO Agency Workforce Upgrade so ModelWeave becomes a vertical AI workforce for a fictional PPC/SEO agency, not only a generic RAG/reporting app.

Completed so far:
- Added agency workspace migration for clients, campaigns, agency tasks, approvals, action events, and run evaluations.
- Added backend agency service logic for Harbor Homeware defaults, approval-gated task proposals, campaign update proposals, action event logging, approval/rejection, and heuristic run evaluation.
- Replaced default agents/workflow with a Monthly PPC/SEO Operations Review workforce.
- Added backend API endpoints for clients, campaigns, tasks, approvals, run events, and run evaluations.
- Extended DOCX reports with execution evaluation, approval-gated actions, and timeline sections.
- Updated frontend positioning to "AI workforce platform for PPC and SEO agency operations."
- Added frontend tabs for Clients, Campaigns, Tasks, Approvals, and Agency Runs while preserving Documents, Agents, Workflow, Run, and Reports.
- Added workflow-builder support for typed execution nodes: retrieval, task proposals, campaign updates, approval gate, evaluation, and DOCX export.
- Added run result timeline display, approval-gated action display, and evaluation score cards.

Checks run:
- `backend/.venv/bin/python -m compileall backend/app`
- `npm run build` from `frontend/`
- Authenticated smoke test with temporary Supabase user, BYOK key, default agency bootstrap, synthetic corpus seed, monthly agency workflow run, approval of a generated task, run event/evaluation retrieval, and DOCX export.
- Smoke test evidence saved to `evidence/tests/agency-workforce-smoke-2026-05-25.json`.

Next actions:
- Commit changes.
- Deploy backend to Railway so production runs migration `002_agency_workspace.sql`.
- Deploy frontend to Vercel.
- Verify production health and public frontend.

Final deployment status:
- Changes committed and pushed in `0063725` (`Add PPC SEO agency workforce execution`) and `8e91496` (`Update ModelWeave agency metadata`).
- Backend deployed to Railway deployment `518c2fb6-f353-4872-8d63-4ec1e5d39e02`.
- Frontend deployed to Vercel deployment `dpl_F5jpCxF49VXYHGv7coftJY5P7TaS` and aliased to `https://modelweave-six.vercel.app`.
- Production checks passed: frontend HTTP 200, backend health OK, deployed metadata includes "AI workforce platform for PPC and SEO agency operations", and deployed JS contains Clients, Campaigns, Approvals, Tasks, and Agency Runs tabs.

### 2026-05-26

Issue:
- Production "Load synthetic PPC/SEO corpus" returned HTTP 500.
- Railway logs showed `IndexError: 4` in `seed_synthetic_documents`; the endpoint assumed a local path depth that does not exist in Railway's `/app/app/api/routes.py` layout.

Fix in progress:
- Replaced fixed parent-index lookup with `synthetic_corpus_dir()`, which searches parent directories for both `data/synthetic-corpus` and `backend/data/synthetic-corpus`.

Checks run:
- `backend/.venv/bin/python -m compileall backend/app`
- `PYTHONPATH=backend backend/.venv/bin/python - <<'PY' ... synthetic_corpus_dir() ...`

Resolution:
- Committed fix in `700559e` (`Fix synthetic corpus path on Railway`).
- First Railway redeploy failed due a Nixpacks/nixpkgs tarball read error unrelated to app code.
- Retry Railway deployment succeeded: `7ee8ee8a-f398-4788-b6c2-0a5d76468d54`.
- Authenticated production test passed against `https://api-production-e70a9.up.railway.app/api/documents/seed-synthetic` with response `{"indexed_documents":16}`.
- Evidence saved to `evidence/tests/seed-synthetic-production-2026-05-26.json`.

Document management update:
- Added backend document management endpoints for opening indexed document content, updating document metadata, and deleting documents.
- Document delete removes the Postgres document/chunks and deletes matching Qdrant vectors.
- Document rename updates Postgres document metadata, chunk metadata, and Qdrant vector payload filename.
- Added frontend Documents tab controls for Open, Save metadata, and Delete.
- Current limitation: opening a document shows reconstructed indexed chunk text, not the original uploaded binary file.

Checks run:
- `backend/.venv/bin/python -m compileall backend/app`
- `npm run build` from `frontend/`
- Authenticated document-management smoke test: seed 16 documents, open one document, rename it, delete it, confirm GET returns 404 after deletion.

### 2026-05-27

Current task:
- Implemented the ModelWeave UX and output polish plan so AI outputs render as formatted content, DOCX exports are markdown-aware, and workflow runs expose live execution state.

What changed:
- Added safe frontend markdown rendering with `react-markdown`, `remark-gfm`, and `rehype-sanitize`.
- Added shared `MarkdownContent` rendering and plain-text preview helpers for outputs, traces, approvals, tasks, documents, reports, and run lists.
- Added live run status fields and migration for pending/running/waiting approval/completed/failed states.
- Changed workflow run creation to return immediately and execute through FastAPI background tasks.
- Added `GET /api/runs/{id}` run-detail polling endpoint.
- Added node-level action events: node started, node completed, node failed, approval required, and run completed.
- Added a React Flow run progress view with waiting/running/completed/approval/failed node states and animated active edges.
- Redesigned document, approval, report, and agency run panels for more readable cards, semantic badges, scrollable detail panes, markdown previews, and DOCX-first report actions.
- Replaced newline-only DOCX export with a `markdown-it-py` renderer for headings, inline emphasis, lists, tables, blockquotes, dividers, code, evaluation tables, approvals, timeline, trace, and citations.
- Refined DOCX approval and citation appendices after render QA so long markdown excerpts flow as readable blocks instead of oversized table cells.

Why it changed:
- The previous MVP exposed raw markdown in the UI and DOCX output, and workflow runs appeared mostly static while agents were executing.
- The upgrade makes ModelWeave feel like a PPC/SEO agency workforce product instead of a raw technical demo.

Files touched:
- `backend/migrations/003_run_execution_state.sql`
- `backend/app/api/routes.py`
- `backend/app/services/agents.py`
- `backend/app/services/agency.py`
- `backend/app/services/reports.py`
- `backend/requirements.txt`
- `frontend/app/page.tsx`
- `frontend/app/globals.css`
- `frontend/package.json`
- `frontend/package-lock.json`
- `evidence/tests/ux-polish-smoke-2026-05-27.json`
- `evidence/reports/modelweave-ux-polish-smoke-report.docx`

Commands or checks run:
- `backend/.venv/bin/python -m compileall backend/app`
- `npm run build` from `frontend/`
- `PYTHONPATH=backend backend/.venv/bin/python - <<'PY' ... init_db() ...`
- Authenticated service-layer smoke test with temporary user `ux-polish-smoke-1779882331`: seed synthetic corpus, bootstrap workforce, create non-blocking run, execute workflow, confirm pending approval state, events, traces, citations, approvals, evaluation, and DOCX output.
- Structural DOCX check: zero raw `**`, zero raw `#`, and zero markdown table separator lines in generated report text.
- Rendered `evidence/reports/modelweave-ux-polish-smoke-report.docx` to `/tmp/modelweave-ux-report-render` and visually inspected representative pages including first page, approval/timeline area, and citation appendix pages.
- Local browser verification at `http://localhost:3000`: confirmed title, login UI, and PPC/SEO workforce positioning in the DOM. Screenshot capture timed out in the browser bridge, but the app shell loaded successfully.

Evidence artifacts:
- `evidence/tests/ux-polish-smoke-2026-05-27.json`
- `evidence/reports/modelweave-ux-polish-smoke-report.docx`

Open questions or next steps:
- Backend deployed to Railway deployment `9b25098c-a949-4f3a-943a-603c127d631a`.
- Frontend deployed to a new accessible Vercel project under the current CLI account: `https://modelweave-two.vercel.app`, deployment `dpl_G6FfvyPTXdyKSpGhpe9sZLZjwJ1t`.
- The earlier `https://modelweave-six.vercel.app` project is still live but is not visible to the currently authenticated Vercel CLI account, so it could not be updated from this shell.
- Production checks passed: backend health OK, unauthenticated `GET /api/runs/{id}` returns 401 instead of 404, confirming the new run-detail route is deployed; frontend HTTP 200 and deployed JS contains the markdown renderer, run progress flow, approval cards, and new API base URL.
- If using `https://modelweave-two.vercel.app` for fresh registrations, add this domain to Supabase Auth redirect URLs if email confirmation redirects are rejected.
- A durable queue can replace FastAPI background tasks later if this evolves beyond the academic demo.
- Evidence saved to `evidence/tests/document-management-smoke-2026-05-26.json`.

Production status:
- Document management changes committed and pushed in `7527dca` (`Add document management controls`).
- Backend deployed to Railway deployment `006ab577-d40c-4636-b030-f9ba0bc1b651`.
- Frontend deployed to Vercel deployment `dpl_H2Nc3uNaaEvY3nSwumyu3QrA3gnV` and aliased to `https://modelweave-six.vercel.app`.
- Authenticated production document-management smoke test passed: seed 16 documents, open one document, rename metadata, delete it, and confirm GET returns 404 after deletion.
- Evidence saved to `evidence/tests/document-management-production-2026-05-26.json`.

Diploma writing task:
- Started generating the English diploma thesis DOCX for the approved title.
- Planned contents: formal front matter, abstract, introduction, technology review, mathematical RAG/workflow model, service-oriented architecture, implementation, testing/evaluation, deployment, screenshots, charts, tables, references, and appendices.
- Sources must be English-language only and tied to fresh official documentation or established research papers.
- Visual evidence will use generated architecture/charts plus screenshots of the deployed ModelWeave application.
- Output target: `ModelWeave_Diploma_Thesis_EN.docx`.

Diploma writing result:
- Generated `ModelWeave_Diploma_Thesis_EN.docx` as an English thesis draft for the approved title.
- Included bilingual abstract material, contents, abbreviations, introduction, literature/technology review, problem statement, mathematical model, service-oriented architecture, implementation, testing/evaluation, deployment, commercial relevance, limitations, detailed design discussion, conclusions, references, and appendices.
- Added formulas for corpus/chunk representation, embeddings, cosine similarity, top-k retrieval, workflow graphs, evaluation, approval state, storage, and run complexity.
- Added diagrams/charts under `evidence/figures/` and screenshots under `evidence/screenshots/`.
- Captured production demo state in `evidence/tests/thesis-demo-production-state-2026-05-26.json`.
- Rendered the DOCX to page PNGs for visual QA; first render exposed oversized full-page screenshots, then cropped screenshots were inserted and the second render passed visual inspection.
- Final draft length after expansion: approximately 5,032 words and 26 rendered pages.
- Temporary screenshot/demo users and the local credential file were deleted after screenshots were captured.

Open items:
- Fill formal title-page placeholders for institute/faculty, department, group, specialty, and exact student metadata before official submission.
- If the university requires a longer page count, expand the theory review, occupational safety/economic justification, and implementation/testing chapters.

Formula formatting correction:
- User flagged that formulas looked like raw text.
- Converted all 15 formula paragraphs in `ModelWeave_Diploma_Thesis_EN.docx` from styled text to native Word OMML equation objects.
- Re-rendered the document and visually checked the mathematical model pages; equations now display with Word math formatting, including subscripts, superscripts, fractions, summation, and centered equation layout.
- Removed temporary rendered QA images after inspection.

Ukrainian thesis copy task:
- Started creating a Ukrainian copy of `ModelWeave_Diploma_Thesis_EN.docx`.
- Target output: `ModelWeave_Diploma_Thesis_UA.docx`.
- Requirements: preserve the original layout, screenshots, tables, and native OMML equations; translate textual paragraphs and table cells to Ukrainian; keep URLs, API paths, code identifiers, filenames, model/product names, and reference metadata usable.
- Created `ModelWeave_Diploma_Thesis_UA.docx` from the English thesis and translated the document body/table cells into Ukrainian.
- Cleaned up remaining English-heavy table cells while preserving product names, API routes, file paths, UI tab labels, and English-language reference metadata.
- Current verification: DOCX structure check shows 235 paragraphs, 15 tables, and 0 formula paragraphs with raw visible text, so Word equation objects were preserved.
- Rendered the Ukrainian copy to 28 page PNGs and a PDF under `evidence/rendered-thesis-ua/` for visual QA.
- Visually checked representative pages: title page, mathematical model/equations, backend and agent tables, evaluation appendix, references/API appendix, and final evidence appendix.
- Final structural check: 235 paragraphs, 15 tables, 11 image relationships, and 0 formula paragraphs with visible raw text.

Commands or checks run:
- `render_docx.py ModelWeave_Diploma_Thesis_UA.docx --output_dir evidence/rendered-thesis-ua --emit_pdf`
- Python DOCX structure check for paragraphs, tables, images, and formula paragraph text.
- English-leftover scan over Ukrainian DOCX paragraphs and table cells.

### 2026-05-27

Current task:
- Implementing the ModelWeave UX and output polish plan: formatted markdown in the web app, markdown-aware DOCX exports, live run status/animations, and cleaner product screens.

Status:
- Started implementation after confirming the current app renders LLM markdown as raw text and `POST /api/runs` is still synchronous.
- Existing local uncommitted change noted: `ModelWeave_Diploma_Thesis_EN.docx`. This is unrelated and must remain untouched/unstaged.
- Added migration `003_run_execution_state.sql` for run status, current node, timestamps, and errors.
- Refactored backend run execution into immediate run creation plus background execution helpers.
- Added run detail API support and status/event payloads for frontend polling.
- Replaced DOCX export logic with a markdown-aware renderer that creates real Word headings, lists, tables, callouts, score tables, approval tables, event tables, trace sections, and citation tables.
- Added frontend markdown dependencies and a shared safe Markdown renderer.
- Updated run, approvals, reports, documents, tasks, and agency run views to render formatted markdown and cleaner status cards.
- Added a read-only animated React Flow run-progress view based on workflow nodes and live action events.

Checks run:
- `backend/.venv/bin/python -m compileall backend/app`
- `npm run build` from `frontend/`

Next actions:
- Apply the new migration to the configured database.
- Run authenticated local smoke tests for non-blocking runs, polling, events, DOCX export, and approvals.
- Render a generated DOCX report to verify no raw markdown remains.

### 2026-05-27

Current task:
- Creating a new full English-only diploma thesis DOCX for the approved title, following the `Правила` samples and targeting about 45 pages of main body content.

Status:
- Re-read `PROJECT_MEMORY.md` and inspected `Правила` template documents before generating the new paper.
- Confirmed the university sample formatting uses A4 pages, Times New Roman 14 pt, 1.5 line spacing, and margins of approximately left 2.5 cm, right 1 cm, top/bottom 2 cm.
- Confirmed the prior English thesis is too short for the new requirement: about 5,839 words.
- Verified current production links for inclusion in the paper: frontend `https://modelweave-six.vercel.app`, backend `https://api-production-e70a9.up.railway.app`, repository `https://github.com/serhiiSotskyi/multi-agent-knowledge-platform`.
- Verified available evidence assets under `evidence/figures`, `evidence/screenshots`, `evidence/tests`, and `evidence/reports`.

Next actions:
- Generate the new DOCX as a separate full thesis artifact rather than overwriting the previous short thesis.
- Use native Word/OMML equation objects for mathematical formulas.
- Render the DOCX to PNG/PDF for visual QA and iterate on layout if needed.

Result:
- Created new full English thesis artifact: `ModelWeave_Diploma_Thesis_EN_Full.docx`.
- Created repeatable builder script: `scripts/build_full_thesis_docx.py`.
- Created reference trace file: `evidence/references/full-thesis-sources-2026-05-27.json`.
- Rendered the thesis to `evidence/rendered-thesis-en-full/` with a PDF and 54 page PNGs for visual QA.
- Final rendered structure: Introduction starts on page 6, References start on page 51, so the main body is exactly 45 rendered pages.
- Final structural check: 11,616 words, 421 paragraphs, 14 tables, 54 native Word/OMML equation objects, 11 images, 32 English-language references, 0 raw markdown bold markers, and 0 raw markdown table separators.
- Production links are included in the DOCX source text: `https://modelweave-six.vercel.app`, `https://api-production-e70a9.up.railway.app`, and `https://github.com/serhiiSotskyi/multi-agent-knowledge-platform`.

Commands or checks run:
- `python3 scripts/build_full_thesis_docx.py`
- `render_docx.py ModelWeave_Diploma_Thesis_EN_Full.docx --output_dir evidence/rendered-thesis-en-full --emit_pdf`
- `pdftotext -layout evidence/rendered-thesis-en-full/ModelWeave_Diploma_Thesis_EN_Full.pdf /tmp/modelweave_full_thesis.txt`
- Python DOCX structure check for words, paragraphs, tables, equation objects, images, markdown artifacts, references, and production links.
- Visual inspection of representative rendered pages: title page, contents, mathematical model/equations, architecture section, testing section, references, and appendices.

Open questions or next steps:
- Confirm whether the university wants the title page fields translated back to Ukrainian or kept English-only as requested.
- If exact department/group metadata differs from the placeholders used here, update the title page before official submission.

### 2026-05-27

Current task:
- Creating a full Ukrainian translation/adaptation of `ModelWeave_Diploma_Thesis_EN_Full.docx` for supervisor review.

Status:
- Re-read project memory and document-generation instructions.
- Plan is to create a separate Ukrainian DOCX, preserve the same core thesis structure, formulas, figures, tables, production links, references, and appendices, and render-check the result.

Next actions:
- Generate `ModelWeave_Diploma_Thesis_UA_Full.docx`.
- Verify native Word/OMML equations remain rendered formulas.
- Render the DOCX to page PNGs/PDF and inspect representative pages.

Result:
- Created Ukrainian supervisor-review thesis artifact: `ModelWeave_Diploma_Thesis_UA_Full.docx`.
- Created repeatable Ukrainian builder script: `scripts/build_full_thesis_docx_ua.py`.
- Created Ukrainian reference trace file: `evidence/references/full-thesis-sources-ua-2026-05-27.json`.
- Corrected the manually generated Ukrainian table of contents page numbers after visual render inspection.
- Rendered the Ukrainian thesis to `evidence/rendered-thesis-ua-full/` with a PDF and 40 page PNGs for visual QA.
- Final structural check: 5,485 approximate words, 362 paragraphs, 14 tables, 81 Word/OMML equation XML items, 11 embedded images, 32 English-language references, 0 raw markdown bold markers, 0 raw markdown table separators, and 0 markdown heading markers.
- Production links are included in the DOCX source text: `https://modelweave-six.vercel.app`, `https://api-production-e70a9.up.railway.app`, and `https://github.com/serhiiSotskyi/multi-agent-knowledge-platform`.
- Visual inspection covered the title page, contents, mathematical formulas/figures, references, and appendices.

Commands or checks run:
- `python3 scripts/build_full_thesis_docx_ua.py`
- `render_docx.py ModelWeave_Diploma_Thesis_UA_Full.docx --output_dir evidence/rendered-thesis-ua-full --emit_pdf`
- `pdftotext -layout evidence/rendered-thesis-ua-full/ModelWeave_Diploma_Thesis_UA_Full.pdf /tmp/modelweave_ua_full_thesis.txt`
- Python DOCX structure check for rendered page count, paragraphs, tables, word count, equation XML items, embedded images, reference count, markdown artifacts, synthetic-data statement, and production links.

Open questions or next steps:
- This Ukrainian file is a supervisor-review translation/adaptation of the full English thesis, while the official thesis artifact remains the English-only full version requested earlier.
- If the supervisor requires a near page-for-page Ukrainian version, expand this copy further toward the English 54-page length before sharing as a final official Ukrainian submission.

### 2026-05-27

Current task:
- Creating an English 15-minute small-defense presentation for the ModelWeave diploma project.

Status:
- Started PPTX generation after reading project memory and the presentation tooling instructions.
- Target output: `ModelWeave_Small_Defense_Presentation_EN.pptx`.
- Deck structure follows the supervisor's required seven slides plus one final demo slide.
- Evidence source assets: thesis figures, production screenshots, test JSON metrics, production frontend/backend links, and repository link.

Next actions:
- Generate a professional editable PPTX with speaker notes.
- Render PNG/PDF previews and visually inspect all slides.
- Record verification results and final paths here.

Result:
- Created final English small-defense deck: `ModelWeave_Small_Defense_Presentation_EN.pptx`.
- Deck has 8 slides: Topic, Goal and Tasks, Relevance, Methods and Comparison, Structural Scheme, Results, Conclusions, and Demo Link.
- Added speaker notes to all 8 slides with timing guidance for a maximum 15-minute defense.
- Used existing project evidence: architecture, RAG pipeline, workflow graph, production screenshots, test metrics, production frontend/backend links, and repository link.
- Created QR code asset for `https://modelweave-six.vercel.app`.
- Rendered PNG previews and contact sheet under `outputs/manual-20260527-defense/presentations/modelweave-small-defense/`.
- Created PDF preview: `outputs/manual-20260527-defense/presentations/modelweave-small-defense/output/ModelWeave_Small_Defense_Presentation_EN.pdf`.

Commands or checks run:
- `python3 - <<'PY' ... qrcode ... PY`
- `node build_artifact_deck.mjs --slide-count 8 --slide-size 1280x720`
- Visual inspection of rendered contact sheet and slides 1-8.
- `soffice --headless --convert-to pdf --outdir ... ModelWeave_Small_Defense_Presentation_EN.pptx`
- PPTX archive check: 8 slides, 8 notes slides, production frontend/backend/repository links present, and no Cyrillic text in slide XML.
- `pdfinfo` check: rendered PDF has 8 pages.

Open questions or next steps:
- If the university later provides an official PowerPoint template, recreate the same content in that template.
- If a live demo is required instead of a link-only demo, rehearse the five-step path on the production app before defense.

### 2026-05-28

Current task:
- Expanding the English small-defense presentation speaker notes so the user can read them directly during the defense.

Result:
- Updated `ModelWeave_Small_Defense_Presentation_EN.pptx` with full read-aloud speaker notes under all 8 slides.
- The notes now include slide-by-slide speaking scripts, timing cues, transitions, and the demo closing.
- Total speaker-note script length is about 1,601 words, estimated at about 11 minutes at 145 words per minute, leaving buffer under the 15-minute maximum.
- Slide visuals were preserved.

Commands or checks run:
- `node build_artifact_deck.mjs --slide-count 8 --slide-size 1280x720`
- `soffice --headless --convert-to pdf --outdir ... ModelWeave_Small_Defense_Presentation_EN.pptx`
- PPTX archive check: 8 slides, 8 notes slides, all production links present, no Cyrillic text, expanded notes present, estimated timing under 15 minutes.
- `pdfinfo` check: rendered PDF has 8 pages.

Open questions or next steps:
- Rehearse the script once aloud; if speaking speed is slower than 110 words per minute, shorten slide 4 or slide 5 notes before presenting.

### 2026-06-04

Current task:
- Restyling the ModelWeave frontend to a dark workspace-control-plane design while preserving existing Supabase/FastAPI functionality.

Status:
- Re-read `PROJECT_MEMORY.md` and inspected current git status before editing.
- Confirmed there are unrelated existing thesis, evidence, output, and script changes in the workspace; this task will avoid touching those artifacts.
- Inspected a prior visual reference: dark shell, emerald primary actions, compact cards, sticky header, icon nav, status badges, clean tables, and empty states.

Next actions:
- Update frontend CSS and minimal markup in `frontend/app/page.tsx`.
- Run the frontend build and local visual checks.

Result:
- Replaced the light frontend theme with a dark workspace control-plane design using plain CSS and existing dependencies.
- Updated the signed-out auth panel with dark product framing, brand mark, segmented sign-in/register controls, and clearer demo positioning.
- Updated the signed-in app shell with a fixed dark sidebar, branded workspace card, account/API status card, icon tab navigation, compact sidebar metrics, sticky topbar, and dark notice styling.
- Restyled existing panels, tables, forms, badges, markdown previews, document/report previews, approval cards, empty states, React Flow workflow canvases, live run nodes, timelines, traces, and citations without changing backend APIs or data contracts.

Files touched:
- `frontend/app/globals.css`
- `frontend/app/page.tsx`
- `PROJECT_MEMORY.md`

Commands or checks run:
- `npm run build` from `frontend/`
- Started local Next dev server on `http://localhost:3001` because port 3000 was already in use.
- Playwright visual check of signed-out auth page at desktop and mobile sizes.
- Playwright visual check of signed-in shell using a mocked local Supabase session; tab spot-checks covered Documents, Workflow, Run, Approvals, and Reports with no browser-visible runtime errors.
- Stopped the temporary local dev server on port 3001.
- Final `npm run build` from `frontend/`

Open questions or next steps:
- Run a real authenticated smoke test when Supabase/Railway DNS is reachable from the local environment; DNS lookup for the Supabase host failed during this session, so the signed-in visual check used a mocked browser session and expected API fetch failures.
- Deploy the frontend to Vercel after the user reviews the local UI.

### 2026-06-05

Current task:
- Production-readiness QA pass for the simplified ModelWeave document-agent platform.

Status:
- Local backend was running on `http://127.0.0.1:8000`.
- Local frontend was running on `http://localhost:3001`.
- Re-read this memory before testing, per project instructions.

Result:
- Backend health and frontend localhost checks passed.
- Backend compile check passed.
- Frontend production build passed before and after the metadata cleanup.
- Authenticated isolated smoke test passed with a temporary confirmed Supabase user and real local API calls.
- Smoke test verified BYOK Anthropic key storage, default bootstrap, synthetic corpus loading, Markdown document upload/open/rename/delete, default document agents, custom agent creation/detail, custom workflow creation, manual workflow run execution, live queued-to-running transition, RAG citations, run trace events, evaluation scores, approval creation, approval/reject decisions, task state changes, DOCX report download, unified run history, manual agent run, scheduled agent run creation/execution, and cleanup of temporary test data.
- UI browser pass confirmed the simplified navigation exists: Setup, Database, Agents, Workflows, Runs, Approvals, Tasks, Reports.
- UI browser pass confirmed Database has upload/load/open/delete surfaces, Agents has create/detail/schedule controls, Workflows has simplified execution nodes, Runs has manual run and history, Approvals has the human approval queue, Tasks has the durable task queue, and Reports has preview/DOCX actions.
- Captured QA screenshots:
  - `evidence/screenshots/qa-ui-workflows-2026-06-05.png`
  - `evidence/screenshots/qa-ui-runs-2026-06-05.png`
  - `evidence/screenshots/qa-ui-tasks-2026-06-05.png`
- Updated frontend metadata to remove the old PPC/SEO product description and match the current document-agent academic framing.

Files touched:
- `frontend/app/layout.tsx`
- `evidence/screenshots/qa-ui-workflows-2026-06-05.png`
- `evidence/screenshots/qa-ui-runs-2026-06-05.png`
- `evidence/screenshots/qa-ui-tasks-2026-06-05.png`
- `PROJECT_MEMORY.md`

Commands or checks run:
- `curl -sS -m 5 http://127.0.0.1:8000/api/health`
- `curl -sS -m 5 -I http://localhost:3001/`
- `backend/.venv/bin/python -m compileall backend/app`
- `npm run build` from `frontend/`
- Authenticated Python smoke test using Supabase Auth REST, local FastAPI endpoints, Anthropic API, Supabase Postgres, and Qdrant.
- Browser UI inspection through the Codex in-app browser at `http://localhost:3001/`.
- `rg -n "Campaigns|campaign update|Agency Runs|PPC/SEO|PPC|SEO|Harbor Homeware|agency operations" frontend/app frontend/components frontend/lib`

Open questions or next steps:
- The code path is production-ready locally, but the latest frontend/backend changes have not been deployed in this QA pass.
- The current signed-in demo account still contains old historical workflows/runs/tasks from earlier PPC/SEO and dinner-test experiments. A new user is clean, but the demo account should be cleaned or reset before a formal demonstration if historical rows should not appear.
- Legacy campaign endpoints and database tables remain in the backend for compatibility as planned; they are not exposed in the simplified UI.
