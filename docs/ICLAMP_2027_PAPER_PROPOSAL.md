# Proposal Riset & Strategi Publikasi ICLAMP 2027
**Konferensi:** *The International Conference on the Leadership and Management of Projects in the Digital Age (ICLAMP) 2027*  
**Penyelenggara:** Applied Science University (ASU), Kerajaan Bahrain, bekerjasama dengan mitra internasional (CIB / London South Bank University)  
**Indeks Prosiding:** Springer Nature (Seri: *Projects, Processes, Systems and Networks in the Digital Age* / Scopus)  
**Topik Utama:** *Process Innovation, Resource-Efficient System Engineering, Public Sector Digital Transformation, & Data Governance*

---

## 1. Justifikasi Relevansi Makalah dengan ICLAMP 2027

Konferensi ICLAMP berfokus pada **tata kelola dan kepemimpinan proyek di era digital**, bukan murni kompetisi algoritma *computer science*. Oleh karena itu, naskah riset dari proyek **GovConnect** harus dikemas menggunakan kacamata **Rekayasa Sistem & Manajemen Proyek Publik (*Systems Engineering & Public Project Governance*)**.

### Narasi Utama yang Diusulkan:
1. **Kegagalan Proyek Digitalisasi Klasik:** Proyek integrasi e-Government sering mengalami pembengkakan anggaran (*cost overrun*) dan keterlambatan jadwal (*schedule slippage*) karena resistensi birokrasi dan tingginya biaya perombakan arsitektur *backend* ratusan instansi pemerintah (*siloed legacy systems*).
2. **Inovasi Proses (*Process Innovation*):** GovConnect memperkenalkan paradigma *Non-Invasive Client-Side Interoperability* berbasis *Hybrid Cascade Pipeline*. Pemerintah tidak perlu merekayasa ulang server *legacy*, melainkan menjembatani disparitas data langsung di lapisan pengalaman pengguna (*browser runtime*).
3. **Efisiensi Alokasi Sumber Daya (*Resource Allocation*):** Pendekatan berjenjang (W3C $\rightarrow$ Leksikal $\rightarrow$ BM25 $\rightarrow$ Jaro-Winkler $\rightarrow$ On-Device SBERT) membuktikan bahwa 80%+ interaksi dapat diselesaikan dengan biaya komputasi mendekati nol, mematahkan tren boros komputasi berbasis Cloud LLM API.
4. **Tata Kelola Privasi Data (*Data Privacy Governance*):** Memenuhi standar kedaulatan data (UU PDP / GDPR) melalui prinsip *Zero-Remote Egress* (model AI dan eksekusi WASM berjalan 100% lokal di browser pengguna).

---

## 2. Pilihan Judul Makalah yang Direkomendasikan

* **Opsi 1 (Fokus Rekayasa Sistem & Efisiensi Sumber Daya - Disarankan):**
  > **"A Resource-Efficient Hybrid Cascade Pipeline for Heterogeneous Form Resolution: Overcoming Public Sector Legacy Constraints via Client-Side Edge AI"**
* **Opsi 2 (Fokus Kedaulatan Data & Tata Kelola Privasi Proyek Publik):**
  > **"Privacy-Preserving Form Automation in Digital Government: A Zero-Egress Edge AI Architecture for Citizen-Centric Services"**
* **Opsi 3 (Fokus Manajemen Transformasi Digital & Interoperabilitas Non-Invasif):**
  > **"Non-Invasive Public Service Modernization: Evaluating a Multi-Tiered Semantic Resolution System for Fragmented E-Government Portals"**

---

## 3. Rencana Struktur Makalah Ilmiah (Springer Format)

```
1. INTRODUCTION
   1.1 The Challenge of Digital Public Infrastructure Fragmentation
   1.2 Bureaucratic and Technical Bottlenecks of Centralized API Standardization
   1.3 Research Objectives and Novelty of Client-Side Cascading Integration

2. RELATED WORK & THEORETICAL FOUNDATION
   2.1 Form Field Classification and Information Extraction in Web Engineering
   2.2 Information Retrieval Models (BM25, Jaro-Winkler, Dense Vector Embeddings)
   2.3 Privacy-by-Design and Edge AI in Public Sector Project Governance

3. SYSTEM ARCHITECTURE & CASCADE METHODOLOGY
   3.1 Architectural Topology: Manifest V3, Offscreen Computing, and CSP Constraints
   3.2 Tier-0: Deterministic Resolution via W3C HTML5 Autocomplete Standard
   3.3 Tier-1: Morphological Normalization, Prefix Stripping, and Legacy Abbreviations
   3.4 Tier-2: Tokenized Contextual Modifiers and Cross-Domain Veto Rules
   3.5 Tier-2.5: Normalized BM25 Lexical Ranking for Long Descriptive Labels
   3.6 Tier-3: Argmax Hybrid Lexical Scoring and Calibrated Confidence Zones
   3.7 Tier-4: Privacy-Preserving On-Device SBERT Inference via WebAssembly

4. EMPIRICAL BENCHMARKS & EXPERIMENTAL SETUP
   4.1 Testbed Formulation: Dataset of 120+ Real-World and Synthetic E-Gov Forms
   4.2 Evaluation Metrics: Precision, Recall, F1-Score, Execution Latency, and Memory Footprint
   4.3 Comparative Analysis: Pure Heuristics vs. Cloud LLM vs. GovConnect Hybrid Cascade
   4.4 Ablation Study: Impact of Token-Boundary Guarding and Model Bundling

5. PROJECT MANAGEMENT, POLICY & SOCIO-TECHNICAL IMPLICATIONS
   5.1 Capital Expenditure (CapEx) vs. Operational Expenditure (OpEx) Trade-offs
   5.2 Accelerating Digital Transformation Delivery Cycles without Backend Disruption
   5.3 Compliance with Cross-Border Data Privacy Regulations (GDPR and Indonesia's PDP Law)

6. CONCLUSION & FUTURE DIRECTIONS
   6.1 Summary of Contributions
   6.2 Limitations and Roadmap toward Decentralized Digital Wallets (Self-Sovereign Identity)
```

---

## 4. Persiapan Data Empiris yang Wajib Dilengkapi Menjelang 2027

Untuk memastikan naskah lolos seleksi *peer-review* ketat Springer di ICLAMP 2027, tim riset perlu menyiapkan:

1. **Dataset Formulir (*Corpus Benchmark*):**
   * Mengumpulkan minimal 50–100 formulir layanan publik nyata (Dukcapil, Beasiswa Kemendikbud, Perpajakan DJP CoreTax, Imigrasi, Layanan Pemda) dan formulir uji sintetis ([`test-form.html`](file:///c:/Users/april/E-Government/test-form.html)).
2. **Matriks Evaluasi Kuantitatif:**
   * Menyajikan tabel F1-Score per Pass.
   * Grafik perbandingan latensi jalur leksikal (<5 ms) vs jalur SBERT WASM (120–280 ms).
   * Utilisasi RAM browser pada offscreen document (rata-rata 80–120 MB).
3. **Analisis Kualitatif Manajemen Proyek:**
   * Menjelaskan estimasi perbandingan durasi deployment: integrasi API terpusat antarinstansi (estimasi 12–24 bulan) vs deployment ekstensi sisi klien (estimasi 1–2 bulan).
