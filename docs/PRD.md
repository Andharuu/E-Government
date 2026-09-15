# Product Requirements Document (PRD)
# GovConnect — Final MVP

| | |
|---|---|
| **Dokumen** | Product Requirements Document (PRD) |
| **Versi** | 3.0 (Final MVP) |
| **Status** | Final MVP |
| **Platform** | Google Chrome Extension + Web Dashboard |
| **Target** | Citizen / Public Service Users |

> **Catatan versi 3.0:** Menggantikan draf sebelumnya. Field mapping bersifat **per-user** (bukan global), NFR keamanan mengikuti versi ringkas (tanpa penambahan enkripsi at-rest/UU PDP/CSRF yang sempat diusulkan), dan target success metrics memakai ambang **≥80%** sesuai kebutuhan MVP yang realistis.

---

## 1. Product Overview

GovConnect adalah aplikasi berbasis **Chrome Extension** yang membantu pengguna mengisi formulir pada website layanan pemerintah secara lebih cepat, menggunakan data pribadi yang telah disimpan dan dikonfigurasi di GovConnect.

GovConnect bekerja sebagai **lapisan integrasi berbasis browser (browser-side integration layer)**. Extension mendeteksi formulir pada halaman website, mengenali field yang tersedia, mencocokkannya dengan data profil pengguna, kemudian mengisi field yang sesuai.

**GovConnect tidak melakukan pengiriman formulir secara otomatis.** Setelah autofill selesai, pengguna tetap melakukan pemeriksaan dan menekan tombol submit pada website pemerintah secara manual.

**Web Dashboard** digunakan sebagai pusat pengelolaan akun, data profil, konfigurasi mapping, serta riwayat dan statistik penggunaan.

---

## 2. Problem Statement

Pengguna sering harus mengisi data yang sama berulang kali ketika mengakses berbagai layanan publik berbasis website — contoh: nama lengkap, NIK, tanggal lahir, alamat, nomor telepon, email, data pendidikan.

**Permasalahan utama:**
- Pengisian formulir membutuhkan waktu.
- Pengguna harus mengetik ulang data yang sama.
- Pengulangan input meningkatkan kemungkinan kesalahan.
- Setiap website dapat menggunakan nama atau struktur field yang berbeda.
- Pengguna membutuhkan cara yang lebih praktis tanpa harus memberikan akses langsung kepada GovConnect terhadap sistem internal pemerintah.

---

## 3. Product Vision

Mempermudah pengisian formulir layanan publik dengan memanfaatkan data pengguna yang tersimpan secara terkontrol, tanpa mengambil alih proses pengajuan layanan.

GovConnect berfokus pada:
- **Speed** — mempercepat pengisian formulir.
- **Accuracy** — mengurangi kesalahan input berulang.
- **Control** — pengguna tetap mengontrol dan memeriksa data.
- **Privacy** — data pribadi tidak dikirim ke sistem pemerintah melalui GovConnect.
- **Simplicity** — arsitektur sederhana dan mudah dikembangkan.

---

## 4. Product Goals

### 4.1 Primary Goals
- Memungkinkan pengguna menyimpan profil pribadi di GovConnect.
- Mendeteksi field formulir pada website.
- Memetakan field website ke data profil pengguna.
- Mengisi field secara otomatis.
- Memberikan pengguna kesempatan untuk memeriksa hasil autofill.
- Mencatat aktivitas penggunaan tanpa menyimpan nilai data pribadi dalam log.
- Menyediakan dashboard untuk mengelola profil dan melihat statistik penggunaan.

### 4.2 Secondary Goals
- Mendukung mapping khusus per pengguna untuk website tertentu.
- Menyediakan pengaturan pengguna (settings dasar).
- Menyediakan statistik penggunaan autofill.
- Menyediakan mekanisme manual override ketika mapping tidak sesuai.

---

## 5. Non-Goals

Fitur berikut **tidak termasuk** dalam MVP:

