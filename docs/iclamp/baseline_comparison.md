# Perbandingan Baseline Empiris: Evaluasi 4 Arsitektur Resolusi Kontrol Formulir Web

> **Dokumen Riset & Evaluasi Empiris GovConnect ICLAMP 2027**  
> **Tanggal:** 30 Oktober 2026  
> **Item Implementation Plan:** Milestone M3 (Evaluasi 2 Baseline Nyata: Native Chromium Autofill & n-gram Logistic Regression)  
> **Dataset Uji:** 64 Kontrol Target Beranotasi pada 10 Kategori Non-Name di 5 Website Heterogen ($N = 177$ Elemen DOM Total)

---

## 1. Latar Belakang & Motivasi Evaluasi Baseline

Kritik tinjauan sejawat (A5) menyoroti bahwa perbandingan arsitektur pada draf awal paper terlalu hipotetis ("strawman") dengan estimasi cakupan tanpa pengukuran nyata terhadap pembanding riil. Untuk mengatasi kritik tersebut secara definitif, evaluasi empiris dilakukan terhadap 4 sistem nyata pada set uji 64 kontrol target beranotasi:

1. **Native Chromium Autofill:** Mesin autofill bawaan peramban berbasis Chromium (parser standar W3C `autocomplete` dan heuristik regex bawaan pada `name`, `placeholder`, dan `<label for>`).
2. **Character/Word n-gram TF-IDF + Logistic Regression:** Pengklasifikasi berbasis pembelajaran mesin terlatih ringan (*lightweight statistical classifier*) yang mengekstrak fitur n-gram karakter (3–5) dan kata untuk memprediksi kunci kanonikal.
3. **GovConnect Rule-Only Baseline (Pass 0 + 1 + 1.5):** Baseline heuristik aturan deterministik murni tanpa inferensi tokenisasi lanjut maupun representasi semantik.
4. **GovConnect Full Hybrid Cascade (Pass 0 s.d. Pass 4):** Kaskade hibrida lengkap GovConnect yang memadukan W3C lookup, prefix stripper, token shortcuts, scoped vetoes, query-normalized BM25, hybrid scoring, dan on-device WebAssembly SBERT.

---

## 2. Hasil Komparatif Menyeluruh (Tabel Metrik Utama)

Pengujian dilakukan secara kuantitatif dengan menghitung **Recall (Sensitivitas)**, **Precision**, **F1-Score**, **95% Wilson Confidence Interval**, dan **Latensi Inferensi**:

| Arsitektur Sistem | Kontrol Terisi ($N=64$) | Recall (%) [95% Wilson CI] | Precision (%) | F1-Score (%) | Latensi Rata-Rata per Field | OpEx Inferensi per Form | Karakteristik Privasi PII |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Native Chromium Autofill** | 38 / 64 | **59.4%** [47.1%, 70.5%] | **100.0%** | **74.5%** | **0.011 ms** | $0.00 | Lokal (Tanpa Egress) |
| **TF-IDF + Logistic Regression** | 48 / 64 | **75.0%** [63.2%, 84.0%] | **98.0%** | **85.0%** | **0.664 ms** | $0.00 | Lokal (Tanpa Egress) |
| **GovConnect Rule-Only** (Pass 0--1.5) | 35 / 64 | **54.7%** [42.6%, 66.3%] | **100.0%** | **70.7%** | **< 0.001 ms** | $0.00 | Lokal (Tanpa Egress) |
| **GovConnect Full Cascade** | **62 / 64** | **96.9%** [89.3%, 99.1%] | **100.0%** | **98.4%** | **< 5 ms (95.3% fields)**<br>Pass 4: 120--280 ms | $0.00 | **Zero-Egress On-Device** |

---

## 3. Rincian Efikasi Resolusi per Situs Uji

Dinamika resolusi pada masing-masing karakteristik website memperlihatkan keunggulan spesifik GovConnect:

