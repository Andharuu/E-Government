"""Tests for Security Audit Fixes (SEC-02, SEC-03)."""

import pytest
from fastapi.testclient import TestClient
from fastapi import Request
from starlette.datastructures import Headers

from app.core.security import get_ip_or_token, create_access_token
from app.models.entities import User, Complaint


def test_sec02_rate_limit_key_with_fake_bearer_token():
    """SEC-02: Sending a forged/invalid Bearer token must fallback to IP, preventing rate limit bypass."""
    # Dummy request with fake token
    scope = {
        "type": "http",
        "headers": [
            (b"authorization", b"Bearer fake-forged-token-12345"),
            (b"x-forwarded-for", b"203.0.113.195"),
        ],
        "client": ("127.0.0.1", 12345),
    }
    request = Request(scope)
    key = get_ip_or_token(request)
    
    # Must NOT use "token:fake-forged-token-12345"
    assert not key.startswith("token:")
    assert key.startswith("ip:")


def test_sec02_rate_limit_key_with_valid_bearer_token():
    """SEC-02: A valid signed JWT token should resolve to user:<id>."""
    valid_token = create_access_token(data={"sub": "42", "email": "test@govconnect.id"})
    scope = {
        "type": "http",
        "headers": [
            (b"authorization", f"Bearer {valid_token}".encode("ascii")),
        ],
        "client": ("127.0.0.1", 12345),
    }
    request = Request(scope)
    key = get_ip_or_token(request)
    assert key == "user:42"


def test_sec03_submit_public_help_isolation(client: TestClient, db_session):
    """SEC-03: An unauthenticated public help ticket should not be assigned to regular user."""
    # Create a regular user
    regular_user = User(
        email="victim_user@example.com",
        hashed_password="hashed_pw_dummy",
        is_admin=False,
    )
    db_session.add(regular_user)
    db_session.commit()
    db_session.refresh(regular_user)

    # Submit public help using regular user's email
    response = client.post(
        "/api/v1/complaints/public-help",
        json={
            "name": "Anonymous Visitor",
            "email": "victim_user@example.com",
            "category": "teknis",
            "subject": "Kendala Login Publik",
            "message": "Saya tidak bisa login dari browser chrome.",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["reference_number"].startswith("HLP-")

    # Verify that the ticket in DB is NOT assigned to regular_user.id
    saved_complaint = db_session.query(Complaint).filter(Complaint.reference_number == data["reference_number"]).first()
    assert saved_complaint is not None
    assert saved_complaint.user_id != regular_user.id


def test_sec07_password_length_constraint(client: TestClient):
    """SEC-07: Passwords longer than 128 characters must be rejected with 422 to protect server resources."""
    long_password = "A" * 150
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "overflow@govconnect.id", "password": long_password},
    )
    assert response.status_code == 422
    assert "128" in response.text


def test_bug02_mcp_and_oauth_compatibility_endpoints(client: TestClient):
    """BUG-02: /mcp and /.well-known/oauth-protected-resource must return 200 without 404 error logs."""
    r_mcp = client.get("/mcp")
    assert r_mcp.status_code == 200
    assert r_mcp.json()["status"] == "ok"

    r_oauth = client.get("/.well-known/oauth-protected-resource")
    assert r_oauth.status_code == 200
    assert r_oauth.json()["status"] == "active"
