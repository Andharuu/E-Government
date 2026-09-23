# GovConnect — E-Government Autofill Assistant

> Platform asisten pengisian formulir layanan publik otomatis terintegrasi berbasis **Chrome Extension (Manifest V3)**, **FastAPI (Modular Architecture)**, **MySQL / SQLite**, dan **React 19 (Vite + TypeScript + Tailwind CSS v4)**.

---

## 📌 Deskripsi Sistem

**GovConnect** adalah ekosistem *e-government digital assistant* yang mengotomatisasi pengisian formulir layanan publik menggunakan profil kependudukan pengguna yang tersimpan secara terstruktur dan aman. Sistem ini dirancang untuk mengeliminasi friksi pengisian data identitas berulang pada berbagai portal digital (pendaftaran beasiswa, perizinan, layanan kependudukan, BPJS, perbankan, dan lainnya).

Sistem terdiri dari tiga pilar komponen utama yang saling terhubung:

| Komponen | Teknologi Utama | Fungsi Utama |
|---|---|---|
| **Backend API Engine** | Python 3.10+ · FastAPI · SQLAlchemy 2.0 · Pydantic v2 | Manajemen profil kependudukan, sinkronisasi mapping per-domain, analitik & KPI, otentikasi JWT HS256, rate limiting, dan proteksi privasi. |
| **Chrome Extension** | Manifest V3 · Vanilla JS · Side Panel API | Deteksi form otomatis dengan **Algoritma Hybrida**, inspeksi form, workspace side panel interaktif, dan injeksi autofill 1-klik. |
| **Web Dashboard** | React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts | Antarmuka manajemen master profil (29+ atribut), visualisasi analitik penggunaan, manajemen keamanan akun, dan testing preset. |

---

### 🏛️ Alur Kerja Sistem (System Architecture)

