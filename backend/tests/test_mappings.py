def test_create_and_get_mapping(client, auth_headers):
    # Buat mapping
    payload = {
        "website_domain": "layanan.dukcapil.kemendagri.go.id",
        "website_field": "input_nik_warga",
        "govconnect_field": "nik",
        "selector_query": "#input_nik_warga"
    }
    create_res = client.post("/api/v1/mappings", json=payload, headers=auth_headers)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["govconnect_field"] == "nik"
    assert created["id"] is not None

    # Ambil dengan domain filter
    get_res = client.get(
        "/api/v1/mappings?domain=layanan.dukcapil.kemendagri.go.id",
        headers=auth_headers
    )
    assert get_res.status_code == 200
    items = get_res.json()
    assert len(items) == 1
    assert items[0]["website_field"] == "input_nik_warga"

    # Ambil tanpa domain filter (semua mapping)
    all_res = client.get("/api/v1/mappings", headers=auth_headers)
    assert all_res.status_code == 200
    assert len(all_res.json()) >= 1


def test_upsert_mapping(client, auth_headers):
    # Buat mapping awal
    client.post(
        "/api/v1/mappings",
        json={
            "website_domain": "pajak.go.id",
            "website_field": "txt_npwp",
            "govconnect_field": "npwp",
            "selector_query": "input[name='txt_npwp']"
        },
        headers=auth_headers
    )

    # Kirim mapping ulang dengan selector yang diperbarui (upsert)
    upsert_res = client.post(
        "/api/v1/mappings",
        json={
            "website_domain": "pajak.go.id",
            "website_field": "txt_npwp",
            "govconnect_field": "npwp",
            "selector_query": "#npwp_input_v2"
        },
        headers=auth_headers
    )
    assert upsert_res.status_code == 200
    assert upsert_res.json()["selector_query"] == "#npwp_input_v2"

    # Pastikan tidak terjadi duplikasi baris
    get_res = client.get("/api/v1/mappings?domain=pajak.go.id", headers=auth_headers)
    assert len(get_res.json()) == 1


def test_bulk_create_mappings(client, auth_headers):
    bulk_payload = {
        "website_domain": "beacukai.go.id",
        "mappings": [
            {
                "website_field": "field_nama",
                "govconnect_field": "full_name",
                "selector_query": "input#nama"
            },
            {
                "website_field": "field_nik",
                "govconnect_field": "nik",
                "selector_query": "input#nik"
            }
        ]
    }
    response = client.post("/api/v1/mappings/bulk", json=bulk_payload, headers=auth_headers)
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2


def test_update_and_delete_mapping(client, auth_headers):
    create_res = client.post(
        "/api/v1/mappings",
        json={
            "website_domain": "test.go.id",
            "website_field": "f_email",
            "govconnect_field": "email",
            "selector_query": "input[type='email']"
        },
        headers=auth_headers
    )
    mapping_id = create_res.json()["id"]

    # Update PUT
    update_res = client.put(
        f"/api/v1/mappings/{mapping_id}",
        json={"selector_query": "input.user-email"},
        headers=auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["selector_query"] == "input.user-email"

    # Delete
    del_res = client.delete(f"/api/v1/mappings/{mapping_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # Verify deleted
    get_res = client.get("/api/v1/mappings?domain=test.go.id", headers=auth_headers)
    assert len(get_res.json()) == 0
