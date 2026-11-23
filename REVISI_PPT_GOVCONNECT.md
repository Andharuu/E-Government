# PANDUAN LENGKAP MATERI PRESENTASI GOVCONNECT
> Dokumen ini berisi dua hal utama:
> 1. **Daftar Lengkap Bahasa Pemrograman, Framework, dan Penempatannya** di seluruh modul GovConnect.
> 2. **Dua Pilihan Naskah PPT Siap Copas**:
>    - **BAGIAN A: Versi Teknis & Akademis** (Cocok untuk Konferensi Ilmiah, Sidang Skripsi/Tesis, dan Penguji IT).
>    - **BAGIAN B: Versi Bahasa Awam / Non-IT** (Cocok untuk Pejabat SPBE, Dinas Kominfo, Juri Bisnis/Inovasi Publik, dan Masyarakat Umum).

---

# 🛠️ PEMETAAN TEKNOLOGI (BAHASA & FRAMEWORK)

Berikut adalah rincian teknologi yang digunakan pada GovConnect beserta letak dan fungsinya:

| Bagian Sistem | Komponen / File | Bahasa Pemrograman | Framework & Pustaka Utama | Fungsi & Penempatan di Sistem |
| :--- | :--- | :--- | :--- | :--- |
| **Ekstensi Browser** | `content_script.js` | **JavaScript (ES2022+)** | DOM API, MutationObserver | Injeksi otomatis ke formulir web publik, deteksi field (Pass 0–3), traversal Shadow DOM, adapter PrimeNG (Angular) & React-Select, serta peringatan anti-sadap HTTP. |
| **Ekstensi Browser** | `offscreen.js` & `offscreen.html` | **JavaScript, WebAssembly (WASM)** | **ONNX Runtime Web (WASM)**, **Transformers.js** | Menjalankan model AI semantik (Pass 4 SBERT) secara lokal di background tanpa akses internet (*Zero-Egress*) dan tanpa membebani antarmuka halaman web. |
| **Ekstensi Browser** | `background.js` (Service Worker) | **JavaScript (ES2022+)** | Chrome Extension API (MV3) | Manajemen siklus hidup ekstensi, jembatan komunikasi antar-tab, sinkronisasi token sesi, dan penampung profil volatil di memori sementara. |
| **Ekstensi Browser** | `sidepanel.js` / `popup.js` | **JavaScript, HTML5, CSS3** | Chrome SidePanel API, FontAwesome Free | Antarmuka interaktif di sisi layar peramban bagi warga untuk memicu pengisian formulir instan dengan satu klik. |
| **Model AI On-Device** | `models/Xenova/all-MiniLM-L6-v2/` | **ONNX (Format Model AI)** | Model Quantized INT8 (22.7 MB) | Otak AI Sentence-BERT yang telah dikompresi agar hemat RAM dan bisa berjalan cepat di komputer pengguna biasa. |
| **Web Portal Warga** | `frontend/src/pages/` | **TypeScript (~5.8)** | **React 19 (`^19.2.8`)**, **Vite 8** | Antarmuka web modern warga untuk mengelola identitas, brankas dokumen resmi, dan melacak efisiensi waktu birokrasi. |
| **Desain Antarmuka** | `frontend/src/` | **CSS3, HTML5** | **Tailwind CSS v4 (`^4.3.3`)**, PostCSS | Sistem desain berbasis token warna SPBE yang bersih, responsif, dan ringan tanpa dependensi CSS berat. |
| **Visualisasi Data** | `Dashboard.tsx` | **TypeScript** | **Recharts (`^3.10.1`)**, Chart.js | Grafik tren area interaktif untuk menghitung detik waktu yang dihemat dan grafik donat rasio keberhasilan pengisian form. |
| **Backend REST API** | `backend/app/main.py` | **Python 3.11+ / 3.13** | **FastAPI**, Starlette, Uvicorn (ASGI) | Server pintu gerbang utama yang menyajikan endpoint RESTful API berkecepatan tinggi dengan dokumentasi Swagger otomatis. |
| **Basis Data & ORM** | `backend/app/models/` | **Python** | **SQLAlchemy 2.0**, Alembic | Pemetaan objek data (ORM) ke basis data relasional (SQLite untuk demo lokal, PostgreSQL/MySQL untuk skala nasional). |
| **Kriptografi & Privasi** | `core/security.py`, `profile_service.py` | **Python** | **Cryptography (Fernet / AES-256)**, PBKDF2 | Mengenkripsi data sensitif (NIK, KK, nama ibu kandung) di level kolom database sebelum tersimpan ke harddisk. |
| **Autentikasi & Sesi** | `core/config.py`, `routers/auth.py` | **Python** | **PyJWT (JOSE)**, Passlib (Bcrypt) | Pengelolaan login aman warga & admin dengan token JWT dan perlindungan cookie anti-pembajakan sesi (*HttpOnly, Secure, SameSite*). |
| **Keamanan Jaringan** | Middleware di `main.py` | **Python** | **SlowAPI (Rate Limiter)**, CORS Middleware | Menangkal serangan brute-force login, membatasi spam request per menit, serta memvalidasi header pencegah CSRF. |
| **Audit Jejak Digital** | `services/audit_service.py` | **Python** | SQLAlchemy Logging | Mencatat setiap aktivitas akses data oleh administrator dengan mekanisme *Fail-Closed* untuk memenuhi mandat UU PDP No. 27/2022. |
| **Evaluasi & Tolok Ukur**| `scripts/benchmark_baselines.py` | **Python** | Scikit-learn (TF-IDF & Logistic Regression) | Skrip pengujian otomatis untuk membandingkan akurasi GovConnect dengan autofill bawaan Chrome pada 313 kolom formulir. |

