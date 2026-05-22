import base64
import hashlib
from dataclasses import dataclass

import httpx
from cryptography.fernet import Fernet
from fastapi import Depends, Header, HTTPException, status

from app.core.config import get_settings


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None = None


def _fernet() -> Fernet:
    secret = get_settings().api_key_encryption_secret or get_settings().jwt_secret
    if not secret:
        raise RuntimeError("API_KEY_ENCRYPTION_SECRET or JWT_SECRET must be configured")
    digest = hashlib.sha256(secret.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


def encrypt_secret(value: str) -> str:
    return _fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_secret(value: str) -> str:
    return _fernet().decrypt(value.encode("utf-8")).decode("utf-8")


async def get_current_user(authorization: str | None = Header(default=None)) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    settings = get_settings()
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(
            f"{str(settings.supabase_url).rstrip('/')}/auth/v1/user",
            headers={
                "apikey": settings.supabase_anon_key,
                "Authorization": f"Bearer {token}",
            },
        )
    if response.status_code != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Supabase session")

    payload = response.json()
    return CurrentUser(id=payload["id"], email=payload.get("email"))

