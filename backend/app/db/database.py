from collections.abc import Iterator
from pathlib import Path

import psycopg
from psycopg.rows import dict_row

from app.core.config import get_settings


def get_connection() -> psycopg.Connection:
    return psycopg.connect(get_settings().database_url, row_factory=dict_row)


def run_query(query: str, params: tuple | dict | None = None) -> list[dict]:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, params)
            if cur.description is None:
                return []
            return list(cur.fetchall())


def run_one(query: str, params: tuple | dict | None = None) -> dict | None:
    rows = run_query(query, params)
    return rows[0] if rows else None


def init_db() -> None:
    migration_dir = Path(__file__).resolve().parents[2] / "migrations"
    with get_connection() as conn:
        with conn.cursor() as cur:
            for migration in sorted(migration_dir.glob("*.sql")):
                cur.execute(migration.read_text(encoding="utf-8"))
        conn.commit()

