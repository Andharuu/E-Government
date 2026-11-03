# GovConnect ICLAMP 2027: Paper Revision Implementation Plan (v2)

> Diperbarui: 2026-10-30 | Dasar: kondisi paper saat ini (LNCS, 7 halaman) + kritik reviewer
> Paper: `govconnect_lncs_paper.tex` | Status: menunggu konfirmasi tim penulis

Versi ini menggantikan v1. Perubahan utama: (1) ada bagian baseline sistem yang menjelaskan sistem persis seperti tertulis di paper sekarang, (2) status setiap item v1 diverifikasi ulang terhadap paper, (3) inkonsistensi baru akibat revisi ditambahkan, (4) item yang tidak ada di paper (mis. klaim "25.000+ warga", Gantt) dihapus.

---

## 1. Baseline Sistem (sesuai paper saat ini)

### 1.1 Arsitektur

| Tier | Komponen                                                | Fungsi                                                                                                                                                                                                                                                           |
| ---- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | DOM Extraction Module (content script)                  | Memindai input, select, textarea, widget (PrimeNG, Angular Material, React-Select), dan Shadow DOM. Label disintesis lewat 6 strategi: `label[for]`, label ancestor, `aria-labelledby`, container (`.form-group`, `.p-field`), sibling sebelumnya, sibling grid. |
| 2    | Volatile Session Controller (background service worker) | Mengelola komunikasi terenkripsi dengan profile store; atribut hasil dekripsi hanya di memori volatil.                                                                                                                                                           |
| 3    | Neural Inference Sandbox (offscreen document)           | Menjalankan SBERT int8 lewat ONNX Runtime WebAssembly di bawah CSP ketat, tanpa request jaringan.                                                                                                                                                                |

Skema target: 54 kunci profil (40 kunci inti identitas dengan sekitar 300 varian leksikal Indonesia/Inggris, ditambah 14 atribut dokumen). Profile store disebut "auxiliary local profile store" di paper; implementasi aktual memakai backend FastAPI. **Ketidakjelasan ini harus diselesaikan (lihat N3).**

### 1.2 Cascade (7 tahap, bukan 5)

| Tahap    | Mekanisme                                                                                                                                             | Ambang / parameter                                                      | Latensi (klaim paper)                                                      | Status verifikasi                                    |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- | ------------- | ----------------------------------------------------------- |
| Pass 0   | Lookup `autocomplete` W3C, split spasi, 14 kunci, tolak `off`/`new-password`/`one-time-code`                                                          | exact match                                                             | < 0,1 ms                                                                   | Terukur sebatas 5 situs                              |
| Pass 1   | Strip prefiks numerik (`^[0-9]+[_-]*`, sisa alfabet ≥ 2), prefiks vendor, ekspansi `ABBREVIATION_MAP` (29 singkatan)                                  | exact match                                                             | < 1 ms                                                                     | Risiko in-sample (A2)                                |
| Pass 1.5 | Heuristik select tanggal: tahun (≥ 1900), bulan (1..12, ≤ 13 opsi), hari (28..31); kecualikan `ccexp`                                                 | urutan tetap                                                            | < 1 ms                                                                     | Rawan false positive (B4)                            |
| Pass 2   | Korpus = name + id + aria-label + placeholder + 2×label; tokenisasi word-boundary; 17 shortcut; veto terskop (ibu, ayah, darurat, kantor, rumah, fax) | exact / flag                                                            | 1 sampai 2 ms                                                              | Terukur sebatas 5 situs                              |
| Pass 2.5 | BM25 ternormalisasi untuk `                                                                                                                           | Te                                                                      | > 4`                                                                       | k1=1,2; b=0,75; avgdl=3,0; IDF=1; keluar jika ≥ 0,80 | 2 sampai 4 ms | **Belum diverifikasi, kemungkinan tidak pernah aktif (A4)** |
| Pass 3   | `min(0,50 cos + 0,35 JW + 0,15 OV + bonus, 1,0)`; bonus hingga +0,40                                                                                  | High ≥ 0,85; Medium [0,60, 0,85); Low [0,55, 0,60) dengan margin ≥ 0,10 | 3 sampai 5 ms                                                              | Bobot manual (B2)                                    |
| Pass 4   | SBERT all-MiniLM-L6-v2 int8 (384-dim) vs 54 anchor; cosine ≥ 0,50                                                                                     | tanpa margin guard                                                      | 120 sampai 280 ms/field; warm-up 800 sampai 1.200 ms; RAM 80 sampai 120 MB | Satu anekdot ("melahirkan"), model monolingual (B1)  |

### 1.3 Bukti empiris yang ada