❌ Government API integration · Dukcapil API · Integrasi database pemerintah
❌ Provider pendidikan · Provider pajak
❌ Evidence Broker · Evidence Request / Evidence Record
❌ Pengambilan data dari sistem pemerintah
❌ Automatic form submission
❌ Bypass CAPTCHA · Bypass OTP
❌ Pengelolaan kredensial akun pemerintah
❌ Payment processing
❌ Akses langsung ke database pemerintah
❌ Microservices · Kubernetes · Kafka · Redis
❌ AI/LLM sebagai komponen wajib MVP

---

## 6. Target Users

### Primary User
Masyarakat yang sering menggunakan website layanan publik dan harus mengisi data pribadi berulang kali.

**Karakteristik:**
- Menggunakan Google Chrome.
- Memiliki data pribadi yang relatif stabil.
- Menggunakan berbagai website layanan publik.
- Menginginkan proses pengisian formulir yang lebih cepat.
- Tetap ingin memiliki kontrol terhadap data yang dikirim.

---

## 7. Core User Journey

```
Chrome Web Store
       ↓
Install Extension
       ↓
Open Extension
       ↓
Login / Create Account
       ↓
Web Dashboard
       ↓
Profile Complete?
   ↙          ↘
 NO             YES
 ↓               ↓
Setup Profile   Dashboard
 ↓               ↓
Save Profile    Ready
       ↘       ↙
     Government Website
            ↓
       Form Detection
            ↓
       Side Panel Open
            ↓
       Field Mapping
            ↓
          Autofill
            ↓
          Review
            ↓
   User Manually Submits
            ↓
       Activity Log
            ↓
       Dashboard Analytics
```

---

## 8. Product Architecture

GovConnect terdiri dari **dua client**, **satu backend**, dan **satu database**.

```
                              USER
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
       Chrome Extension                  Web Dashboard
       ├── Popup                         ├── Authentication
       ├── Side Panel                    ├── Profile
       ├── Content Script                ├── Activity
       ├── Field Detection               ├── Analytics
       ├── Field Mapping                 └── Settings
       └── Autofill
                │                               │
                └──────────────┬────────────────┘
                               │
                         HTTPS / REST
                               │
                               ▼
                         FastAPI API
                               │
                               ▼
                              MySQL


Government Website
        ▲
        │ DOM / Form
        │
Content Script
        │
Chrome Extension
```

**Prinsip arsitektur:**
- Extension berinteraksi langsung dengan DOM website.
- FastAPI menangani data dan layanan GovConnect.
- MySQL menyimpan data aplikasi.
- Dashboard tidak berinteraksi langsung dengan website pemerintah.
- Government website tidak perlu menyediakan API kepada GovConnect.
- Pengguna tetap menjadi pihak yang melakukan submit.

---

## 9. Product Components

### 9.1 Chrome Extension

Komponen: Popup · Side Panel · Content Script · Background Service Worker · Field Detection · Field Mapping · Autofill Engine · Extension Authentication.

**Popup** — entry point dan authentication gateway.

```
┌──────────────────────────────┐
│          GovConnect          │
│                              │
│  Fill forms faster.          │
│  Keep control of your data.  │
│                              │
│       [ Login ]              │
│     [ Create Account ]       │
└──────────────────────────────┘
```

Popup **tidak** digunakan sebagai tempat utama pengelolaan profil.

### 9.2 Side Panel

Side Panel merupakan interface utama ketika pengguna melakukan autofill.

```
GovConnect
Government Service

✓ 6 fields detected

☑ NIK
☑ Nama Lengkap
☑ Tanggal Lahir
☑ Alamat
☑ Email
☐ NISN

[ Fill Selected Fields ]
```

Setelah autofill:

```
Autofill Complete

✓ 5 fields filled
⚠ 1 field skipped

✓ NIK
✓ Nama Lengkap
✓ Tanggal Lahir
✓ Alamat
✓ Email
○ NISN — Not found

Review the form before submitting
```

---

## 10. Web Dashboard

Web Dashboard merupakan pusat pengelolaan data dan aktivitas GovConnect.

**Navigation:** Dashboard · My Profile · Activity · Settings

**Dashboard Overview menyediakan:**
- **KPI:** Total Autofill · Success Rate · Estimated Time Saved · Profile Completion
- **Analytics:** Autofill Activity · Autofill Results · Most Used Fields · Autofill by Website
- **Recent Activity:** menampilkan aktivitas autofill terbaru.