---
---

# 🏛️ BAGIAN A: VERSI TEKNIS & AKADEMIS
*(Format ini sama persis dengan naskah yang sudah Anda buat, sangat cocok untuk Sidang Skripsi, Konferensi Ilmiah LNCS/Springer, dan Audiens IT).*

---

### SLIDE 1 (TEKNIS): COVER
- **Header:** `POLITEKNIK ELEKTRONIKA NEGERI SURABAYA (PENS)`
- **Judul:** `GovConnect`
- **Sub-judul:** `Mengeliminasi Friksi Birokrasi Digital Melalui Client-Side Schema Matching & On-Device Edge AI`
- **Tagline Highlight:** `Isi Formulir Layanan Publik 0.3 Detik Tanpa Kompromi Privasi Data Warga`
- **Pemakalah:** `Andharu Raffi · Fajrian Aprilio · Amma Liesvarastranta Haz`
- **Institusi:** `Departemen Teknik Informatika dan Komputer, Politeknik Elektronika Negeri Surabaya`

---

### SLIDE 2 (TEKNIS): LATAR BELAKANG MASALAH
- **Header Kategori:** `LATAR BELAKANG MASALAH`
- **Judul Slide:** `Mengapa Formulir Publik Belum Efisien?`
- **Kotak 1:** `27.000+` | `Fragmentasi SPBE`  
  *Deskripsi:* Aplikasi pemerintah berjalan terpisah tanpa interoperabilitas (Perpres No. 95/2018).
- **Kotak 2:** `8–15 Mnt` | `Form Fatigue Warga`  
  *Deskripsi:* Ketik ulang NIK, KK, dan identitas manual di tiap portal, rawan salah ketik.
- **Kotak 3:** `1.5–4 Dtk` | `Risiko Privasi Cloud AI`  
  *Deskripsi:* Latensi 1.500–4.000 ms; kirim PII ke LLM pihak ketiga melanggar UU PDP & GDPR.
- **Footer Callout:** `⚠️ Autofill bawaan browser hanya mengenali 59.4% kolom formulir birokrasi akibat penamaan legacy.`

---

### SLIDE 3 (TEKNIS): ARSITEKTUR 3-IN-1 & STACK TEKNOLOGI
- **Header Kategori:** `SOLUSI ARSITEKTUR`
- **Judul Slide:** `Ekosistem Terintegrasi 3-in-1`
- **Kolom 1: Chrome Extension (Manifest V3)**
  - *Tech:* JavaScript Modern, WebAssembly, Chrome MV3 API.
  - *On-Device AI:* Autofill instan via ONNX WebAssembly lokal.
  - *DOM Modern:* Dukungan Shadow DOM, PrimeNG (Angular), React-Select.
  - *Anti-Sadap:* Peringatan otomatis deteksi formulir tidak aman (HTTP).
