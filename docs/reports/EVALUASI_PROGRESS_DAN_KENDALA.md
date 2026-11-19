# 📊 EVALUASI PROGRESS, ANALISIS KENDALA & KESIAPAN SISTEM GOVCONNECT
**Mata Kuliah:** Workshop Pemrograman Framework (Semester 3)  
**Platform:** GovConnect E-Government Autofill Platform  
**Penyusun:** Tim Pengembang GovConnect  
**Tanggal Evaluasi:** 19 November 2026  
**Status Sistem:** *Fully Functional, Hardened & Ready for Usability Testing*  

---

## 📑 DAFTAR ISI
1. [Ringkasan Eksekutif (Executive Summary)](#1-ringkasan-eksekutif-executive-summary)
2. [Matriks Status Capaian & Metrik Kuantitatif](#2-matriks-status-capaian--metrik-kuantitatif)
3. [Evaluasi Progress Arsitektur Sistem (Per-Layer)](#3-evaluasi-progress-arsitektur-sistem-per-layer)
   - [A. Lapisan Ekstensi Browser (Chrome Extension MV3)](#a-lapisan-ekstensi-browser-chrome-extension-mv3)
   - [B. Lapisan Backend API Engine (FastAPI & SQLAlchemy)](#b-lapisan-backend-api-engine-fastapi--sqlalchemy)
   - [C. Lapisan Frontend Dashboard (React 19, TypeScript, Tailwind)](#c-lapisan-frontend-dashboard-react-19-typescript-tailwind)
   - [D. Modul Onboarding Tour Interaktif (UX Walkthrough)](#d-modul-onboarding-tour-interaktif-ux-walkthrough)
4. [Analisis Kendala Teknis & Remediasi (Challenges & Problem Solving)](#4-analisis-kendala-teknis--remediasi-challenges--problem-solving)
   - [Kendala 1: Bug Viewport Tooltip Terpotong & Solusi Coordinate Clamping](#kendala-1-bug-viewport-tooltip-terpotong--solusi-coordinate-clamping)
   - [Kendala 2: Celah Password Injection & Kebocoran PII pada Ekstensi (SEC-01)](#kendala-2-celah-password-injection--kebocoran-pii-pada-ekstensi-sec-01)
   - [Kendala 3: Regresi Modul Pasca Modifikasi Model AI Eksternal](#kendala-3-regresi-modul-pasca-modifikasi-model-ai-eksternal)
   - [Kendala 4: Bypass Rate Limiter & Mitigasi Validasi JWT (SEC-02)](#kendala-4-bypass-rate-limiter--mitigasi-validasi-jwt-sec-02)
   - [Kendala 5: Bcrypt DoS vs Boundary Hashing Password (SEC-07)](#kendala-5-bcrypt-dos-vs-boundary-hashing-password-sec-07)
   - [Kendala 6: Kerentanan RCE Vite Windows & Sanitasi Dependensi (SEC-06)](#kendala-6-kerentanan-rce-vite-windows--sanitasi-dependensi-sec-06)
5. [Analisis SWOT Proyek (Strengths, Weaknesses, Opportunities, Threats)](#5-analisis-swot-proyek-strengths-weaknesses-opportunities-threats)
6. [Kesiapan Uji Kegunaan (System Usability Scale / SUS Testing Readiness)](#6-kesiapan-uji-kegunaan-system-usability-scale--sus-testing-readiness)
7. [Rencana Kerja Selanjutnya (Action Items & Roadmap)](#7-rencana-kerja-selanjutnya-action-items--roadmap)

---

## 1. Ringkasan Eksekutif (Executive Summary)

Sistem **GovConnect** dikembangkan sebagai solusi terpadu untuk otomasi pengisian formulir pelayanan publik pemerintah (seperti portal Dukcapil, Kepolisian/SKCK, DJP Pajak, BPJS, dan SSCASN) berbasis data kependudukan terverifikasi warga. 

Melalui prinsip **Zero-Cloud Egress**, identitas warga tidak pernah diekspos ke pihak ketiga atau disimpan polos di cloud, melainkan dienkripsi secara lokal di sisi basis data menggunakan algoritma **Fernet PBKDF2 (100.000 iterasi)** dan disuntikkan secara aman oleh ekstensi browser langsung ke DOM situs resmi tujuan.

Hingga evaluasi saat ini, proyek telah menyelesaikan:
1. **Fitur Inti:** Pengelolaan data kependudukan berjenjang, template isian formulir dinamis, pencatatan log aktivitas pengisian otomatis, dan otentikasi berbasis JWT & Session Cookie.
2. **Peningkatan UX Onboarding:** Restorasi penuh modul panduan interaktif (*Walkthrough Tour*) sebanyak 21 langkah di 5 modul dengan timing cerdas dan resolusi tuntas atas masalah kotak informasi terpotong (*anti-cutoff clamping*).
3. **Security Hardening Komprehensif:** Audit keamanan 4 fase yang menutup 10 temuan kerentanan (*Critical, High, Medium*), mencakup kebocoran PII pada kolom password, bypass limiter, injeksi XSS, hingga vulnerabilitas dependensi frontend.
4. **Validasi Kualitas (QA):** Kelulusan 100% pada rangkaian pengujian otomatis backend (36 tests di Pytest) dan build frontend tanpa galat kompilasi TypeScript.

---

## 2. Matriks Status Capaian & Metrik Kuantitatif

| Parameter Metrik | Target Awal | Capaian Saat Ini | Status Evaluasi |
| :--- | :--- | :--- | :---: |
| **Kompilasi Frontend (Build)** | Bebas Galat (0 error) | 0 Galat, Waktu: ~850 ms (Vite 8.3.8) | 🟢 **SANGAT BAIK** |
| **Pengujian Unit Backend (Pytest)** | Minimal 25 Test Cases | 36 Test Cases (100% PASS) | 🟢 **MELAMPAUI TARGET** |
| **Audit Kerentanan Dependensi (NPM)** | 0 High Vulnerability | 0 Vulnerability (Bersih Total) | 🟢 **SANGAT BAIK** |
| **Keamanan Input Ekstensi (Password)** | Pengecualian kolom sensitif | Triple-layer exclusion (:not([type=password])) | 🟢 **SELESAI** |
| **Cakupan Onboarding Tour** | 1 Halaman Dasbor | 5 Halaman Lengkap (21 Langkah Interaktif) | 🟢 **MELAMPAUI TARGET** |
| **Resolusi Bug Viewport Tooltip** | Tidak terpotong di layar | Dynamic Bounds Clamping + Scroll Capture | 🟢 **SELESAI** |
| **Kesiapan Uji Usability (SUS)** | Tersedia kuesioner | Skrip Apps Script & Kuesioner SUS Siap | 🟢 **SIAP UJI** |

---

## 3. Evaluasi Progress Arsitektur Sistem (Per-Layer)

### A. Lapisan Ekstensi Browser (Chrome Extension MV3)
* **Status:** 100% Berfungsi Stabil.
* **Komponen:** `content_script.js`, `background.js`, `popup.js`, `sidepanel.js`, `config.js`.
* **Capaian Progres:**
  1. **Algoritma Autofill Multi-Pass:** Mampu mendeteksi elemen input formulir standar (`input`, `select`, `textarea`) serta komponen modern (`p-dropdown`, `mat-select`, `react-select`) dengan 5 tingkatan pencocokan (Autocomplete, Exact Attr, Token Regex, Label Heuristics, dan Semantic Fallback).
  2. **Zero-Cloud Egress Injection:** Seluruh pengisian data berjalan lokal di memori tab aktif pengguna tanpa mengirimkan nilai isian kembali ke server GovConnect saat autofill berlangsung.
  3. **Pembersihan Origin Liar:** Menghapus port dev yang tidak terverifikasi (port 3000), mengunci komunikasi postMessage hanya ke `localhost:5173` dan `4173`.

### B. Lapisan Backend API Engine (FastAPI & SQLAlchemy)
* **Status:** 100% Berfungsi Stabil & Teruji.
* **Komponen:** FastAPI v0.115, SQLAlchemy v2.0, SQLite (Dev) / MySQL (Prod), Uvicorn, SlowAPI.
* **Capaian Progres:**
  1. **Enkripsi Data Sensitif:** Kolom identitas kependudukan terenkripsi menggunakan kunci simetris `PII_ENCRYPTION_KEY` terpisah dari kunci JWT, menjamin kerahasiaan data di level *database rest*.
  2. **Arsitektur Keamanan Lapis Ganda:** Dilengkapi dengan middleware CSRF (wajib header `X-Requested-With`), CORS origin whitelist ketat, security headers (X-Frame-Options: DENY, X-Content-Type-Options: nosniff), dan rate limiting adaptif.
  3. **Logging & Kompatibilitas:** Memasang endpoint kompatibilitas `/mcp` dan `/.well-known` untuk mengeliminasi banjir log galat 404 pada monitoring server.

### C. Lapisan Frontend Dashboard (React 19, TypeScript, Tailwind)
* **Status:** 100% Berfungsi Responsif.
* **Komponen:** React 19, Vite 8.3, React Router DOM v7, Tailwind CSS, Lucide & FontAwesome Icons.
* **Capaian Progres:**
  1. **Antarmuka TailAdmin Dark Modern:** Dashboard analitik terpadu mencakup metrik KPI efisiensi, grafik tren pengisian realtime, distribusi status sukses/parsial, dan pencarian cepat berbasis keyboard shortcut (`Ctrl + K`).
  2. **Proteksi Rute Berjenjang:** `AuthContext` memisahkan hak akses publik, warga (*citizen*), dan administrator secara ketat.

### D. Modul Onboarding Tour Interaktif (UX Walkthrough)
* **Status:** 100% Selesai & Terintegrasi Penuh.
* **Komponen:** `TourContext.tsx`, `TourOverlay.tsx`, `TourSteps.ts`, `tourStorage.ts`, `useTourTarget.ts`.
* **Capaian Progres:**
  1. **Partisi Per-Halaman:** Tur tidak membombardir pengguna di awal, melainkan hanya aktif sesuai halaman yang sedang dibuka (`dashboard`, `profile`, `templates`, `activity`, `settings`).
  2. **Smart Delay:** Otomatis muncul setelah 10 detik di kunjungan pertama halaman Dasbor untuk memberi waktu pengguna mengamati tampilan.
  3. **Kontrol Pengguna Lengkap:** Tombol reset tur tersedia di Pengaturan, serta tombol "Panduan Tur" tersemat di Sidebar dan Quick Search.

---

## 4. Analisis Kendala Teknis & Remediasi (Challenges & Problem Solving)

Dalam proses pengembangan dan audit komprehensif, tim berhasil mengidentifikasi dan menyelesaikan 6 kendala teknis kritis:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                    KENDALA KRITIS & SOLUSI TEKNIS                         │
├────────────────────────────────────────────────────────────────────────────┤
│  1. Tooltip Terpotong Layar  ──► Viewport Bounding Clamping + Scroll-Capt  │
│  2. Password Injection       ──► Triple-Defense Guard (:not([type=pass]))  │
│  3. Regresi Model AI Hermes  ──► Rekonstruksi Total Modul Tour & Cleanup   │
│  4. Rate Limit Bypass        ──► Verifikasi Kriptografi Token JWT          │
│  5. Bcrypt Memory DoS        ──► Pembatasan Skema Pydantic max_length=128 │
│  6. Kerentanan Paket Vite    ──► Audit Supply Chain & Pembaruan v8.3.8     │
└────────────────────────────────────────────────────────────────────────────┘
```

### Kendala 1: Bug Viewport Tooltip Terpotong & Solusi Coordinate Clamping
* **Deskripsi Kendala:** Pada elemen yang terletak di tepi atas atau tepi kanan layar (misalnya tombol *"Simpan Profil"* di sudut kanan atas atau grafik tren besar di dasbor), kotak tooltip panduan keluar dari batas jendela browser (*viewport cutoff*). Tombol navigasi "Lanjut" dan informasi tips terpotong dan tidak dapat diklik oleh pengguna.
* **Akar Masalah (Root Cause):** 
  1. Koordinat dihitung murni berdasarkan `targetRect.top - tooltipHeight` tanpa mengukur apakah nilai tersebut bernilai negatif (`< 0`) atau melebihi tinggi layar (`window.innerHeight`).
  2. Event listener scroll tidak menggunakan flag `{ capture: true }`, sehingga pergerakan scroll pada kontainer `<main>` (yang berstatus `overflow-y-auto`) tidak terdeteksi oleh hook `useTourTarget`.
* **Solusi & Remediasi:**
  1. Mengimplementasikan algoritma pembatasan koordinat absolut (*Hard Clamping*):
     $$\text{calculatedLeft} = \max(\text{EDGE\_MARGIN}, \min(\text{calculatedLeft}, W_{\text{window}} - W_{\text{tooltip}} - \text{EDGE\_MARGIN}))$$
     $$\text{calculatedTop} = \max(\text{EDGE\_MARGIN}, \min(\text{calculatedTop}, H_{\text{window}} - H_{\text{tooltip}} - \text{EDGE\_MARGIN}))$$
  2. Memasang deteksi perbandingan ruang vertikal dinamis: jika elemen terlalu tinggi untuk ditempati tooltip di atas maupun di bawah, sistem otomatis memilih sisi dengan sisa ruang terbesar (`spaceAbove` vs `spaceBelow`).
  3. Memasang batas proteksi kontainer: `max-h-[calc(100vh-32px)]` dengan `overflow-y-auto` pada div tooltip agar dalam kondisi zoom ekstrem atau layar kecil, konten di dalam tooltip tetap dapat di-scroll dan tombol navigasi tidak pernah terpotong.
  4. Mengaktifkan `{ capture: true, passive: true }` pada window scroll event untuk memantau scroll di kontainer `<main>`.

### Kendala 2: Celah Password Injection & Kebocoran PII pada Ekstensi (SEC-01)
* **Deskripsi Kendala:** Pada pengujian form login atau form dengan kolom bertipe password (contoh: `<input type="password" name="nik">`), ekstensi mendeteksi kolom tersebut sebagai kolom NIK dan mengisi nomor NIK secara polos (*plaintext*).
* **Akar Masalah:**
  1. `getAllFormFields()` menggunakan query selector yang tidak mengecualikan `:not([type=password])`.
  2. Pada fungsi `matchProfileKey()`, pengecekan tipe password berada di baris paling bawah (Pass 4), sedangkan Pass 0–2 melakukan *early return* saat ada atribut nama/id yang cocok.
* **Solusi & Remediasi:**
  Menerapkan prinsip **Defense-in-Depth** (3 lapis pengaman):
  - *Layer 1:* Selektor DOM `getAllFormFields()` menambahkan `:not([type=password])` dan verifikasi eksplisit `if (type === "password") return false;`.
  - *Layer 2:* Guard paling atas pada `matchProfileKey(el)`: `if (inputType === "password") return null;`.
  - *Layer 3:* Pengecekan di `fillForm()` sebelum menyuntikkan nilai ke DOM: jika elemen bertipe password, autofill dilewati secara otomatis.

### Kendala 3: Regresi Modul Pasca Modifikasi Model AI Eksternal
* **Deskripsi Kendala:** Modifikasi sebelumnya oleh model eksternal (*Hermes dengan Deepseek V4.1 Flash*) menghapus seluruh folder `frontend/src/tour/` untuk menghilangkan bug CSS terpotong secara instan, meninggalkan komponen yatim piatu di UI dan branch git stash `kondisi-setelah-tour-dibuang`.
* **Solusi & Remediasi:**
  Membangun ulang arsitektur tur dari nol secara modular:
  - `tourStorage.ts`: Manajemen state lokal terisolasi per versi dan modul.
  - `TourSteps.ts`: Standarisasi 21 langkah tur dengan panduan berkualitas tinggi.
  - `TourOverlay.tsx`: Render portal berbasis Tailwind dengan spotlight cincin bercahaya `#7BBDE8`.
  - Mengintegrasikan kembali ke `App.tsx`, `Layout.tsx`, dan `Settings.tsx`.

### Kendala 4: Bypass Rate Limiter & Mitigasi Validasi JWT (SEC-02)
* **Deskripsi Kendala:** Penyerang dapat mengirimkan header `Authorization: Bearer <token-acak>` yang berbeda pada setiap request. Fungsi `get_ip_or_token()` langsung menggunakan token mentah sebagai kunci partisi limiter, menyebabkan limiter tidak pernah terpicu (*infinite quota*).
* **Solusi & Remediasi:**
  Memodifikasi fungsi pembaca kunci partisi di `backend/app/core/security.py`:
  - Token Bearer wajib di-decode dan divalidasi keabsahan signature-nya terlebih dahulu.
  - Kunci partisi hanya menggunakan user ID resmi jika token valid (`user:<id>`).
  - Bila token palsu, rusak, atau kedaluwarsa, partisi otomatis dialihkan ke IP penyerang (`ip:<client_ip>`), sehingga upaya brute-force langsung terblokir oleh HTTP 429 Too Many Requests.

### Kendala 5: Bcrypt DoS vs Boundary Hashing Password (SEC-07)
* **Deskripsi Kendala:** Bcrypt membatasi panjang input maksimal 72 byte. Teks sandi yang sangat panjang (misal 50.000 karakter) dapat membebani memori dan CPU server saat diproses. Namun, pemotongan statis tanpa validasi schema menyebabkan regresi pada pengujian boundary bawaan sistem.
* **Solusi & Remediasi:**
  Menambahkan batasan skema Pydantic pada `UserCreate` dan `PasswordChangeRequest`:
  - `password: str = Field(..., min_length=6, max_length=128)`
  - Dengan batasan 128 karakter, serangan DoS string raksasa langsung ditolak di gerbang HTTP 422 oleh FastAPI sebelum mencapai fungsi hashing, sekaligus tetap mendukung pengguna yang menggunakan *passphrase* panjang secara aman.

### Kendala 6: Kerentanan RCE Vite Windows & Sanitasi Dependensi (SEC-06)
* **Deskripsi Kendala:** Paket `vite` versi 8.3.0 memiliki celah Arbitrary Command Execution pada sistem operasi Windows melalui modul `launch-editor` (GHSA-r825-w8mm-5pxw), ditambah celah *cross-realm credential header leakage* pada `follow-redirects`.
* **Solusi & Remediasi:**
  Menjalankan resolusi dependensi terarah melalui `npm audit fix` di modul frontend, memutakhirkan Vite ke versi aman `8.3.8`, sehingga laporan audit dependensi mencapai status **0 Vulnerabilities**.

---

## 5. Analisis SWOT Proyek (Strengths, Weaknesses, Opportunities, Threats)

| Kategori | Analisis Kondisi Sistem GovConnect |
| :--- | :--- |
| **Strengths (Kekuatan)** | • Arsitektur modern multi-tier (FastAPI + React 19 + Chrome MV3).<br>• Zero-Cloud Egress menjaga kedaulatan data sensitif warga.<br>• Sistem Onboarding Tour interaktif yang sangat detail dan responsif.<br>• Rangkaian automated testing lengkap (36 test cases, 100% lulus). |
| **Weaknesses (Kelemahan)** | • Ketergantungan browser saat ini berfokus pada ekosistem Chromium.<br>• Pengisian form portal yang menggunakan Captcha gambar kompleks masih membutuhkan intervensi manual warga. |
| **Opportunities (Peluang)** | • Integrasi AI lokal (ONNX Web / WebLLM) di ekstensi untuk klasifikasi kolom formulir non-standar secara offline.<br>• Perluasan template form ke seluruh portal kementerian dan pemerintah daerah di Indonesia. |
| **Threats (Ancaman)** | • Perubahan struktur DOM yang drastis pada situs e-government target sewaktu-waktu.<br>• Regulasi ketat terkait penyimpanan data kependudukan (UU Perlindungan Data Pribadi / PDP). |

---

## 6. Kesiapan Uji Kegunaan (System Usability Scale / SUS Testing Readiness)

Sistem GovConnect saat ini telah berada pada status **Feature Complete & Hardened**, sehingga siap memasuki tahapan pengujian pengguna lapangan.

### Kesiapan Instrumen Evaluasi SUS:
1. **10 Pertanyaan Standar SUS (Skala Likert 1-5):**
   - Pertanyaan ganjil mengukur aspek positif (kemudahan, integrasi fitur, rasa percaya diri).
   - Pertanyaan genap mengukur aspek hambatan (kompleksitas, kebutuhan bantuan teknis, inkonsistensi).
2. **Otomasi Pengumpulan Data:**
   - Telah disiapkan kode integrasi Google Apps Script untuk menghubungkan Google Form evaluasi langsung ke Google Spreadsheet analitik secara otomatis.
3. **Target Kelayakan Benchmark:**
   - Menargetkan skor rata-rata SUS **$\ge 75$** (*Grade A / Excellent Usability*), menandakan sistem dapat diterima dengan baik oleh masyarakat umum tanpa memerlukan pelatihan teknis rumit.

---

## 7. Rencana Kerja Selanjutnya (Action Items & Roadmap)

1. **Jangka Pendek (Minggu Berjalan):**
   - Mendistribusikan kuesioner pengujian SUS kepada kelompok responden uji coba (mahasiswa & masyarakat umum).
   - Menganalisis skor System Usability Scale untuk mendapatkan skor kuantitatif kemudahan penggunaan.
2. **Jangka Menengah (Persiapan Demo Akhir):**
   - Menyusun video demonstrasi alur pengisian form portal publik nyata (misal: simulasi form Dukcapil dan pendaftaran SSCASN).
   - Menyiapkan berkas presentasi akhir (*slide deck*) dan laporan akhir proyek mencakup arsitektur, laporan audit keamanan, dan hasil pengujian SUS.
3. **Penyempurnaan Berkelanjutan:**
   - Memonitor log audit backend dan terus memperkaya kamus padanan atribut (*heuristics mappings*) untuk variasi form baru.

---

> **Kesimpulan Akhir:**  
> Proyek **GovConnect** telah bertransisi dari fase pengembangan aktif menuju fase stabilitas tinggi. Seluruh kendala teknis dan celah keamanan telah berhasil diremediasi, rangkaian pengujian otomatis terverifikasi 100% lulus, dan modul panduan onboarding telah berjalan sempurna tanpa ada kecacatan visual di antarmuka pengguna. Sistem siap untuk dipresentasikan dan diuji ke pengguna riil.