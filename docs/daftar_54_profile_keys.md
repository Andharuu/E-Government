# Daftar Lengkap 54 Profile Keys (Anchor Fields) GovConnect

Dokumen ini memuat spesifikasi lengkap **54 Profile Keys** (Anchor Fields) yang aktif digunakan di seluruh ekosistem **GovConnect**: mulai dari **Dashboard Frontend (React/Vite)**, **Backend Database & Enkripsi PII (FastAPI & SQLite)**, hingga **Ekstensi Browser Matching Engine (Rule-based & SBERT Semantic Fallback)**.

---

## 1. Arsitektur & Peran 54 Profile Keys

Ke-54 kunci profil ini bertindak sebagai **Universal Canonical Schema**:
1. **Dashboard Profil**: Form pengisian terenkripsi yang dibagi ke dalam 7 kategori standar.
2. **Database Backend**: Disimpan pada tabel `profiles` dengan enkripsi field-level PII (AES-256) serta derivasi tanggal lahir (`birth_day`, `birth_month`, `birth_year`, `age`).
3. **Ekstensi Chrome (Matching Pipeline)**:
   - **Pass 0 (W3C Autocomplete)**: Memetakan atribut HTML standar seperti `autocomplete="tel"` ke `phone`.
   - **Pass 1 (Regex & Keyword Map)**: Memetakan ~300 sinonim nama/id/label ke salah satu dari 54 kunci ini.
   - **Pass 6 (SBERT Semantic Fallback)**: Menghitung Cosine Similarity 384-dimensi antara teks label input web formulir target terhadap **54 referensi embedding anchor vectors** yang telah di-pra-komputasi di `offscreen.js`.

---

## 2. Tabel Lengkap 54 Profile Keys