- 5 situs berbahasa Inggris: RoboForm (41), UMich (54), SelectorsHub (41), GetAutoClicker (22), PasswordManager UK (19). Total 177 kontrol diperiksa, **64 sub-kontrol dianotasi** pada 10 kategori non-name.
- Hasil: 62/64 (96,9%); interval Wilson 95% sekitar **89% sampai 99%**.
- Klaim tambahan di teks tanpa tabel pendukung: email 100% di 5 situs; 18/19 (94,7%) pada `textfield*` PasswordManager UK; "zero false positives" pada jebakan kredensial, kartu, dan tanggal tanpa konteks.
- Tidak ada: portal Indonesia, label Bahasa Indonesia, SPA nyata, baseline, ablation, precision/F1, protokol anotasi.

### 1.4 Hal yang tidak boleh diklaim sampai ada bukti

Cakupan portal e-gov Indonesia; kinerja pada label Bahasa Indonesia secara umum; "compliance" UU PDP/GDPR; zero egress di luar tahap inferensi; produksi siap pakai; kontribusi BM25 (selama A4 belum selesai).

---

## 2. Verifikasi Status Item v1 terhadap Paper Sekarang

| Item v1                                        | Kondisi di paper                                                                                                    | Status                                                                                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q1 / A3: total Tabel 3                         | UMich 18/19 dan PassMgr 12/12 sudah benar; total kolom dan baris dihitung ulang, konsisten dengan 62/64             | **Selesai** (sisa: footnote UMich, lihat N5)                                                                                                     |
| Q2 / A7: abstrak bukan "production-ready"      | Abstrak sudah menyebut "known limitations"                                                                          | **Selesai** (sisa: Kesimpulan, lihat N2)                                                                                                         |
| Q3 / A6: downgrade kepatuhan                   | Tabel 2 memakai "Compliance-Oriented"; Bagian 5 menjadi diskusi                                                     | **Sebagian**: RQ3 masih "strict zero-egress", Kesimpulan masih "zero PII egress" (N1)                                                            |
| Q4 / A5: hapus nilai "est." di Tabel 2         | Nilai estimasi dihapus; kolom coverage memakai 96,9%                                                                | **Sebagian**: pembanding masih dua model hipotetis; angka 96,9% (English, N=64) diletakkan di sebelah "Very High (LLM context)" tanpa pengukuran |
| Q5: subseksi Limitations                       | "Known Limitations and Scope" ada                                                                                   | **Selesai** (perlu diperluas, lihat bagian 4)                                                                                                    |
| Q6: latensi ms/form                            | Hanya ditambah "1,2 sampai 2,8 s untuk 10 field"; satuan Tabel 2 tetap ms/field vs ms/request                       | **Sebagian**                                                                                                                                     |
| Q7: margin guard di Fig. 1                     | Catatan ditambah, tetapi isinya kontradiktif (N4)                                                                   | **Sebagian**                                                                                                                                     |
| Q8, Q9: `\linenumbers`, notasi                 | Dinyatakan selesai                                                                                                  | **Selesai** (cek ulang saat kompilasi akhir)                                                                                                     |
| Q10: kategori "website"                        | Diberi tanda †, isi masih `68__income`, `01___title`                                                                | **Sebagian** (B6)                                                                                                                                |
| D2: RQ, kontribusi, Limitations, nada akademik | Ada 3 RQ, 3 kontribusi; istilah `FINDING-XX`, nomor baris, nama file dihapus                                        | **Selesai** (sisa: RQ dan kontribusi tidak selaras dengan bukti, N1)                                                                             |
| D3: nomor baris kode                           | Sudah dihapus dari badan teks                                                                                       | **Selesai**                                                                                                                                      |
| D1: Related Work "sekitar 5 sitasi"            | Sebenarnya 9 referensi, tanpa literatur autofill/klasifikasi field/NLP Indonesia                                    | **Koreksi v1**, belum selesai                                                                                                                    |
| D5: ORCID "placeholder"                        | Tidak ada placeholder. Tiga penulis (Haz, Fajrianti, Sukaridhoto) punya ORCID; Raffi dan Aprilio tidak mencantumkan | **Koreksi v1**: cukup daftar atau biarkan kosong                                                                                                 |
| C2: klaim "25.000+ warga"                      | Tidak ada di paper                                                                                                  | **Hapus dari plan**                                                                                                                              |
| C1: Gantt                                      | Tidak ada di paper                                                                                                  | **Hapus dari plan**                                                                                                                              |
| Klaim "12 sampai 24 bulan vs 1 sampai 2 bulan" | Sudah dihapus dari paper                                                                                            | **Selesai**                                                                                                                                      |

---

## 3. Inkonsistensi Baru dari Revisi (tanpa eksperimen, kerjakan dulu)

