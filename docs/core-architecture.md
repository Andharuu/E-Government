# GovConnect — Core Matching Engine: Technical Architecture & Analysis

> **Versi:** 1.0 — September 2026
> **Scope:** Analisis mendalam sistem Field Matching Engine pada `content_script.js`, evaluasi peningkatan algoritma, tinjauan kritis multi-perspektif, dan roadmap implementasi.
> **Dokumen terkait:** [`System Architecture.md`](./System%20Architecture.md), [`PRD.md`](./PRD.md)

---

## Daftar Isi

1. [Sistem Matching Saat Ini](#1-sistem-matching-saat-ini)
2. [Evaluasi Peningkatan Algoritma](#2-evaluasi-peningkatan-algoritma)
3. [Tinjauan Kritis — Perspektif Peneliti](#3-tinjauan-kritis--perspektif-peneliti)
4. [Tinjauan Kritis — Perspektif Software Architect](#4-tinjauan-kritis--perspektif-software-architect)
5. [Final Boss — Keterbatasan Fisik DOM](#5-final-boss--keterbatasan-fisik-dom)
6. [Roadmap Implementasi](#6-roadmap-implementasi)
7. [Known Limitations yang Didokumentasikan](#7-known-limitations-yang-didokumentasikan)

---

## 1. Sistem Matching Saat Ini

### 1.1 Pipeline `matchProfileKey()` — 3 Phase

Fungsi ini adalah jantung sistem, dipanggil untuk setiap elemen HTML pada halaman target.

```
┌─────────────────────────────────────────────────────────────┐
│                    matchProfileKey(el)                       │
├─────────────────────────────────────────────────────────────┤
│  Pass 0 │ HTML5 autocomplete attribute (W3C standard map)   │
│         │ → 100% confidence, O(1) lookup                    │
│         │ → return langsung jika match                      │
├─────────────────────────────────────────────────────────────┤
│  Phase 1│ Exact + Normalized String Match vs KEYWORD_MAP    │
│         │ → strip numeric prefix, expand ABBREVIATION_MAP   │
│         │ → 6 normalisasi paralel per keyword               │
│         │ → return langsung jika match                      │
├─────────────────────────────────────────────────────────────┤
│  Phase 2│ Hardcoded Semantic Shortcuts (token-based rules)  │
│         │ → 17 aturan eksplisit (email, phone, NIK, dll.)  │
│         │ → Context modifiers: hasIbu, hasAyah, hasDarurat  │
│         │ → return langsung jika match                      │
├─────────────────────────────────────────────────────────────┤
│  Phase 3│ Hybrid Scoring (Cosine + Levenshtein + Bonus)     │
│         │ score = 0.70×Cosine + 0.30×Levenshtein           │
│         │ + context_bonus (max +0.40)                       │
│         │ threshold ≥ 0.58 → return bestCandidate           │
│         │ else → return null (tidak diisi)                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Formula Scoring Phase 3 (Eksisting)

```
score = 0.70 × CosineSimilarity(input_tokens, keyword_tokens)
      + 0.30 × LevenshteinSimilarity(input_normalized, keyword_normalized)
      + Σ context_bonus

threshold: score ≥ 0.58 → match valid
```

**Context bonus yang tersedia:**

| Token hadir | Profile key | Bonus |
|-------------|-------------|-------|
| hasIbu | mother_name | +0.25 |
| hasAyah | father_name | +0.25 |
| hasDarurat + hasTelp | emergency_contact_phone | +0.30 |
| hasKampus | institution | +0.30 |
| inputTokens.includes("first") | first_name | +0.35 |
| inputTokens.includes("age") | age | +0.40 |

### 1.3 `bestMatchOption()` — Dropdown Matching

Untuk elemen `<select>`, PrimeNG, dan React-Select, digunakan pipeline terpisah:

```
Step 1 → Exact match value/text  (O(1))
Step 2 → DROPDOWN_VALUE_MAP synonym lookup (gender, religion, marital_status, dll.)
Step 3 → NLP Hybrid: 0.65×Cosine + 0.35×Levenshtein + 0.20×overlap bonus
         threshold ≥ 0.48
```

### 1.4 Kelemahan yang Teridentifikasi

| # | Masalah | Dampak |
|---|---------|--------|
| 1 | Levenshtein tidak menangkap transposisi | Singkatan ambigu salah map |
| 2 | Cosine TF lemah untuk field 1–2 token | Skor flat, tidak diskriminatif |
| 3 | Tidak ada IDF | "nama" dan "kependudukan" bobotnya sama |
| 4 | Threshold tunggal 0.58 | Tidak ada confidence level — binary output |
| 5 | Tidak ada prefix stripper semantik | `form_nama` vs `form_telepon` bisa false positive |
| 6 | Zero handling Shadow DOM | Web Components tidak terdeteksi sama sekali |
| 7 | Zero handling iFrame | Form dalam iframe tidak terisi |
| 8 | `attributes: true` pada MutationObserver | Ratusan trigger berlebih pada form Angular/React |

---

## 2. Evaluasi Peningkatan Algoritma

### 2.1 Jaro-Winkler Similarity

**Kasus penggunaan:** Mencocokkan `name`/`id` field HTML pendek dengan singkatan/typo.

**Keunggulan vs Levenshtein saat ini:**
- Memberikan bobot ekstra pada **prefix match** — relevan karena HTML field sering berbagi awalan
- Lebih akurat untuk string pendek (1–8 karakter)
- Lebih toleran terhadap transposisi karakter

```
Jaro-Winkler("frstname", "firstname") ≈ 0.95
Levenshtein ("frstname", "firstname") ≈ 0.73
```

**Titik buta kritis — Jebakan Prefix Statis e-gov:**

Developer e-gov Indonesia sering menggunakan prefix statis untuk semua elemen:
```
form_nama, form_alamat, form_telepon, data_diri_nik
```

Jaro-Winkler yang membandingkan `form_nama` vs `form_telepon` menghasilkan skor semu tinggi (~0.91) karena prefix `form_` cocok di karakter-karakter awal. JW yang sensitif terhadap awalan justru menjadi kelemahan dalam konteks ini.

**Solusi wajib — Prefix Stripper dengan guard:**

```javascript
const STRIPPABLE_PREFIXES = [
  "inp_", "form_", "txt_", "data_", "field_", "fld_",
  "ctrl_", "el_", "reginput_", "isian_", "kolom_", "input_"
];
const MIN_REMAINDER = 3; // karakter minimum setelah stripping

function stripSemanticPrefix(str) {
  if (!str || str.length < MIN_REMAINDER) return str;
  let result = str.toLowerCase(); // Normalisasi ke lowercase agar startsWith() tidak gagal pada CamelCase (Form_, Data_)
  // Iterasi max 2x untuk handle double prefix: "form_data_nik" → "nik"
  for (let i = 0; i < 2; i++) {
    const matched = STRIPPABLE_PREFIXES.find(p => result.startsWith(p));
    if (!matched) break;
    const candidate = result.slice(matched.length);
    // Guard: jangan strip jika sisa < 3 karakter
    if (candidate.length >= MIN_REMAINDER) {
      result = candidate;
    } else {
      break;
    }
  }
  return result;
}
```

**Edge case yang ditangani:**

| Input | Hasil | Status |
|-------|-------|--------|
| `inp_nama` | `nama` | ✅ Strip normal |
| `form_data_nik` | `nik` (2 iterasi) | ✅ Double prefix |
| `data` | `data` (sisa < 3) | ✅ Guard aktif |
| `inp_id` | `inp_id` (sisa < 3) | ✅ Guard aktif |

> **Catatan penting:** Prefix stripper harus dijalankan **sebelum Phase 1 Exact Match** juga, bukan hanya sebelum JW. `stripNumericPrefix()` yang ada (L112) hanya menangani angka — belum menangani prefix semantik.

**Estimasi gain murni Jaro-Winkler:** +7–10% untuk field legacy dengan singkatan/typo.

---

### 2.2 BM25 (Okapi BM25)

**Kasus penggunaan:** Mencocokkan label teks panjang (4+ token) ke keyword map dengan IDF weighting.

**Formula:**
```
BM25(q, d) = Σ IDF(qi) × [TF(qi,d) × (k1+1)] / [TF(qi,d) + k1(1 - b + b×|d|/avgdl)]
```

**Keunggulan vs Cosine TF biasa:**
- IDF memberi bobot lebih tinggi pada kata langka ("kependudukan") vs kata umum ("nama")
- TF saturation mencegah overfit pada kata yang berulang

**Masalah IDF pada Korpus Kecil:**

Jika IDF dihitung dinamis dari ~50 profile keys saja, kata umum tidak terpenalti dengan benar karena distribusinya di dalam 50 keys tidak mencerminkan bahasa alami formulir nyata. Ini adalah *circular reasoning* — IDF dihitung dari kamus yang sama dengan yang akan di-query.

**Solusi — Static IDF Dictionary dari Korpus Domain-Spesifik:**

Jangan hitung IDF dari KEYWORD_MAP. Pre-komputasi dari crawl 50–100 form e-gov (SIMPEL, OSS, DJP, Dukcapil): ekstrak semua `label`/`placeholder`/`name`/`id` (~5.000–20.000 token unik), hitung IDF, bundle sebagai `idf_dict.json` (~50 KB). Saat ekstensi berjalan, BM25 hanya lookup O(1).

> ⚠️ **Wikipedia Bahasa Indonesia bukan sumber yang tepat.** Distribusi kata "kependudukan" di Wikipedia sangat berbeda dengan di form e-gov. IDF dari Wikipedia akan *underpenalize* kata-kata birokrasi yang justru paling penting. Gunakan crawl e-gov sebagai ground truth.

**Keterbatasan yang perlu didokumentasikan:** Static IDF mengalami *data drift*. Jika terminologi birokrasi bergeser ("KTP" → "Identitas Kependudukan Digital / IKD"), model menjadi bias hingga pembaruan berikutnya.

**Estimasi gain murni BM25:** +5–8% untuk field dengan label panjang Bahasa Indonesia formal.

---

### 2.3 ONNX SBERT — Tidak Viable untuk Chrome Extension MV3

**Analisis teknis:**

| Aspek | Nilai | Batas MV3 Service Worker |
|-------|-------|--------------------------|
| Model size (multilingual) | 90–250 MB | — |
| Service Worker memory limit | — | ~50 MB |
| Cold start | 800ms–2s | — |
| SW lifecycle | Di-kill browser sebelum model load | — |

> **Kesimpulan: SBERT di dalam Service Worker MV3 adalah ketidakcocokan platform, bukan masalah implementasi.**

**Alternatif viable — Chrome Offscreen Documents API (Chrome 109+):**

Offscreen Document memiliki akses memori setara tab biasa tanpa hard limit. Model terkuantisasi INT8:

| Model | Size INT8 | Bahasa | Rekomendasi |
|-------|-----------|--------|-------------|
| all-MiniLM-L6-v2 | ~22 MB | EN dominan | ✅ Viable untuk fallback |
| paraphrase-multilingual-MiniLM-L12-v2 | ~116 MB | ID+EN | ⚠️ Berat, pertimbangkan ulang |

**Catatan Offscreen Documents:**
- Hanya bisa ada 1 offscreen document per extension
- Bisa di-kill browser saat memory pressure
- Belum tersedia di Firefox/Edge Extension

---

### 2.4 Estimasi Peningkatan Akurasi Per Skenario

| Skenario | Sistem Saat Ini | + JW | + BM25 | + JW + BM25 |
|----------|----------------|------|--------|-------------|
| Form gov legacy (singkatan) | ~82% | ~91% | ~84% | **~94%** |
| Label bahasa campuran ID+EN | ~75% | ~80% | ~88% | **~95%** |
| Field hanya ada label DOM | ~60% | ~65% | ~70% | **~88%** |
| Field ambigu (nama ibu vs nama depan) | ~72% | ~85% | ~78% | **~90%** |

---

### 2.5 Formula Hybrid Engine V2 (Target State)

**Pipeline yang diusulkan:**

```
matchProfileKey(el)
├── Pass 0   : HTML5 autocomplete → return [100% confidence]
├── Phase 1  : Exact/Normalized Match KEYWORD_MAP
│              (dengan stripSemanticPrefix) → return
├── Phase 1.5: ⭐ Jaro-Winkler setelah semantic prefix strip
│              → return jika jwScore ≥ 0.90
├── Phase 2  : Semantic shortcuts hardcoded → return
├── Phase 2.5: ⭐ BM25 Label Match (hanya jika label > 4 token)
│              → return jika bm25Score ≥ 0.80
└── Phase 3  : Ensemble Scoring (3-tier confidence zone)
               score = 0.50×Cosine + 0.35×JW + 0.15×Overlap + contextBonus
               ≥ 0.85 → early exit
               0.60–0.85 → konfirmasi 1 metrik tambahan
               0.55–0.60 → full ensemble voting
               < 0.55 → return null
```

| Komponen | Bobot Lama | Bobot Baru | Alasan |
|----------|-----------|-----------|--------|
| Cosine | 70% | 50% | Kurangi dominasi untuk field pendek |
| Levenshtein → JW | 30% | 35% | JW lebih akurat untuk HTML field |
| Overlap bonus | +20% ad-hoc | 15% terintegrasi | Normalisasi dalam formula |

---

## 3. Tinjauan Kritis — Perspektif Peneliti

### 3.1 Ensemble vs Early Exit Cascade

**Masalah:** Early exit di Phase 1.5 rawan false positive. Jika JW menghasilkan skor tinggi karena singkatan ambigu, padahal BM25 dari label panjang memiliki jawaban lebih akurat, sistem sudah terlanjur return.

**Solusi — 3-Tier Confidence Zone:**

```
score ≥ 0.85     → Early exit (highly confident)
0.60 ≤ score < 0.85 → Jalankan konfirmasi 1 metrik tambahan
                      (BM25 jika name-based, JW jika label-based)
score < 0.60     → Full ensemble voting semua metrik → argmax
```

Ini mencegah false positive tanpa overhead penuh di setiap field, dan lebih pragmatis dari full ensemble yang menambah latency signifikan pada form besar.

### 3.2 Magic Numbers & Grid Search

Bobot `0.50 × Cosine + 0.35 × JW` dan threshold `0.85/0.60/0.55` adalah *magic numbers* tanpa justifikasi empiris.

**Untuk paper akademis — syarat Grid Search yang valid:**

1. **Metrik:** Gunakan Precision-weighted F1 (bukan F1 biasa) — false positive autofill lebih berbahaya dari false negative; isi field salah lebih buruk dari tidak isi sama sekali
2. **Dataset minimum:** ≥100–150 annotated fields dari ≥10 form e-gov berbeda (jangan hanya dari 1 situs)
3. **Cross-validation:** k=5 fold dengan stratified sampling per field type (text, select, radio, custom dropdown)
4. **Dokumentasi:** Buktikan bahwa bobot 0.35 untuk JW menghasilkan kurva F1 tertinggi vs 0.30 atau 0.40

### 3.3 Privasi pada Remote Semantic Fallback

Mengirim label DOM ke backend — meskipun bukan *value* pengguna — berpotensi melanggar klaim **"100% Privacy-Preserving"** jika placeholder/label mengandung PII tersirat (contoh: placeholder yang di-generate dinamis berisi data spesifik).

**Satu-satunya path yang konsisten dengan privacy claim:**  
Offscreen Documents + quantized ONNX model. Jika backend tetap digunakan, harus ada:
- Regex sanitization ekstrem sebelum data keluar dari browser
- Explicit disclosure di privacy policy
- Revisi klaim privasi di paper menjadi "privacy-preserving by default"

---

## 4. Tinjauan Kritis — Perspektif Software Architect

### 4.1 Over-Stripping — Pedang Bermata Dua

Guard minimum: **string tidak boleh di-strip jika karakter tersisa < 3.**

Stripper harus dijalankan di **Phase 1 juga**, bukan hanya sebelum JW. `stripNumericPrefix()` yang ada (L112) hanya menangani angka — tidak menangani prefix semantik seperti `form_`, `data_`.

### 4.2 SPA & DOM Mutation — Celah pada Implementasi yang Ada

MutationObserver sudah ada di L2244–2302 dengan debounce 400ms, tetapi ada **tiga celah aktif:**

**Celah A — `attributes: true` terlalu lebar (Bug Aktif):**

```javascript
// Saat ini — trigger setiap hover/animasi CSS class
observer.observe(target, {
  childList: true,
  subtree: true,
  attributes: true,                               // ← BUG
  attributeFilter: ["style", "class", "hidden"]
});
```

Pada form Angular berat (CoreTax DJP), setiap `mouseover` yang mengubah class `ng-dirty`/`ng-touched`/`is-focused` memicu mutation. Ratusan trigger per detik saat user mengetik.

**Fix — Pisahkan menjadi dua observer:**

```javascript
// Observer 1: Deteksi form/elemen baru (childList only)
observer.observe(target, { childList: true, subtree: true });

// Observer 2: Deteksi form tersembunyi yang muncul (targeted)
const visibilityObserver = new MutationObserver((mutations) => {
  const revealedForm = mutations.some(m =>
    m.type === "attributes" &&
    (m.target.tagName === "FORM" || m.target.closest("form, [role='dialog']"))
  );
  if (revealedForm && !isFillingProcess) debouncedFormUpdate();
});
document.querySelectorAll("form, [role='dialog'], [role='tabpanel']").forEach(el =>
  visibilityObserver.observe(el, {
    attributes: true,
    attributeFilter: ["style", "class", "hidden"]
  })
);
```

**Celah B — Debounce tanpa maxWait:**

SPA yang terus-menerus animate DOM bisa menunda `FORM_UPDATED` tanpa batas karena setiap mutation me-reset timer. Tambahkan maxWait = 1500ms sehingga bahkan dalam burst mutation, update tetap terjadi dalam batas waktu yang terprediksi.

**Celah C — `FORM_UPDATED` tidak punya handler di `background.js` (Silent Failure):**

Content script mengirim `chrome.runtime.sendMessage({ action: "FORM_UPDATED" })` tetapi `background.js` tidak memiliki handler untuk action ini. Pesan hanya menjangkau side panel jika terbuka. Untuk mode 1-klik, ini *silent failure* — tidak crash, tidak melakukan apa-apa.

### 4.3 Data Drift & Mekanisme Pembaruan Dictionary

**Dua masalah berbeda yang perlu penanganan terpisah:**

**Masalah A — `KEYWORD_MAP` + `ABBREVIATION_MAP` hardcoded:** Tidak ada update mechanism. Terminologi birokrasi berevolusi tanpa pembaruan ekstensi.

**Masalah B — Static IDF (akan dibangun):** Perlu mekanisme fetch berkala.

**Solusi — Versioned Fetch dengan Integrity Check:**

```javascript
// background.js
async function checkAndUpdateDictionaries() {
  const remoteManifest = await fetch("https://govconnect.app/dict-manifest.json")
    .then(r => r.json()).catch(() => null);
  if (!remoteManifest) return;

  const stored = await chrome.storage.local.get("govconnect_keyword_version");
  if (remoteManifest.keyword_version !== stored.govconnect_keyword_version) {
    const data = await fetch("https://govconnect.app/keyword-map.json").then(r => r.json());
    // Validasi SHA-256 checksum sebelum menyimpan
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(data)));
    const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
    if (hashHex === remoteManifest.keyword_checksum) {
      await chrome.storage.local.set({
        govconnect_keyword_map: data,
        govconnect_keyword_version: remoteManifest.keyword_version
      });
    }
  }
}
// Panggil saat extension startup
chrome.runtime.onStartup.addListener(checkAndUpdateDictionaries);
chrome.runtime.onInstalled.addListener(checkAndUpdateDictionaries);
```

Content script load dari storage, fallback ke bundled map jika storage kosong.

---

## 5. Final Boss — Keterbatasan Fisik DOM

### 5.1 Shadow DOM

**Status saat ini:** Zero handling. `getAllFormFields()` menggunakan `document.querySelectorAll` yang blind total terhadap shadow roots.

**Urgensi untuk e-gov Indonesia:** Medium. Situs prioritas (CoreTax DJP, SSCASN, OSS, Dukcapil) belum menggunakan native Web Components. Ini adalah *technical debt* yang harus di-address sebelum skala deployment meluas ke portal yang lebih modern.

**Solusi — Recursive Shadow Piercing:**

```javascript
function querySelectorAllDeep(selector, root = document) {
  const results = [];
  results.push(...root.querySelectorAll(selector));
  const allElements = root.querySelectorAll("*");
  for (const el of allElements) {
    if (el.shadowRoot) {
      // Rekursif masuk ke shadow root yang terbuka
      results.push(...querySelectorAllDeep(selector, el.shadowRoot));
    }
  }
  return results;
}
```

**Observer pool untuk shadow roots (mencegah memory leak via WeakMap):**

```javascript
const shadowObservers = new WeakMap();

function observeShadowRoots() {
  document.querySelectorAll("*").forEach(el => {
    if (el.shadowRoot && !shadowObservers.has(el.shadowRoot)) {
      const shadowObs = new MutationObserver(debouncedMutationHandler);
      shadowObs.observe(el.shadowRoot, { childList: true, subtree: true });
      shadowObservers.set(el.shadowRoot, shadowObs); // Track agar tidak double-observe
    }
  });
}
```

**Performance caveat:** `querySelectorAllDeep` adalah O(n²) di worst case. Mitigasi: cache hasil dan invalidasi hanya saat MutationObserver fires.

**Known limitations Shadow DOM:**

| Jenis | Status | Alasan |
|-------|--------|--------|
| Open shadow root (`mode: "open"`) | ✅ Bisa ditembus | `el.shadowRoot` accessible |
| Closed shadow root (`mode: "closed"`) | ❌ Tidak bisa | W3C spec — `el.shadowRoot === null` by design |

---

### 5.2 Cross-Origin iFrame

**Status saat ini:** `manifest.json` tidak memiliki `all_frames: true`. Content script hanya berjalan di top-level frame. Zero handling untuk form di dalam iframe.

**Klasifikasi iFrame dan solvabilitas:**

```
┌────────────────┬──────────────────┬─────────────────┐
│  SAME-ORIGIN   │   CROSS-ORIGIN   │   SANDBOXED     │
│    iFrame      │     iFrame       │     iFrame      │
├────────────────┼──────────────────┼─────────────────┤
│ ✅ Fully       │ ✅ Partial:      │ ❌ Tidak bisa   │
│ solvable.      │ CS ter-inject    │ (allow-scripts  │
│ Prioritas:     │ via all_frames,  │ tidak di-set    │
│ kerjakan kini  │ isi field dalam  │ oleh site)      │
│                │ iframe sendiri   │                 │
└────────────────┴──────────────────┴─────────────────┘
```

**Perubahan `manifest.json` yang diperlukan:**

```json
"content_scripts": [{
  "matches": ["<all_urls>"],
  "js": ["content_script.js"],
  "run_at": "document_idle",
  "all_frames": true
}],
"permissions": [
  "sidePanel", "activeTab", "scripting", "storage",
  "tabs", "contextMenus",
  "webNavigation"
]
```

> ⚠️ **Kepatuhan Chrome Web Store:** Penambahan izin `webNavigation` umumnya memicu **manual review** yang lebih ketat dari Google. Saat mengunggah ke Chrome Web Store, sertakan justifikasi yang jelas pada halaman privasi dan formulir submission — jelaskan bahwa izin ini digunakan *semata-mata* untuk mengidentifikasi frame ID pada halaman aktif saat autofill, bukan untuk melacak riwayat navigasi pengguna.

**Arsitektur messaging multi-frame di `background.js`:**

```javascript
async function executeOneClickAutofill(tab, token, cachedProfile) {
  // ... existing top-frame code ...

  // Koordinasi ke semua child frame
  const frames = await chrome.webNavigation.getAllFrames({ tabId: tab.id });
  const childFrames = frames.filter(f => f.frameId !== 0 && f.parentFrameId === 0);

  for (const frame of childFrames) {
    try {
      await chrome.tabs.sendMessage(tab.id,
        { action: "EXECUTE_ONE_CLICK_AUTOFILL", profile: profile },
        { frameId: frame.frameId }  // ← target frame spesifik
      );
    } catch {
      // Frame mungkin tidak accessible — skip gracefully
    }
  }
}
```

**Deteksi konteks di `content_script.js`:**

```javascript
const IS_INSIDE_IFRAME = window.self !== window.top;

if (IS_INSIDE_IFRAME) {
  // Mode iframe: terima perintah langsung via frameId targeting
  // JANGAN jalankan MutationObserver penuh — overhead tidak perlu
  // Listener sudah ada dan akan menerima via chrome.runtime.onMessage
}
```

**Known limitations iFrame:**

| Jenis | Status | Alasan |
|-------|--------|--------|
| Same-origin iframe | ✅ Fully solvable | CS ter-inject, messaging direct via frameId |
| Cross-origin iframe (dalam host_permissions) | ✅ Solvable | CS ter-inject, isi field di dalam iframe-nya |
| Cross-origin iframe (luar host_permissions) | ✅ Butuh `<all_urls>` | Sudah ada di manifest saat ini |
| Sandboxed iframe | ❌ Tidak bisa | Platform browser restriction |

---

## 6. Roadmap Implementasi

### Priority Matrix

| # | Item | Severity | Effort | Sprint |
|---|------|----------|--------|--------|
| 1 | Hapus `attributes: true` dari observer utama | 🔴 High | 5 menit | **Sekarang** |
| 2 | `all_frames: true` + `webNavigation` di manifest | 🔴 High | 30 menit | **Sekarang** |
| 3 | Implementasi `stripSemanticPrefix()` + guard 3-char | 🔴 High | 1 jam | Sprint 1 |
| 4 | Ganti `computeLevenshteinSimilarity` → Jaro-Winkler | 🟡 Medium | 1 jam | Sprint 1 |
| 5 | Tambah handler `FORM_UPDATED` di `background.js` | 🟡 Medium | 30 menit | Sprint 1 |
| 6 | Debounce maxWait = 1500ms pada MutationObserver | 🟡 Medium | 1 jam | Sprint 1 |
| 7 | iFrame messaging architecture (frameId targeting) | 🟡 Medium | 1 hari | Sprint 2 |
| 8 | BM25 dengan Static IDF Dictionary (crawl e-gov) | 🟡 Medium | 3 hari | Sprint 2 |
| 9 | Shadow DOM recursive piercing + observer pool | 🟢 Low | 2 hari | Sprint 3 |
| 10 | Versioned dictionary fetch + SHA-256 integrity | 🟢 Low | 2 hari | Sprint 3 |
| 11 | Offscreen Document + Quantized ONNX (Stretch) | 🟢 Low | 1 minggu | Sprint 4 |

### Diagram Pipeline Target (Setelah Implementasi Penuh)

```
matchProfileKey(el)
│
├─ Pass 0: HTML5 autocomplete (W3C map, O(1))
│   └─ return profileKey [100% confidence]
│
├─ Phase 1: Exact/Normalized + stripSemanticPrefix + ABBREVIATION_MAP
│   └─ return profileKey [high confidence]
│
├─ Phase 1.5 ⭐: Jaro-Winkler (setelah semantic prefix strip)
│   └─ jwScore ≥ 0.90 → return profileKey
│
├─ Phase 2: Semantic shortcuts (17 hardcoded rules)
│   └─ return profileKey
│
├─ Phase 2.5 ⭐: BM25 Label Match (label > 4 token, static IDF)
│   └─ bm25Score ≥ 0.80 → return profileKey
│
└─ Phase 3: 3-Tier Ensemble Scoring
    score = 0.50×Cosine + 0.35×JW + 0.15×Overlap + contextBonus
    ├─ score ≥ 0.85 → early exit → return bestCandidate
    ├─ 0.60 ≤ score < 0.85 → +1 confirmation metric → argmax
    ├─ 0.55 ≤ score < 0.60 → full ensemble → argmax
    └─ score < 0.55 → return null (tidak diisi)
```

---

## 7. Known Limitations yang Didokumentasikan

Keterbatasan berikut bersifat *by design* dari platform atau W3C spec — bukan kekurangan implementasi. Harus dicantumkan secara eksplisit di paper, README, dan dokumentasi pengguna.

| Keterbatasan | Akar Penyebab | Mitigasi |
|-------------|---------------|---------|
| Closed Shadow DOM (`mode: "closed"`) | W3C spec — intentional security boundary | Dokumen sebagai known limitation |
| Sandboxed iFrame (tanpa `allow-scripts`) | Platform browser restriction | Dokumen sebagai known limitation |
| Cross-origin iFrame SOP barrier | Same-Origin Policy W3C | Partial workaround via frameId messaging |
| Service Worker memory limit ~50 MB (MV3) | Chrome MV3 architecture | Mitigasi via Offscreen Documents |
| ONNX SBERT tidak viable di Service Worker | Chrome MV3 SW lifecycle | Alternatif: Offscreen Document + INT8 model |
| Static IDF data drift | Dictionary statis | Mitigasi via versioned fetch + SHA-256 |
| Formulir yang membutuhkan interaksi sebelum muncul | SPA lazy loading | MutationObserver + debounce maxWait |

---

*Dokumen ini merangkum hasil analisis teknis multi-sesi dan menjadi referensi tunggal (single source of truth) untuk pengembangan Matching Engine GovConnect ke depan.*

*Last updated: September 2026 | Maintainer: GovConnect Engineering*