---

## 11. Profile Management

Pengguna melakukan pengaturan data melalui Web Dashboard.

**Identity**
| Field | Required |
|---|---|
| Nama Lengkap | Yes |
| NIK | Yes |
| Tempat Lahir | Optional |
| Tanggal Lahir | Yes |
| Jenis Kelamin | Yes |

**Address**
| Field | Required |
|---|---|
| Alamat Lengkap | Yes |
| Provinsi | Yes |
| Kabupaten/Kota | Yes |
| Kecamatan | Yes |
| Kelurahan/Desa | Yes |
| Kode Pos | Optional |

**Contact**
| Field | Required |
|---|---|
| Nomor Telepon | Optional |
| Email | Optional |

**Education**
| Field | Required |
|---|---|
| NISN | Optional |
| Nama Institusi | Optional |
| Jenjang Pendidikan | Optional |
| Nomor Induk Mahasiswa | Optional |

**Additional**
| Field | Required |
|---|---|
| Pekerjaan | Optional |
| Nama Instansi | Optional |

---

## 12. Profile Setup Flow

```
Register
   ↓
Login
   ↓
Setup Profile
   ↓
Save Profile
   ↓
Connect / Authenticate Extension
   ↓
Dashboard
   ↓
Ready to Autofill
```

*Profile Completion* digunakan untuk menentukan apakah pengguna telah memiliki data minimum yang diperlukan.

---

## 13. Form Detection

Content Script memeriksa elemen formulir pada halaman: `<input>`, `<select>`, `<textarea>`, `<label>`.

Informasi yang dapat digunakan: `name`, `id`, `placeholder`, `label`, `aria-label`, `autocomplete`, `type`.

```html
<label for="citizen_nik">
    Nomor Induk Kependudukan
</label>

<input
    id="citizen_nik"
    name="citizen_nik"
    type="text">
```

Field tersebut dapat dipetakan ke `profile.nik`.

---

## 14. Field Mapping

Field Mapping merupakan proses mencocokkan field website dengan field profil GovConnect. **Mapping bersifat per-user** — setiap pengguna dapat memiliki hasil pemetaan/override tersendiri per website (lihat skema `field_mappings` di §21).

| Website Field | GovConnect Field |
|---|---|
| nik | nik |
| nomor_induk_kependudukan | nik |
| identity_number | nik |
| nama | full_name |
| nama_lengkap | full_name |
| full_name | full_name |
| tanggal_lahir | birth_date |
| birth_date | birth_date |

**MVP Mapping Strategy** (urutan pencocokan):

```
Exact Match
     ↓
Keyword Match
     ↓
Attribute Matching
     ↓
Potential Match
     ↓
Manual Override
```

Semantic/AI-based matching dapat ditambahkan pada fase selanjutnya.

---

## 15. Autofill Flow

```
Government Website
        ↓
Content Script
        ↓
Detect Form
        ↓
Extract Field Attributes
        ↓
Field Mapping
        ↓
Retrieve User Profile
        ↓
Show Mapping to User
        ↓
User Selects Fields
        ↓
Autofill
        ↓
Display Result
        ↓
User Review
        ↓
Manual Submit
```

GovConnect tidak melakukan submit otomatis.

---

## 16. Manual Override

Jika mapping tidak sesuai, pengguna dapat mengubah atau melewati field tertentu.

**Status field:** ✓ Matched · ✓ Filled · ⚠ Potential Match · ○ Not Found · ○ Skipped

**Pengguna dapat:**
- memilih field yang ingin diisi;
- membatalkan field tertentu;
- melakukan mapping manual (tersimpan sebagai override per-user, §14);
- mengoreksi data pada website sebelum submit.

---

## 17. Unsupported Website

Jika form tidak dapat dikenali:

```
GovConnect

Website belum didukung

GovConnect belum dapat mengenali
form pada website ini.
```

Extension tidak memaksakan autofill jika struktur form tidak dapat dikenali dengan cukup baik.

---

## 18. Activity Logging