| No | `profileKey` | Label / Judul di Dashboard | Kategori Dashboard | Tipe Data | Status PII | Deskripsi & Tujuan |
|---|---|---|---|---|:---:|---|
| 1 | `full_name` | Nama Lengkap | Identitas & Kependudukan | `text` | Ya | Nama lengkap resmi sesuai KTP / Akta Kelahiran. |
| 2 | `first_name` | Nama Depan | Identitas & Kependudukan | `text` | Ya | Nama depan (First Name / Given Name) untuk formulir internasional / RoboForm. |
| 3 | `middle_initial` | Inisial Tengah | Identitas & Kependudukan | `text` | Ya | Inisial atau nama tengah (Middle Name / Initial). |
| 4 | `last_name` | Nama Belakang | Identitas & Kependudukan | `text` | Ya | Nama belakang (Last Name / Surname / Family Name). |
| 5 | `title` | Gelar / Sapaan | Identitas & Kependudukan | `text` | Tidak | Gelar kehormatan / sapaan (Mr, Mrs, Ms, Dr, Prof). |
| 6 | `nik` | NIK (Nomor Induk Kependudukan) | Identitas & Kependudukan | `text` | **Kritis** | 16 digit NIK e-KTP resmi Dukcapil / SSN. |
| 7 | `birth_place` | Tempat Lahir | Identitas & Kependudukan | `text` | Ya | Kota / Kabupaten tempat lahir. |
| 8 | `birth_date` | Tanggal Lahir | Identitas & Kependudukan | `date` | Ya | Tanggal lahir lengkap format ISO (`YYYY-MM-DD`). |
| 9 | `birth_day` | Hari Lahir | Identitas & Kependudukan | `text` | Ya | Komponen hari lahir (1–31), diekstrak otomatis dari `birth_date`. |
| 10 | `birth_month` | Bulan Lahir | Identitas & Kependudukan | `text` | Ya | Komponen bulan lahir (1–12), diekstrak otomatis dari `birth_date`. |
| 11 | `birth_year` | Tahun Lahir | Identitas & Kependudukan | `text` | Ya | Komponen 4-digit tahun lahir, diekstrak otomatis dari `birth_date`. |
| 12 | `age` | Umur / Usia | Identitas & Kependudukan | `text` | Ya | Angka usia dalam tahun (dihitung otomatis dari `birth_date`). |
| 13 | `gender` | Jenis Kelamin | Identitas & Kependudukan | `select` | Ya | Jenis kelamin (Laki-laki / Perempuan). |
| 14 | `blood_type` | Golongan Darah | Identitas & Kependudukan | `select` | Ya | Golongan darah (A, B, AB, O, Tidak Tahu). |
| 15 | `religion` | Agama / Kepercayaan | Identitas & Kependudukan | `select` | Ya | Agama resmi (Islam, Protestan, Katolik, Hindu, Buddha, Konghucu, Lainnya). |
| 16 | `marital_status` | Status Pernikahan | Identitas & Kependudukan | `select` | Ya | Status perkawinan (Belum Kawin, Kawin, Cerai Hidup, Cerai Mati). |
| 17 | `address` | Alamat Domisili Utama | Alamat & Domisili | `textarea` | Ya | Alamat lengkap tempat tinggal saat ini sesuai KTP / domisili. |
| 18 | `address_line_1` | Alamat Baris 1 | Alamat & Domisili | `text` | Ya | Baris pertama alamat (nama jalan, nomor rumah, RT/RW). |
| 19 | `address_line_2` | Alamat Baris 2 | Alamat & Domisili | `text` | Ya | Baris kedua alamat (apartemen, unit, blok, kavling, gedung). |
| 20 | `province` | Provinsi | Alamat & Domisili | `text` | Ya | Nama provinsi tempat tinggal. |
| 21 | `city` | Kota / Kabupaten | Alamat & Domisili | `text` | Ya | Nama kota / kabupaten domisili. |
| 22 | `district` | Kecamatan | Alamat & Domisili | `text` | Ya | Nama kecamatan domisili. |
| 23 | `village` | Kelurahan / Desa | Alamat & Domisili | `text` | Ya | Nama kelurahan atau desa domisili. |
| 24 | `postal_code` | Kode Pos | Alamat & Domisili | `text` | Ya | 5 digit kode pos wilayah domisili. |
| 25 | `country` | Negara (Country) | Alamat & Domisili | `text` | Ya | Nama negara domisili / kewarganegaraan (default: Indonesia). |
| 26 | `phone` | Nomor HP / WhatsApp Utama | Kontak Pribadi | `text` | **Kritis** | Nomor seluler / handphone aktif (format lokal/internasional). |
| 27 | `home_phone` | Telepon Rumah | Kontak Pribadi | `text` | Ya | Nomor telepon kabel / PSTN rumah. |
| 28 | `work_telephone` | Telepon Kantor | Kontak Pribadi | `text` | Ya | Nomor telepon kantor / ekstensi tempat kerja. |
| 29 | `fax` | Nomor Fax | Kontak Pribadi | `text` | Ya | Nomor faksimili instansi / pribadi. |
| 30 | `email` | Alamat Surel / Email | Kontak Pribadi | `text` | **Kritis** | Alamat email utama pengguna. |
| 31 | `website` | Situs Web / URL | Kontak Pribadi | `text` | Tidak | Tautan situs web pribadi, blog, atau portofolio. |
| 32 | `education_level` | Jenjang Pendidikan Terakhir | Pendidikan & Akademik | `select` | Ya | Jenjang pendidikan (SD, SMP, SMA/SMK, D3, D4/S1, S2, S3, Lainnya). |
| 33 | `institution` | Nama Universitas / Sekolah | Pendidikan & Akademik | `text` | Ya | Nama perguruan tinggi, akademi, sekolah tinggi, atau sekolah asal. |
| 34 | `student_id` | Nomor Induk Mahasiswa/Siswa | Pendidikan & Akademik | `text` | Ya | NIM / NPM / No Mahasiswa / Pelajar. |
| 35 | `nisn` | NISN | Pendidikan & Akademik | `text` | Ya | 10 digit Nomor Induk Siswa Nasional dari Pusdatin Kemendikbud. |
| 36 | `occupation` | Profesi / Pekerjaan | Pekerjaan & Karir | `text` | Ya | Profesi / jabatan / posisi pekerjaan saat ini. |
| 37 | `organization` | Nama Perusahaan / Instansi | Pekerjaan & Karir | `text` | Ya | Tempat bekerja (nama perusahaan, kementerian, lembaga, BUMN). |
| 38 | `work_address` | Alamat Tempat Kerja | Pekerjaan & Karir | `text` | Ya | Alamat kantor / lokasi gedung instansi tempat bekerja. |
| 39 | `income` | Penghasilan Bulanan | Pekerjaan & Karir | `text` | **Kritis** | Estimasi nominal pendapatan / gaji per bulan. |
| 40 | `mother_name` | Nama Ibu Kandung | Keluarga & Kontak Darurat | `text` | **Kritis** | Nama lengkap ibu kandung (kunci verifikasi perbankan & Dukcapil). |
| 41 | `father_name` | Nama Ayah Kandung | Keluarga & Kontak Darurat | `text` | Ya | Nama lengkap ayah kandung. |
| 42 | `family_card_number` | Nomor Kartu Keluarga (KK) | Keluarga & Kontak Darurat | `text` | **Kritis** | 16 digit Nomor Kartu Keluarga (NKK) resmi Dukcapil. |
| 43 | `family_relationship` | Status Hubungan Keluarga | Keluarga & Kontak Darurat | `text` | Ya | Status dalam susunan keluarga (Kepala Keluarga, Istri, Anak, dll.). |
| 44 | `emergency_contact_name` | Nama Kontak Darurat | Keluarga & Kontak Darurat | `text` | Ya | Nama orang yang dapat dihubungi saat situasi darurat. |
| 45 | `emergency_contact_phone` | Nomor Kontak Darurat | Keluarga & Kontak Darurat | `text` | Ya | Nomor telepon orang yang dapat dihubungi saat situasi darurat. |
| 46 | `npwp` | Nomor NPWP | Dokumen Resmi & Foto | `text` | **Kritis** | 15 atau 16 digit Nomor Pokok Wajib Pajak DJP. |
| 47 | `bpjs_number` | Nomor Kartu BPJS | Dokumen Resmi & Foto | `text` | **Kritis** | 13 digit nomor kartu BPJS Kesehatan atau Ketenagakerjaan. |
| 48 | `driver_license` | Nomor SIM | Dokumen Resmi & Foto | `text` | Ya | Nomor Surat Izin Mengemudi (SIM A/B/C). |
| 49 | `foto_ktp` | Foto e-KTP Asli | Dokumen Resmi & Foto | `image` | **Kritis** | File foto / scan tampak depan e-KTP asli (autofill berkas unggahan). |
| 50 | `foto_kk` | Foto Kartu Keluarga | Dokumen Resmi & Foto | `image` | **Kritis** | File foto / scan lembar Kartu Keluarga tampak utuh. |
| 51 | `pasfoto` | Pasfoto Formal Diri | Dokumen Resmi & Foto | `image` | Ya | Foto wajah formal ukuran 3x4 / 4x6 dengan latar merah/biru. |
| 52 | `foto_npwp` | Foto Kartu NPWP | Dokumen Resmi & Foto | `image` | Ya | File foto fisik kartu NPWP atau bukti cetak resmi DJP. |
| 53 | `foto_ijazah` | Foto Ijazah / SKL | Dokumen Resmi & Foto | `image` | Ya | File foto / scan dokumen ijazah pendidikan terakhir / SKL resmi. |
| 54 | `comments` | Catatan Formulir / Komentar | Dokumen Resmi & Foto | `textarea` | Tidak | Catatan tambahan, preferensi pengisian, atau catatan standar RoboForm. |

