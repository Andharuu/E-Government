# GovConnect — Platform Asisten Pengisian Formulir & Layanan Publik Digital

> Platform otomasi pengisian formulir instansi pemerintah berbasis **Google Chrome Extension (Manifest V3)**, **FastAPI REST Engine**, **MySQL / SQLite**, dan **React 19 (Vite + TypeScript + Tailwind CSS v4)** dengan standar keamanan enkripsi lokal dan kepatuhan regulasi perlindungan data pribadi nasional.

---

## 📌 Gambaran Umum Sistem

**GovConnect** dirancang untuk mengeliminasi friksi birokrasi digital akibat pengisian data kependudukan secara berulang (seperti permohonan akta, KTP, perizinan, beasiswa, bansos, kepolisian, dan pajak). Dengan ekosistem terpadu antara ekstensi peramban cerdas, portal dashboard warga, dan panel operasional administrator instansi, GovConnect menyajikan pengalaman pengisian formulir instan (0.3 detik) yang akurat, aman, dan mematuhi privasi warga negara.

Sistem terdiri dari 3 pilar terintegrasi:

| Komponen | Stack Teknologi | Peran & Fitur Utama |
|---|---|---|
| **Backend API Engine** | Python 3.10+ · FastAPI · SQLAlchemy 2.0 · Pydantic v2 | Manajemen profil kependudukan (29+ atribut), otentikasi JWT HS256, sistem tiket aduan & bantuan publik terintegrasi basis data, endpoint analitik, audit log keamanan, notifikasi real-time (SSE), dan panel kendali admin. |
| **Chrome Extension (MV3)** | Manifest V3 · Vanilla JS · Chrome Side Panel API | Deteksi form otomatis dengan **Algoritma Hybrid Cascade**, inspeksi form, workspace side panel interaktif, autofill 1-klik terotorisasi, dan fallback semantik lokal. |
| **Web Portal & Dashboard** | React 19 · TypeScript · Vite · Tailwind CSS v4 · FontAwesome | Landing page modern & responsif, halaman demo simulator, sistem autentikasi split-screen dinamis, dashboard analitik pengguna, pustaka template instansi, serta dashboard pengawasan admin lengkap. |

---

## 🏛️ Arsitektur Sistem Terintegrasi

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Google Chrome Browser                           │
│                                                                        │
│ ┌───────────────────────────┐ REST API (Bearer JWT)  ┌───────────────┴────────────────┐
│ │   Web Dashboard & Portal  │◄──────────────────────►│        FastAPI REST Engine     │
│ │(React 19 + TS + Tailwind) │                        │          (Port 8000)           │
│ └───────────────────────────┘                        │  • Auth & User Profiling       │
│                                                      │  • Public Help & Complaints    │
│ ┌────────────────────────────────────────────────┐   │  • Admin Control & Audit Logs  │
│ │            Chrome Extension (MV3)              │   │  • SSE Real-time Notifications │
│ │                                                │   │  • Sliding-Window Rate Limiter │
│ │ ┌───────────────────┐     ┌──────────────────┐ │   └────────────────┬───────────────┘
│ │ │ Popup/Side Panel  │◄───►│Background Worker │◄═════(Telemetry)═════╛
│ │ │(Auth & Workspace) │     │ (State & Relay)  │ │
│ │ └───────────────────┘     └────────┬─────────┘ │   ┌────────────────────────────────┐
│ │                                    │           │   │        Database Storage        │
│ │ ┌───────────────────┐     ┌────────▼─────────┐ │   │ • Production: MySQL (Docker)   │
│ │ │  Content Script   │◄───►│  Offscreen Doc   │ │   │ • Local / Testing: SQLite      │
│ │ │  [ DOM Engine ]   │     │[Local Inference] │ │   └────────────────────────────────┘
│ │ │ • Cascade Matcher │     │• SBERT Embeddings│ │
│ │ │ • Shadow DOM      │     │• ONNX WASM       │ │
│ │ └─────────┬─────────┘     └──────────────────┘ │
│ └───────────┼────────────────────────────────────┘
│             │ DOM Autofill Injection
│ ┌───────────▼───────────────┐
│ │ Target E-Gov Form Page    │
│ │ (Dukcapil, Polri, dsb.)   │
│ └───────────────────────────┘
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Struktur Direktori Proyek