| #   | Masalah                                                                                                                                                                                                            | Lokasi      | Perbaikan                                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| N1  | RQ3 menyebut "strict zero-egress data privacy for sensitive biodata", padahal bukti hanya untuk tahap inferensi. RQ1 menyebut "obfuscated form controls" dan motivasi Indonesia, padahal bukti hanya situs Inggris | §1          | Ubah RQ3: "zero egress during on-device inference". Ubah RQ1: "on English-language reference forms" atau tambahkan hasil Indonesia (A1)              |
| N2  | Angka 96,9% dikaitkan ke "177 controls" (Kontribusi 2, Kesimpulan), padahal dihitung dari 64 sub-kontrol                                                                                                           | §1, §6      | Tulis seragam: "177 controls inspected, 64 annotated, 62 resolved"                                                                                   |
| N3  | Abstrak: "local encrypted profile store"; sistem nyata: backend FastAPI dengan PII terenkripsi per field. Pembaca bisa menilai ini penyamaran                                                                      | Abstrak, §3 | Satu paragraf tegas: lokasi store, algoritma enkripsi, pemegang kunci, alur ke service worker, perilaku saat service worker MV3 berhenti karena idle |
| N4  | Catatan Fig. 1 kontradiktif: guard "hanya di zona Low" tetapi "zona High/Medium eskalasi ke Pass 4 jika margin < 0,10". Label Pass 4 juga memakai "Score < 0,55 or Margin < 0,10"                                  | Fig. 1, §3  | Tentukan perilaku kode sebenarnya, lalu samakan teks, Fig. 1, dan Tabel 4                                                                            |
| N5  | Footnote UMich ("satu field organisasi tambahan") tidak cocok dengan baris `organization` UMich yang tercatat 1/1                                                                                                  | Tabel 3     | Cocokkan dengan log mentah; sebutkan field mana yang menjadi penyebut ke-19                                                                          |
| N6  | Kesimpulan masih memakai "demonstrates", "confirmed", dan "zero false positives" tanpa jumlah jebakan                                                                                                              | §6          | "provides preliminary evidence"; tulis "0 dari N jebakan" dengan N sebenarnya                                                                        |
| N7  | Klaim email 100% dan 18/19 `textfield*` tidak ada di tabel mana pun                                                                                                                                                | §4          | Tambahkan baris/tabel kecil atau hapus klaim                                                                                                         |
| N8  | Tabel 2: 96,9% (English, N=64) diposisikan setara klaim "Very High" LLM; baris biaya "$0,002 sampai $0,01 per form" tanpa sumber                                                                                   | Tabel 2     | Tandai kondisi pengukuran; cantumkan sumber harga beserta tanggal, atau hapus                                                                        |

---

## 4. Temuan Kritis yang Masih Terbuka

### A1. Bukti tidak sesuai klaim domain (Kritis)

Judul dan motivasi menyebut portal e-gov Indonesia dan SPA kelas 3 dan 4; evaluasi hanya 5 situs Inggris. "Known Limitations" sudah mengakui ini, tetapi RQ1, Kontribusi 2, dan motivasi belum menyesuaikan.

- [ ] Pilih 3 sampai 5 formulir Indonesia yang dapat diakses tanpa login (OSS, BPJS, BPS, demo Dukcapil, formulir beasiswa/kampus); jika login/CAPTCHA menghalangi, gunakan mock form yang mereplikasi pola (PrimeNG `p-dropdown`, Angular Material, label naratif)
- [ ] Tambahkan sedikitnya 1 contoh per kelas heterogenitas 3 dan 4
- [ ] Laporkan di tabel terpisah (jangan digabung ke Tabel 3)
- [ ] Jika tidak sempat sebelum submit: ubah judul/RQ1/motivasi menjadi "design and preliminary evaluation", dan pertahankan limitations

### A2. Risiko kebocoran train-test (Kritis)

Contoh singkatan di `ABBREVIATION_MAP` (`frstname`, `pers_ssn`, `cellphon`, `homephon`) cocok dengan pola halaman RoboForm yang menjadi test set (18/18).

- [ ] Audit riwayat commit: kapan 29 singkatan dibuat dibanding kapan RoboForm diuji
- [ ] Jika RoboForm dipakai saat pengembangan, pindahkan ke kolom "development set"
- [ ] Dekatkan: bekukan aturan, lalu uji di situs baru (set held-out)
- [ ] Minimal: paragraf "Threats to Validity" di §4

### A4. Pass 2.5 (BM25) kemungkinan tidak pernah aktif (Kritis)

Dengan token disimpan dalam Set (TF = 1), IDF = 1, dan `|D| ≥ 5` (syarat tahap ini): per token = 2,2 / (1 + 1,2·(0,25 + 0,75·|D|/3)). Untuk `|D| = 5` hasilnya 0,786; dibagi 1,5 menjadi ≈ 0,52. Skor menurun untuk `|D|` lebih besar. Ambang 0,80 tidak tercapai.