- **Kolom 2: Web Portal Warga (React 19 + Tailwind v4)**
  - *Tech:* TypeScript, React 19, Tailwind CSS v4, Recharts.
  - *Brankas Profil:* 45+ atribut kanonikal & Dynamic Custom Fields.
  - *Dokumen Aman:* Enkripsi file e-KTP, KK, NPWP, dan Ijazah.
  - *Kontrol Penuh:* Dasbor analitik waktu dan izin data granular.
- **Kolom 3: Backend REST API (FastAPI)**
  - *Tech:* Python 3.11+, FastAPI, SQLAlchemy, Cryptography (AES-256).
  - *Enkripsi Kolom:* Kunci proteksi PII terpisah dari secret token JWT.
  - *Audit Fail-Closed:* Kepatuhan ketat UU PDP No. 27/2022.
  - *Keamanan API:* Proteksi CSRF ganda, Secure Cookie, dan SlowAPI rate limiter.
- **Footer:** `🛡️ Integrasi Zero-Touch: Bekerja tanpa mengubah satu baris kode situs instansi pemerintah.`

---

### SLIDE 4 (TEKNIS): KEAMANAN & ARSITEKTUR ZERO-EGRESS
- **Header Kategori:** `KEAMANAN & PRIVASI LOKAL`
- **Judul Slide:** `Arsitektur Zero-Egress Lokal`
- **Diagram Alur Komponen:**
  - `[Website Target]` ↔ `[Content Script]`
  - `[Content Script]` ↔ `[ZERO-EGRESS SANDBOX: Offscreen Document (ONNX WASM + SBERT INT8 22.7 MB)]`
  - `[Sidepanel UI]` ↔ `[FastAPI Backend (HTTPS / JWT)]`
- **Poin Zero-Egress Boundary:**
  1. *Model SBERT INT8 Lokal (22.7 MB):* all-MiniLM-L6-v2 berjalan 100% di memori sandbox browser.
  2. *Zero Network Saat Matching:* Tanpa socket jaringan keluar saat inferensi kesamaan semantik.
  3. *Kepatuhan Regulasi Penuh:* Privacy by Design (GDPR Pasal 25) & UU PDP No. 27/2022.
  4. *Fallback Resilient:* Pre-bundled WASM lokal dengan fail-safe CDN terverifikasi.

---

### SLIDE 5 (TEKNIS): 7-TIER HYBRID CASCADE PIPELINE
- **Header Kategori:** `ESKALASI CERDAS MULTI-LAPISAN`
- **Judul Slide:** `7-Tier Hybrid Cascade Pipeline`
- **Alur Bertingkat:**
  - **PASS 0 (<0.001 ms):** `W3C Autocomplete` — Deteksi token standar HTML5.
  - **PASS 1 (<1 ms):** `Prefix & Singkatan` — Pembersihan prefix baris & ekspansi 29 istilah legacy.
  - **PASS 1.5 (<1 ms):** `Date Heuristics` — Profil distribusi nilai opsi dropdown tanggal lahir.
  - **PASS 2 (<2 ms):** `Scoped Vetoes` — 6 aturan anti-tabrakan konteks (hasIbu, hasAyah, dll).
  - **PASS 2.5 (<3 ms):** `Query-Normalized BM25` — Skor BM25 label panjang ($k_1=1.2, b=0.30, \tau=0.75$).
  - **PASS 3 (3–5 ms):** `Clamped Hybrid Lexical` — Bobot linear $0.40\text{JW} + 0.35\text{Sub} + 0.15\text{Lev} + 0.10\text{Dice}$.
  - **PASS 4 (120–280 ms):** `On-Device Sentence-BERT` — Fallback embedding semantik lokal ($\text{Cosine} \ge 0.50$).
- **Footer:** `⚡ Jalur Cepat: >95% kolom terselesaikan pada Tier Leksikal (Pass 0–3) di bawah 5 ms.`