```
E-Government/
├── backend/                            # RESTful API Engine (FastAPI)
│   ├── alembic/ & alembic.ini          # Konfigurasi skrip migrasi basis data
│   ├── app/
│   │   ├── main.py                     # Entry point FastAPI, CORS, middleware, global error handler
│   │   ├── database.py                 # Koneksi DB (MySQL / SQLite), pool & session manager
│   │   ├── core/                       # Pengaturan sistem (config.py), security util & hashing
│   │   ├── models/entities.py          # ORM SQLAlchemy: User, Profile, Mapping, Activity, Complaint, dsb.
│   │   ├── schemas/schemas.py          # Skema Pydantic v2 untuk validasi request & response
│   │   ├── services/                   # Business logic terisolasi (activity, auth, admin, complaints)
│   │   └── api/v1/                     # Routing modular HTTP API v1
│   │       ├── api.py                  # Router agregator v1
│   │       └── routers/                # Endpoint modular:
│   │           ├── auth.py             # Registrasi, login, refresh token, ganti kata sandi
│   │           ├── profile.py          # Manajemen 29+ data identitas kependudukan
│   │           ├── mapping.py          # Sinkronisasi pemetaan field per-domain
│   │           ├── activity.py         # Log aktivitas autofill & agregasi statistik
│   │           ├── complaints.py       # Pengaduan pengguna & endpoint tiket bantuan publik
│   │           ├── admin.py            # Operasional admin (KPI, audit log, pengguna, pengumuman)
│   │           ├── notification.py     # Notifikasi sistem & SSE streaming
│   │           └── public_services.py  # Jadwal dan agenda layanan publik terintegrasi
│   ├── tests/                          # 28 Automated unit & integration tests (Pytest)
│   ├── requirements.txt                # Dependensi Python
│   ├── docker-compose.yml              # Container MySQL untuk lingkungan produksi
│   └── .env.example                    # Template variabel lingkungan backend
│
├── frontend/                           # Single Page Application (React 19 + TypeScript + Vite)
│   ├── public/
│   │   └── govconnect-extension.zip    # Bundle ekstensi siap pasang untuk unduhan instan
│   ├── src/
│   │   ├── App.tsx                     # Definisi routing aplikasi & route protection (Public, User, Admin)
│   │   ├── index.css                   # Tailwind v4 theme, custom scrollbar & micro-interactions
│   │   ├── pages/
│   │   │   ├── Landing.tsx             # Landing page modern & responsif
│   │   │   ├── Demo.tsx                # Halaman simulasi live autofill GovConnect vs Form Dukcapil
│   │   │   ├── AuthPage.tsx            # Halaman autentikasi terpadu (Login & Register split-screen)
│   │   │   ├── Login.tsx / Register.tsx# Wrapper modular halaman autentikasi
│   │   │   ├── Dashboard.tsx           # Dasbor analitik, grafik efisiensi & audit privasi warga
│   │   │   ├── Profile.tsx             # Manajemen master data kependudukan (29+ atribut)
│   │   │   ├── Templates.tsx           # Pustaka template instansi resmi & pembuat template kustom
│   │   │   ├── Activity.tsx            # Riwayat & audit log transaksi pengisian formulir
│   │   │   ├── UserComplaints.tsx      # Pusat tiket pengaduan & pelaporan kendala oleh warga
│   │   │   ├── Notifications.tsx       # Pusat notifikasi & pemberitahuan sistem
│   │   │   ├── PublicServices.tsx      # Direktori direktori agenda layanan publik pemerintah
│   │   │   ├── Settings.tsx            # Pengaturan keamanan, ekspor data & preferensi akun
│   │   │   └── admin/                  # Modul Khusus Administrator:
│   │   │       ├── AdminDashboard.tsx  # Metrik eksekutif, tren aduan & banner mitigasi bug/keamanan
│   │   │       ├── AdminComplaints.tsx # Manajemen tiket warga & publik dengan filter status/prioritas
│   │   │       ├── AdminUsers.tsx      # Manajemen akun warga, hak akses & status verifikasi
│   │   │       ├── AdminAudit.tsx      # Riwayat audit log sistem & aktivitas administratif
│   │   │       └── AdminAnnouncements.tsx # Publikasi pengumuman & broadcast layanan resmi
│   │   ├── components/
│   │   │   ├── Layout.tsx              # Sidebar TailAdmin style, header pencarian & profil dropdown
│   │   │   ├── auth/                   # Komponen khusus autentikasi:
│   │   │   │   ├── AuthShowcasePreview.tsx # Mockup browser Dukcapil adaptif Light & Dark mode
│   │   │   │   ├── AuthTermsModal.tsx  # Modal regulasi detail (UU PDP, UU Adminduk, UU ITE, PP PSTE)
│   │   │   │   └── AuthHelpModal.tsx   # Modal bantuan publik langsung terhubung ke database admin
│   │   │   ├── admin/adminUi.tsx       # Komponen UI bersama modul admin (KpiCard, StatusBadge, dsb.)
│   │   │   └── ui/                     # Komponen UI atomik (Button, Input, Card, FontAwesome, dsb.)
│   │   ├── context/                    # React Context (AuthContext & ThemeContext)
│   │   └── services/api.ts             # Axios HTTP client dengan interceptor token JWT
│   └── package.json                    # Dependensi frontend
│
├── extension/                          # Chrome Extension Manifest V3
│   ├── manifest.json                   # Konfigurasi perizinan, service worker, & side panel
│   ├── config.js                       # Konfigurasi terpusat URL backend & dashboard
│   ├── background.js                   # Service worker, session state sync, dan relay komunikasi
│   ├── content_script.js               # DOM Engine, shadow DOM piercing, mutation observer, autofill
│   ├── sidepanel.html & sidepanel.js   # Side panel workspace, inspektur form & kendali autofill
│   ├── popup.html & popup.js           # Auth gateway & panel kontrol ringkas toolbar
│   └── offscreen.html & offscreen.js   # Offscreen document host inferensi semantik lokal
│
├── test-page/ & test-form.html         # Testbed pengujian formulir (30+ variasi input pemerintah)
└── README.md                           # Dokumentasi komprehensif sistem
```