Setiap aktivitas autofill dapat dicatat untuk kebutuhan histori dan analytics.

**Data yang dicatat:** `user_id`, `website_domain`, `action`, `fields_detected`, `fields_filled`, `status`, `created_at`

Contoh:
```
website_domain: layanan.example.go.id
action: autofill
fields_detected: 6
fields_filled: 5
status: partial
```

**Nilai aktual data pribadi tidak disimpan dalam activity log.**

Contoh yang **tidak boleh** disimpan (ilustrasi, data fiktif):
```
NIK = 1234567890123456
Nama = Budi Santoso
```

---

## 19. Activity Status

Aktivitas dapat memiliki status: `success` · `partial` · `failed`

| Status | Definisi |
|---|---|
| **Success** | Semua field yang dapat dipetakan berhasil diisi. |
| **Partial** | Sebagian field berhasil diisi, tetapi terdapat field yang tidak ditemukan atau tidak dapat dipetakan. |
| **Failed** | Autofill tidak berhasil dilakukan. |

---

## 20. Dashboard Analytics

Analytics dihitung dari `activity_logs`. **Tidak diperlukan database analytics terpisah untuk MVP.**

**Data yang dapat dihitung:**
- Total Autofill
- Success Rate
- Failed Autofill / Partial Autofill
- Activity per Day
- Activity per Website
- Most Used Fields

Contoh agregasi: `COUNT(autofill)`, `COUNT(success)`, `COUNT(failed)`, `GROUP BY date`, `GROUP BY website`, `GROUP BY field`.

**Estimated Time Saved** — merupakan **estimasi**, bukan pengukuran aktual.

Contoh asumsi: Manual input = 3 menit, Autofill = 30 detik → Estimated saving = 2,5 menit.

Dashboard harus menampilkan metrik ini secara eksplisit sebagai estimasi (bukan data terukur presisi).

---

## 21. Database

Database MVP terdiri dari empat tabel utama: `users` · `profiles` · `field_mappings` · `activity_logs`

### `users`
`id` · `email` · `password_hash` · `created_at` · `updated_at`

### `profiles`
`id` · `user_id` · `full_name` · `nik` · `birth_place` · `birth_date` · `gender` · `address` · `province` · `city` · `district` · `village` · `postal_code` · `phone` · `email` · `nisn` · `institution` · `education_level` · `student_id` · `occupation` · `organization` · `created_at` · `updated_at`

### `field_mappings` *(per-user)*
`id` · `user_id` · `website_domain` · `website_field` · `govconnect_field` · `created_at` · `updated_at`

### `activity_logs`
`id` · `user_id` · `website_domain` · `action` · `fields_detected` · `fields_filled` · `status` · `created_at`

---

## 22. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | User dapat membuat akun |
| FR-02 | User dapat login/logout |
| FR-03 | User dapat mengelola profile |
| FR-04 | Extension dapat melakukan authentication |
| FR-05 | Extension dapat mendeteksi form |
| FR-06 | Extension dapat mendeteksi field |
| FR-07 | Extension dapat melakukan field mapping (per-user) |
| FR-08 | Extension dapat melakukan autofill |
| FR-09 | User dapat memilih field yang akan diisi |
| FR-10 | User dapat melakukan manual override |
| FR-11 | Sistem mencatat aktivitas autofill |
| FR-12 | Dashboard menampilkan history dan analytics |
| FR-13 | Sistem tidak melakukan automatic submission |

---

## 23. Non-Functional Requirements

**Security**
- Password harus disimpan dalam bentuk hash.
- Komunikasi API menggunakan HTTPS.
- Endpoint membutuhkan authentication sesuai kebutuhan.
- Authorization diterapkan berdasarkan user.
- Data pengguna tidak boleh dapat diakses oleh user lain.
- Activity log tidak menyimpan nilai personal data.
- Extension menggunakan prinsip *least privilege*.
- Tidak meminta akses terhadap file system atau sistem operasi pengguna yang tidak diperlukan.

**Privacy**
- GovConnect hanya menggunakan data yang diperlukan.
- Data tidak dikirim ke website pemerintah melalui backend GovConnect.
- Extension mengisi data langsung ke DOM website.
- User tetap mengontrol proses submit.
- GovConnect tidak menyimpan kredensial akun pemerintah.