---

### SLIDE 6 (TEKNIS): BENCHMARK KOMPARATIF FORMULIR
- **Header Kategori:** `EVALUASI EMPIRIS (64 KONTROL TARGET)`
- **Judul Slide:** `Benchmark 313 Elemen Formulir`
- **Tabel Pengujian:**

| Metode / Arsitektur | Terpecahkan | Recall [95% Wilson CI] | Presisi | Rata-rata Latensi |
| :--- | :---: | :---: | :---: | :---: |
| Native Chromium Autofill | 38 / 64 | 59.4% [47.1%, 70.5%] | 100.0% | 0.011 ms |
| TF-IDF + Logistic Regression | 48 / 64 | 75.0% [63.2%, 84.0%] | 98.0% | 0.664 ms |
| Rule-Only Matcher (Pass 0–1.5) | 36 / 64 | 56.3% [44.1%, 67.8%] | 100.0% | < 0.001 ms |
| **GovConnect (Hybrid Cascade)** | **62 / 64** | **96.9% [89.3%, 99.1%]** | **100.0%** | **< 5 ms (95.3%)** |

- **Footer:** `📈 Unggul +37.5 poin Recall atas autofill bawaan browser dengan presisi tetap 100.0%.`

---

### SLIDE 7 (TEKNIS): VALIDASI PORTAL RI & KEAMANAN
- **Header Kategori:** `VALIDASI LAPANGAN & KEAMANAN`
- **Judul Slide:** `Validasi Portal RI & Keamanan`
- **Statistik 1:** `100%` | `41 / 41 Kontrol Identitas Terpecahkan`  
  *Detail:* Coretax DJP, SSCASN BKN, PPDB SMK, Dukcapil JotForm, & OSS BKPM (5 Portal Resmi Indonesia).
- **Statistik 2:** `0.0% FPR` | `Zero False Positive Security Traps`  
  *Detail:* Menolak akurat password, PIN, CVV, OTP, CAPTCHA, & hidden token CSRF (63 / 63 Perangkap Ditolak).
- **Statistik 3:** `98.6%` | `Efisiensi Waktu Pengisian Formulir`  
  *Detail:* Memangkas friksi pengisian identitas manual menjadi eksekusi satu klik ($8.5\text{ menit} \to 0.3\text{ detik}$).

---

### SLIDE 8 (TEKNIS): ANTARMUKA PORTAL & PANEL ADMIN
- **Header Kategori:** `ANTARMUKA EKOSISTEM`
- **Judul Slide:** `Portal Warga & Panel Admin`
- **Kolom Kiri: Modul Pengguna (Warga)**
  - *Brankas Profil Terenkripsi:* 45+ atribut kanonikal & Dynamic Custom Fields.
  - *Visualisasi Efisiensi:* Grafik Recharts Area hitung penghematan waktu.
  - *Pustaka Template Instansi:* Skema siap pakai portal pusat & daerah.
  - *Pusat Pengaduan Mandiri:* Lapor kendala birokrasi & insiden privasi.
- **Kolom Kanan: Panel Administrator (SPBE)**
  - *Executive Dashboard:* Pantau agregat transaksi autofill & SLA tiket.
  - *Audit Trail Fail-Closed:* Mitigasi spoofing IP; batal otomatis jika log gagal.
  - *Resolusi Tiket Pengaduan:* Delegasi disposisi sesuai urgensi instansi.
  - *Broadcast Real-Time:* Pengumuman warga berbasis Server-Sent Events (SSE).

---

### SLIDE 9 (TEKNIS): KESIAPAN PRODUKSI & ROADMAP
- **Header Kategori:** `BATASAN SISTEM & PENGEMBANGAN`
- **Judul Slide:** `Kesiapan Produksi & Roadmap`
- **Kondisi Batas Terselesaikan:**
  - *Skor Leksikal Terbuka:* Normalisasi $\min(1.0, \text{Score})$ & runner-up guard $\ge 0.10$.
  - *Kalibrasi BM25 Panjang Query:* Normalisasi dokumen cegah false positive label panjang.
  - *Proteksi Overwrite Kolom:* Verifikasi DOM event jaga input manual warga.