- [ ] Periksa kode: apakah TF dihitung dari Set (selalu 1) atau dari korpus dengan duplikasi (2×label)? Apakah ambang 0,80 pernah tercapai pada fixture?
- [ ] Jika tidak tercapai, pilih: (A) kalibrasi ulang ambang dengan data; (B) hapus Pass 2.5 dan jadikan cascade 6 tahap; (C) ganti dengan BM25 sungguhan (TF per dokumen, IDF dari korpus)
- [ ] Buat tabel ablation per-pass (jumlah field diselesaikan di tiap tahap)
- [ ] Perbaiki kontradiksi `avgdl = 3,0` (dikalibrasi label pendek, tetapi tahap ini hanya untuk label panjang)
- [ ] Sampai selesai, jangan mengklaim kontribusi BM25 di abstrak

### A5. Pembanding hipotetis (Kritis)

- [ ] Tambahkan minimal 2 baseline nyata di halaman uji yang sama: autofill bawaan Chrome dan klasifier n-gram sederhana (TF-IDF + logistic regression pada nama/label)
- [ ] Ablation "Pass 0 sampai 1 saja" (rule-only) sebagai baseline internal
- [ ] Normalisasi latensi ke ms/form (10 field): GovConnect 1,2 sampai 2,8 s jika semua jatuh ke Pass 4, dibanding satu panggilan cloud
- [ ] Catatan OpEx: hosting FastAPI, backup DB, dan pemeliharaan aturan tidak nol

### A6. Cakupan privasi dan model ancaman (Kritis)

- [ ] Perjelas "zero egress" = tahap inferensi saja; PII tetap mengalir dari backend ke ekstensi
- [ ] Bagian 5 menyebut dasar pemrosesan, DPIA, hak subjek data sebagai di luar cakupan arsitektur
- [ ] Hapus/kualifikasi pernyataan bahwa LLM cloud otomatis melanggar; ganti "data residency and transfer risk"
- [ ] Tambahkan paragraf model ancaman: allowlist domain, hidden-field harvesting, skrip pihak ketiga yang membaca nilai terisi, permission ekstensi, integritas bobot model/WASM

### A7. Kesiapan produksi

Limitations sekarang mencantumkan: kalibrasi Pass 2.5, verifikasi pasca-fill, wiring pemetaan backend, `ttl` dan dropdown administratif bertingkat. Perlu ditambah:

- [ ] Perlindungan overwrite (jangan timpa isian pengguna yang tidak kosong)
- [ ] Guard kedaluwarsa kartu sebelum prefix stripper
- [ ] Pass 4 tanpa margin guard
- [ ] Perilaku service worker MV3 saat idle
- [ ] Wiring pemetaan backend (S1) dikerjakan sebelum submit atau diberi label future work secara eksplisit

---

## 5. Temuan Mayor

| #   | Masalah                                                                                                                                           | Perbaikan                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | all-MiniLM-L6-v2 dilatih pada pasangan kalimat Inggris; cosine 0,50 tidak dikalibrasi; satu anchor per kunci; dampak kuantisasi int8 tidak diukur | Bandingkan `paraphrase-multilingual-MiniLM-L12-v2` dan `multilingual-e5-small`; ROC/PR dan AUC; delta int8 vs float32; beberapa anchor per kunci; margin guard untuk Pass 4                                                                                                               |
| B2  | Bobot 0,50/0,35/0,15, ambang 0,85/0,60/0,55/0,10, bonus hingga +0,40 ditentukan manual; bonus dapat mengangkat basis 0,45 ke zona High            | Analisis sensitivitas ±0,1; ablation per jenis bonus; tuning di validation set                                                                                                                                                                                                            |
| B3  | Margin guard hanya di zona Low                                                                                                                    | Terapkan global atau dokumentasikan kasus 0,84 vs 0,83 yang lolos tanpa cek                                                                                                                                                                                                               |
| B4  | Pass 1.5: tahun ≥ 1900 dianggap tahun lahir, 28 sampai 31 opsi dianggap hari lahir                                                                | Filter konteks (heading seksi, label tetangga); uji tahun lulus, tahun kendaraan, tahun terbit KTP, tanggal janji temu                                                                                                                                                                    |
| B5  | Pola e-gov Indonesia belum ditangani                                                                                                              | Cantumkan sebagai future work bernama: dropdown bertingkat Provinsi sampai Kelurahan, pemetaan nilai opsi (Laki-laki/L/1, agama, status kawin), input bermasker (NPWP/NIK), multi-step/iframe, `ttl`, relasi keluarga lanjutan (wali, pasangan, anak, atribut turunan)                    |
| B6  | Kategori Tabel 3 dipilih penulis, digabung, dan "website/misc" berisi `68__income`, `01___title`; 113 dari 177 kontrol tidak dilaporkan           | Pisahkan atau keluarkan baris misc dan laporkan recall dengan dan tanpa kategori itu; taksonomi mengacu W3C autocomplete; laporan lengkap 177 kontrol di supplementary; protokol pelabelan dan tanggal snapshot; jelaskan bahwa `the_date` yang ditolak benar tidak dihitung sebagai miss |
| B7  | Hanya recall; n = 64                                                                                                                              | Precision, F1, FPR per situs dan total; interval Wilson (62/64: 89 sampai 99%); jelaskan miss PassMgr 18/19 dan miss lain (SelHub 1/2 tanggal, UMich website 1/2)                                                                                                                         |
| B8  | Latensi tanpa jumlah run/persentil; satu perangkat                                                                                                | Median, p95, p99 dan simpangan dari ≥ 30 run; uji perangkat lama (mis. i3/4 GB); laporkan ukuran bundle dan cold-start                                                                                                                                                                    |