**Performance** (target MVP)
- Form detection terasa responsif.
- Autofill dilakukan tanpa delay yang mengganggu.
- Dashboard dapat memuat data aktivitas secara efisien.

**Reliability**
- Kegagalan mapping tidak boleh menyebabkan halaman website rusak.
- Field yang tidak dikenali harus dilewati.
- Autofill tidak boleh mengubah field secara diam-diam tanpa mekanisme review pengguna.

---

## 24. Security Boundary

```
┌─────────────────────────────────────────────┐
│              GOVCONNECT BACKEND             │
│                                             │
│ Users / Profiles / Mapping / Activity      │
└──────────────────────┬──────────────────────┘
                       │
                    HTTPS
                       │
┌──────────────────────▼──────────────────────┐
│              CHROME EXTENSION               │
│                                             │
│ Popup / Side Panel / Content Script         │
└──────────────────────┬──────────────────────┘
                       │
                    DOM Only
                       │
┌──────────────────────▼──────────────────────┐
│            GOVERNMENT WEBSITE               │
│                                             │
│ Original Website Form                       │
└─────────────────────────────────────────────┘
```

GovConnect tidak memiliki akses ke database internal pemerintah.

---

## 25. Chrome Extension Permissions

Extension hanya meminta permission yang diperlukan untuk fungsi utamanya (*least privilege*):
- Tidak meminta akses sistem operasi.
- Tidak membaca password manager.
- Tidak membaca browser credential.
- Tidak mengakses file pribadi pengguna tanpa kebutuhan.
- Tidak mengakses halaman yang tidak diperlukan.

---

## 26. Technology Stack

| Layer | Stack |
|---|---|
| Chrome Extension | React · TypeScript · Vite · Tailwind CSS · Chrome Extension Manifest V3 · Chrome APIs · Content Script · Background Service Worker · Side Panel |
| Web Dashboard | React · TypeScript · Vite · Tailwind CSS · **Recharts** |
| Backend | Python · FastAPI · Pydantic · JWT Authentication |
| Database | MySQL 8 · InnoDB · utf8mb4 |
| Infrastructure | Docker · Docker Compose · Nginx |
| Development | Git · GitHub · VS Code / Antigravity |

---

## 27. MVP Scope

**Must Have — Extension:** Login/logout · Popup · Side Panel · Content Script · Form detection · Field detection · Field mapping (per-user) · Autofill · User review · Manual override · Autofill status · Unsupported website state.

**Must Have — Dashboard:** Register · Login · Profile setup · Profile edit · Activity history · Dashboard KPI · Analytics · Settings dasar.

**Must Have — Backend:** Authentication API · Profile API · Mapping API · Activity API.

**Must Have — Database:** Users · Profiles · Field mappings (per-user) · Activity logs.

---

## 28. Future Development

Fitur berikut dapat dipertimbangkan setelah MVP stabil:

```
Semantic Field Recognition
        ↓
AI-assisted Mapping
        ↓
Website-specific Mapping
        ↓
User-defined Mapping (perluasan dari per-user mapping MVP)
        ↓
Multiple Profiles
        ↓
Profile Import / Export
        ↓
Browser Sync
        ↓
Multi-browser Support
```

AI **bukan** bagian wajib dari arsitektur MVP. Sistem awal harus dapat bekerja menggunakan rule-based matching.

---

## 29. Success Metrics

| Metric | Target MVP |
|---|---|
| Successful Autofill | ≥ 80% |
| Field Recognition Accuracy | ≥ 80% |
| Profile Completion | ≥ 90% |
| Activity Logging | 100% |
| Analytics Consistency | 100% |
| SUS Score | ≥ 68 |

**Definisi:**
- **Successful Autofill** — persentase proses autofill yang berhasil mengisi field yang sesuai.
- **Field Recognition Accuracy** — persentase field website yang berhasil dikenali dan dipetakan dengan benar.
- **Profile Completion** — persentase pengguna yang menyelesaikan field profil minimum.
- **SUS** — System Usability Scale untuk mengukur usability aplikasi.