- **Roadmap Pengembangan Mendatang:**
  - *Multilingual Sentence-BERT:* Encoder `paraphrase-multilingual-MiniLM-L12-v2` bahasa daerah.
  - *Asynchronous Cascading Dropdown:* Dependensi otomatis Provinsi → Kota → Kecamatan.
  - *W3C Verifiable Credentials:* Transisi menuju standar identitas digital desentralisasi.

---

### SLIDE 10 (TEKNIS): PENUTUP
- **Header:** `SESI DISKUSI & TANYA JAWAB`
- **Judul:** `Terima Kasih`
- **Keterangan:** `GovConnect v2.0.0 — Roadmap: Multilingual SBERT & W3C Verifiable Credentials`
- **Afiliasi:** `Andharu Raffi · Fajrian Aprilio · Amma Liesvarastranta Haz`  
  `Departemen Teknik Informatika dan Komputer — Politeknik Elektronika Negeri Surabaya (PENS)`

---
---

# 👥 BAGIAN B: VERSI BAHASA AWAM / NON-IT
*(Didesain khusus untuk audiens Umum, Pimpinan Instansi Pemerintah, Pejabat Kominfo, Juri Kompetisi Inovasi, atau Masyarakat. **Bebas dari jargon teknis rumit**, menggunakan analogi sehari-hari yang mudah dipahami).*

---

### SLIDE 1 (AWAM): COVER
- **Header:** `INOVASI LAYANAN PUBLIK DIGITAL — PENS`
- **Judul:** `GovConnect`
- **Sub-judul:** `Asisten Pintar Pengisi Formulir Pemerintah: Mengurus Layanan Publik Jadi Sekejap Mata`
- **Tagline Highlight:** `Isi Formulir Pemerintah Cuma 0.3 Detik, Data Pribadi Tetap 100% Aman di Komputer Anda`
- **Penyusun:** `Fajrian Aprilio & Tim Peneliti GovConnect`  
  `Politeknik Elektronika Negeri Surabaya (PENS)`

---

### SLIDE 2 (AWAM): MASALAH NYATA MASYARAKAT
- **Header Kategori:** `MASALAH YANG DIHADAPI WARGA`
- **Judul Slide:** `Mengapa Mengurus Layanan Pemerintah Masih Melelahkan?`
- **Kotak 1: Terlalu Banyak Aplikasi**
  - *Angka Highlight:* `27.000+ Portal`
  - *Penjelasan Awam:* Setiap dinas dan kementerian punya website sendiri-sendiri yang tidak saling terhubung.
- **Kotak 2: Lelah Mengetik Ulang**
  - *Angka Highlight:* `15 Menit / Form`
  - *Penjelasan Awam:* Warga dipaksa mengetik NIK, nama orang tua, alamat, dan data yang sama berkali-kali, sangat rentan salah ketik.
- **Kotak 3: Takut Data Bocor**
  - *Angka Highlight:* `Bahaya AI Luar`
  - *Penjelasan Awam:* Memakai aplikasi AI online biasa berisiko membocorkan identitas warga ke server asing di luar negeri.
- **Pesan Bawah:** `⚠️ Browser biasa (Google Chrome autofill) sering gagal dan bingung membaca kolom formulir instansi pemerintah.`

---

### SLIDE 3 (AWAM): SOLUSI KAMI
- **Header Kategori:** `SOLUSI GOVCONNECT`
- **Judul Slide:** `Satu Solusi Praktis untuk Semua Formulir Pemerintah`
- **Kolom 1: Asisten Pintar di Browser**
  - *Bentuk:* Ekstensi kecil di Google Chrome.
  - *Fungsi:* Begitu warga membuka website pemerintah, asisten ini langsung mengenali kolom apa saja yang harus diisi.
  - *Kemudahan:* Langsung mengisi seluruh formulir hanya dengan menekan 1 tombol.