```
┌─────────────────────────────────┐
│     Google Chrome Browser       │
│                                 │
│  ┌───────────────────────────┐  │      REST API (JSON / Bearer JWT)      ┌──────────────────────────────────┐
│  │     Web Dashboard         │  │ ◄────────────────────────────────────► │         FastAPI Backend          │
│  │ (React 19 + TS + Tailwind)│  │                                        │          (Port 8000)             │
│  │   http://localhost:5173   │  │                                        │  • Modular API Routers           │
│  └───────────────────────────┘  │                                        │  • Business Logic Services       │
│                                 │                                        │  • Centralized Core Config & Env │
│  ┌───────────────────────────┐  │      REST API (Fresh Token Sync)       │  • Sliding-Window Rate Limiting  │
│  │   Chrome Extension (MV3)  │  │ ◄────────────────────────────────────► │  • Global Exception Handlers     │
│  │ • Popup (Auth Gateway)    │  │                                        └─────────────────┬────────────────┘
│  │ • Side Panel (Workspace)  │  │                                                          │
│  └─────────────┬─────────────┘  │                                                          │ SQLAlchemy 2.0 ORM
│                │ chrome.tabs    │                                                          ▼
│                ▼ sendMessage    │                                        ┌──────────────────────────────────┐
│  ┌───────────────────────────┐  │                                        │       Database Engine            │
│  │     Content Script        │  │                                        │                                  │
│  │  [ Algoritma Hybrida ]    │  │                                        │ • Production: MySQL (Docker)     │
│  │ • W3C Autocomplete Match │  │                                        │ • Test/Local: SQLite Instan      │
│  │ • Heuristic Label Scoring │  │                                        └──────────────────────────────────┘
│  │ • Exact Token Matcher     │  │
│  └─────────────┬─────────────┘  │
│                │ DOM Injection  │
│                ▼                │
│  ┌───────────────────────────┐  │
│  │ Target E-Gov Form Page    │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## 📁 Struktur Proyek (Directory Tree)

Codebase menggunakan arsitektur modular berlapis (*Separation of Concerns*) untuk memudahkan pemeliharaan dan pengujian:

```
E-Government/
├── backend/                            # Layanan RESTful API Engine
│   ├── app/
│   │   ├── main.py                     # Entry point FastAPI, CORS, logger & global exception
│   │   ├── database.py                 # Inisialisasi engine & session database (MySQL / SQLite)
│   │   ├── core/                       # Pengaturan sistem inti & utilitas keamanan
│   │   │   ├── config.py               # Pydantic Settings & environment variable loader
│   │   │   └── security.py             # Bcrypt hashing, JWT token issuer & rate limiter
│   │   ├── api/                        # Lapisan HTTP Routing
│   │   │   ├── auth.py                 # Otentikasi: register, login, me, change-password
│   │   │   ├── endpoints.py            # Router agregator v1 (backward compatible)
│   │   │   └── routers/                # Sub-router modular per domain fitur
│   │   │       ├── profile_router.py   # Endpoint profil (GET, PUT, PATCH)
│   │   │       ├── mapping_router.py   # Endpoint custom field mapping (CRUD & Bulk)
│   │   │       └── activity_router.py  # Endpoint log aktivitas, stats & analytics
│   │   ├── models/
│   │   │   └── entities.py             # Model SQLAlchemy: User, Profile, Mapping, Activity
│   │   ├── schemas/
│   │   │   └── schemas.py              # Skema validasi Pydantic (Request / Response)
│   │   └── services/                   # Lapisan logika bisnis terisolasi
│   │       ├── profile_service.py      # Kalkulasi kelengkapan profil (29+ fields)
│   │       └── activity_service.py     # Agregasi metrik analitik, domain extractor & KPI
│   ├── tests/                          # Automated Test Suite (Pytest)
│   │   ├── conftest.py                 # Fixture isolated in-memory/file SQLite DB & client
│   │   ├── test_auth.py                # 11 Unit test autentikasi, token & rate limiting
│   │   ├── test_profile.py             # 6 Unit test CRUD & validasi profil kependudukan
│   │   ├── test_mappings.py            # 4 Unit test mapping tunggal, bulk & per-domain
│   │   └── test_activities.py          # 3 Unit test pencatatan aktivitas & analitik
│   ├── .env.example                    # Template konfigurasi environment
│   ├── docker-compose.yml              # Orkestrasi container MySQL
│   ├── pytest.ini                      # Konfigurasi runner test pytest
│   └── requirements.txt                # Dependensi Python
│
├── frontend/                           # Web Dashboard SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx           # Ringkasan KPI, grafik Recharts & quick actions
│   │   │   ├── Profile.tsx             # Form wizard master profile (29+ atribut kependudukan)
│   │   │   ├── Activity.tsx            # Audit log riwayat injeksi & status keberhasilan
│   │   │   ├── Settings.tsx            # Pengaturan keamanan, ganti password & kontrol privasi
│   │   │   ├── Login.tsx               # Halaman masuk sistem
│   │   │   └── Register.tsx            # Halaman pendaftaran akun baru
│   │   ├── components/                 # Komponen modular (Sidebar, Navbar, Card, Modal)
│   │   ├── constants/                  # Preset profil dummy terverifikasi untuk pengujian
│   │   ├── services/                   # Axios HTTP client, token interceptor & endpoint SDK
│   │   └── types/                      # Deklarasi tipe TypeScript untuk Profile & Activity
│   ├── package.json                    # Dependensi Node.js (React 19, Tailwind v4, Vite 8)
│   └── vite.config.ts                  # Konfigurasi Vite & Tailwind CSS bundler
│
├── extension/                          # Chrome Extension (Manifest V3)
│   ├── manifest.json                   # Definisi ekstensi, permissions & host matches
│   ├── background.js                   # Service worker, session state & relay pesan
│   ├── popup.html & popup.js           # Auth Gateway & panel kontrol cepat
│   ├── sidepanel.html & sidepanel.js   # Side panel workspace autofill & inspector form
│   └── content_script.js               # Algoritma Hybrida: deteksi form & injeksi DOM
│
├── test-page/                          # Portal Uji Coba & Benchmarking Autofill
│   ├── index.html                      # Test suite portal hub & panduan pengujian
│   ├── dummy_form.html                 # Formulir pengujian komprehensif (30+ elemen input)
│   ├── demoqa_standard.html            # Standar pengujian otomasi berbasis DemoQA
│   └── roboform_standard.html          # Benchmark kompatibilitas standar formulir RoboForm
│
└── docs/                               # Dokumentasi Teknis & Laporan Proyek
    ├── PRD.md                          # Product Requirements Document
    ├── System Architecture.md          # Dokumen arsitektur teknis sistem
    ├── DesignSystem.md                 # Design system, palet warna & tipografi
    ├── uiuxspesification.md            # Spesifikasi antarmuka dan interaksi pengguna
    └── progress-report.md              # Laporan progres pengembangan mingguan