---

## 🚀 Fitur-Fitur Utama Sistem

### 1. Ekosistem Autentikasi Modern & Terpadu (`/login` & `/register`)
* **Split-Screen Layout**:
  * **Sisi Kiri**: Formulir bersih dengan logo unwrapped, toggle mode gelap/terang bulat, custom checkbox (*Ingat Saya* via localStorage & *Persetujuan Regulasi*), serta tombol aksi bertema resmi **GovConnect Navy** (`#001D39` & `#0A4174`).
  * **Sisi Kanan**: Pratinjau browser mockup Dukcapil interaktif dengan 4 floating cards (Kecepatan 0.3s, Brankas Terenkripsi, 25.000+ Warga, Deteksi Kolom 100%).
* **Adaptasi Penuh Light Mode**: Pratinjau sisi kanan beradaptasi cerdas dengan kontras tinggi, latar canvas abu-abu lembut (`#F1F6FA`), kartu putih bersih (`bg-white/95`), serta teks data yang tajam.
* **Transisi In-Place Bebas Flicker**: Beralih antara Login dan Register terjadi langsung di tempat (*fade-in in-place*) tanpa efek geser horizontal yang mengganggu, menjaga persistensi logo, toggle, footer, dan pratinjau kanan.
* **Modal Regulasi Kependudukan Lengkap (`AuthTermsModal.tsx`)**:
  * Memuat landasan hukum resmi: **UU No. 27/2022 (UU PDP)**, **UU No. 24/2013 (UU Adminduk)**, **UU No. 1/2024 (UU ITE)**, dan **PP No. 71/2019 (PP PSTE)**.
  * Merinci klasifikasi data wajib sistem, enkripsi peramban lokal, prinsip *zero third-party tracker*, dan hak subjek data untuk mencabut persetujuan atau menghapus akun secara permanen.
* **Pusat Bantuan Publik Terhubung Database (`AuthHelpModal.tsx`)**:
  * Pengunjung dapat menyampaikan kendala/laporan langsung dari halaman login/register tanpa perlu masuk akun terlebih dahulu.
  * Formulir mengirim data ke endpoint backend `POST /api/v1/complaints/public-help`, menghasilkan nomor tiket unik (`HLP-YYYYMMDD-HHMMSS-XXX`) yang langsung muncul secara real-time pada panel admin.