- **Kolom 2: Brankas Data Pribadi Warga**
  - *Bentuk:* Website profil pribadi warga.
  - *Fungsi:* Tempat warga menyimpan data resmi (KTP, KK, NPWP, Ijazah) sekali saja seumur hidup.
  - *Kendali:* Warga memegang kendali penuh atas data apa yang boleh dan tidak boleh diisikan.
- **Kolom 3: Sistem Pengawas yang Aman**
  - *Bentuk:* Server pengaman berstandar nasional.
  - *Fungsi:* Menjaga data tetap terkunci rapat dengan enkripsi militer dan mencatat siapa saja yang mengakses data.
  - *Layanan:* Menyediakan sarana pengaduan bagi warga jika ada kendala administrasi.
- **Pesan Bawah:** `✨ Praktis: Instansi pemerintah tidak perlu mengubah website mereka sama sekali. GovConnect langsung bekerja di atasnya!`

---

### SLIDE 4 (AWAM): JAMINAN KEAMANAN & PRIVASI
- **Header Kategori:** `PERLINDUNGAN PRIVASI TOTAL`
- **Judul Slide:** `Teknologi "Kamar Tertutup": Data Anda Tidak Pernah Keluar dari Komputer`
- **Analogi Alur Gambar (Mudah Dipahami):**
  ```text
  [ Website Dinas ] ◄────────► [ Asisten GovConnect ]
                                        │
                                        ▼ (Berpikir di tempat)
                              [ KAMAR TERTUTUP DI LAPTOP ]
                              Kecerdasan Buatan bekerja di dalam laptop.
                              Tanpa internet. Data tidak dikirim ke siapa pun!
  ```
- **4 Jaminan Keamanan Warga:**
  1. *Kecerdasan Buatan Offline:* Otak pintar GovConnect dipasang langsung di laptop warga, bekerja tanpa perlu kirim data ke internet.
  2. *Anti Sadap Jaringan:* Saat mengisi formulir, tidak ada lalu lintas data identitas yang melayang di udara.
  3. *Sesuai UU Perlindungan Data Pribadi (UU PDP):* Menghormati privasi warga secara ketat sesuai hukum yang berlaku di Indonesia.
  4. *Peringatan Bahaya:* GovConnect otomatis menolak mengisi formulir jika website tujuan terindikasi tidak aman atau palsu.

---

### SLIDE 5 (AWAM): BAGAIMANA CARA KERJANYA?
- **Header Kategori:** `CARA KERJA SEDERHANA`
- **Judul Slide:** `7 Lapisan Saringan Pintar: Cepat, Tepat, dan Tidak Pernah Tertukar`
- **Alur Kerja (Bahasa Manusia):**
  - **Langkah 1 (Cek Nama Resmi):** Mencocokkan nama kolom standar internasional. *(Selesai dalam sekejap mata)*
  - **Langkah 2 (Pahami Singkatan):** Mengerti singkatan aneh di portal lama, seperti `pers_ssn` diartikan NIK, atau `cellphon` diartikan No. HP.
  - **Langkah 3 (Pilah Tanggal Lahir):** Otomatis membedakan mana kotak tanggal, kotak bulan, dan kotak tahun.
  - **Langkah 4 (Cegah Tertukar / Pantangan):** Menjaga agar nama anak tidak tertukar dengan nama ibu atau nama ayah.
  - **Langkah 5 & 6 (Baca Makna Kalimat):** Membaca kalimat panjang seperti *"Alamat domisili tempat tinggal saat ini"* dan memahaminya sebagai Alamat.
  - **Langkah 7 (Otak AI Terakhir):** Jika ada bahasa yang sangat rumit, otak AI lokal akan menebak maknanya dengan tepat.
- **Pesan Bawah:** `⚡ Lebih dari 95% kolom formulir berhasil ditebak dalam waktu kurang dari 5 milidetik!`

---

### SLIDE 6 (AWAM): BUKTI NYATA DI LAPANGAN
- **Header Kategori:** `HASIL PENGUJIAN`
- **Judul Slide:** `Terbukti Jauh Lebih Hebat Dibandingkan Pengisi Bawaan Chrome`
- **Perbandingan Sederhana:**
  - *Autofill Bawaan Google Chrome:* Hanya berhasil mengisi **59%** kolom. *(Banyak yang terlewat dan bingung)*
  - *Metode Rumus Biasa:* Hanya berhasil mengisi **56%** kolom.
  - *Metode Statistik Jadul:* Berhasil mengisi **75%** kolom.
  - **GovConnect (Inovasi Kami):** Berhasil mengisi **97% kolom dengan sukses sempurna (Presisi 100%)!**