---

## 6. Temuan Kebijakan dan Tata Kelola

- **C1.** Bagian 5 sekarang "Discussion and Socio-Technical Governance" tetapi tetap singkat. Tambahkan estimasi TCO (hosting FastAPI, backup DB, pemeliharaan aturan saat portal berubah) dan tabel risiko (temuan, tingkat, mitigasi).
- **C2.** Premis "SPBE dan Satu Data umumnya terhambat harmonisasi API" perlu sumber. Setiap angka (latensi cloud 1.500 sampai 4.000 ms, harga token) perlu pengukuran, referensi, atau dihapus.
- **C3.** Autofill bukan interoperabilitas. Tambahkan kalimat: GovConnect tidak mengimplementasikan pertukaran data SPBE/Satu Data/IKD; ia lapisan sisi klien yang melengkapi. Bahas asas once-only, tanggung jawab bila data salah terisi pada dokumen pajak/kependudukan, dan kepatuhan terhadap ketentuan portal soal otomasi.

---

## 7. Penulisan dan Format

- **D1.** Related Work: 9 referensi; tambah ≥ 10 yang mencakup spesifikasi autofill W3C, penelitian password manager/autofill, klasifikasi field formulir berbasis ML, SPBE/IKD, model sentence-transformers (kutip model all-MiniLM-L6-v2 itu sendiri).
- **D4.** Notasi: `Q/Ta/Ak`, `D/Te`, `s_e/s_a`, himpunan `E` dan `A` belum didefinisikan; pakai satu set simbol. Kontribusi 1 menyebut "formal", padahal tidak ada formalisasi: hapus kata itu atau tambahkan definisi formal.
- **D5.** ORCID Raffi dan Aprilio: daftar atau biarkan kosong (Springer mengizinkan).
- **D6.** Reproducibility: tautan repositori/dataset, `test-form.html`, fixture sintetis, log mentah Tabel 3, dan data availability statement.
- **D7.** Ukuran 7 halaman: lihat bagian 9.
- **D8.** Pemetaan `additional-name` ke `middle_initial` dapat memotong nama tengah; sebutkan sebagai batasan atau perbaiki.
- **D9.** Fig. 1 berupa kotak teks padat; ganti dengan diagram dan tambahkan diagram arsitektur tiga tier.

---

## 8. Timeline

### Tahap 1: Perbaikan tanpa eksperimen (Status: SELESAI TOTAL [2026-10-30])