```

---

## ⚡ Algoritma Hybrida & 29+ Atribut Kependudukan

Ekstensi GovConnect menggunakan **Algoritma Hybrida** pada `content_script.js` untuk mendeteksi field input dengan akurasi tinggi:

1. **Layer 1 — Standar W3C HTML5 `autocomplete`**:
   Mencocokkan atribut standar browser (`given-name`, `family-name`, `email`, `tel`, `street-address`, `postal-code`, `bday`, dll.) dengan kecocokan instan 100%.
2. **Layer 2 — Heuristic Multi-Attribute Scoring**:
   Menganalisis dan memberi bobot skor pada atribut elemen DOM: `id`, `name`, `placeholder`, `aria-label`, `<label>` terdekat, serta atribut konteks form.
3. **Layer 3 — Exact Token Matching untuk Kata Kunci Pendek**:
   Mencegah *false positive* pada kata kunci 2–4 karakter (`nik`, `wa`, `hp`, `kab`, `kot`, `zip`, `sim`, `sex`, `age`, `dob`) dengan validasi token presisi (bukan sekadar `substring.includes()`).
4. **Layer 4 — Custom Persistent Mapping**:
   Pengguna dapat memetakan kolom formulir yang unik pada domain tertentu; mapping disimpan ke backend dan otomatis digunakan saat situs dibuka kembali.

### Cakupan 29+ Atribut Profil Master
* **Identitas Diri**: NIK (16 digit), Nama Lengkap, Gelar Depan/Belakang, Tempat Lahir, Tanggal Lahir, Jenis Kelamin, Agama, Status Perkawinan, Golongan Darah.
* **Kontak**: Email, Nomor Telepon/HP, Nomor WhatsApp.
* **Alamat Lengkap**: Alamat Domisili, RT/RW, Kelurahan/Desa, Kecamatan, Kota/Kabupaten, Provinsi, Kode Pos, Negara.
* **Pendidikan & Karir**: Pendidikan Terakhir, Nama Sekolah/Kampus, Jurusan/Program Studi, Pekerjaan/Profesi, Nama Instansi/Perusahaan, NIP/NRP/NIM.
* **Dokumen Tambahan & Kontak Darurat**: Nomor Kartu Keluarga (KK), Nomor NPWP, Nomor BPJS Kesehatan, Nomor Paspor, Nomor SIM, Nama Kontak Darurat, Nomor Telepon Kontak Darurat.

---

## 🔌 Dokumentasi REST API

Base URL: `http://127.0.0.1:8000`

### 1. Health & Server Info
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|:---:|
| `GET` | `/` | Cek status server, versi aplikasi, dan tautan dokumentasi | Publik |
| `GET` | `/health` | Health-check endpoint untuk monitoring & uptime tracker | Publik |
| `GET` | `/docs` | Swagger UI interaktif (OpenAPI specification) | Publik |
| `GET` | `/redoc` | ReDoc alternative API documentation | Publik |