---

## 30. Acceptance Criteria

GovConnect dianggap memenuhi MVP apabila:

1. User dapat membuat akun dan login.
2. User dapat menyimpan profile.
3. Extension dapat terhubung dengan akun pengguna.
4. Extension dapat mendeteksi form pada website.
5. Extension dapat mengenali field yang relevan.
6. Field dapat dipetakan ke data profile (per-user).
7. User dapat memilih field untuk autofill.
8. Data berhasil dimasukkan ke field website.
9. User dapat memeriksa hasil autofill.
10. User tetap melakukan submit secara manual.
11. Aktivitas tercatat setelah proses autofill.
12. Activity log tidak menyimpan nilai personal data.
13. Dashboard dapat menampilkan histori aktivitas.
14. Dashboard dapat menampilkan KPI dan analytics.
15. Website yang tidak dikenali tidak dipaksakan untuk autofill.

---

## 31. UX Principles

1. **User in Control** — pengguna selalu memiliki keputusan akhir terhadap data yang diisi dan dikirim.
2. **No Silent Action** — tidak ada pengisian atau pengiriman data secara diam-diam tanpa indikasi yang jelas.
3. **Review Before Submit** — autofill bukan berarti automatic submission.
4. **Minimal Complexity** — interface dibuat sederhana dan fokus pada tugas utama.
5. **Clear Feedback** — setiap proses harus memiliki status yang jelas: Detected · Matched · Filled · Skipped · Failed.
6. **Privacy by Design** — data pribadi hanya digunakan ketika diperlukan dan tidak dicampurkan ke activity log.

---

## 32. Final Product Definition

GovConnect adalah Chrome Extension yang membantu pengguna mengisi formulir pada website layanan pemerintah menggunakan data profil yang telah disimpan di GovConnect. Extension mendeteksi field pada halaman, melakukan mapping terhadap data pengguna (per-user), dan mengisi field yang sesuai. Pengguna tetap melakukan review dan submit secara manual. Web Dashboard digunakan untuk mengelola profil, konfigurasi, aktivitas, dan analytics.

**Arsitektur final:**

```
                         USER
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
     Chrome Extension            Web Dashboard
     ├── Popup                   ├── Authentication
     ├── Side Panel              ├── Profile
     ├── Content Script           ├── Activity
     ├── Field Detection          ├── Analytics
     ├── Field Mapping            └── Settings
     └── Autofill
              │                         │
              └────────────┬────────────┘
                           │
                      HTTPS / REST
                           │
                           ▼
                       FastAPI
                           │
                           ▼
                         MySQL


Government Website
        ▲
        │
        │ DOM
        │
Content Script
        │
        ▼
Chrome Extension
        │
        ▼
     Autofill
        │
        ▼
   User Review
        │
        ▼
Manual Submission
```

---

## Ringkasan Revisi dari v2.1 → v3.0 (Final MVP)

| Aspek | v2.1 | v3.0 (Final MVP — dokumen ini) |
|---|---|---|
| Field Mapping | Global/built-in | **Per-user** (`field_mappings.user_id`) |
| Privasi/UU PDP, hapus akun, enkripsi at-rest, rate-limit login, refresh token, CSRF | Ditambahkan | **Di-drop** — mengikuti NFR versi ringkas |
| Success Metrics | ≥90% + metrik tambahan (Crash Rate, API Availability, dll.) | **≥80%** (Successful Autofill, Field Recognition Accuracy) + metrik baru (Profile Completion, Activity Logging, Analytics Consistency) |
| Dashboard | Activity history sederhana | **Dashboard KPI & Analytics** (Recharts) |
| Extension Entry Point | Hanya Side Panel | **Popup** (auth gateway) + Side Panel (workspace autofill) |

> Dokumen berikutnya dalam urutan dokumentasi: **User Flow**, kemudian **System Architecture** — menjaga alur: apa produknya → bagaimana user menggunakannya → bagaimana sistem dibangun → bagaimana datanya disimpan → bagaimana API bekerja → bagaimana tampilannya → bagaimana implementasinya.