---

## 3. Rincian per Kategori Dashboard

### A. Kategori `identity` (Identitas & Kependudukan) — 16 Fields
- `full_name`, `first_name`, `middle_initial`, `last_name`, `title`
- `nik`, `birth_place`, `birth_date`, `birth_day`, `birth_month`, `birth_year`, `age`
- `gender`, `blood_type`, `religion`, `marital_status`

### B. Kategori `address` (Alamat & Domisili) — 9 Fields
- `address`, `address_line_1`, `address_line_2`
- `village`, `district`, `city`, `province`, `postal_code`, `country`

### C. Kategori `contact` (Kontak Pribadi & Digital) — 6 Fields
- `phone`, `home_phone`, `work_telephone`, `fax`, `email`, `website`

### D. Kategori `education` (Pendidikan & Akademik) — 4 Fields
- `education_level`, `institution`, `student_id`, `nisn`
*(Ekstensi kustom dashboard juga menyediakan `major_field`/`jurusan` dan `gpa_score`/`ipk`)*

### E. Kategori `career` (Pekerjaan & Karir) — 4 Fields
- `occupation`, `organization`, `work_address`, `income`

### F. Kategori `family` (Keluarga & Kontak Darurat) — 6 Fields
- `mother_name`, `father_name`, `family_card_number`, `family_relationship`
- `emergency_contact_name`, `emergency_contact_phone`

### G. Kategori `documents` (Dokumen Resmi & Berkas Unggahan) — 9 Fields
- Nomor Dokumen: `npwp`, `bpjs_number`, `driver_license`
- Berkas Unggahan (Foto): `foto_ktp`, `foto_kk`, `pasfoto`, `foto_npwp`, `foto_ijazah`
- Form Meta: `comments`

---

## 4. Referensi Implementasi pada Source Code

1. **SBERT Reference Anchors (`offscreen.js`)**:
   - Berada di baris 185–240 pada objek `PROFILE_KEY_LABELS`.
   - Mengubah teks deskriptif ke 54 vektor dimensi $1 \times 384$ saat ekstensi dimuat.
2. **Rule-Based Alias Dictionary (`content_script.js`)**:
   - Berada di baris 165–363 pada objek `KEYWORD_MAP`.
   - Menghubungkan lebih dari 300 variasi nama tag input HTML ke 54 `profileKey` ini.
3. **Database Model & Enkripsi (`backend/app/models/entities.py` & `profile_service.py`)**:
   - Tabel `profiles` menyimpan 38 kolom statis + 2 kolom JSON (`custom_fields`, `document_photos`).
   - Seluruh field berlabel PII dienkripsi menggunakan kunci simetris AES sebelum ditulis ke disk SQLite.
4. **Dashboard Frontend (`frontend/src/pages/Profile.tsx` & `profilePresets.tsx`)**:
   - Memetakan 54 kunci ini ke grid input responsif, modal penambahan kolom custom, serta slot unggah foto terkompresi otomatis.