### 2. Autentikasi & Akun (`/api/v1/auth`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|:---:|
| `POST` | `/api/v1/auth/register` | Mendaftarkan akun pengguna baru (Password min. 6 karakter) | Publik |
| `POST` | `/api/v1/auth/login` | Login via form OAuth2 password & menerbitkan Bearer JWT | Publik |
| `GET` | `/api/v1/auth/me` | Mengambil data akun pengguna yang sedang login | Bearer JWT |
| `POST` | `/api/v1/auth/change-password` | Mengubah kata sandi akun pengguna | Bearer JWT |

### 3. Profil Pengguna (`/api/v1/profile`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|:---:|
| `GET` | `/api/v1/profile/me` | Mengambil data profil 29+ field beserta skor kelengkapan (%) | Bearer JWT |
| `PUT` | `/api/v1/profile/me` | Pembaruan menyeluruh (*full update*) seluruh field profil | Bearer JWT |
| `PATCH` | `/api/v1/profile/me` | Pembaruan parsial (*delta update*) pada field tertentu saja | Bearer JWT |

### 4. Custom Field Mappings (`/api/v1/mappings`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|:---:|
| `GET` | `/api/v1/mappings` | Mengambil daftar mapping tersimpan (opsional `?domain=...`) | Bearer JWT |
| `POST` | `/api/v1/mappings` | Tambah atau upsert mapping field tunggal untuk suatu domain | Bearer JWT |
| `POST` | `/api/v1/mappings/bulk` | Sinkronisasi batch daftar field mapping dari Chrome Extension | Bearer JWT |
| `PUT` | `/api/v1/mappings/{id}` | Memperbarui mapping field spesifik berdasarkan ID | Bearer JWT |
| `DELETE` | `/api/v1/mappings/{id}` | Menghapus satu mapping spesifik | Bearer JWT |
| `DELETE` | `/api/v1/mappings` | Membersihkan seluruh mapping pengguna (opsional `?domain=...`) | Bearer JWT |

### 5. Aktivitas & Analitik (`/api/v1/activities`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|:---:|
| `GET` | `/api/v1/activities` | Riwayat autofill dengan filter `status`, `domain`, `limit`, `offset` | Bearer JWT |
| `POST` | `/api/v1/activities` | Mencatat log aktivitas autofill (**tanpa mencatat data sensitif**) | Bearer JWT |
| `GET` | `/api/v1/activities/stats` | Agregasi KPI instan: Total Autofill, Success Rate, Waktu Hemat | Bearer JWT |
| `GET` | `/api/v1/activities/analytics`| Data analitik visual grafik tren harian & distribusi website (`?days=7`) | Bearer JWT |
| `GET` | `/api/v1/activities/{id}` | Mengambil rincian spesifik satu entri log aktivitas | Bearer JWT |
| `DELETE` | `/api/v1/activities/{id}` | Menghapus satu catatan log riwayat | Bearer JWT |
| `DELETE` | `/api/v1/activities` | Menghapus seluruh riwayat aktivitas (*Hak Kendali Privasi*) | Bearer JWT |

---

## ⚙️ Prasyarat Sistem

