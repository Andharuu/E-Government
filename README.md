# GovConnect — E-Government Autofill Assistant

> Asisten pengisian formulir layanan publik otomatis berbasis Chrome Extension + FastAPI + MySQL.

---

## 📌 Deskripsi Sistem

**GovConnect** adalah sistem *e-government assistant* yang membantu masyarakat mengisi formulir layanan pemerintah secara otomatis. Sistem ini terdiri dari tiga komponen utama:

| Komponen | Teknologi | Fungsi |
|---|---|---|
| **Backend API** | Python · FastAPI · SQLAlchemy | Menyimpan profil kependudukan, log aktivitas, dan autentikasi (JWT) |
| **Chrome Extension** | Manifest V3 · Vanilla JS | Auth gateway & workspace autofill via Side Panel |
| **Dashboard** | React · Vite · Tailwind CSS | Antarmuka manajemen profil & monitoring berbasis SPA |

### Alur Kerja Sistem

```
┌─────────────────┐     REST API      ┌───────────────────────┐
│ Chrome Extension│ ◄───────────────► │   FastAPI Backend      │
│ (Side Panel)    │      (JWT)        │  (Port 8000)           │
└────────┬────────┘                   └──────────┬────────────┘
         │ chrome.tabs.sendMessage                │ SQLAlchemy ORM
         ▼                                        ▼
┌─────────────────┐                   ┌───────────────────────┐
│ Content Script  │                   │   MySQL Database       │
│ (Autofill Form) │                   │  (govconnect_db)       │
└─────────────────┘                   └───────────────────────┘
```

---

## 📁 Struktur Proyek

```
E-Government/
├── backend/
│   ├── app/
│   │   ├── main.py             # Entry point FastAPI
│   │   ├── database.py         # Konfigurasi koneksi MySQL
│   │   ├── api/
│   │   │   ├── auth.py         # Endpoint autentikasi (JWT)
│   │   │   └── endpoints.py    # Route REST API (/api/v1/...)
│   │   ├── models/
│   │   │   └── entities.py     # Model database (User, Profile, Mapping, Activity)
│   │   └── schemas/
│   │       └── schemas.py      # Pydantic schemas
│   ├── docker-compose.yml      # Konfigurasi MySQL via Docker
│   └── requirements.txt        # Dependensi Python
│
├── frontend/                   # Dashboard Web SPA
│   ├── src/                    # React source code
│   ├── package.json            # Dependensi Node.js
│   └── vite.config.ts          # Konfigurasi Vite
│
├── extension/                  # Chrome Extension (Manifest V3)
│   ├── manifest.json           # Konfigurasi ekstensi
│   ├── background.js           # Service worker & state JWT
│   ├── popup.html              # Auth Gateway
│   ├── sidepanel.html          # Workspace Autofill
│   └── content_script.js       # Script injeksi autofill & deteksi form
│
└── test-page/
    └── dummy_form.html         # Formulir dummy untuk pengujian
```

---

## 🔌 API Endpoints

Base URL: `http://127.0.0.1:8000`

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/` | Cek status server |
| `POST` | `/api/v1/auth/register` | Mendaftarkan akun baru |
| `POST` | `/api/v1/auth/login` | Login & mendapatkan JWT token |
| `GET` | `/api/v1/profile/me` | Ambil profil pengguna aktif (Requires JWT) |
| `PUT` | `/api/v1/profile/me` | Perbarui profil pengguna (Requires JWT) |
| `GET` | `/api/v1/mappings?domain=...` | Ambil mapping field berdasarkan domain (Requires JWT) |
| `POST` | `/api/v1/mappings` | Tambah mapping field baru (Requires JWT) |
| `GET` | `/api/v1/activities?limit=10` | Ambil riwayat autofill (Requires JWT) |
| `POST` | `/api/v1/activities` | Catat aktivitas autofill (Requires JWT) |
| `GET` | `/docs` | Swagger UI (dokumentasi interaktif) |

---

## ⚙️ Prasyarat

Pastikan software berikut sudah terinstal:

- **Python** 3.10+ → [python.org](https://www.python.org/downloads/)
- **Node.js** 18+ → [nodejs.org](https://nodejs.org/) (untuk menjalankan Dashboard Vite)
- **Docker Desktop** → [docker.com](https://www.docker.com/products/docker-desktop/)
- **Google Chrome** (versi terbaru)

---

## 🚀 Cara Menjalankan

### Langkah 1 — Clone Repository

```bash
git clone https://github.com/Andharuu/E-Government
cd E-Government
```

---

### Langkah 2 — Jalankan Database MySQL (via Docker)

```bash
cd backend
docker-compose up -d
```

Verifikasi container berjalan:

```bash
docker ps
```

Harus terlihat container `govconnect_mysql` dengan status `Up`.

| Parameter | Nilai |
|---|---|
| Host | `localhost` |
| Port | `3306` |
| Database | `govconnect_db` |
| Username | `govuser` |
| Password | `govpassword` |

> Data MySQL disimpan di Docker volume sehingga tidak hilang saat container di-restart.

---

### Langkah 3 — Buat Virtual Environment Python

Tetap di folder `backend`:

```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

> Jika PowerShell menolak script, jalankan dulu:
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

---

### Langkah 4 — Install Dependensi Python

```bash
pip install -r requirements.txt
```