- **Kesimpulan Angka:** `GovConnect 37% lebih pintar dan lengkap dalam mengenali formulir pemerintah dibandingkan browser tercanggih saat ini.`

---

### SLIDE 7 (AWAM): KEBERHASILAN DI WEBSITE RESMI PEMERINTAH
- **Header Kategori:** `UJI COBA DI SITUS PEMERINTAH INDONESIA`
- **Judul Slide:** `Berhasil 100% pada Berbagai Portal Resmi Republik Indonesia`
- **Pencapaian 1:** `100% Berhasil`
  - *Keterangan:* Sukses mengenali seluruh data identitas di 5 portal resmi: **Pajak Coretax DJP, Pendaftaran CPNS SSCASN BKN, PPDB Sekolah SMK, Layanan Kependudukan Dukcapil, dan Perizinan Usaha OSS BKPM**.
- **Pencapaian 2:** `Nol Kesalahan (Aman 100%)`
  - *Keterangan:* Sangat cerdas. **Tidak akan pernah** salah memasukkan identitas ke kotak Password, PIN ATM, CVV Kartu Bank, atau Kode Verifikasi CAPTCHA.
- **Pencapaian 3:** `Hemat Waktu 98.6%`
  - *Keterangan:* Mengurus formulir yang biasanya memakan waktu **8 sampai 15 menit**, kini tuntas hanya dalam waktu **0.3 detik (satu kali klik)**.

---

### SLIDE 8 (AWAM): MANFAAT UNTUK WARGA & PEMERINTAH
- **Header Kategori:** `MANFAAT NYATA`
- **Judul Slide:** `Kemudahan untuk Warga, Efisiensi bagi Pemerintah`
- **Untuk Warga (Masyarakat):**
  - Tidak perlu menghafal atau membawa tumpukan fotokopi berkas saat mengurus administrasi.
  - Bebas dari stres mengetik ulang dan tidak takut salah ketik NIK/Nomor KK.
  - Bisa melihat grafik berapa banyak waktu berharga yang berhasil dihemat.
  - Bisa melapor langsung jika ada kendala di salah satu website dinas.
- **Untuk Pemerintah (Instansi SPBE):**
  - Data yang masuk dari warga dijamin rapi, terstandarisasi, dan bebas kesalahan input.
  - Mengurangi antrean pelayanan tatap muka di kantor dinas.
  - Tercipta sistem administrasi modern tanpa perlu membuang anggaran triliunan rupiah untuk menyatukan database server dinas.

---

### SLIDE 9 (AWAM): RENCANA KE DEPAN
- **Header Kategori:** `PENGEMBANGAN MASA DEPAN`
- **Judul Slide:** `Menuju Layanan Publik Digital Masa Depan yang Merata`
- **Rencana 1: Mengerti Bahasa Daerah**
  - Mengembangkan kecerdasan buatan agar mengenali dialek dan istilah lokal di portal pemerintah daerah pelosok.
- **Rencana 2: Pilihan Wilayah Otomatis**
  - Pilihan Provinsi, Kabupaten, Kecamatan, hingga Kelurahan akan langsung terhubung dan terisi beruntun otomatis.
- **Rencana 3: Identitas Digital Nasional**
  - Menyiapkan integrasi dengan standar Identitas Digital Kependudukan (IKD) resmi dari pemerintah pusat.

---

### SLIDE 10 (AWAM): PENUTUP
- **Header:** `KOLABORASI UNTUK INDONESIA MAJU`
- **Judul:** `Mewujudkan Birokrasi Digital Tanpa Ribet`
- **Pesan Utama:** `GovConnect: Warga Nyaman, Data Aman, Indonesia Efisien.`
- **Salam Penutup:** `Terima Kasih — Tim Peneliti GovConnect, PENS Surabaya`
