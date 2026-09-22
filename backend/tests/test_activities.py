def test_log_activity_and_list(client, auth_headers):
    # Log aktivitas 1 (Success)
    log1 = {
        "target_url": "https://layanan.kominfo.go.id/permohonan",
        "action": "autofill",
        "fields_detected": 8,
        "fields_filled": 8,
        "status": "success",
        "filled_fields_summary": "nik, full_name, email, phone"
    }
    res1 = client.post("/api/v1/activities", json=log1, headers=auth_headers)
    assert res1.status_code == 201
    data1 = res1.json()
    assert data1["website_domain"] == "layanan.kominfo.go.id"
    assert data1["status"] == "success"

    # Log aktivitas 2 (Partial)
    log2 = {
        "target_url": "https://oss.go.id/register",
        "action": "autofill",
        "fields_detected": 10,
        "fields_filled": 6,
        "status": "partial",
        "filled_fields_summary": "nik, full_name, npwp"
    }
    client.post("/api/v1/activities", json=log2, headers=auth_headers)

    # Ambil daftar aktivitas
    list_res = client.get("/api/v1/activities?limit=10", headers=auth_headers)
    assert list_res.status_code == 200
    activities = list_res.json()
    assert len(activities) == 2

    # Filter berdasarkan status
    partial_res = client.get("/api/v1/activities?status=partial", headers=auth_headers)
    assert len(partial_res.json()) == 1
    assert partial_res.json()[0]["status"] == "partial"


def test_activity_stats_and_analytics(client, auth_headers):
    # Tambah aktivitas sampel
    client.post(
        "/api/v1/activities",
        json={
            "target_url": "https://sipongi.menlhk.go.id/form",
            "action": "autofill",
            "fields_detected": 5,
            "fields_filled": 5,
            "status": "success",
            "filled_fields_summary": "nik, full_name, phone"
        },
        headers=auth_headers
    )

    # Test Stats KPI
    stats_res = client.get("/api/v1/activities/stats", headers=auth_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_autofill"] >= 1
    assert stats["success_count"] >= 1
    assert stats["success_rate"] > 0
    assert stats["estimated_time_saved_seconds"] > 0

    # Test Analytics Engine
    analytics_res = client.get("/api/v1/activities/analytics?days=7", headers=auth_headers)
    assert analytics_res.status_code == 200
    analytics = analytics_res.json()
    assert "daily_trend" in analytics
    assert len(analytics["daily_trend"]) == 7
    assert len(analytics["by_website"]) >= 1
    assert len(analytics["most_used_fields"]) >= 1
    assert len(analytics["recent_activities"]) >= 1


def test_delete_and_clear_activities(client, auth_headers):
    # Buat satu log
    create_res = client.post(
        "/api/v1/activities",
        json={
            "target_url": "https://pajak.go.id/spt",
            "action": "autofill",
            "fields_detected": 4,
            "fields_filled": 4,
            "status": "success",
            "filled_fields_summary": "npwp, email"
        },
        headers=auth_headers
    )
    act_id = create_res.json()["id"]

    # Hapus satu
    del_res = client.delete(f"/api/v1/activities/{act_id}", headers=auth_headers)
    assert del_res.status_code == 204

    # Buat satu lagi lalu bersihkan semua (privacy clear)
    client.post(
        "/api/v1/activities",
        json={
            "target_url": "https://dukcapil.kemendagri.go.id",
            "action": "autofill",
            "fields_detected": 2,
            "fields_filled": 2,
            "status": "success"
        },
        headers=auth_headers
    )
    clear_res = client.delete("/api/v1/activities", headers=auth_headers)
    assert clear_res.status_code == 200
    assert "berhasil dibersihkan" in clear_res.json()["detail"]

    # Pastikan kosong
    final_res = client.get("/api/v1/activities", headers=auth_headers)
    assert len(final_res.json()) == 0
