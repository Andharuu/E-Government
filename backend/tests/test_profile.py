import json


def test_get_initial_profile(client, auth_headers):
    response = client.get("/api/v1/profile/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "user_id" in data
    assert data["nik"] is None
    assert "profile_completion" in data


def test_update_profile_put(client, auth_headers):
    payload = {
        "nik": "3171012345670001",
        "full_name": "Raden Wijaya",
        "birth_place": "Surabaya",
        "birth_date": "1995-05-12",
        "gender": "Laki-laki",
        "address": "Jl. Merdeka No. 45",
        "province": "DKI Jakarta",
        "city": "Jakarta Pusat",
        "phone": "081234567890",
        "email": "raden@govconnect.id",
        "education_level": "S1",
        "institution": "Universitas Indonesia",
        "occupation": "Software Engineer",
        "npwp": "09.123.456.7-890.000",
        "bpjs_number": "000123456789"
    }
    response = client.put("/api/v1/profile/me", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["nik"] == "3171012345670001"
    assert data["full_name"] == "Raden Wijaya"
    assert data["profile_completion"] > 40.0


def test_patch_profile(client, auth_headers):
    # First set full name
    client.put("/api/v1/profile/me", json={"full_name": "Nama Awal", "nik": "1111222233334444"}, headers=auth_headers)

    # Patch only occupation without wiping out nik or full_name
    patch_res = client.patch(
        "/api/v1/profile/me",
        json={"occupation": "Arsitek Sistem"},
        headers=auth_headers
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["occupation"] == "Arsitek Sistem"
    assert data["full_name"] == "Nama Awal"
    assert data["nik"] == "1111222233334444"


def test_profile_completion_bug006_custom_fields(client, auth_headers):
    """Pengujian verifikasi BUG-006: Kalkulasi presisi custom_fields (list & dict format)."""
    # 1. Custom fields format list
    cf_list = [
        {"key": "Nomor Paspor", "value": "A1234567"},
        {"key": "Gelar Depan", "value": "Dr."},
        {"key": "Kosong", "value": ""}
    ]
    client.patch(
        "/api/v1/profile/me",
        json={"custom_fields": json.dumps(cf_list)},
        headers=auth_headers
    )
    res_list = client.get("/api/v1/profile/me", headers=auth_headers)
    completion_list = res_list.json()["profile_completion"]
    assert completion_list > 0.0

    # 2. Custom fields format dict
    cf_dict = {
        "paspor": {"value": "B9876543"},
        "gelar": "Ir."
    }
    client.patch(
        "/api/v1/profile/me",
        json={"custom_fields": json.dumps(cf_dict)},
        headers=auth_headers
    )
    res_dict = client.get("/api/v1/profile/me", headers=auth_headers)
    completion_dict = res_dict.json()["profile_completion"]
    assert completion_dict > 0.0


def test_patch_profile_extended_fields(client, auth_headers):
    """Memverifikasi bahwa ProfileUpdate (DRY) mendukung pembaruan seluruh field profil."""
    patch_res = client.patch(
        "/api/v1/profile/me",
        json={
            "mother_name": "Siti Aminah",
            "emergency_contact_phone": "081299998888",
            "education_level": "S2",
            "institution": "Institut Teknologi Bandung"
        },
        headers=auth_headers
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["mother_name"] == "Siti Aminah"
    assert data["emergency_contact_phone"] == "081299998888"
    assert data["education_level"] == "S2"
    assert data["institution"] == "Institut Teknologi Bandung"


def test_patch_profile_standard_form_fields(client, auth_headers):
    """Memverifikasi dukungan field standar form internasional (RoboForm/DemoQA)."""
    payload = {
        "first_name": "Budi",
        "last_name": "Santoso",
        "country": "Indonesia",
        "driver_license": "SIM-A-987654321",
        "website": "https://budisantoso.id",
        "income": "15000000"
    }
    patch_res = client.patch(
        "/api/v1/profile/me",
        json=payload,
        headers=auth_headers
    )
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["first_name"] == "Budi"
    assert data["last_name"] == "Santoso"
    assert data["country"] == "Indonesia"
    assert data["driver_license"] == "SIM-A-987654321"
    assert data["website"] == "https://budisantoso.id"
    assert data["income"] == "15000000"