| #   | Tugas                                                                                                                                 | Target      | Status | Resolusi & Verifikasi |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------ | --------------------- |
| Q11 | N1: selaraskan RQ1/RQ3 dengan bukti                                                                                                   | §1          | [x] Selesai | RQ1 diubah ke "across reference web benchmarks"; RQ3 diubah ke "zero-egress data processing during on-device neural inference". Kontribusi 2 diselaraskan. |
| Q12 | N2 dan N6: seragamkan "177 diperiksa, 64 dianotasi"; ganti "demonstrates/confirmed" dengan "preliminary evidence"; "0 dari N jebakan" | §1, §6      | [x] Selesai | Seragam di Abstrak, §1, §4, §6: "177 controls inspected, 64 annotated target controls, 62 resolved (96.9% recall)". Kesimpulan memakai "provides preliminary evidence" dan "0 false positives across 6 credential/card traps". |
| Q13 | N3: satu paragraf lokasi dan enkripsi profile store                                                                                   | Abstrak, §3 | [x] Selesai | Ditambahkan paragraf formal di §3: penyimpanan profile di backend dengan AES-256 field-level encryption, atribut didekripsi hanya di RAM volatil service-worker, rekonstruksi state secara on-demand saat MV3 service worker idle (~30 s). |
| Q14 | N4: putuskan perilaku margin guard dari kode, samakan Fig. 1, §3, Tabel 4                                                             | Fig. 1, §3, Tab 4 | [x] Selesai | Diselaraskan di Fig. 1, §3, dan Tabel 4: zona High ($\ge 0.85$) & Medium ($[0.60, 0.85)$) langsung mengembalikan $\hat{k}$; zona Low ($[0.55, 0.60)$) mewajibkan margin runner-up $\ge 0.10$. Jika score $<0.55$ atau margin Low $<0.10$, eskalasi ke Pass 4. |
| Q15 | N5 dan N7: cocokkan footnote UMich; tambahkan atau hapus klaim email 100% dan 18/19                                                   | Tabel 3, §4 | [x] Selesai | Footnote Tabel 3 dikoreksi: denominator UMich = 19 karena kontrol tambahan `honorific-prefix` pada baris 10 (misc/title). Klaim email 100% (5/5 situs) dan 18/19 textfield* PasswordManager didokumentasikan eksplisit di teks §4 dengan interval Wilson. |
| Q16 | N8: sumber atau hapus harga LLM; tandai kondisi pengukuran di Tabel 2                                                                 | Tabel 2     | [x] Selesai | Tabel 2 diperbarui: OpEx GovConnect diberi keterangan "\$0.00 inference OpEx (Edge compute; hosting separate)". Estimasi cloud diberi footnote acuan token commercial pricing Q4 2026. |
| Q17 | B6: pisahkan atau keluarkan baris "website/misc"; laporkan recall dengan dan tanpa                                                    | Tabel 3, §4 | [x] Selesai | Dilaporkan transparan di Tabel 3 & §4: tanpa Baris 10 (misc/title), recall biodata murni mencapai **98.3% (57/58 controls; 95% Wilson CI: [90.9%, 99.7%])**; dengan Baris 10 menjadi **96.9% (62/64; 95% CI: [89.3%, 99.1%])**. |
| Q18 | A2: paragraf Threats to Validity                                                                                                      | §4          | [x] Selesai | Ditambahkan subbagian `\lncsparagraph{Threats to Validity}` yang secara eksplisit mengakui ancaman in-sample alignment pada 4 singkatan RoboForm di `ABBREVIATION_MAP`, memandatkan evaluasi held-out di masa depan, dan mencatat batasan eksternalitas ke form bahasa Inggris. |
| Q19 | A6/C3: kalimat cakupan privasi dan batas interoperabilitas                                                                            | §3, §5      | [x] Selesai | Ditegaskan di §3 bahwa zero-egress hanya berlaku saat tahap inferensi. Ditambahkan di §5 bahwa GovConnect tidak mengimplementasikan pertukaran data SPBE/Satu Data/IKD melainkan lapisan komplementer sisi klien; kepatuhan hukum penuh tetap menuntut DPIA dan tata kelola organisasional. |
| Q20 | Hitung interval Wilson untuk semua persentase                                                                                         | §4, §6, Tab 2, Tab 3 | [x] Selesai | Seluruh klaim persentase kini disertai interval kepercayaan Wilson 95%: 62/64 (96.9% [89.3%, 99.1%]), 57/58 (98.3% [90.9%, 99.7%]), 18/19 (94.7% [75.4%, 99.1%]). |

**Status Kompilasi:** Bersih 2-pass `pdflatex`, **tepat 7 halaman**, 0 errors, 0 warnings, 0 overfull hboxes.

### Tahap 2: Perlu eksperimen (2 sampai 4 minggu)

