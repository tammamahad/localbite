import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status

from app.core.config import settings


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 600000)
    return f"pbkdf2_sha256$600000${_base64url_encode(salt)}${_base64url_encode(password_hash)}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations, salt, stored_hash = password_hash.split("$")
        if algorithm != "pbkdf2_sha256":
            return False

        decoded_salt = _base64url_decode(salt)
        decoded_hash = _base64url_decode(stored_hash)
        candidate_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            decoded_salt,
            int(iterations),
        )
        return hmac.compare_digest(candidate_hash, decoded_hash)
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, claims: dict[str, Any] | None = None) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload: dict[str, Any] = {
        "sub": subject,
        "exp": int(expires_at.timestamp()),
    }
    if claims:
        payload.update(claims)

    header = {"alg": settings.jwt_algorithm, "typ": "JWT"}
    signing_input = f"{_json_b64(header)}.{_json_b64(payload)}"
    signature = _sign(signing_input)
    return f"{signing_input}.{signature}"


def decode_access_token(token: str) -> dict[str, Any]:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        header_segment, payload_segment, signature_segment = token.split(".")
    except ValueError as exc:
        raise credentials_error from exc

    signing_input = f"{header_segment}.{payload_segment}"
    expected_signature = _sign(signing_input)
    if not hmac.compare_digest(signature_segment, expected_signature):
        raise credentials_error

    try:
        header = json.loads(_base64url_decode(header_segment))
        payload = json.loads(_base64url_decode(payload_segment))
    except (ValueError, json.JSONDecodeError) as exc:
        raise credentials_error from exc

    if header.get("alg") != settings.jwt_algorithm:
        raise credentials_error

    expires_at = payload.get("exp")
    if not isinstance(expires_at, int) or expires_at < int(datetime.now(timezone.utc).timestamp()):
        raise credentials_error

    return payload


def _sign(signing_input: str) -> str:
    if settings.jwt_algorithm != "HS256":
        raise ValueError("Only HS256 JWT signing is supported")

    digest = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        signing_input.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return _base64url_encode(digest)


def _json_b64(value: dict[str, Any]) -> str:
    serialized = json.dumps(value, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return _base64url_encode(serialized)


def _base64url_encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _base64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)
