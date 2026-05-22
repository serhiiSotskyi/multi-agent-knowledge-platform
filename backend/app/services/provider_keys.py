from uuid import uuid4

from app.core.security import decrypt_secret, encrypt_secret
from app.db.database import run_one, run_query


def save_provider_key(user_id: str, provider: str, api_key: str) -> None:
    encrypted = encrypt_secret(api_key)
    run_query(
        """
        insert into provider_keys (id, user_id, provider, encrypted_key)
        values (%(id)s, %(user_id)s, %(provider)s, %(encrypted_key)s)
        on conflict (user_id, provider)
        do update set encrypted_key = excluded.encrypted_key, updated_at = now()
        """,
        {
            "id": str(uuid4()),
            "user_id": user_id,
            "provider": provider,
            "encrypted_key": encrypted,
        },
    )


def has_provider_key(user_id: str, provider: str) -> bool:
    row = run_one(
        "select id from provider_keys where user_id = %(user_id)s and provider = %(provider)s",
        {"user_id": user_id, "provider": provider},
    )
    return row is not None


def get_provider_key(user_id: str, provider: str) -> str | None:
    row = run_one(
        "select encrypted_key from provider_keys where user_id = %(user_id)s and provider = %(provider)s",
        {"user_id": user_id, "provider": provider},
    )
    if not row:
        return None
    return decrypt_secret(row["encrypted_key"])