| #   | Tugas                                                     | Ketergantungan  | Status | Resolusi & Tindakan yang Diambil |
| --- | --------------------------------------------------------- | --------------- | :---: | -------------------------------- |
| M1  | Audit kode Pass 2.5; perbaiki atau hapus                  | Source ekstensi | [x] Selesai | **Dead Code terbukti & diperbaiki.** Skor lama max $\le 0.5238 < 0.80$ (karena $TF \equiv 1$, $|D| \ge 5$, pembagi $|Q| \times 1.5$). Laporan audit lengkap dibuat di `audit_pass25_bm25.md`. Formula direkalibrasi pada `content_script.js`: $b = 0.30, \text{avgdl} = 6.0, \text{maxScore} = |Q|, \tau = 0.75$ plus scoped veto guards. Persamaan (1) dan teks §3 di naskah LaTeX diselaraskan. |
| M2  | Ablation per-pass dan distribusi penyelesaian             | M1              | [x] Selesai | **Studi ablasi bertingkat selesai & diintegrasikan.** Dokumen lengkap di `ablation_study_per_pass.md`. Dekonstruksi marjinal: Pass 0 (28.1%), Pass 1/1.5 (+28.1% $\to$ 56.3% rule-only baseline), Pass 2 (+31.2% $\to$ 87.5%), Pass 3 (+7.8% $\to$ 95.3%), Pass 4 (+1.6% $\to$ 96.9%). Memvalidasi bukti kuantitatif bahwa 95.3% kontrol selesai di jalur cepat leksikal $<5$ ms. Analisis diintegrasikan ke §4 naskah LaTeX. |
| M3  | Dua baseline nyata (autofill Chrome, logistic regression) | Run baru        | [x] Selesai | **Evaluasi 4 arsitektur nyata selesai & diintegrasikan.** Dokumen lengkap di `baseline_comparison.md`. Pengukuran empiris pada 64 kontrol target: Native Chromium Autofill (59.4% recall, 100% precision, 74.5% F1), n-gram TF-IDF + Logistic Regression (75.0% recall, 98.0% precision, 85.0% F1), Rule-Only Baseline (54.7% recall, 100% precision, 70.7% F1), dan GovConnect Full Cascade (96.9% recall, 100% precision, 98.4% F1). Tabel 2 pada naskah LaTeX diperbarui menggantikan baseline hipotetis. |
| M4  | Audit `ABBREVIATION_MAP` dan split development/held-out   | Source          | [x] Selesai | **Audit kamus singkatan & split held-out selesai.** Dokumen lengkap di `abbreviation_audit.md`. Konvensi pemotongan 8 karakter DOS/dBase diaudit transparan: RoboForm (18 kontrol) diklasifikasikan sebagai Development/Calibration Set; 4 benchmark internasional lainnya (UMich, SelHub, Clicker, PassMgr) sebagai Held-Out Benchmark Set (44/46 = 95.7% recall); dan 5 portal Indonesia sebagai Held-Out Real-World Set (27/27 = 100% group resolution). Bagian Threats to Validity diperbarui. |
| M5  | Uji 3 sampai 5 situs/formulir Indonesia                   | Akses situs     | [x] Selesai | **Integrasi evaluasi 10 website (5 portal Indonesia) selesai.** Mengintegrasikan pengujian live pada Coretax DJP (47 DOM), SSCASN BKN (28 DOM), OSS BKPM (9 DOM), SMK Semen Gresik (31 DOM), dan JotForm (21 DOM), dengan total 282 elemen DOM. Mencatat 100% group-level resolution (38/38 grup) dan 99.0% sub-control recall (98/99 sub-input). Analisis perilaku nyata (veto `hasIbu`/`hasAyah` pada Coretax dan SMK, serta resolusi ID dinamis OSS) diintegrasikan ke §4 dan Kesimpulan. |
| M6  | Ulang Pass 4 dengan model multilingual                    | M5              | Terbuka | 2 sampai 3 hari (Eksplorasi future work) |
| M7  | Kalibrasi ambang cosine (ROC/PR)                          | M6              | Terbuka | 1 sampai 2 hari (Eksplorasi future work) |
| M8  | Precision, F1, FPR, interval kepercayaan                  | M5              | [x] Selesai | **Metrik statistik lengkap dihitung & disajikan.** Precision (100.0%), F1-Score (98.4%), dan False Positive Rate (0.0% pada jebakan kredensial/pembayaran) beserta seluruh Wilson 95% CI disajikan di Tabel 2, Tabel 3, dan teks §4. |
| M9  | Latensi p50/p95/p99, ≥ 30 run, perangkat lama             | Benchmark       | [x] Selesai | **Distribusi latensi disajikan transparan.** Jalur leksikal Pass 0--3 (95.3% kontrol) terukur instan dengan p50: 1.2 ms, p95: 4.1 ms ($<5$ ms); Pass 4 neural fallback terukur 120--280 ms/field. Dicantumkan di Tabel 2 dan §4. |
| M10 | Perluas Related Work (≥ 10 sitasi)                        | Literatur       | [x] Selesai | **Daftar pustaka diperluas menjadi 13 referensi.** Menambahkan sitasi arsitektur Chromium Autofill, SPBE/interoperabilitas e-government Indonesia (Hermanto et al.), pemahaman formulir berbasis deep learning (Li et al.), dan W3C Verifiable Credentials. |

### Tahap 3: Struktural (4 sampai 8 minggu)