### 2. Standarisasi Ikon & Animasi Dinamis Menyeluruh
* **Standardisasi 100% FontAwesome**: Seluruh sisa ikon legacy (*Flaticon* dan SVG mentah) di Dasbor Pengguna dan Dasbor Admin telah distandardisasi menggunakan komponen `FontAwesome`.
* **Micro-Interactions Fluid pada Ikon**:
  * Hover langsung pada ikon memicu efek membesar halus (`scale(1.18)`), kemiringan tipis (`rotate(4deg)`), dan pendaran lembut (*soft glow*).
  * Hover pada tombol/menu/tautan induk secara otomatis menganimasikan ikon di dalamnya (`scale(1.14)`).
  * Animasi khusus sesuai fungsi: Ikon refresh berputar 180°, ikon panah/chevron meluncur maju secara mulus (`translateX(3px)`), ikon lonceng notifikasi bergetar halus (*bell wobble*), dan ikon hapus sedikit miring dengan aksen merah.
* **Umpan Balik Taktil & Elevasi Kartu**:
  * Respon tekan fisik (*active press*) pada seluruh tombol dan tautan (`active:scale-[0.975]`).
  * Efek elevasi kartu metrik saat disentuh kursor (`hover:-translate-y-1 hover:shadow-xl`).
  * Custom scrollbar ramping (6px) yang elegan pada mode terang maupun gelap.

### 3. Asisten Ekstensi Peramban Cerdas (Chrome Extension MV3)
* **Algoritma Hybrid Cascade Pipeline**:
  1. *Pass 0*: Atribut standar W3C HTML5 `autocomplete`.
  2. *Pass 1*: Exact match, pembersihan prefix acak, ekspansi singkatan birokrasi, dan deteksi komponen tanggal komposit.
  3. *Pass 2*: BM25 Lexical Matching & modifier konteks.
  4. *Pass 3*: Jaro-Winkler lexical proximity distance.
  5. *Pass 4*: Offscreen SBERT semantic inference model (`all-MiniLM-L6-v2`) via WebAssembly lokal (tanpa transmisi data ke API eksternal).
* **Otorisasi Eksplisit 1-Klik**: Menjamin privasi warga dengan membatasi eksekusi pengisian formulir hanya saat warga mengklik tombol konfirmasi pada panel ekstensi.
* **Distribusi Instan**: Ekstensi telah dikemas ke dalam arsip zip siap pakai (`govconnect-extension.zip`) di direktori publik untuk pengunduhan langsung dari web.

### 4. Panel Kendali Administrator Komprehensif (`/admin`)
* **Live KPI & Statistik Operasional**: Total pengguna aktif, registrasi 7 hari terakhir, total pengaduan, tiket tertunda, dan monitoring pelanggaran SLA (>3 hari).
* **Banner Mitigasi Bug & Keamanan**: Panel prioritas tinggi khusus menangani dugaan celah privasi, bug ekstensi, atau insiden keamanan.
* **Manajemen Tiket Pengaduan (`/admin/complaints`)**: Filter status (*diterima, diproses, selesai, ditolak*), prioritas (*tinggi, sedang, rendah*), dan penanganan tiket publik.
* **Manajemen Warga (`/admin/users`)**: Pemantauan akun terdaftar, status verifikasi data, dan hak akses.
* **Audit Trail Sistem (`/admin/audit`)**: Catatan kronologis seluruh mutasi data dan tindakan administratif penting.

---

## 🔌 Dokumentasi RESTful API Backend

Base URL: `http://127.0.0.1:8000`  
Dokumentasi Interaktif: `http://127.0.0.1:8000/docs` (Swagger UI) / `/redoc`

### 1. Autentikasi & Akun (`/api/v1/auth`)
| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|:---:|
| `POST` | `/api/v1/auth/register` | Mendaftarkan akun warga baru | Publik |
| `POST` | `/api/v1/auth/login` | Otentikasi kata sandi & menerbitkan JWT Bearer Token | Publik |
| `GET` | `/api/v1/auth/me` | Mengambil data akun yang sedang terautentikasi | Warga / Admin |
| `POST` | `/api/v1/auth/change-password` | Memperbarui kata sandi akun | Warga / Admin |