Sebelum memulai instalasi, pastikan lingkungan komputer Anda memiliki:
- **Python** 3.10 atau versi lebih baru → [python.org](https://www.python.org/downloads/)
- **Node.js** 18 atau 20+ (LTS) & `npm` → [nodejs.org](https://nodejs.org/)
- **Google Chrome** (versi 116+ dengan dukungan Side Panel API)
- *(Opsional)* **Docker Desktop** → jika ingin menggunakan MySQL via container

---

## 🚀 Panduan Instalasi & Menjalankan Sistem

### Langkah 1 — Clone Repository

```bash
git clone https://github.com/Andharuu/E-Government.git
cd E-Government
```

---

### Langkah 2 — Konfigurasi Environment Backend (`.env`)

Masuk ke direktori `backend` dan salin file template konfigurasi:

```bash
cd backend

# Windows (Command Prompt / PowerShell)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Buka file `.env` dan tentukan database engine yang ingin digunakan:
* **Opsi A: MySQL (Default / Docker)**
  ```env
  DATABASE_URL="mysql+pymysql://govuser:govpassword@localhost:3306/govconnect_db"
  ```
* **Opsi B: SQLite (Instan & Cepat tanpa Docker)**
  ```env
  DATABASE_URL="sqlite:///./govconnect.db"
  ```

---

### Langkah 3 — Jalankan Database

#### Opsi A: Menggunakan Docker (MySQL)
Jika memilih MySQL via Docker, jalankan container di folder `backend`:
```bash
docker-compose up -d
```
Verifikasi bahwa container `govconnect_mysql` berjalan sehat di port `3306`:
```bash
docker ps
```

#### Opsi B: Menggunakan SQLite
Jika menggunakan SQLite pada `.env`, Anda tidak perlu menjalankan container database apapun. File database `govconnect.db` akan dibuat secara otomatis saat server pertama kali dijalankan.

---

### Langkah 4 — Siapkan Virtual Environment & Install Dependensi

Tetap di folder `backend`:

```bash
# Membuat virtual environment
python -m venv venv

# Mengaktifkan virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Windows (CMD):
.\venv\Scripts\activate.bat
# macOS / Linux:
source venv/bin/activate
```

> **Catatan PowerShell**: Jika muncul pesan pembatasan skrip, jalankan:  
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

Install paket dependensi Python:

```bash
pip install -r requirements.txt
```

---

### Langkah 5 — Jalankan Automated Test Suite (Pytest)

Pastikan seluruh sistem backend berfungsi normal dengan menjalankan 24 test otomatis:

```bash
pytest
```

Hasil yang diharapkan:
```
================= 24 passed, 36 warnings in ~2.00s =================
```

---

### Langkah 6 — Jalankan Server FastAPI

Masih di dalam direktori `backend` dengan virtual environment aktif:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Server berhasil berjalan jika muncul log:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Memulai GovConnect API Engine v2.0.0
INFO:     Application startup complete.
```

Tabel basis data (`users`, `profiles`, `mappings`, `activities`) akan diinisialisasi otomatis saat pertama kali dijalankan.

---

### Langkah 7 — Jalankan Dashboard React (Vite)

Buka terminal **baru**, lalu masuk ke direktori `frontend`:

```bash
cd frontend
npm install
npm run dev
```

Dashboard akan aktif di alamat: **http://localhost:5173**

---

### Langkah 8 — Pasang Chrome Extension (Manifest V3)

1. Buka browser **Google Chrome**.
2. Buka URL `chrome://extensions/`.
3. Aktifkan toggle **"Developer mode"** di pojok kanan atas.
4. Klik tombol **"Load unpacked"** di pojok kiri atas.
5. Arahkan dan pilih folder `extension/` dari direktori proyek ini.
6. Ekstensi **GovConnect — Autofill Assistant** berhasil terpasang di Chrome.

> 💡 **Tips Pengembang**: Jika Anda melakukan modifikasi pada kode ekstensi, klik ikon refresh 🔄 pada kartu ekstensi di `chrome://extensions/`.

---

### Langkah 9 — Uji Coba Autofill Menggunakan Test Suite Portal

Proyek ini telah dilengkapi dengan portal benchmark formulir komprehensif:

1. Buka file `test-page/index.html` langsung di Google Chrome.
2. Pilih salah satu formulir pengujian:
   * **Comprehensive Dummy Form (`dummy_form.html`)**: Memuat 30+ input beragam (identitas, kontak, alamat, institusi, radio button, select, dsb.).
   * **Standard DemoQA Form (`demoqa_standard.html`)**: Benchmark form standar pengujian otomatisasi QA.
   * **RoboForm Standard Form (`roboform_standard.html`)**: Benchmark standar industri autofill.
3. Klik ikon ekstensi **GovConnect** di toolbar Chrome:
   * Masuk menggunakan akun Anda (atau gunakan fitur registrasi).
   * Buka **Side Panel Autofill**.
4. Ekstensi akan memindai formulir secara otomatis menggunakan **Algoritma Hybrida**.
5. Tinjau field yang terdeteksi, pilih field yang ingin diisi, lalu klik **"⚡ Fill Selected Fields"**.
6. Formulir akan terisi otomatis secara instan dan log aktivitas akan tercatat di Web Dashboard.

---

## 📊 Fitur Unggulan Web Dashboard

Akses di: **http://localhost:5173**

* 📈 **KPI & Visual Analytics**: Menampilkan statistik total form yang diisi, persentase keberhasilan (*success rate*), estimasi waktu yang dihemat, serta grafik tren harian menggunakan Recharts.
* 👤 **Master Profile Management**: Wizard pengisian data kependudukan terstruktur dengan indikator kelengkapan profil (*Profile Completion Score*).
* 🧪 **Preset Pengujian Instan**: Opsi isi otomatis data dummy terverifikasi (Pelajar/Mahasiswa, ASN/PNS, Profesional Swasta) untuk mempercepat demo pengujian.
* 📜 **Activity Audit Log**: Riwayat transaksi autofill lengkap dengan domain target, jumlah field terisi, status eksekusi, serta filter pencarian.
* 🔒 **Pusat Keamanan & Privasi**: Fitur ganti kata sandi akun serta tombol pembersihan riwayat (*Clear Activity History*) sesuai prinsip perlindungan data pribadi.

---

## 🛑 Cara Menghentikan Layanan

* **Menghentikan FastAPI / Vite**: Tekan `Ctrl + C` pada masing-masing jendela terminal.
* **Menghentikan Container MySQL**:
  ```bash
  cd backend
  # Hentikan tanpa menghapus data
  docker-compose stop

  # Hentikan dan bersihkan container (volume data tetap aman)
  docker-compose down

  # Reset total database (menghapus volume data)
  docker-compose down -v
  ```

---

## 🐛 Panduan Troubleshooting

| Gejala Masalah | Kemungkinan Penyebab | Solusi |
|---|---|---|
| **Ekstensi menunjukkan status "Offline"** | Server FastAPI belum berjalan atau port 8000 terblokir | Pastikan backend berjalan via `uvicorn app.main:app --port 8000`. Cek `http://127.0.0.1:8000` di browser. |
| **Error `Can't connect to MySQL server`** | Container Docker MySQL belum siap menerima koneksi | Tunggu 10–15 detik hingga MySQL selesai inisialisasi. Cek status via `docker ps`. Alternatifnya, beralih ke SQLite di `.env`. |
| **Error `ModuleNotFoundError` pada Python** | Virtual environment belum diaktifkan saat menjalankan server | Pastikan awalan `(venv)` terlihat di terminal Anda sebelum menjalankan `uvicorn` atau `pytest`. |
| **Error PowerShell script execution denied** | Kebijakan eksekusi skrip PowerShell Windows masih terblokir | Jalankan: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`. |
| **Autofill tidak mengisi kolom tertentu** | Kolom memiliki atribut non-standar atau form dinamis | Buka Side Panel ekstensi, tentukan pemetaan manual melalui form mapper, lalu simpan agar tersinkronisasi ke server. |
| **CORS Error pada Browser Console** | Origin extension atau dashboard belum diizinkan | Pastikan `.env` memiliki `CORS_ORIGINS` yang mencakup URL frontend dan `CORS_ORIGIN_REGEX="^chrome-extension://[a-zA-Z0-9]+$"`. |

---

## 📄 Lisensi & Kontributor

Proyek ini dikembangkan untuk keperluan akademik — **Workshop Pemrograman Framework**.

* **Repository**: [github.com/Andharuu/E-Government](https://github.com/Andharuu/E-Government)
* **Arsitektur & Spesifikasi Lengkap**: Lihat folder [docs/](file:///c:/Users/BR/govconnect/docs/)
