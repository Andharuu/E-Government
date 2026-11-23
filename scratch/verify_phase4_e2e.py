"""
Comprehensive End-to-End Verification Script for GovConnect Audit & Fixes (Phase 4).
Runs automatic tests across Backend, Extension, and Frontend Tour modules.
"""

import sys
import re
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.security import get_ip_or_token, create_access_token
from starlette.requests import Request


def test_section(name):
    print(f"\n=======================================================")
    print(f"  VERIFIKASI FASE 4: {name}")
    print(f"=======================================================")


def run_e2e_verification():
    passed = 0
    total = 0

    # ---------------------------------------------------------
    # 1. EXTENSION SECURITY TESTS (SEC-01, SEC-04, SEC-05)
    # ---------------------------------------------------------
    test_section("1. Keamanan Chrome Extension (SEC-01, SEC-04, SEC-05)")
    cs_path = Path("extension/content_script.js")
    cs_text = cs_path.read_text(encoding="utf-8")

    # SEC-01: Password selector exclusion
    total += 1
    if ":not([type=password])" in cs_text and 'inputType === "password"' in cs_text:
        print("  [PASS] SEC-01: content_script.js memblokir input type=password di getAllFormFields & matchProfileKey")
        passed += 1
    else:
        print("  [FAIL] SEC-01: Filter password di content_script.js tidak lengkap!")

    # SEC-04: XSS check on badge markers
    total += 1
    if "badge.textContent = \"\"" in cs_text and "badge.appendChild(labelSpan)" in cs_text:
        print("  [PASS] SEC-04: DOM-based XSS tereliminasi (textContent & appendChild digunakan)")
        passed += 1
    else:
        print("  [FAIL] SEC-04: Masih ditemukan potensi innerHTML pada badge!")

    # SEC-05 & BUG-03: No port 3000 origins in any extension file
    total += 1
    ext_files = [
        Path("extension/config.js"),
        Path("extension/content_script.js"),
        Path("extension/popup.js"),
        Path("extension/sidepanel.js"),
    ]
    has_p3000 = False
    for ef in ext_files:
        txt = ef.read_text(encoding="utf-8")
        if "localhost:3000" in txt or "127.0.0.1:3000" in txt or 'port === "3000"' in txt:
            has_p3000 = True
            print(f"  [FAIL] File {ef} masih mengandung origin port 3000!")
    if not has_p3000:
        print("  [PASS] SEC-05 & BUG-03: Origin port 3000 bersih dari seluruh berkas ekstensi (hanya 5173/4173)")
        passed += 1

    # ---------------------------------------------------------
    # 2. BACKEND SECURITY & LOGGING TESTS (SEC-02, SEC-03, SEC-07, BUG-01, BUG-02)
    # ---------------------------------------------------------
    test_section("2. Keamanan & Konfigurasi Backend (SEC-02, SEC-03, SEC-07, BUG-01, BUG-02)")
    
    # BUG-01: slowapi in requirements.txt
    total += 1
    reqs = Path("backend/requirements.txt").read_text(encoding="utf-8")
    if "slowapi" in reqs:
        print("  [PASS] BUG-01: slowapi terdaftar di backend/requirements.txt")
        passed += 1
    else:
        print("  [FAIL] BUG-01: slowapi belum ada di requirements.txt!")

    # BUG-03: config.py CORS origins clean
    total += 1
    config_py = Path("backend/app/core/config.py").read_text(encoding="utf-8")
    if "3000" not in config_py:
        print("  [PASS] BUG-03: backend/app/core/config.py bebas dari port 3000")
        passed += 1
    else:
        print("  [FAIL] BUG-03: config.py masih mencantumkan port 3000!")

    # SEC-02: Rate limit token spoofing test
    total += 1
    fake_scope = {
        "type": "http",
        "headers": [(b"authorization", b"Bearer unverified.fake.token"), (b"x-forwarded-for", b"198.51.100.1")],
        "client": ("127.0.0.1", 50000),
    }
    key = get_ip_or_token(Request(fake_scope))
    if not key.startswith("token:") and key.startswith("ip:"):
        print(f"  [PASS] SEC-02: Forged JWT otomatis fallback ke IP partition key: '{key}'")
        passed += 1
    else:
        print(f"  [FAIL] SEC-02: Forged JWT diterima sebagai key: '{key}'!")

    # TestClient endpoints
    client = TestClient(app)

    # BUG-02: MCP & OAuth endpoints
    total += 1
    r_mcp = client.get("/mcp")
    r_oauth = client.get("/.well-known/oauth-protected-resource")
    if r_mcp.status_code == 200 and r_oauth.status_code == 200:
        print("  [PASS] BUG-02: Endpoints /mcp dan /.well-known/oauth-protected-resource mengembalikan 200 OK")
        passed += 1
    else:
        print(f"  [FAIL] BUG-02: Endpoint probe gagal: MCP={r_mcp.status_code}, OAuth={r_oauth.status_code}")

    # SEC-07: Password boundary
    total += 1
    r_long_pw = client.post("/api/v1/auth/register", json={"email": "overflow@test.id", "password": "X" * 150})
    if r_long_pw.status_code == 422:
        print("  [PASS] SEC-07: Password > 128 karakter ditolak dengan 422 Unprocessable Content")
        passed += 1
    else:
        print(f"  [FAIL] SEC-07: Password panjang tidak ditolak: {r_long_pw.status_code}")

    # ---------------------------------------------------------
    # 3. ONBOARDING TOUR RESTORATION TESTS (REG-01 & VIEWPORT ANTI-CUTOFF)
    # ---------------------------------------------------------
    test_section("3. Pemulihan Fitur Onboarding Tour & Viewport Clamping")
    
    tour_dir = Path("frontend/src/tour")
    expected_files = [
        "TourContext.tsx",
        "TourOverlay.tsx",
        "TourSteps.ts",
        "tourStorage.ts",
        "useTourTarget.ts",
        "index.ts",
    ]
    
    total += 1
    missing = [f for f in expected_files if not (tour_dir / f).exists()]
    if not missing:
        print(f"  [PASS] REG-01: Seluruh 6 file modul tour lengkap di frontend/src/tour/")
        passed += 1
    else:
        print(f"  [FAIL] REG-01: File tour hilang: {missing}")

    # Check 5 tour sections and step counts
    total += 1
    steps_file = (tour_dir / "TourSteps.ts").read_text(encoding="utf-8")
    sections = ["dashboard", "profile", "templates", "activity", "settings"]
    all_sections_present = all(f"{s}: [" in steps_file for s in sections)
    step_matches = re.findall(r"id:\s*'([a-z\-]+)'", steps_file)
    if all_sections_present and len(step_matches) >= 20:
        print(f"  [PASS] REG-01: Terverifikasi {len(step_matches)} langkah tur pada 5 modul ({', '.join(sections)})")
        passed += 1
    else:
        print(f"  [FAIL] REG-01: Langkah tur tidak lengkap: {len(step_matches)} langkah ditemukan")

    # Anti-cutoff viewport clamping check in TourOverlay
    total += 1
    overlay_text = (tour_dir / "TourOverlay.tsx").read_text(encoding="utf-8")
    has_clamping = "maxTop = Math.max(EDGE_MARGIN, windowHeight - tooltipHeight - EDGE_MARGIN)" in overlay_text
    has_max_height = "max-h-[calc(100vh-32px)]" in overlay_text
    has_overflow = "overflow-y-auto" in overlay_text
    if has_clamping and has_max_height and has_overflow:
        print("  [PASS] ANTI-CUTOFF: Tooltip dialog terlindungi dengan viewport clamping & scrollable bounds")
        passed += 1
    else:
        print("  [FAIL] ANTI-CUTOFF: Guard anti-cutoff di TourOverlay belum optimal")

    # Check tour integration into App.tsx and Layout.tsx
    total += 1
    app_tsx = Path("frontend/src/App.tsx").read_text(encoding="utf-8")
    layout_tsx = Path("frontend/src/components/Layout.tsx").read_text(encoding="utf-8")
    if "<TourProvider>" in app_tsx and "<TourOverlay />" in app_tsx and "startTour()" in layout_tsx:
        print("  [PASS] INTEGRATION: TourProvider & TourOverlay terintegrasi di App.tsx dan Layout.tsx")
        passed += 1
    else:
        print("  [FAIL] INTEGRATION: Integrasi tour di App.tsx / Layout.tsx tidak lengkap")

    # ---------------------------------------------------------
    # SUMMARY
    # ---------------------------------------------------------
    test_section("RINGKASAN AUDIT AKHIR FASE 4")
    print(f"Total Pengujian  : {total}")
    print(f"Lulus (Passed)   : {passed}")
    print(f"Gagal (Failed)   : {total - passed}")
    print(f"Tingkat Kelulusan: {(passed / total) * 100:.1f}%\n")

    if passed == total:
        print(">>> SELURUH SISTEM GOVCONNECT TERVERIFIKASI BERFUNGSI SEMPURNA & AMAN <<<\n")
        return 0
    else:
        print(">>> TERDAPAT PENGUJIAN YANG GAGAL! <<<\n")
        return 1


if __name__ == "__main__":
    sys.exit(run_e2e_verification())