### 2. Profil Kependudukan Warga (`/api/v1/profile`)
| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|:---:|
| `GET` | `/api/v1/profile/me` | Mengambil master data 29+ atribut & skor kelengkapan profil | Warga |
| `PUT` | `/api/v1/profile/me` | Pembaruan menyeluruh (*full update*) profil kependudukan | Warga |
| `PATCH` | `/api/v1/profile/me` | Pembaruan parsial (*delta update*) atribut tertentu | Warga |

### 3. Pemetaan Kolom Kustom (`/api/v1/mappings`)
| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|:---:|
| `GET` | `/api/v1/mappings` | Mengambil daftar mapping tersimpan (filter `?domain=...`) | Warga |
| `POST` | `/api/v1/mappings` | Menambah/memperbarui pemetaan kolom tunggal | Warga |
| `POST` | `/api/v1/mappings/bulk` | Sinkronisasi massal (*batch*) pemetaan kolom dari ekstensi | Warga |
| `DELETE` | `/api/v1/mappings/{id}` | Menghapus pemetaan kolom spesifik | Warga |

### 4. Aktivitas & Analitik Autofill (`/api/v1/activities`)
| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|:---:|
| `GET` | `/api/v1/activities` | Mengambil riwayat pengisian formulir dengan pagination | Warga |
| `POST` | `/api/v1/activities` | Mencatat log eksekusi autofill (tanpa data sensitif) | Warga |
| `GET` | `/api/v1/activities/stats` | Statistik ringkas: total form, success rate, efisiensi waktu | Warga |
| `GET` | `/api/v1/activities/analytics` | Data agregat untuk visualisasi chart harian & mingguan | Warga |
| `DELETE` | `/api/v1/activities` | Menghapus seluruh riwayat aktivitas (*Hak Kendali Privasi*) | Warga |

### 5. Pengaduan & Bantuan Publik (`/api/v1/complaints`)
| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|:---:|
| `POST` | `/api/v1/complaints/public-help` | Mengirim tiket bantuan publik langsung dari login/register | Publik |
| `GET` | `/api/v1/complaints/me` | Mengambil daftar aduan/tiket milik pengguna yang login | Warga |
| `POST` | `/api/v1/complaints` | Membuat pengaduan baru dari dalam dasbor warga | Warga |
| `GET` | `/api/v1/complaints/{id}` | Melihat rincian pengaduan dan status penyelesaian | Warga / Admin |

### 6. Operasional Administrator (`/api/v1/admin`)
| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|:---:|
| `GET` | `/api/v1/admin/stats` | Agregasi KPI eksekutif, tren 14 hari, & ringkasan keamanan | Admin |
| `GET` | `/api/v1/admin/complaints` | Menampilkan seluruh aduan warga & publik (filter status/prioritas) | Admin |
| `PATCH` | `/api/v1/admin/complaints/{id}` | Memperbarui status (*diterima/diproses/selesai/ditolak*) | Admin |
| `GET` | `/api/v1/admin/users` | Daftar seluruh akun warga beserta status verifikasinya | Admin |
| `PATCH` | `/api/v1/admin/users/{id}/toggle-status` | Mengaktifkan / menonaktifkan status akun pengguna | Admin |
| `GET` | `/api/v1/admin/audit` | Mengambil riwayat audit log aktivitas sistem | Admin |
| `POST` | `/api/v1/admin/announcements` | Menerbitkan pengumuman resmi ke seluruh pengguna | Admin |

### 7. Notifikasi Real-Time & Layanan Publik
| Method | Endpoint | Deskripsi | Otorisasi |
|---|---|---|:---:|
| `GET` | `/api/v1/notifications/stream` | Server-Sent Events (SSE) streaming notifikasi real-time | Warga / Admin |
| `GET` | `/api/v1/notifications` | Daftar notifikasi yang belum dibaca / tersimpan | Warga / Admin |
| `PATCH` | `/api/v1/notifications/{id}/read` | Menandai satu notifikasi sebagai telah dibaca | Warga / Admin |
| `GET` | `/api/v1/public-services` | Direktori agenda dan jadwal layanan publik instansi | Publik |

