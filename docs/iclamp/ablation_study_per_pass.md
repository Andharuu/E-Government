# Studi Ablasi Multi-Tier Cascade Pipeline: Analisis Kontribusi Bertingkat dan Distribusi Latensi

> **Dokumen Riset & Evaluasi Empiris GovConnect ICLAMP 2027**  
> **Tanggal:** 30 Oktober 2026  
> **Item Implementation Plan:** M2 (Ablation Per-Pass dan Distribusi Penyelesaian Kontrol)  
> **Objek Uji:** 5 Benchmark Internasional ($N = 177$ Elemen DOM, 64 Kontrol Dianotasi pada 10 Kategori Non-Name)

---

## 1. Tujuan Studi Ablasi

Studi ablasi ini bertujuan untuk membuktikan secara empiris dan kuantitatif:
1. **Kontribusi Marjinal Tiap Tingkatan (*Marginal Gain*):** Mengetahui persentase kontrol yang berhasil diselesaikan pada tiap tingkatan kaskade (Pass 0 hingga Pass 4).
2. **Validasi Baseline Internal (*Rule-Only* vs. *Hybrid Cascade*):** Membandingkan pendekatan heuristik deterministik murni (Pass 0 s.d. Pass 1.5) dengan kaskade hibrida lengkap.
3. **Korelasi Latensi vs. Akurasi:** Membuktikan klaim bahwa $\ge 80\%$ kontrol web form dapat diselesaikan secara instan ($<5$ ms) pada jalur leksikal tanpa memerlukan beban inferensi neural.

---

## 2. Tabel Ablasi Bertingkat (*Cumulative & Marginal Performance*)

Tabel berikut menyajikan dekonstruksi kinerja pencocokan skema pada 64 kontrol target beranotasi:

| Tingkatan Kaskade | Komponen yang Diaktifkan | Kontrol Terisi Kumulatif | **Recall Kumulatif** | **Marginal Gain** | Latensi Eksekusi per Kontrol |
|:---|:---|:---:|:---:|:---:|:---:|
| **Level 0** | **Pass 0** (W3C HTML5 `autocomplete`) | 18 / 64 | **28.1%** | +28.1% | $< 0.1$ ms |
| **Level 1** | **+ Pass 1 & 1.5** (Prefix Stripper, 29 Singkatan, Dropdown Tanggal) | 36 / 64 | **56.3%** | **+28.1%** | $< 1.0$ ms |
| **Level 2** | **+ Pass 2** (Tokenisasi Word-Boundary, 17 Shortcuts, Scoped Vetoes) | 56 / 64 | **87.5%** | **+31.2%** | $1.0\text{--}2.0$ ms |
| **Level 2.5**| **+ Pass 2.5** (Okapi BM25 Terkalibrasi untuk Label $>4$ Kata) | 56 / 64$^*$ | **87.5%** | *Fast-path* | $2.0\text{--}4.0$ ms |
| **Level 3** | **+ Pass 3** (Clamped Hybrid Scoring: Cosine + Jaro-Winkler + Bonus) | 61 / 64 | **95.3%** | **+7.8%** | $3.0\text{--}5.0$ ms |
| **Level 4** | **+ Pass 4 (Full Cascade)** (On-device Quantized SBERT WASM) | 62 / 64 | **96.9%** | **+1.6%** | $120\text{--}280$ ms |
| **Miss** | Kontrol Tidak Terpetakan (`honorific-prefix`, generic `the_date`) | 2 / 64 | — | 3.1% | — |

$^*$*Catatan:* Pada benchmark 5 situs berbahasa Inggris singkat, Pass 2.5 berfungsi sebagai jalur cepat (*fast-path early exit*) untuk label panjang sebelum Pass 3, sehingga kontribusi recall kumulatifnya bersinergi langsung dengan Pass 3.

---

## 3. Distribusi Resolusi per Situs Uji ($N=64$)

Distribusi tahap penyelesaian akhir (*terminal pass*) pada masing-masing situs uji:

| Website Uji | Target Kontrol | Pass 0 (W3C) | Pass 1 (Prefix/Abbr) | Pass 1.5 (Date) | Pass 2 (Tokens) | Pass 3 (Hybrid) | Pass 4 (SBERT) | Unresolved | Total Recall |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **RoboForm** | 18 | 0 | **15** | **3** | 0 | 0 | 0 | 0 | **18/18 (100%)** |
| **UMich W3C** | 19 | **18** | 0 | 0 | 0 | 0 | 0 | 1 | **18/19 (94.7%)** |
| **SelectorsHub**| 11 | 0 | 0 | 0 | **9** | **1** | 0 | 1 | **10/11 (90.9%)** |
| **GetAutoClicker**| 4 | 0 | 0 | 0 | **4** | 0 | 0 | 0 | **4/4 (100%)** |
| **PasswordManager**| 12 | 0 | 0 | 0 | **7** | **4** | **1** | 0 | **12/12 (100%)** |
| **Total Kontrol** | **64** | **18 (28.1%)** | **15 (23.4%)** | **3 (4.7%)** | **20 (31.3%)** | **5 (7.8%)** | **1 (1.6%)** | **2 (3.1%)** | **62/64 (96.9%)** |

---

## 4. Analisis Temuan Inti

### 4.1 Validasi Hipotesis Latensi Sub-5 Milidetik
- **Pass 0 s.d. Pass 2 (Deterministic & Token Fast-Path):**  
  Menyelesaikan **56 dari 64 kontrol (87.5%)** dalam waktu $< 2.0$ ms.
- **Pass 0 s.d. Pass 3 (Total Leksikal & Heuristik):**  
  Menyelesaikan **61 dari 64 kontrol (95.3%)** dalam waktu $< 5.0$ ms.
- **Hasil:** Klaim pada makalah bahwa *">80% kontrol diselesaikan dalam waktu <5 ms"* terbukti valid dan konservatif (kinerja aktual mencapai **95.3%**).

### 4.2 Evaluasi Baseline Internal: *Rule-Only* vs. *Hybrid Cascade*
- Mengandalkan aturan baku saja (*Rule-Only: Pass 0 + 1 + 1.5*) hanya mampu menjaring **56.3%** kontrol. Sistem gagal total ketika menghadapi formulir modern yang menolak atribut standar W3C atau mengaburkan atribut `name` (seperti `textfield*` pada PasswordManager UK dan SelectorsHub).
- Integrasi **Pass 2 (Word-Boundary Tokenization & Scoped Vetoes)** memberikan lonjakan kinerja terbesar (**+31.2% marginal gain**), membuktikan pentingnya penguraian camelCase dan pemisahan domain semantik konteks.
- Integrasi **Pass 3 & Pass 4** memberikan penyempurnaan akhir sebesar **+9.4%**, berhasil mengatasi obfuskasi DOM ekstrem dan deskripsi peran ambigu tanpa menghasilkan *false positive*.

---

## 5. Ringkasan Implementasi ke Makalah Ilmiah

Temuan dari studi ablasi ini diintegrasikan ke dalam naskah `govconnect_lncs_paper.tex` Bagian 4 (Empirical Evaluation), dengan menyajikan:
1. Pembagian terperinci persentase terminal pass ($28.1\%$ di Pass 0, $28.1\%$ di Pass 1/1.5, $31.3\%$ di Pass 2, $7.8\%$ di Pass 3, dan $1.6\%$ di Pass 4).
2. Perbandingan formal efikasi *Rule-Only* ($56.3\%$) vs *Hybrid Cascade* ($96.9\%$).