| Website Uji | Target Kontrol | Native Chromium Autofill | TF-IDF + Logistic Regression | Rule-Only Baseline | GovConnect Full Cascade |
|:---|:---:|:---:|:---:|:---:|:---:|
| **RoboForm** (Legacy Abbrev) | 18 | 11 / 18 (61.1%) | 13 / 18 (72.2%) | **18 / 18 (100.0%)** | **18 / 18 (100.0%)** |
| **UMich W3C** (HTML5 Standards) | 19 | **18 / 19 (94.7%)** | 11 / 19 (57.9%) | 17 / 19 (89.5%) | **18 / 18 (94.7%)** |
| **SelectorsHub** (Dynamic/Traps) | 11 | 9 / 11 (81.8%) | **10 / 11 (90.9%)** | 0 / 11 (0.0%) | **10 / 11 (90.9%)** |
| **GetAutoClicker** (Form Controls)| 4 | 0 / 4 (0.0%) | **4 / 4 (100.0%)** | 0 / 4 (0.0%) | **4 / 4 (100.0%)** |
| **PasswordManager UK** (Table DOM)| 12 | 0 / 12 (0.0%) | 10 / 12 (83.3%) | 0 / 12 (0.0%) | **12 / 12 (100.0%)** |
| **Total / Rata-Rata** | **64** | **38 / 64 (59.4%)** | **48 / 64 (75.0%)** | **35 / 64 (54.7%)** | **62 / 64 (96.9%)** |

---

## 4. Analisis Komparatif Mendalam

### 4.1 Mengapa Native Chromium Autofill Gagal pada Formulir Tabel & Obfuskasi (59.4% Recall)
- **Kelemahan Deteksi Kontras:** Chromium sangat unggul pada situs berstandar W3C modern (18/19 di UMich) dan placeholder standar (SelectorsHub). Namun, mesin bawaan Chromium **gagal total (0/12)** pada PasswordManager UK karena kontrolnya berwujud `<input name="textfield5">` di mana label teks berada di dalam sel tabel `<td>` terpisah tanpa atribut `<label for="...">`.
- **Kegagalan Dropdown & Radio:** Chromium tidak memiliki logika bawaan untuk mengaitkan grup radio kustom (*gender* pada GetAutoClicker) maupun pemecah tanggal numerik (*birth date* 3-select pada RoboForm).

### 4.2 Analisis Kinerja Pengklasifikasi Statistik (TF-IDF + Logistic Regression, 75.0% Recall)
- Model regresi logistik n-gram berhasil memetakan variasi leksikal seperti `cellphon`, `homephon`, dan teks sel tabel dengan cukup baik.
- Namun, model statistik mengalami kendala pada:
  1. Kontrol tanpa label eksplisit di mana hanya ada atribut struktural W3C (UMich: hanya 11/19 terpetakan karena kebingungan membedakan n-gram `address-level1` vs `address-level2`).
  2. Dropdown tanggal numerik tanpa kata kunci semantik (misalnya opsi `1..12` dan `1..31` pada RoboForm).
  3. Rentan menghasilkan *false positive* pada jebakan kontekstual (misalnya salah mengasosiasikan kolom tanggal umum `the_date`).

### 4.3 Mengapa GovConnect Unggul (96.9% Recall & 98.4% F1)
- **Ekstraksi DOM 6-Strategi:** Mengambil teks kontekstual dari sel tabel `<td>` dan kontainer tetangga, memungkinkan Pass 2 dan Pass 3 memetakan 12/12 kontrol PasswordManager UK.
- **Hierarki Khusus (Pass 1 & 1.5):** Menyelesaikan 100% pola prefiks lawas dan dropdown tanggal numerik.
- **Veto Terskop & Margin Guard:** Mencegah kontaminasi silang domain nama dan relasi keluarga, menjaga Precision tetap **100.0%**.

---

## 5. Kesimpulan Integrasi Makalah

Hasil evaluasi empiris baseline ini secara resmi menggantikan kolom pembanding hipotetis pada **Tabel 2 (`govconnect_lncs_paper.tex`)**, menyajikan data kuantitatif yang kokoh untuk menjawab kritik A5 secara tuntas.

