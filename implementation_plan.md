# 🔍 Laporan Inspeksi & Implementation Plan — GovConnect

> **STATUS:** READ-ONLY ANALYSIS — Tidak ada kode yang dimodifikasi.
> **Tanggal:** 2026-10-04 | **Inspektor:** Antigravity (Software Architect Mode)

---

## RINGKASAN EKSEKUTIF

Ditemukan **4 bug kritis** yang saling berkaitan dan menyebabkan degradasi performa menyeluruh pada ekstensi GovConnect. Sumber masalah tersebar di 4 file berbeda: backend activity router/service, offscreen.js, dan content_script.js.

---

## BUG #1 — Backend Error 500: `flush_activity_logs` Worker Tidak Pernah Dimulai

### 📂 File yang Terdampak
- [`activity_service.py`](file:///c:/Users/BR/E-Government/backend/app/services/activity_service.py) — Baris 165–185
- [`main.py`](file:///c:/Users/BR/E-Government/backend/app/main.py) — Baris 47

### 🔍 Temuan Root Cause

**Masalah A — `flush_activity_logs` tidak pernah di-await / dijalankan sebagai background task yang nyata.**

Di [`main.py` baris 47](file:///c:/Users/BR/E-Government/backend/app/main.py#L47):
```python
flush_task = asyncio.create_task(flush_activity_logs())
```
`asyncio.create_task()` memang menciptakan task, tetapi ada **kondisi race condition** yang fatal: jika event loop belum sepenuhnya berjalan saat `lifespan` context manager dipanggil, atau jika uvicorn menggunakan worker mode yang tidak kompatibel, task ini bisa `silently fail` atau tidak pernah dieksekusi sama sekali.

**Masalah B — Logic `flush_activity_logs` mengandung cacat logika `break` yang salah:**

Di [`activity_service.py` baris 172–176](file:///c:/Users/BR/E-Government/backend/app/services/activity_service.py#L172-L176):
```python
for _ in range(10):
    await asyncio.sleep(FLUSH_INTERVAL / 10.0)  # sleep 0.5 detik
    async with queue_lock:
        if len(activity_queue) >= MAX_QUEUE_SIZE:
            break  # ← BUG: break keluar dari for, BUKAN dari while!
```
Pernyataan `break` di sini hanya keluar dari loop `for _ in range(10)` — yang **memang sudah akan selesai setelah 10 iterasi**. `break` tidak memberikan nilai tambah apapun. Intent kode adalah memeriksa queue setiap 0.5 detik dan *flush lebih cepat* jika queue penuh. Logika ini berfungsi secara kebetulan, namun sangat membingungkan dan rentan kesalahan di masa depan.

**Masalah C — `_bulk_insert_activities` adalah fungsi SYNCHRONOUS yang dipanggil via `asyncio.to_thread`:**

Di [`activity_service.py` baris 184–185](file:///c:/Users/BR/E-Government/backend/app/services/activity_service.py#L184-L185):
```python
await asyncio.to_thread(_bulk_insert_activities, records_to_insert)
```
`asyncio.to_thread()` menjalankan fungsi di thread pool executor. Masalahnya: `_bulk_insert_activities` di baris 153 membuat `SessionLocal()` baru jika `db=None`. SQLAlchemy session **tidak thread-safe** bila digunakan bersamaan dengan koneksi pool yang sama. Di environment tertentu (terutama saat `--reload` aktif), ini bisa menyebabkan:
- Database lock error → Exception tidak tertangkap → `flush_task` crash
- Queue menumpuk hingga penuh → Endpoint POST `/api/v1/activities` melempar **Error 500**

**Masalah D — Error 500 disebabkan oleh unhandled exception di `push_activity_to_queue`:**

Ketika `flush_task` crash (akibat masalah C), `activity_queue` terus terisi (`activity_queue.append(activity_data)` di baris 146) namun tidak pernah di-drain. Setelah queue melebihi batas memori atau kondisi internal lain, panggilan ke `push_activity_to_queue` melempar exception yang akhirnya ter-catch oleh global exception handler di `main.py` baris 138–147, menghasilkan **HTTP 500** dengan latensi tinggi (4 detik).

**Masalah E — `FIELD_LABELS` dictionary di `activity_service.py` baris 38 masih menggunakan `mother_name`:**
```python
"mother_name": "Nama Ibu",  # ← Tidak konsisten dengan nama field di DB
```
Ini menyebabkan label "Nama Ibu" tidak muncul dengan benar di analytics jika filled_fields_summary sudah menggunakan key yang benar.

---

## BUG #2 — Performa SBERT: `semanticCache` Direset Setiap Request

### 📂 File yang Terdampak
- [`offscreen.js`](file:///c:/Users/BR/E-Government/extension/offscreen.js) — Baris 44–45

### 🔍 Temuan Root Cause

Ini adalah **bug tata letak scope (scoping bug) yang sangat kritis**:

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "PING_OFFSCREEN") { ... }

  // ← BUG FATAL: semanticCache dibuat DI DALAM listener!
  const semanticCache = new Map();  // Baris 45 — DIRESET setiap pesan masuk!

  if (message.action === "SEMANTIC_FALLBACK") { ... }
});
```

`const semanticCache = new Map()` dideklarasikan **di dalam** callback `onMessage.addListener`. Artinya, setiap kali sebuah pesan diterima (termasuk `PING_OFFSCREEN`), cache ini di-reset menjadi Map kosong baru. Cache tidak pernah benar-benar menyimpan apapun lintas-request.

> **Efek:** Setiap `SEMANTIC_FALLBACK` request selalu memicu kalkulasi SBERT penuh (embed query label + embed 54 reference labels + cosine similarity), yang memakan **2–4 detik CPU** per request.

**Masalah sekunder:** `getReferenceEmbeddings` *sudah memiliki cache level-modul* (`referenceEmbeddingsCache` di baris 145), tetapi karena `semanticCache` di dalam listener tidak berfungsi, setiap request label yang *sama* tetap memanggil `processSemanticFallback` → memanggil `extractor([labelText])` untuk query embedding baru. Yang di-cache hanya **reference embeddings** (54 profile keys), bukan **hasil akhir mapping** per label.

---

## BUG #3 — Schema Mismatch: `mother_name` vs `mothers_name`

### 📂 File yang Terdampak
- [`offscreen.js`](file:///c:/Users/BR/E-Government/extension/offscreen.js) — Baris 93 (`PROFILE_KEY_LABELS`)
- [`content_script.js`](file:///c:/Users/BR/E-Government/extension/content_script.js) — Baris 278, 535, 1269, 1281–1282, 2396
- [`activity_service.py`](file:///c:/Users/BR/E-Government/backend/app/services/activity_service.py) — Baris 38
- [`sidepanel.js`](file:///c:/Users/BR/E-Government/extension/sidepanel.js) — Baris 952

### 🔍 Temuan Root Cause

Setelah inspeksi menyeluruh, situasinya lebih kompleks dari yang tampak:

**Database Schema (Source of Truth):**
- `entities.py` baris 51: `mother_name = Column(String(255), ...)` ← DB column = `mother_name`
- `schemas.py` baris 50: `mother_name: Optional[str] = None` ← Pydantic schema = `mother_name`

Artinya, **nama field yang BENAR di database dan Pydantic adalah `mother_name`**, bukan `mothers_name`.

**Namun, masalah SINKRONISASI terjadi di lapisan extension:**

| Lokasi | Key yang Digunakan | Status |
|--------|---------------------|--------|
| `offscreen.js:93` SBERT returns | `mother_name` | ✅ Benar |
| `content_script.js:278` KEYWORD_MAP key | `mother_name` | ✅ Benar |
| `content_script.js:1281` fallback lookup | `mother_name` OR `mothers_name` | ⚠️ Ambigu |
| `content_script.js:1269` test profile data | Punya KEDUANYA (`mother_name` + `mothers_name`) | ⚠️ Redundan |
| `content_script.js:2396` context bonus | `mother_name` | ✅ Benar |
| `activity_service.py:38` FIELD_LABELS | `mother_name` | ✅ Benar |

**Masalah sebenarnya:** SBERT di `offscreen.js` mengembalikan key `mother_name` (karena itulah key di `PROFILE_KEY_LABELS` baris 93). Ketika `background.js` me-relay `SEMANTIC_RESULT` ke `content_script.js`, `profileKey: "mother_name"` diterima. Kemudian di `content_script.js:1280`, kode mencari `profile["mother_name"]` — **yang ADA di profil** karena API backend mengembalikan field `mother_name`. Jadi alur ini sebenarnya **sudah benar**.

**Bug sesungguhnya** adalah: test profile dummy di baris 1269–1270 memiliki *kedua* key (`mother_name` dan `mothers_name`), yang menyembunyikan masalah saat testing. Di production, jika ada logika lain yang mengirimkan `profileKey: "mothers_name"` (misalnya dari kamus keyword yang memiliki `"mothers_name"` sebagai keyword input di baris 280), maka `profile["mothers_name"]` akan `undefined` karena API hanya mengembalikan `mother_name`. Fallback di baris 1281–1282 memang menangani ini, tetapi `filled_fields_summary` yang dikirim ke backend akan berisi `"mothers_name"` bukan `"mother_name"`, sehingga `FIELD_LABELS.get("mothers_name")` di `activity_service.py:123` akan `undefined` dan menampilkan `"Mothers Name"` di analytics.

---

## BUG #4 — Form 3 Debounce: `FORM_UPDATED` Tidak Memicu Re-Scan Konten

### 📂 File yang Terdampak
- [`content_script.js`](file:///c:/Users/BR/E-Government/extension/content_script.js) — Baris 2554–2579
- [`background.js`](file:///c:/Users/BR/E-Government/extension/background.js) — Baris 455–458
- [`sidepanel.js`](file:///c:/Users/BR/E-Government/extension/sidepanel.js) — Baris 467–473

### 🔍 Temuan Root Cause

**Masalah A — `FORM_UPDATED` dari content_script tidak membawa konteks form mana yang berubah:**

```javascript
// content_script.js baris 2566 & 2576
chrome.runtime.sendMessage({ action: "FORM_UPDATED" }).catch(() => {});
```

Pesan `FORM_UPDATED` dikirim tanpa payload apapun — tidak ada `tabId`, `formId`, atau identifikasi form mana yang baru muncul. Background.js hanya meneruskan `{ success: true }` tanpa re-routing (baris 455–458). Sidepanel.js menerima dan memanggil `detectPageFields()` (baris 472), tetapi ini adalah **full re-scan** yang mahal.

**Masalah B — `maxWait` terlalu pendek untuk Form 3 (multi-step / lazy-render):**

```javascript
// content_script.js baris 2561–2568
if (!maxWaitTimer) {
    maxWaitTimer = setTimeout(() => {
        clearTimeout(mutationDebounceTimer);
        maxWaitTimer = null;
        if (!isFillingProcess) {
            chrome.runtime.sendMessage({ action: "FORM_UPDATED" }).catch(() => {});
        }
    }, 1500);  // ← maxWait = 1500ms
}

// baris 2572–2578: debounce delay = 400ms
mutationDebounceTimer = setTimeout(() => { ... }, 400);
```

Form 3 yang menggunakan lazy-render (misalnya React/Angular yang render step-by-step setelah user klik "Lanjut") sering menghasilkan **burst of mutations** selama 500–2000ms. Dengan `debounce = 400ms`, setiap mutation baru mereset timer — sehingga `FORM_UPDATED` tidak pernah terkirim sampai burst berhenti selama 400ms penuh. Jika burst berlangsung >1500ms, `maxWaitTimer` memang memaksa trigger, tetapi pada saat itu form mungkin belum selesai render. Nilai `maxWait = 1500ms` tidak memadai untuk SPA dengan animasi transisi.

**Masalah C — Tidak ada `attachVisibilityObserver` dinamis untuk form yang ditambahkan setelah DOMContentLoaded:**

```javascript
// sidepanel.js baris 467–473
if (message.action === "FORM_UPDATED") {
    if (currentActiveScreen === "screenResult" || isAutofillingInProgress) {
        return;  // ← Guard yang baik
    }
    detectPageFields();  // ← Ini memanggil full DETECT_FIELDS ke content_script
}
```

`attachVisibilityObserver()` di content_script baris 2669–2676 hanya memasang observer pada elemen form yang ADA saat halaman load awal. Form 3 yang di-inject secara dinamis (via JS `document.createElement("form")` atau React portal) **tidak akan ter-observe** oleh `visibilityObserver`. Akibatnya, ketika Form 3 ditampilkan (misalnya saat user klik tab "Data Orang Tua"), `visibilityObserver` tidak memicu `debouncedFormUpdate()`.

`startMutationObserver` memang menggunakan `childList: true, subtree: true` yang akan mendeteksi penambahan form, tetapi filterasi `hasRealMutation` bisa menolak beberapa mutasi attribute-only yang terjadi saat form di-reveal dari `display:none` ke `display:block` tanpa perubahan DOM structure.

---

## ✅ IMPLEMENTATION PLAN — Rencana Eksekusi

### FASE 1 — Backend: Perbaiki Error 500 (Prioritas KRITIS)

**[STEP 1.1]** **File:** `activity_service.py`
- **Apa:** Pindahkan `_bulk_insert_activities` menjadi async-safe dengan menggunakan `AsyncSession` atau membuat session terpisah yang proper untuk thread executor.
- **Mengapa:** Penggunaan synchronous `SessionLocal()` di dalam `asyncio.to_thread` menyebabkan potential race condition pada connection pool.
- **Cara:** Refactor `_bulk_insert_activities` agar menerima data saja, lalu buat sesi baru yang bersih dan di-close dengan benar, atau gunakan `run_in_executor` dengan session factory yang thread-safe.

**[STEP 1.2]** **File:** `activity_service.py`
- **Apa:** Tambahkan `try/except` yang robust di dalam loop `flush_activity_logs` agar worker tidak crash total jika satu batch insert gagal.
- **Mengapa:** Saat ini jika `_bulk_insert_activities` melempar exception, `flush_activity_logs` akan crash dan seluruh background task berhenti, sehingga queue menumpuk tanpa batas.
- **Cara:** Wrap `await asyncio.to_thread(...)` dengan try/except, log error, dan lanjutkan loop tanpa menghentikan worker.

**[STEP 1.3]** **File:** `activity_service.py`
- **Apa:** Refactor logika debounce `flush_activity_logs` — ganti `for _ in range(10): break` dengan logika wait yang lebih jelas menggunakan `asyncio.wait_for` atau `asyncio.Event`.
- **Mengapa:** Logika saat ini membingungkan dan sulit di-maintain.

**[STEP 1.4]** **File:** `activity_service.py` baris 38
- **Apa:** Update `FIELD_LABELS` dictionary — ganti key `"mother_name"` menjadi sesuai canonical key yang disepakati (lihat Step 3.1).
- **Mengapa:** Konsistensi label di analytics dashboard.

---

### FASE 2 — Extension Offscreen: Perbaiki Cache SBERT (Prioritas TINGGI)

**[STEP 2.1]** **File:** `offscreen.js` — baris 44–45
- **Apa:** Pindahkan `const semanticCache = new Map()` ke **scope modul** (di luar listener), sejajar dengan `let extractorPromise` dan `let referenceEmbeddingsCache`.
- **Mengapa:** Saat ini `semanticCache` dideklarasikan di dalam callback `onMessage`, sehingga direset ke `Map` kosong setiap kali pesan masuk.
- **Efek yang diharapkan:** Cache akan benar-benar bekerja lintas-request, mengeliminasi re-kalkulasi berulang untuk label yang sama.

**[STEP 2.2]** **File:** `offscreen.js`
- **Apa:** Pindahkan juga inisialisasi `referenceEmbeddingsCache` yang dipicu saat dokumen offscreen dimuat — tambahkan `getReferenceEmbeddings(extractor)` setelah `getExtractor()` berhasil di baris 33–35.
- **Mengapa:** Saat ini reference embeddings dihitung saat *pertama kali* ada request SEMANTIC_FALLBACK. Lebih baik pre-compute saat offscreen document dimuat (warm-up eager), sehingga request pertama juga langsung menggunakan cache.

---

### FASE 3 — Extension Schema: Canonicalize `mother_name` (Prioritas MEDIUM)

**[STEP 3.1]** Tetapkan **`mother_name`** sebagai canonical key tunggal (sesuai DB schema di `entities.py` dan `schemas.py`).

**[STEP 3.2]** **File:** `offscreen.js` baris 93
- **Apa:** Konfirmasi key `PROFILE_KEY_LABELS` tetap `mother_name` (sudah benar).
- **Tindakan:** Tidak ada perubahan diperlukan di sini.

**[STEP 3.3]** **File:** `content_script.js` baris 278–281
- **Apa:** Pastikan `KEYWORD_MAP` key tetap `mother_name` dan keyword-list-nya sudah mencakup semua variasi input form (`mothers_name`, `mothersname`, dll.) sebagai **nilai dalam array**, bukan sebagai key utama.
- **Tindakan:** Sudah benar di baris 280 (`"mothers_name"` ada di dalam array keywords). Tidak ada perubahan diperlukan di sini.

**[STEP 3.4]** **File:** `content_script.js` baris 1269–1270
- **Apa:** Hapus key duplikat `mothers_name` dari test profile dummy. Sisakan hanya `mother_name`.
- **Mengapa:** Duplikasi ini menyembunyikan bug saat testing karena fallback selalu menemukan nilai.

**[STEP 3.5]** **File:** `content_script.js` baris 1281–1282
- **Apa:** Sederhanakan fallback lookup — hanya cari `profile.mother_name`, hapus referensi ke `profile.mothers_name` karena API backend tidak pernah mengembalikan field dengan nama itu.
- **Mengapa:** Cleanup logika agar tidak ada ambiguitas.

**[STEP 3.6]** **File:** `sidepanel.js` baris 952
- **Apa:** Pastikan label display map menggunakan `mother_name` sebagai key.
- **Tindakan:** Sudah benar. Tidak ada perubahan diperlukan.

---

### FASE 4 — Extension MutationObserver: Perbaiki Form 3 Debounce (Prioritas MEDIUM)

**[STEP 4.1]** **File:** `content_script.js` baris 2568
- **Apa:** Tingkatkan nilai `maxWait` dari `1500` ms menjadi `3000` ms (atau jadikan configurable).
- **Mengapa:** Form 3 yang menggunakan animasi transisi React/Angular memerlukan waktu lebih lama untuk selesai rendering. `maxWait 1500ms` terlalu agresif untuk SPA multi-step.

**[STEP 4.2]** **File:** `content_script.js` — fungsi `attachVisibilityObserver`
- **Apa:** Tambahkan mekanisme **re-attach** observer setiap kali `startMutationObserver` mendeteksi penambahan node baru yang merupakan `<form>` atau `[role='dialog']` atau `[role='tabpanel']`.
- **Mengapa:** Saat ini `attachVisibilityObserver` hanya berjalan sekali pada DOMContentLoaded. Form yang di-inject dinamis (Form 3) tidak ter-observe oleh `visibilityObserver`.
- **Cara:** Di dalam callback `MutationObserver` (baris 2617–2621), setelah `observeShadowRoots`, tambahkan pengecekan apakah `addedNodes` mengandung form baru dan pasang `visibilityObserver` padanya.

**[STEP 4.3]** **File:** `content_script.js` baris 2566 & 2576
- **Apa:** Tambahkan payload minimal ke pesan `FORM_UPDATED` — sertakan `formCount` atau `newFormsFound: true` untuk membantu sidepanel membuat keputusan yang lebih cerdas.
- **Mengapa:** Saat ini sidepanel melakukan full re-scan tanpa mengetahui apakah ada form baru yang benar-benar ditambahkan atau hanya atribut yang berubah.

**[STEP 4.4]** **File:** `background.js` baris 455–458
- **Apa:** Forward pesan `FORM_UPDATED` ke sidepanel jika terbuka (jika sidebar aktif), bukan hanya mengembalikan `{ success: true }`.
- **Mengapa:** Saat ini background.js *menerima* `FORM_UPDATED` dari content_script tetapi tidak melakukan re-routing ke sidepanel. Sidepanel menerima `FORM_UPDATED` karena ia memiliki listener `chrome.runtime.onMessage` sendiri yang mendengarkan semua pesan runtime — ini berfungsi karena kebetulan sidepanel adalah extension page. Namun jika ke depan komunikasi diubah ke model explicit routing, ini akan bermasalah.

---

## 📊 Peta Dampak & Prioritas

| Bug | Severity | Dampak Pengguna | File Utama | Perkiraan Effort |
|-----|----------|-----------------|------------|------------------|
| #1 — Error 500 Backend | 🔴 KRITIS | Extension lag 4 detik, log hilang | `activity_service.py` | Medium (3–4 jam) |
| #2 — Cache SBERT Rusak | 🔴 KRITIS | CPU spike, extension hang setiap form scan | `offscreen.js` | Kecil (30 menit) |
| #3 — Schema Mismatch | 🟡 MEDIUM | Analytics label salah, test profile ambigu | `content_script.js` | Kecil (1 jam) |
| #4 — Form 3 Observer | 🟡 MEDIUM | Form 3 tidak ter-detect otomatis | `content_script.js` | Medium (2–3 jam) |

---

## 🚨 Catatan Penting untuk Eksekutor

1. **Urutan eksekusi perbaikan:** Bug #2 → Bug #1 → Bug #3 → Bug #4. Perbaiki SBERT cache dulu karena paling cepat dan langsung dirasakan dampaknya.
2. **Testing Bug #2:** Setelah pindah `semanticCache` ke scope modul, verifikasi dengan membuka DevTools offscreen (`chrome://inspect/#other`), kirim 2 request SEMANTIC_FALLBACK dengan label yang sama, dan konfirmasi bahwa kalkulasi SBERT hanya terjadi **1 kali**.
3. **Testing Bug #1:** Restart uvicorn setelah perbaikan, periksa log terminal bahwa `flush_activity_logs` task berjalan tanpa crash, dan kirim beberapa POST ke `/api/v1/activities`.
4. **Tidak ada perubahan skema database** yang diperlukan untuk semua bug ini. Semua perbaikan ada di level aplikasi/logika.
