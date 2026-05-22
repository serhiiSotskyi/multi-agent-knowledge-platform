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
- Updated README with approved title, app name, supervisor, planned deployment, and data-safety rule.
- Generated a fully synthetic PPC/SEO agency corpus under `data/synthetic-corpus/`.

Current status:
- Repository setup and public visibility are complete.
- Latest scope/configuration/corpus changes are being committed and pushed.

Next actions:
- Continue project scaffolding in this repository when requested.
- Build backend/frontend/infra scaffold around the approved architecture.
- Replace or update diploma plan text later so it uses the approved title while preserving the multi-agent/RAG implementation idea.

## Open Items

- Add a short summary of the diploma topic, requirements, supervisor feedback, and current writing status when those are available.
- Track future document edits with source file, output file, and verification steps.
