def test_register_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "Password123"}
    )
    assert response.status_code == 201
    data = response.json()
    # Respons generik (anti email-enumeration) â€” tidak mengembalikan data akun.
    assert "detail" in data
    assert "email" not in data
    assert "password" not in data

    # Akun benar-benar dibuat â†’ dapat login.
    login = client.post(
        "/api/v1/auth/login",
        data={"username": "newuser@example.com", "password": "Password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200


def test_register_duplicate_email(client):
    """Respons registrasi harus IDENTIK baik untuk email baru maupun email lama
    (mencegah email enumeration), dan akun lama TIDAK boleh ditimpa."""
    r1 = client.post("/api/v1/auth/register", json={"email": "dup@example.com", "password": "Password123"})
    r2 = client.post("/api/v1/auth/register", json={"email": "dup@example.com", "password": "Password123"})
    assert r1.status_code == 201
    assert r2.status_code == 201
    # Respons tidak dapat dibedakan satu sama lain.
    assert r1.json() == r2.json()
    assert "email" not in r2.json()

    # Kata sandi lama tetap berlaku (tidak ditimpa).
    login = client.post(
        "/api/v1/auth/login",
        data={"username": "dup@example.com", "password": "Password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login.status_code == 200


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


def test_login_sets_httponly_cookie_and_authenticates_via_cookie(client):
    """Memastikan login menyetel HttpOnly cookie dan endpoint me dapat diakses via cookie murni."""
    # Register & Login
    client.post(
        "/api/v1/auth/register",
        json={"email": "cookieuser@govconnect.id", "password": "CookiePass123!"}
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "cookieuser@govconnect.id", "password": "CookiePass123!"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200
    assert "govconnect_access_token" in login_res.cookies

    # Akses /api/v1/auth/me TANPA header Authorization (hanya mengandalkan cookie yang otomatis disimpan di client session)
    me_res = client.get("/api/v1/auth/me")
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "cookieuser@govconnect.id"


def test_logout_clears_httponly_cookie(client):
    """Memastikan logout menghapus cookie sesi otentikasi."""
    email = "logoutuser@govconnect.id"
    password = "LogoutPass123!"
    # Register & Login
    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200

    # Logout (dengan CSRF header XMLHttpRequest seperti yang dikirim frontend)
    logout_res = client.post("/api/v1/auth/logout", headers={"X-Requested-With": "XMLHttpRequest"})
    assert logout_res.status_code == 200
    assert "detail" in logout_res.json()

    # Cookie sudah dihapus/kosong -> akses /api/v1/auth/me harus 401
    me_after = client.get("/api/v1/auth/me")
    assert me_after.status_code == 401


def test_csrf_protection_guard_on_cookie_mutations(client):
    """Memastikan permintaan mutasi via cookie tanpa header X-Requested-With ditolak 403."""
    email = "csrfuser@govconnect.id"
    password = "CsrfPass123!"
    # Register & Login untuk mendapatkan cookie
    client.post("/api/v1/auth/register", json={"email": email, "password": password})
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200

    # Kirim mutasi PUT tanpa header X-Requested-With (meniru serangan CSRF dari form browser)
    put_without_csrf = client.put(
        "/api/v1/profile/me",
        json={"full_name": "CSRF Attacker"}
    )
    assert put_without_csrf.status_code == 403
    assert "CSRF protection" in put_without_csrf.json()["detail"]

    # Kirim mutasi DENGAN header X-Requested-With -> berhasil lolos guard CSRF
    put_with_csrf = client.put(
        "/api/v1/profile/me",
        json={"full_name": "Valid User", "nik": "1234567890123456"},
        headers={"X-Requested-With": "XMLHttpRequest"}
    )
    assert put_with_csrf.status_code == 200

