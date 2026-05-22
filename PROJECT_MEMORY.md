# Project Memory

Last updated: 2026-05-22

## Purpose

Persistent working memory for this diploma project. Future Codex sessions should read this file before making changes and update it after meaningful work so project context is not lost.

## Project Path

`/Users/sergeysotskiy/Documents/poly/дипломна робота`

## Current Project Shape

This project is currently a document workspace being initialized as a git repository for the planned multi-agent knowledge platform.

Known top-level files:
- `README.md`
- `.gitignore`
- `Diploma Plan (English).docx`
- `План дипломної роботи.docx`
- `План дипломної роботи (Українська).docx`
- `Правила/` - rule/template documents for diploma formatting

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

## Decisions

- 2026-05-21: Added this project memory system so future sessions can track context, decisions, changes, checks, and next steps.
- 2026-05-21: Added `AGENTS.md` to instruct future agents to read and update `PROJECT_MEMORY.md`.
- 2026-05-21: Updated `AGENTS.md` so agents must keep task progress current throughout work, including current status, completed steps, blockers, and next actions.
- 2026-05-22: Chosen GitHub repository name: `multi-agent-knowledge-platform`.

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

Current status:
- Local repository initialization and initial commit are complete.
- GitHub remote creation/push is blocked until GitHub authentication is available.

Next actions:
- Initialize git repository locally.
- Commit the current document workspace and metadata files.
- After authentication, create GitHub repository `multi-agent-knowledge-platform` and push the initial commit.

## Open Items

- Add a short summary of the diploma topic, requirements, supervisor feedback, and current writing status when those are available.
- Track future document edits with source file, output file, and verification steps.
- Authenticate GitHub CLI with `gh auth login` before remote creation and push.