| Package | Versi | Fungsi |
|---|---|---|
| `fastapi` | 0.115.0 | Web framework API |
| `uvicorn[standard]` | 0.30.6 | ASGI server |
| `sqlalchemy` | 2.0.35 | ORM database |
| `pymysql` | 1.1.1 | Driver MySQL |
| `pydantic` | 2.9.2 | Validasi data |
| `cryptography` | 43.0.1 | Enkripsi |
| `python-jose[cryptography]` | 3.3.0 | JWT token |
| `passlib[bcrypt]` | 1.7.4 | Hashing password |
| `python-multipart` | 0.0.9 | Parsing form data |

---

### Langkah 5 — Jalankan Server FastAPI

Masih di folder `backend`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server berhasil berjalan jika muncul:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

> Tabel database (`users`, `profiles`, `mappings`, `activities`) dibuat **otomatis** saat server pertama kali dijalankan.

---

### Langkah 6 — Jalankan Dashboard React (Vite)

Buka terminal **baru**, lalu jalankan:

```bash
cd frontend
npm install
npm run dev
```

Dashboard akan berjalan di: **http://localhost:5173**

---

### Langkah 7 — Verifikasi Backend & Frontend

Buka browser dan akses:

- **Dashboard:** http://localhost:5173 → Login / Daftar akun baru
- **Status API:** http://127.0.0.1:8000 → Menampilkan JSON `"status": "online"`
- **API Docs:** http://127.0.0.1:8000/docs → Swagger UI interaktif

---

### Langkah 8 — Pasang Chrome Extension

1. Buka Google Chrome
2. Masuk ke `chrome://extensions/`
3. Aktifkan **"Developer mode"** (toggle pojok kanan atas)
4. Klik **"Load unpacked"**
5. Pilih folder `extension/` dari proyek ini
6. Ekstensi **GovConnect Autofill Assistant** akan muncul di daftar

> ⚠️ Jika Anda mengubah kode extension, pastikan klik ikon "Refresh" 🔄 di `chrome://extensions/`.

---

### Langkah 9 — Uji Autofill dengan Halaman Dummy

1. Buka file `test-page/dummy_form.html` di Chrome.
2. Klik ikon **GovConnect** di toolbar.
3. Login menggunakan akun yang dibuat di Dashboard (atau buat baru melalui popup ekstensi).
4. Setelah login, klik **"⚡ Buka Side Panel Autofill"** di popup.
5. Side panel akan terbuka di sisi kanan browser, menampilkan daftar *field* form yang berhasil terdeteksi dari `dummy_form.html`.
6. Centang field yang ingin diisi, lalu klik **"⚡ Fill Selected Fields"**.
7. Kolom form akan terisi otomatis, dan status tiap field akan dilaporkan.

---

## 📊 Menggunakan Dashboard

Akses di: http://localhost:5173

**Fitur:**
- **Autentikasi (JWT)** — Login aman menggunakan Email dan Password.
- **KPI & Visualisasi** — Dashboard utama menampilkan total penggunaan, success rate, dan estimasi waktu yang dihemat, beserta grafik riwayat.
- **Master Profile** — Form wizard / terstruktur untuk mengisi Identitas, Alamat, Kontak, Pendidikan, dan lain-lain.
- **Riwayat Injeksi** — Log setiap autofill beserta jumlah kolom yang terisi dan status kegagalan/keberhasilan.

---

## 🗄️ Konfigurasi Database Manual (tanpa Docker)

Edit file `backend/app/database.py`:

```python
DATABASE_URL = "mysql+pymysql://USERNAME:PASSWORD@HOST:PORT/NAMA_DATABASE"
```

Buat database MySQL secara manual:

```sql
CREATE DATABASE govconnect_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'govuser'@'localhost' IDENTIFIED BY 'govpassword';
GRANT ALL PRIVILEGES ON govconnect_db.* TO 'govuser'@'localhost';
FLUSH PRIVILEGES;
```

---

## 🛑 Menghentikan Sistem

**Hentikan server FastAPI:**
```
Ctrl + C
```

**Hentikan container MySQL:**
```bash
# Hentikan saja (data tersimpan)
docker-compose stop

# Hentikan + hapus container (data di volume tetap ada)
docker-compose down

# Reset total (hapus semua data)
docker-compose down -v
```

---

## 🐛 Troubleshooting

### ❌ Status "Offline" atau gagal terhubung di popup ekstensi
- Pastikan server FastAPI berjalan di port 8000
- Pastikan Docker container MySQL aktif (`docker ps`)

### ❌ `Can't connect to MySQL server`
- Tunggu 10–15 detik setelah `docker-compose up -d`
- Verifikasi: `docker ps` harus tampilkan `govconnect_mysql` status `Up`

### ❌ `ModuleNotFoundError`
- Virtual environment belum aktif — pastikan `(venv)` terlihat di prompt
- Jalankan ulang: `pip install -r requirements.txt`

### ❌ PowerShell menolak `Activate.ps1`
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ Autofill tidak berfungsi
- Refresh halaman target setelah ekstensi dipasang
- Pastikan nama/ID input mengandung keyword yang dikenali:

| Field | Keyword yang Dikenali |
|---|---|
| NIK | `nik`, `no_ktp`, `identitas` |
| Nama | `nama`, `name`, `full_name` |
| Alamat | `alamat`, `address`, `domisili` |
| Telepon | `telepon`, `phone`, `hp`, `telp`, `whatsapp` |

### ❌ Ekstensi tidak muncul di Chrome
- Pastikan folder yang dipilih saat "Load unpacked" adalah `extension/` (yang berisi `manifest.json`)
- Cek error di `chrome://extensions/`

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan akademis — **Workshop Pemrograman Framework**.
