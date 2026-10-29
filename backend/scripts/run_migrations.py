"""Dedicated migration runner script (B-H2).
Menjalankan migrasi basis data secara eksplisit di luar proses runtime web server.
"""

import os
import sys

# Ensure backend root is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import engine, Base, run_schema_migrations, _bootstrap_admins
from app.core.config import settings

def main():
    print(f"[*] Menjalankan migrasi basis data untuk environment: {settings.ENVIRONMENT}")
    print(f"[*] Target DB: {settings.DATABASE_URL.split('@')[-1]}")
    try:
        print("[1/3] Membuat tabel yang belum ada...")
        Base.metadata.create_all(bind=engine)
        print("[2/3] Menjalankan pembaruan skema & kolom...")
        run_schema_migrations()
        print("[3/3] Memeriksa akun bootstrap admin...")
        _bootstrap_admins()
        print("[OK] Seluruh migrasi basis data berhasil diselesaikan.")
    except Exception as exc:
        print(f"[ERROR] Migrasi gagal: {exc}")
        sys.exit(1)

if __name__ == "__main__":
    main()
