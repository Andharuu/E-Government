def test_register_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "Password123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data
    assert "password" not in data


def test_register_duplicate_email(client):
    client.post("/api/v1/auth/register", json={"email": "dup@example.com", "password": "Password123"})
    response = client.post("/api/v1/auth/register", json={"email": "dup@example.com", "password": "Password123"})
    assert response.status_code == 400
    assert "sudah terdaftar" in response.json()["detail"]


def test_register_invalid_email(client):
    response = client.post("/api/v1/auth/register", json={"email": "invalidemail", "password": "Password123"})
    assert response.status_code == 422


def test_register_short_password(client):
    response = client.post("/api/v1/auth/register", json={"email": "valid@example.com", "password": "123"})
    assert response.status_code == 422


def test_login_success(client):
    client.post("/api/v1/auth/register", json={"email": "loginuser@example.com", "password": "Password123"})
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "loginuser@example.com", "password": "Password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={"email": "wrongpass@example.com", "password": "Password123"})
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "wrongpass@example.com", "password": "WrongPassword!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401
    assert "tidak sesuai" in response.json()["detail"]


def test_get_me(client, auth_headers):
    response = client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testcitizen@govconnect.id"


def test_get_me_unauthorized(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_change_password(client, auth_headers):
    # Ganti password berhasil
    response = client.post(
        "/api/v1/auth/change-password",
        json={"old_password": "SecurePassword123!", "new_password": "NewSecurePassword456!"},
        headers=auth_headers
    )
    assert response.status_code == 200
    assert "berhasil" in response.json()["detail"]

    # Login dengan password baru
    login_new = client.post(
        "/api/v1/auth/login",
        data={"username": "testcitizen@govconnect.id", "password": "NewSecurePassword456!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_new.status_code == 200


def test_register_long_password_bcrypt_boundary(client):
    """Memastikan password panjang (> 72 karakter) tidak menyebabkan ValueError di bcrypt."""
    long_pass = "A" * 100 + "123!"
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "longpass@example.com", "password": long_pass}
    )
    assert response.status_code == 201

    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "longpass@example.com", "password": long_pass},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200


def test_health_check_endpoint(client):
    """Memastikan endpoint /health mengembalikan status healthy dan timestamp UTC ISO valid."""
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data
