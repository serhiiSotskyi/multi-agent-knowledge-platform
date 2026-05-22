# ModelWeave

Academic workspace for the approved diploma topic:

**Creating a service-oriented architecture for scalable use of language models in commercial solutions.**

ModelWeave is the working application name for the prototype: a web service where users can upload documents, define agents, compose agent workflows, and run those agents over an enterprise-style knowledge base.

The project is framed as a general enterprise knowledge-management assistant rather than a company-specific tool. The working language is English, with Ukrainian supervisor-facing materials maintained alongside it.

Supervisor: Грішина Віра Олександрівна.

Current contents:

- English and Ukrainian diploma plan documents.
- University formatting examples in `Правила/`.
- Project memory notes for future implementation work.
- Synthetic demo corpus for a mock PPC/SEO agency in `data/synthetic-corpus/`.

Planned implementation stack:

- FastAPI backend.
- LangGraph orchestration engine.
- Supabase Postgres metadata storage.
- Qdrant Cloud vector database.
- Next.js web application with a visual agent builder.
- Markdown/Obsidian-compatible memory export.
- Anthropic API as the primary language-model provider.
- Vercel frontend deployment and Railway backend deployment.

No real company data should be used in this repository. Demo documents must be synthetic or anonymized.

## Local Environment

Copy `.env.example` to `.env` and fill in local credentials:

```bash
cp .env.example .env
```

The local `.env` file is ignored by git.