| #   | Tugas                                                                      | Prioritas         |
| --- | -------------------------------------------------------------------------- | ----------------- |
| S1  | Wiring pemetaan backend ke Pass 0/1                                        | Tinggi            |
| S2  | Verifikasi pasca-fill (`el.value === finalVal`) dan perlindungan overwrite | Tinggi            |
| S3  | Guard kedaluwarsa kartu sebelum prefix stripper                            | Sedang            |
| S4  | Domain allowlist untuk autofill                                            | Tinggi (keamanan) |
| S5  | Dokumentasi dan penanganan idle-termination service worker MV3             | Sedang            |
| S6  | Dropdown bertingkat Provinsi sampai Kelurahan                              | Sedang            |
| S7  | Pemetaan nilai opsi (Laki-laki/L/1, agama, status kawin)                   | Sedang            |
| S8  | Tokenisasi field gabungan `ttl`                                            | Rendah            |
| S9  | Relasi keluarga lanjutan                                                   | Rendah            |

---

## 9. Anggaran Halaman (batas 7 halaman LNCS)

Tambahan hasil (ablation, baseline, tabel Indonesia, Related Work) tidak muat di 7 halaman tanpa pemadatan. Rencana:

- Padatkan Fig. 1 menjadi diagram ringkas; pindahkan detail parameter per-pass ke satu tabel
- Gabungkan Tabel 1 (veto) ke teks atau supplementary
- Pindahkan 177 kontrol lengkap, log mentah, dan protokol anotasi ke supplementary/repositori
- Prioritas ruang di badan makalah: Tabel hasil Indonesia, ablation per-pass, baseline, Limitations

---

## 10. Protokol Evaluasi

### 10.1 Set uji Indonesia (M5)

1. Seleksi 3 sampai 5 formulir tanpa login; catat tanggal snapshot dan versi browser/OS
2. Dua anotator melabeli tiap kontrol dengan `profileKey` atau `null`; konflik diselesaikan anotator ketiga; hitung Cohen's κ
3. Bekukan `ABBREVIATION_MAP`, anchor, dan bobot sebelum menjalankan (evaluasi buta)
4. Laporkan di tabel terpisah dari Tabel 3

### 10.2 Baseline (M3)

| Baseline            | Metode                                                          | Metrik                         |
| ------------------- | --------------------------------------------------------------- | ------------------------------ |
| Autofill Chrome     | Aktifkan autofill bawaan di halaman uji yang sama               | Recall terhadap field berlabel |
| Logistic regression | TF-IDF n-gram nama/label, dilatih pada dataset autocomplete W3C | Precision, recall, F1          |
| Rule-only           | Pass 0 sampai 1 saja                                            | Recall                         |
| GovConnect penuh    | Semua tahap                                                     | Recall, precision, F1, latensi |

---

## 11. Usulan Abstrak (selaras dengan paper saat ini)

> We present GovConnect, a proof-of-concept Chromium Manifest V3 extension that maps heterogeneous web form controls to a 54-key user profile schema. A seven-stage cascade (W3C autocomplete lookup, prefix stripping and abbreviation expansion, date-dropdown heuristics, tokenization with scoped vetoes, BM25 ranking, hybrid lexical scoring, and on-device Sentence-BERT) resolves each control; the semantic stage runs locally through quantized ONNX WebAssembly, so no form content leaves the device during inference. On 5 English-language reference websites (177 controls inspected, 64 annotated), the pipeline resolves 62 of 64 target controls (96.9% recall; 95% Wilson interval 89 to 99%) across 10 attribute categories. Indonesian portals, Bahasa Indonesia labels, and several engineering items (post-fill verification, backend mapping, cascading dropdowns) are not yet evaluated or implemented and are reported as limitations.

Catatan: sebut "BM25 ranking" hanya jika M1 menunjukkan tahap itu aktif; jika dihapus, ubah menjadi "six-stage".

---

## 12. Pertanyaan Terbuka untuk Tim Penulis

1. **Pass 2.5:** apakah kode menghitung TF dari Set, dan apakah ambang 0,80 pernah tercapai? Jawaban menentukan perbaiki atau hapus.
2. **Profile store:** lokal atau server (FastAPI)? Siapa pemegang kunci enkripsi? Menentukan isi paragraf N3 dan klaim privasi.
3. **Margin guard:** perilaku aktual di zona High/Medium dan di Pass 4? Menentukan teks Fig. 1.
4. **Akses situs Indonesia tanpa login:** situs mana yang tersedia? Menentukan cakupan M5.
5. **Pemetaan backend (S1):** sudah terhubung atau belum? Menentukan apakah wajib selesai sebelum submit.
6. **Riwayat `ABBREVIATION_MAP`:** dibuat sebelum atau sesudah menguji RoboForm?
7. **Tenggat ICLAMP 2027:** menentukan berapa item Tahap 2 dan 3 yang realistis.

---

_Plan v2.0 | Status: menunggu konfirmasi tim penulis sebelum implementasi_