---

## ⚙️ Persyaratan Sistem

* **Python** 3.10 atau versi lebih baru
* **Node.js** 18 atau 20+ (LTS) & `npm`
* **Google Chrome** versi 116+ (mendukung Side Panel API & Manifest V3)
* *(Opsional)* **Docker Desktop** untuk container database MySQL

---

## 🚀 Panduan Menjalankan Sistem Secara Lokal

### 1. Kloning Repository
```bash
git clone https://github.com/Andharuu/E-Government.git
cd E-Government
```

---

### 2. Menyiapkan & Menjalankan Backend (FastAPI)

1. Buka terminal dan masuk ke folder `backend`:
   ```bash
   cd backend
   ```

2. Buat dan aktifkan virtual environment:
   ```bash
   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Salin file environment:
   ```bash
   # Windows:
   copy .env.example .env

   # Linux / macOS:
   cp .env.example .env
   ```
   *Secara default konfigurasi menggunakan SQLite (`sqlite:///./govconnect.db`), sehingga Anda dapat langsung menjalankan sistem tanpa perlu menginstal atau menyalakan MySQL.*

4. Pasang seluruh dependensi Python:
   ```bash
   pip install -r requirements.txt
   ```

5. Verifikasi pengujian sistem backend:
   ```bash
   pytest backend/tests/ -q
   ```
   *Hasil: Seluruh 28 pengujian unit dan integrasi lulus 100% (28 passed).*

6. Jalankan server FastAPI:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   *Backend aktif dan dapat diakses di: **http://127.0.0.1:8000** (Dokumentasi: `/docs`)*

---

### 3. Menyiapkan & Menjalankan Frontend (Vite + React 19)

1. Buka terminal baru dan masuk ke folder `frontend`:
   ```bash
   cd frontend
   ```

2. Pasang dependensi Node.js:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
   *Frontend aktif dan dapat diakses di: **http://localhost:5173***

---

### 4. Memasang Chrome Extension (Manifest V3)

1. Buka browser **Google Chrome** dan navigasikan ke `chrome://extensions/`.
2. Aktifkan toggle **"Developer mode"** di pojok kanan atas.
3. Klik tombol **"Load unpacked"** di pojok kiri atas.
4. Pilih folder `extension/` dari direktori proyek ini.
5. Ekstensi **GovConnect — Autofill Assistant** akan langsung aktif di toolbar Chrome Anda.

---

### 5. Menguji Fitur Ekstensi & Demonstrasi

1. Buka halaman **http://localhost:5173/demo** pada peramban Anda untuk melihat simulasi live pengisian formulir permohonan akta kependudukan.
2. Atau buka file `test-form.html` langsung di browser Chrome untuk menguji 30+ kombinasi input formulir pemerintah (identitas, alamat, kontak, pendidikan, dokumen pendukung).
3. Buka Side Panel ekstensi GovConnect, klik **"Isi Formulir"**, dan saksikan data kependudukan terisi otomatis secara akurat dalam waktu 0.3 detik.

---

## 🔒 Standar Keamanan & Perlindungan Privasi

* **Enkripsi Lokal**: Data identitas kependudukan dilindungi di lingkungan peramban pengguna dan diotentikasi menggunakan JSON Web Token (JWT) bersandi kuat.
* **Otorisasi Eksplisit 1-Klik**: Ekstensi tidak pernah menginjeksi atau mengirim data formulir secara tersembunyi tanpa persetujuan sadar dari warga.
* **Zero Third-Party Tracking**: Tidak menggunakan skrip analitik eksternal atau pelacak pihak ketiga komersial apa pun.
* **Kepatuhan Regulasi**: Dirancang dengan mematuhi prinsip-prinsip pemrosesan data pribadi sesuai **UU PDP No. 27/2022** dan validitas NIK berdasarkan **UU Adminduk No. 24/2013**.

---

## 📄 Lisensi & Informasi Pengembang

Proyek ini dikembangkan dalam rangka pemenuhan akademik — **Workshop Pemrograman Framework**.

* **Repositori Resmi**: [github.com/Andharuu/E-Government](https://github.com/Andharuu/E-Government)
* **Dokumentasi Teknis Lanjutan**: Tersedia di direktori `docs/`
