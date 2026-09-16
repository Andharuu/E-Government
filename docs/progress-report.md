# 📋 GovConnect — Progress Report

> **Mata Kuliah**: Workshop Pemrograman Framework  
> **Semester**: 3  
> **Minggu Saat Ini**: 4 dari 16  
> **Tanggal**: 16 September 2026  

---

## Daftar Isi

1. [Latar Belakang & Konsep](#1-latar-belakang--konsep)
2. [Progress Keseluruhan](#2-progress-keseluruhan)
3. [Arsitektur Sistem — Detail Komprehensif](#3-arsitektur-sistem--detail-komprehensif)
4. [Progress Frontend (Web Dashboard)](#4-progress-frontend-web-dashboard)
5. [Progress Backend (FastAPI)](#5-progress-backend-fastapi)
6. [Progress Browser Extension](#6-progress-browser-extension)
7. [Bug Report](#7-bug-report)
8. [Rencana Pengembangan (Timeline 16 Minggu)](#8-rencana-pengembangan-timeline-16-minggu)
9. [Metrik Proyek](#9-metrik-proyek)

---

## 1. Latar Belakang & Konsep

### 1.1 Latar Belakang

Indonesia memiliki ratusan layanan publik digital — mulai dari pendaftaran online universitas, formulir BPJS, perpanjangan SIM, pendaftaran beasiswa, hingga layanan kependudukan. Setiap layanan memiliki formulirnya sendiri yang meminta data identitas yang **sama berulang-ulang**: Nama, NIK, Tanggal Lahir, Alamat, NISN, dan sebagainya.

Kondisi ini menciptakan **friction yang tidak perlu** bagi masyarakat yang sudah memiliki data kependudukan lengkap di kartu identitas mereka. Proses pengisian formulir yang berulang dan memakan waktu membuat banyak warga enggan atau salah mengisi layanan digital pemerintah.

**GovConnect** hadir sebagai solusi atas masalah ini.

### 1.2 Konsep GovConnect

> **GovConnect** adalah ekosistem asisten digital berbasis browser yang mengotomatisasi pengisian formulir layanan publik menggunakan data profil kependudukan pengguna yang tersimpan secara aman dan terstruktur.

GovConnect terdiri dari **tiga komponen utama yang saling terintegrasi**:

| Komponen | Teknologi | Fungsi |
|---|---|---|
| **Web Dashboard** | React 18 + TypeScript + Vite | Manajemen profil pengguna, riwayat aktivitas, analitik |
| **Backend API** | FastAPI + SQLAlchemy + MySQL | Otentikasi, penyimpanan data, logika bisnis |
| **Browser Extension** | Chrome Manifest V3 (Vanilla JS) | Deteksi form, autofill instan, side panel interaktif |

### 1.3 Nilai Proposisi

| # | Nilai | Deskripsi |
|---|---|---|
| 1 | ⚡ **Hemat Waktu** | ~30 detik per field → potensi menghemat waktu secara signifikan per formulir |
| 2 | 🎯 **Akurasi Tinggi** | Data diisi dari sumber tunggal terpercaya, meminimalkan kesalahan ketik |
| 3 | 🔒 **Privasi Terjaga** | Data tidak pernah dikirim ke pihak ketiga — alur terisolasi: Pengguna → Backend → Extension |
| 4 | 🔄 **Adaptif** | Sistem learning mapping per-domain → adaptasi otomatis ke berbagai situs layanan |

### 1.4 Alur Kerja Utama

```mermaid
flowchart LR
    A["👤 Pengguna Isi Profil<br/>di Web Dashboard"] --> B[("💾 Tersimpan di MySQL<br/>via FastAPI Backend")]
    B --> C["🧩 Extension Ambil Profil<br/>via Fresh API Call"]
    C --> D["🔍 Deteksi Field Form<br/>di Halaman Web Target"]
    D --> E["⚡ Autofill Otomatis<br/>ke Elemen Input"]
    E --> F["📊 Log Aktivitas Masuk<br/>ke Dashboard Analitik"]
```

---

## 2. Progress Keseluruhan

> Persentase dihitung berdasarkan fitur yang **benar-benar berfungsi end-to-end** dibandingkan total fitur yang direncanakan dalam PRD. Minggu ke-4 dari 16 = 25% timeline berjalan.

### 2.1 Progress Per Komponen

| Komponen | Progress | Keterangan |
|---|---|---|
| **Backend API** | **58%** | Endpoint inti jalan, security & env belum |
| **Web Dashboard (Frontend)** | **52%** | Halaman utama jalan, banyak fitur setengah jadi |
| **Browser Extension** | **45%** | Autofill dasar jalan, banyak edge case gagal |
| **Database & Schema** | **70%** | Skema lengkap, belum ada migrasi / indexing lanjut |
| **Dokumentasi** | **30%** | PRD & arsitektur ada, belum ada API docs & user manual |
| **Testing** | **5%** | Belum ada test — hanya manual smoke test |

> **Rata-rata keseluruhan: ~43%** — wajar dan realistis untuk minggu ke-4.

---

### 2.2 Progress Per Fitur — Backend

| Fitur | % | Kondisi Aktual |
|---|---|---|
| Autentikasi (Register / Login / Me) | **100%** | Berfungsi penuh — JWT HS256 + bcrypt |
| CRUD Profil (GET / PUT) | **70%** | GET & PUT jalan; tidak ada validasi ketat per field, tidak ada PATCH |
| Manajemen Mapping (GET / POST / DELETE) | **70%** | Fungsional; belum diuji di skenario nyata, tidak ada bulk op |
| Activity Logging | **65%** | Log masuk DB; domain parsing manual, tidak ada filter tanggal |
| Analytics Engine | **55%** | Tren 7 hari & by-website ada; kalkulasi custom field masih bug |
| Security Hardening | **15%** | CORS `allow_origins=["*"]`, JWT secret hardcoded, 0 rate limiting |
| Error Handling Global | **25%** | Hanya HTTP exception dasar per endpoint, tidak ada global handler |
| Rate Limiting | **0%** | Belum ada |
| Environment Variables | **0%** | DB URL & JWT secret masih di source code |

---

### 2.3 Progress Per Fitur — Frontend

| Fitur | % | Kondisi Aktual |
|---|---|---|
| Halaman Login & Register | **80%** | Fungsional; tidak ada forgot password, tidak ada validasi format email |
| Layout & Navigasi | **80%** | Sidebar & route guard jalan; tidak ada active state, tidak ada breadcrumb |
| Dashboard Analytics | **60%** | Data dari API tampil; grafik sederhana, tidak ada filter rentang tanggal |
| Halaman Profil (29+ field) | **60%** | Form jalan tapi `Profile.tsx` 116KB monolith; tidak ada validasi per field |
| Halaman Activity | **40%** | Hanya daftar mentah; tidak ada filter, search, atau pagination |
| Halaman Settings | **25%** | UI ada tapi mayoritas opsi tidak terhubung ke API |
| Responsif Mobile | **10%** | Tidak didesain untuk mobile; layout rusak di layar kecil |
| Loading States & Error UI | **20%** | Hanya beberapa halaman punya spinner; belum ada empty state / error state |

---

### 2.4 Progress Per Fitur — Extension

| Fitur | % | Kondisi Aktual |
|---|---|---|
| Background Service Worker | **65%** | Context menu & relay pesan jalan; edge case belum tertangani |
| Smart Field Detection | **60%** | 150+ keyword; sering miss di SPA & form yang dirender secara dinamis |
| Side Panel UI | **60%** | Login, preview, execute jalan; UX masih kasar, tidak ada feedback animasi |
| Checkbox Select / Deselect | **80%** | Baru diperbaiki sesi ini — sebelumnya broken |
| Mode 1-Klik Instan | **55%** | Bekerja pada form statis sederhana; gagal di form multi-step / conditional |
| Activity Logging ke API | **65%** | Log terkirim; field summary kadang tidak akurat |
| Token Refresh / Expiry | **0%** | Belum ada — jika token expired, extension diam tanpa notifikasi apapun |
| SPA Support (MutationObserver) | **0%** | Belum — deteksi field gagal di React / Vue / Angular |
| Popup Extension | **40%** | UI dasar ada; hampir tidak ada fitur yang berguna |

---

## 3. Arsitektur Sistem — Detail Komprehensif

### 3.1 High-Level Architecture

```mermaid
flowchart TB
    subgraph UserSpace["👤 Lingkungan Pengguna & Browser"]
        User["Pengguna (End User)"]
        subgraph Browser["Google Chrome Browser"]
            Dashboard["💻 Web Dashboard<br/>(React 18 + TS + Vite)<br/>Port: 5173"]
            Extension["🧩 Browser Extension<br/>(Manifest V3 Vanilla JS)"]
        end
        User -->|Akses Dashboard| Dashboard
        User -->|Buka Form & Isi Data| Extension
    end

    subgraph BackendSpace["⚡ Lingkungan Backend (FastAPI Server)"]
        Backend["FastAPI Application (Port: 8000)"]
        subgraph InternalBackend["Komponen Internal"]
            AuthModule["🔐 Auth Module<br/>(JWT HS256 + Bcrypt)"]
            APIRouter["📡 Core API Router<br/>(/api/v1/...)"]
            ORM["🗄️ SQLAlchemy ORM Layer"]
        end
        Backend --> AuthModule
        Backend --> APIRouter
        AuthModule --> ORM
        APIRouter --> ORM
    end

    subgraph DatabaseSpace["🗄️ Lingkungan Database"]
        DB[("MySQL 8.x Database<br/>govconnect_db<br/>Tabel: users, profiles, mappings, activities")]
    end

    Dashboard -->|REST / HTTP + Bearer JWT| Backend
    Extension -->|REST / HTTP + Bearer JWT| Backend
    ORM -->|PyMySQL Connection Pool| DB
```

---

### 3.2 Backend — Layered Architecture

```mermaid
flowchart TD
    Client["🌐 Client Request<br/>(Dashboard / Extension)"] --> FastAPIApp["⚡ FastAPI Application<br/>app/main.py"]
    
    FastAPIApp --> CORS["🛡️ CORS Middleware<br/>allow_origins, credentials, methods"]
    
    CORS --> Dispatcher{"Routing Dispatcher"}
    
    Dispatcher -->|/api/v1/auth/*| AuthRouter["🔐 Auth Router<br/>POST /register<br/>POST /login<br/>GET /me"]
    Dispatcher -->|/api/v1/*| CoreRouter["📡 Core API Router<br/>GET, PUT /profile/me<br/>GET, POST, DEL /mappings<br/>GET, POST /activities<br/>GET /activities/analytics"]
    
    CoreRouter --> AuthGuard["🔒 JWT Auth Guard<br/>Depends(get_current_user)<br/>1. Ekstrak Header Authorization Bearer<br/>2. Decode JWT (HS256 + SECRET_KEY)<br/>3. Verifikasi user_id & session<br/>4. Query User aktif dari DB"]
    AuthRouter --> AuthGuard
    
    AuthGuard --> ORMLayer["📦 SQLAlchemy ORM Layer<br/>Model Entities: User, Profile, Mapping, Activity<br/>Relasi: 1:1 dan 1:N"]
    
    ORMLayer --> MySQLDB[("🗄️ MySQL Database<br/>Connection Pool: pool_pre_ping=True")]
```

---

### 3.3 Database Schema — ERD

```mermaid
erDiagram
    users ||--|| profiles : "has (1:1)"
    users ||--o{ activities : "logs (1:N)"
    users ||--o{ mappings : "configures (1:N)"

    users {
        int id PK "Auto Increment"
        string email UK "Unique Email"
        string hashed_password "Bcrypt Hash"
        datetime created_at "Waktu Buat"
        datetime updated_at "Waktu Update"
    }

    profiles {
        int id PK "Auto Increment"
        int user_id FK "Unique Reference ke users.id"
        string nik "Nomor Induk Kependudukan"
        string full_name "Nama Lengkap"
        string birth_place "Tempat Lahir"
        date birth_date "Tanggal Lahir"
        string gender "Jenis Kelamin"
        string religion "Agama"
        string marital_status "Status Pernikahan"
        string blood_type "Golongan Darah"
        string mother_name "Nama Ibu Kandung"
        string father_name "Nama Ayah Kandung"
        string emergency_name "Nama Kontak Darurat"
        string emergency_phone "Telepon Kontak Darurat"
        string address "Alamat Domisili"
        string province "Provinsi"
        string city "Kota / Kabupaten"
        string district "Kecamatan"
        string village "Kelurahan / Desa"
        string postal_code "Kode Pos"
        string phone "Nomor Telepon / WhatsApp"
        string email "Email Kontak"
        string nisn "Nomor Induk Siswa Nasional"
        string institution "Institusi Pendidikan"
        string education_level "Jenjang Pendidikan Terakhir"
        string student_id "NIM / NIS"
        string occupation "Pekerjaan"
        string organization "Instansi Kerja"
        string work_address "Alamat Kantor"
        string npwp "Nomor Pokok Wajib Pajak"
        string bpjs_number "Nomor BPJS"
        text custom_fields "Format JSON untuk data fleksibel"
        text document_photos "Format JSON/Base64 untuk lampiran"
        datetime created_at "Waktu Buat"
        datetime updated_at "Waktu Update"
    }

    activities {
        int id PK "Auto Increment"
        int user_id FK "Reference ke users.id"
        string target_url "URL Halaman Form"
        string website_domain "Domain Web Layanan"
        string action "Jenis Aksi (autofill/detect)"
        int fields_detected "Jumlah Field Terdeteksi"
        int fields_filled "Jumlah Field Berhasil Diisi"
        string status "Status (success/partial/failed)"
        text filled_summary "JSON Ringkasan Field Terisi"
        datetime created_at "Waktu Eksekusi"
    }

    mappings {
        int id PK "Auto Increment"
        int user_id FK "Reference ke users.id"
        string website_domain "Domain Web Target"
        string website_field "Identifier Field pada Web"
        string govconnect_field "Field Profil GovConnect Padanan"
        string selector_query "CSS Selector Spesifik"
        datetime created_at "Waktu Buat"
        datetime updated_at "Waktu Update"
    }
```

---

### 3.4 Alur Autentikasi — JWT Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Pengguna
    participant Client as 💻 Client (Dashboard / Ext)
    participant Auth as 🔐 FastAPI Auth API
    participant Core as 📡 FastAPI Core API
    participant DB as 🗄️ MySQL Database

    %% Tahap Login
    rect rgb(240, 248, 255)
    Note over User, DB: 1. Proses Login & Pembuatan Token JWT
    User->>Client: Masukkan Email & Password
    Client->>Auth: POST /api/v1/auth/login (form-urlencoded)
    Auth->>DB: Query User berdasarkan Email
    DB-->>Auth: Data User & Hashed Password
    Auth->>Auth: bcrypt.verify(password, hash)
    Auth->>Auth: Buat Token JWT (HS256, sub=user.id, exp=7 hari)
    Auth-->>Client: 200 OK {access_token, token_type: "bearer"}
    Client->>Client: Simpan Token (localStorage / chrome.storage.local)
    end

    %% Tahap Ambil Profil
    rect rgb(245, 255, 250)
    Note over User, DB: 2. Request Data Profil Terproteksi
    Client->>Core: GET /api/v1/profile/me (Header: Bearer Token)
    Core->>Core: Decode & Verifikasi Token JWT
    Core->>DB: Query Profile berdasarkan user_id
    DB-->>Core: Data Profil Lengkap
    Core-->>Client: 200 OK {profile data...}
    end

    %% Tahap Update Profil
    rect rgb(255, 250, 245)
    Note over User, DB: 3. Pembaruan Profil
    User->>Client: Mengubah data & simpan
    Client->>Core: PUT /api/v1/profile/me (Header: Bearer Token)
    Core->>Core: Verifikasi Token JWT
    Core->>DB: UPDATE profiles SET ... WHERE user_id = :id
    DB-->>Core: Sukses Update
    Core-->>Client: 200 OK {updated profile data}
    end
```

---

### 3.5 Extension — Internal Components

```mermaid
flowchart TB
    subgraph ManifestConfig["📄 Extension Configuration"]
        Manifest["<b>manifest.json (Manifest V3)</b><br/>• Permissions: sidePanel, activeTab, scripting, storage, tabs, contextMenus<br/>• Host Permissions: localhost:8000, localhost:5173<br/>• Matches: &lt;all_urls&gt;"]
    end

    subgraph BGWorker["⚙️ Background Service Worker (background.js — 14 KB)"]
        BG_Ctx["<b>setupContextMenus()</b><br/>Klik kanan: toggle mode, buka panel, pintasan dashboard"]
        BG_Act["<b>updateActionBehavior()</b><br/>Update ikon toolbar & badge status"]
        BG_Hub["<b>Message Relay Hub</b><br/>Perantara komunikasi Side Panel & Content Script"]
        BG_Storage["<b>chrome.storage.local</b><br/>Penyimpanan Token JWT & preferensi mode pengguna"]
    end

    subgraph ContentEngine["📄 Content Script Engine (content_script.js — 42 KB)"]
        CS_Detect["🔍 <b>Field Detection Engine</b><br/>• Scan input, select, textarea<br/>• Evaluasi 6 sinyal atribut<br/>• Scoring multi-level 150+ keyword"]
        CS_Fill["⚡ <b>Autofill Engine</b><br/>• Injeksi nilai profil ke DOM value<br/>• Trigger event input, change, blur (kompatibel React/Vue)<br/>• Support text, email, select, date, tel"]
        CS_Listener["👂 <b>Message Listener</b><br/>Merespon sinyal: DETECT_FIELDS & EXECUTE_AUTOFILL"]
    end

    subgraph SidePanelUI["📱 Side Panel UI (sidepanel.html + sidepanel.js — 34 KB)"]
        SP_Login["🔐 <b>Layar Login</b><br/>Otentikasi & simpan JWT ke storage"]
        SP_Preview["📋 <b>Layar Preview Field</b><br/>Fresh fetch profil dari API & render checkbox interaktif"]
        SP_Exec["🚀 <b>Layar Eksekusi</b><br/>Kirim perintah isi form terpilih & log aktivitas ke backend"]
    end

    subgraph PopupUI["🪟 Popup Mini (popup.html + popup.js — 12 KB)"]
        Popup["Status login ringkas & tautan langsung ke dashboard web"]
    end

    ManifestConfig -.-> BGWorker
    ManifestConfig -.-> ContentEngine
    ManifestConfig -.-> SidePanelUI
    ManifestConfig -.-> PopupUI

    SP_Preview <-->|chrome.runtime.sendMessage| BG_Hub
    BG_Hub <-->|chrome.tabs.sendMessage| CS_Listener
    CS_Listener --> CS_Detect
    CS_Listener --> CS_Fill
```

---

### 3.6 Extension — Message Passing Flow

Side panel tidak memiliki akses langsung ke DOM tab target, sehingga seluruh perintah diteruskan melalui Background Service Worker:

```mermaid
sequenceDiagram
    autonumber
    participant SP as 📱 Side Panel
    participant BG as ⚙️ Background SW
    participant CS as 📄 Content Script
    participant API as ⚡ FastAPI Backend

    Note over SP, CS: Fase 1: Deteksi Field pada Halaman Aktif
    SP->>BG: chrome.runtime.sendMessage({type: "DETECT_FIELDS"})
    BG->>CS: chrome.tabs.sendMessage(activeTabId, {type: "DETECT_FIELDS"})
    CS->>CS: Scan elemen form & hitung skor keyword
    CS-->>BG: Return daftar field [{field, profileKey, elementId, ...}]
    BG-->>SP: Forward daftar field terdeteksi
    SP->>SP: Render daftar field dengan checkbox pilihan

    Note over SP, API: Fase 2: Eksekusi Pengisian & Pencatatan Log
    SP->>BG: chrome.runtime.sendMessage({type: "EXECUTE_AUTOFILL", profile, selectedIndices})
    BG->>CS: chrome.tabs.sendMessage(activeTabId, {type: "EXECUTE_AUTOFILL", profile, selectedIndices})
    CS->>CS: Isi elemen & trigger event input/change
    CS-->>BG: Return hasil pengisian {filledCount, totalDetected}
    BG-->>SP: Forward respon eksekusi
    SP->>API: POST /api/v1/activities (Direct API Call, tanpa relay)
    API-->>SP: 200 OK (Log aktivitas tersimpan di MySQL)
```

---

### 3.7 Data Sync: Dashboard ⟷ Extension

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 Pengguna
    participant Web as 💻 Web Dashboard
    participant API as ⚡ FastAPI Backend
    participant DB as 🗄️ MySQL Database
    participant Ext as 📱 Extension Side Panel

    rect rgb(240, 248, 255)
    Note over User, DB: Pengguna Memperbarui Data di Web Dashboard
    User->>Web: Mengubah data profil (misal: Alamat Domisili baru)
    Web->>API: PUT /api/v1/profile/me (Header: Bearer Token)
    API->>DB: UPDATE profiles SET address = '...' WHERE user_id = :id
    DB-->>API: Konfirmasi update
    API-->>Web: 200 OK {updated profile}
    Web->>User: Tampilkan feedback sukses tersimpan
    end

    rect rgb(245, 255, 250)
    Note over User, Ext: Pengguna Menggunakan Extension pada Formulir Layanan
    User->>Ext: Membuka Side Panel GovConnect
    Ext->>API: GET /api/v1/profile/me (Fresh API Fetch)
    API->>DB: SELECT * FROM profiles WHERE user_id = :id
    DB-->>API: Data profil terkini
    API-->>Ext: 200 OK {fresh profile data}
    Ext->>Ext: Render daftar nilai profil dengan DATA TERBARU
    Ext->>User: Siap melakukan autofill dengan akurasi 100%
    end
```

> [!TIP]
> **Fresh Fetch Architecture**: Extension selalu melakukan *fresh fetch* dari API setiap kali panel dibuka. Hal ini mengeliminasi *stale cache*, sehingga pembaruan profil di dashboard web langsung tersedia di extension seketika.

---

### 3.8 Smart Field Detection Algorithm

```mermaid
flowchart TD
    Start(["Input: Elemen Form HTML<br/>(&lt;input&gt;, &lt;select&gt;, &lt;textarea&gt;)"]) --> Step1

    subgraph Step1_Box["1. Pengumpulan Sinyal Kontekstual"]
        Step1["Ekstraksi atribut dan teks elemen:<br/>• el.name & el.id<br/>• el.placeholder<br/>• autocomplete & aria-label<br/>• &lt;label for='...'&gt; teks terkait<br/>• Teks elemen induk (parent container)"]
    end

    Step1 --> Step2

    subgraph Step2_Box["2. Pembersihan & Normalisasi Teks"]
        Step2["Normalisasi String:<br/>• .toLowerCase()<br/>• .replace(/[-_]/g, ' ')<br/>• .trim()<br/>• Tokenisasi per kata"]
    end

    Step2 --> Step3

    subgraph Step3_Box["3. Evaluasi & Pembobotan Skor Multi-Level"]
        Step3["Iterasi 150+ Pola Kata Kunci:<br/><br/><b>Keyword Pendek (<= 4 Karakter):</b><br/>• Contoh: 'wa', 'hp', 'nim', 'zip', 'nik'<br/>• WAJIB exact token match (mencegah 'alamat' memicu 'wa')<br/><br/><b>Keyword Panjang (> 4 Karakter):</b><br/>• Substring matching (.includes)<br/>• Kata kunci spesifik = Skor +3<br/>• Kata kunci umum = Skor +1"]
    end

    Step3 --> Step4

    subgraph Step4_Box["4. Seleksi Key Profil Pemenang"]
        Step4{"Apakah skor tertinggi melebihi batas minimum?"}
        Step4 -- "Ya (Match Ditemukan)" --> MatchFound["Kaitkan dengan Profile Key Terbaik<br/>(Contoh: Label 'No. HP / WA' -> key: phone)"]
        Step4 -- "Tidak (Di bawah threshold)" --> Unmatched["Tandai sebagai Field Tidak Dikenali / Skip"]
    end

    MatchFound --> Finish(["Output: Pemetaan Field Siap Diisi"])
    Unmatched --> Finish
```

---

### 3.9 Frontend — Struktur Arsitektur

```mermaid
flowchart TD
    subgraph AppRoot["React 18 + TypeScript + Vite (`frontend/src/`)"]
        Main["<b>main.tsx</b><br/>Entry Point Aplikasi"] --> App["<b>App.tsx</b><br/>Router, Layout Wrapper & Route Guards"]
        
        App --> Context["📂 context/<br/><b>AuthContext.tsx</b><br/>• State global auth: user, token, status<br/>• Method: login(), logout(), refreshUser()"]
        
        App --> Services["📂 services/<br/><b>api.ts</b> (Axios Client :8000)<br/>• Interceptor: Inject Bearer JWT otomatis<br/>• authApi, profileApi, activityApi"]
        
        App --> Components["📂 components/<br/><b>Layout.tsx</b> (Navbar, Sidebar, Navigasi Utama)"]
        
        App --> Pages["📂 pages/ (Modul Halaman)"]
        
        subgraph PageList["Daftar Modul Halaman"]
            P_Login["<b>Login.tsx</b><br/>Form login pengguna & penyimpanan JWT"]
            P_Register["<b>Register.tsx</b><br/>Registrasi akun baru"]
            P_Dashboard["<b>Dashboard.tsx</b><br/>Statistik ringkas, grafik 7 hari, analitik"]
            P_Profile["<b>Profile.tsx</b><br/>Manajemen 29+ field data profil kependudukan"]
            P_Activity["<b>Activity.tsx</b><br/>Riwayat penggunaan autofill"]
            P_Settings["<b>Settings.tsx</b><br/>Preferensi & konfigurasi pengguna"]
        end
        
        Pages --> PageList
        PageList -.-> Context
        PageList -.-> Services
    end
```

---

## 4. Progress Frontend (Web Dashboard)

**Stack**: React 18 • TypeScript • Vite • Tailwind CSS • Axios • Lucide Icons

| Halaman | Fitur Utama | Status |
|---|---|---|
| **Login** | Form login, validasi dasar, JWT save ke localStorage, redirect dashboard | ✅ Selesai |
| **Register** | Form registrasi, error handling responsif, redirect ke login | ✅ Selesai |
| **Dashboard** | KPI cards, tren aktivitas 7 hari, website terbanyak, most-used fields | ✅ Selesai |
| **Profile** | 29+ field profil, 7 kategori, custom fields, document photos | 🟡 Perlu Refactor (Monolith) |
| **Activity** | Daftar riwayat aktivitas autofill beserta status eksekusi | 🟡 Sebagian (Belum filter/pagination) |
| **Settings** | UI preferensi tampilan dan keamanan | ⏳ Belum Terhubung API |

---

## 5. Progress Backend (FastAPI)

**Stack**: FastAPI • SQLAlchemy • PyMySQL • Uvicorn • Pydantic • Bcrypt • PyJWT

| Endpoint | Method | Fungsi | Status |
|---|---|---|---|
| `/api/v1/auth/register` | POST | Registrasi pengguna baru dengan email & password | ✅ Selesai |
| `/api/v1/auth/login` | POST | Otentikasi & pembuatan JWT access token | ✅ Selesai |
| `/api/v1/auth/me` | GET | Mendapatkan data profil pengguna yang sedang login | ✅ Selesai |
| `/api/v1/profile/me` | GET | Mengambil profil lengkap 29+ field kependudukan | ✅ Selesai |
| `/api/v1/profile/me` | PUT | Memperbarui informasi profil pengguna | ✅ Selesai |
| `/api/v1/mappings` | GET / POST / DELETE | Manajemen mapping custom per-domain website | 🟡 Sebagian |
| `/api/v1/activities` | GET / POST | Pencatatan dan pembacaan log autofill | ✅ Selesai |
| `/api/v1/activities/stats` | GET | Statistik ringkas total pengisian & efisiensi | ✅ Selesai |
| `/api/v1/activities/analytics` | GET | Analitik tren harian dan distribusi domain | 🟡 Sebagian |

---

## 6. Progress Browser Extension

**Stack**: Chrome Manifest V3 • Vanilla JavaScript • Chrome APIs (sidePanel, storage, scripting)

| Fitur | Deskripsi | Status |
|---|---|---|
| Background Service Worker | Context menu, toggle mode, dan message relay hub | ✅ Selesai |
| Smart Field Detection Engine | 150+ keyword pattern matching dengan multi-level scoring | 🟡 Sebagian (Perlu optimasi SPA) |
| Side Panel Interaktif | Layar login, preview field interaktif, dan tombol eksekusi | ✅ Selesai |
| Checkbox Select / Deselect | Memilih atau mengecualikan field tertentu sebelum autofill | ✅ Selesai (Fixed) |
| Mode 1-Klik Instan | Autofill otomatis langsung dari klik ikon ekstensi | 🟡 Sebagian |
| Activity Logging Otomatis | Mengirim ringkasan pengisian ke backend secara otomatis | ✅ Selesai |
| SPA Support (MutationObserver) | Deteksi dinamis form pada aplikasi React/Vue/Angular | 📅 Terencana (Minggu 8) |
| Token Refresh & Expiry Notice | Penanganan masa berlaku token JWT secara otomatis | 📅 Terencana (Minggu 10) |

---

## 7. Bug Report

### 7.1 Fixed (Sesi Ini)

| ID Bug | Tingkat Urgensi | Masalah | Solusi Teknis | Status |
|---|---|---|---|---|
| **BUG-001** | 🔴 Kritis | Field Alamat salah terisi dengan nomor HP | Penerapan `SHORT_KEYWORDS` + exact token matching | ✅ Selesai |
| **BUG-002** | 🔴 Kritis | Data update di dashboard tidak sinkron ke extension | Fresh API fetch setiap panel dibuka + koreksi key mapping | ✅ Selesai |
| **BUG-003** | 🟡 Medium | Checkbox deselect di preview tidak berfungsi | Binding event listener langsung per elemen checkbox | ✅ Selesai |

### 7.2 Open Bugs (Backlog)

| ID Bug | Tingkat Urgensi | Masalah | Rencana Solusi | Status |
|---|---|---|---|---|
| **BUG-004** | 🟡 Medium | Race condition deteksi field pada Single Page Application (SPA) | Implementasi MutationObserver pada content script (Minggu 8) | ⏳ Open |
| **BUG-005** | 🟡 Medium | Extension diam tanpa notifikasi saat token JWT kedaluwarsa | Implementasi refresh token atau redirect login notice (Minggu 10) | ⏳ Open |
| **BUG-006** | 🟢 Low | Persentase kelengkapan profil pada custom fields belum presisi | Normalisasi validasi JSON parsing pada backend | ⏳ Open |
| **BUG-007** | 🟢 Low | Konfigurasi CORS `allow_origins=["*"]` belum aman untuk production | Pembatasan origin hanya ke dashboard dan ekstensi resmi | ⏳ Open |

---

## 8. Rencana Pengembangan (Timeline 16 Minggu)

| Fase | Minggu | Fokus Utama & Milestone | Status |
|---|---|---|---|
| **Fase 1: Konseptual** | 1 | Identifikasi masalah, riset formulir layanan publik Indonesia | ✅ Selesai |
| | 2 | Perancangan arsitektur sistem, ERD database, wireframe UI/UX | ✅ Selesai |
| | 3 | Finalisasi konsep ke dosen pengampu, penyusunan PRD, inisialisasi repositori | ✅ Selesai |
| **Fase 2: Fondasi Sistem** | 4 *(saat ini)* | Integrasi Backend + DB + Auth + Extension dasar + Dashboard UI + Bugfix | 🔄 In Progress |
| | 5 | Peningkatan deteksi field lanjutan, penyempurnaan interaksi side panel | 📅 Terencana |
| | 6 | Refaktorisasi monolith Profile.tsx, perbaikan kalkulasi analitik, testing awal | 📅 Terencana |
| **Fase 3: Optimasi & Kecerdasan** | 7 | Smart mapping engine lanjutan, penyimpanan mapping otomatis per-domain | 📅 Terencana |
| | 8 | Dukungan penuh Single Page Application (SPA) dengan MutationObserver | 📅 Terencana |
| | 9 | Dashboard analitik v2: filter rentang tanggal dan export rekap (CSV) | 📅 Terencana |
| **Fase 4: Keamanan & Stabilitas** | 10 | Mekanisme token refresh, session management, pemindahan kredensial ke `.env` | 📅 Terencana |
| | 11 | Global error handling, retry logic network request, offline fallback | 📅 Terencana |
| **Fase 5: Pengalaman Pengguna (UX)** | 12 | Onboarding tour interaktif, tooltip bantuan panduan pengisian | 📅 Terencana |
| | 13 | Aksesibilitas: dukungan navigasi keyboard, standarisasi ARIA, kepatuhan WCAG 2.1 | 📅 Terencana |
| **Fase 6: Pengujian & Dokumentasi** | 14 | Automated testing (pytest untuk backend, unit test frontend), User Acceptance Test | 📅 Terencana |
| | 15 | Dokumentasi teknis komprehensif, panduan instalasi, perekaman video demonstrasi | 📅 Terencana |
| **Fase 7: Finalisasi & Rilis** | 16 | Code freeze, persiapan presentasi tugas akhir framework, evaluasi dosen | 📅 Terencana |

---

## 9. Metrik Proyek

| Kategori | Detail Metrik |
|---|---|
| **Progress Waktu** | Minggu 4 dari 16 → **25% timeline berjalan** |
| **Progress Rata-rata Fitur** | ~**43%** dari total target PRD |
| **Backend Codebase** | ~500 baris Python terstruktur (4 file modul) |
| **Frontend Codebase** | ~150.000+ karakter TypeScript/TSX (6 halaman modul) |
| **Extension Codebase** | ~90.000+ karakter JavaScript modern (5 komponen) |
| **Database Structure** | 4 tabel inti relasional (users, profiles, mappings, activities) |
| **API Endpoints** | 11 endpoint REST aktif |
| **Field Profil Standar** | 29 field data kependudukan + dukungan custom fields (JSON) |
| **Kamus Deteksi Form** | 150+ pola kata kunci dengan scoring adaptif |
| **Masa Berlaku Sesi (JWT)** | 7 hari |
| **Fitur Selesai Penuh (100%)** | Autentikasi Backend (Register, Login, JWT verification) |
| **Fitur Prioritas Berikutnya** | Token refresh, migrasi `.env`, optimasi SPA MutationObserver |
| **Status Bug** | 3 Bug Fixed (sesi ini), 4 Bug Open (dalam backlog terencana) |
| **Test Coverage** | ~0% — pengujian saat ini berfokus pada manual smoke testing |

---

> [!NOTE]
> `Profile.tsx` (116 KB) saat ini masih berukuran terlalu besar (monolith). Telah dijadwalkan untuk refaktorisasi menjadi sub-komponen terpisah pada Minggu ke-6.

> [!WARNING]
> Kredensial rahasia (Secret Key JWT dan URL Database) saat ini masih hardcoded di codebase pengembangan. Harus dipindahkan ke variabel lingkungan (`.env`) sebelum tahap deployment.

> [!CAUTION]
> Penanganan masa berlaku token (BUG-005) pada ekstensi harus diprioritaskan pada awal Fase 4 agar tidak mengganggu pengalaman pengguna saat sesi kedaluwarsa.

---

*Dibuat: 16 September 2026 — Minggu ke-4, Semester 3*  
*Tools: Antigravity IDE — Google DeepMind*
