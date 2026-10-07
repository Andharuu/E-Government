import { pipeline, env } from './lib/transformers.js';

// Offscreen Document - GovConnect
// Digunakan untuk menjalankan komputasi berat (Web Workers / ONNX) secara background tanpa memblokir UI thread

// ============================================================
// KONFIGURASI ONNX RUNTIME WEBASSEMBLY (SAFEGUARDS)
// ============================================================
// Tujuan konfigurasi ini:
//   1. Mengarahkan path .wasm + Web Worker ke CDN publik yang stabil → mencegah
//      kegagalan "Failed to fetch/load .wasm or worker" saat file lokal tidak lengkap.
//   2. Mematikan multithreading (numThreads = 1, proxy = false) → mencegah error
//      SharedArrayBuffer dan menghindari keharusan menyetel header COOP/COEP.

// Pin versi ONNX Runtime Web ke rilis stabil yang kompatibel dengan Transformers.js.
const ONNX_RUNTIME_VERSION = '1.14.0';

// Base CDN utama (jsDelivr di depan, unpkg sebagai cadangan lewat fallback di bawah).
const ONNX_WASM_CDN =
  `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNX_RUNTIME_VERSION}/dist/`;

// 1. ATUR PATH WASM SECARA EKSPLISIT (WAJIB, jangan dikosongkan)
env.backends.onnx.wasm.wasmPaths = ONNX_WASM_CDN;

// 2. NONAKTIFKAN MULTITHREADING (WAJIB)
//    numThreads = 1 mematikan shared worker; proxy = false memastikan ORT
//    tidak memuat ort-wasm-simd-threaded.* dan tidak menyentuh SharedArrayBuffer.
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;

// Logging ORT dibuat lebih tenang agar tidak membanjiri console offscreen.
env.backends.onnx.logLevel = 'error';

// Izinkan Transformers.js mengambil file model (.onnx, tokenizer, dsb.) dari Hugging Face.
env.allowRemoteModels = true;
env.allowLocalModels = false;

console.log(
  `GovConnect Offscreen: Konfigurasi ORT WASM → wasmPaths="${env.backends.onnx.wasm.wasmPaths}", ` +
  `numThreads=${env.backends.onnx.wasm.numThreads}, proxy=${env.backends.onnx.wasm.proxy}`
);

// ============================================================
// INISIALISASI PIPELINE SBERT (dengan Error Handling & Fallback)
// ============================================================
const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

// Daftar strategi pemuatan berlapis. Lapis pertama adalah konfigurasi utama
// (CDN jsDelivr). Lapis berikutnya sebagai fallback bila lapis sebelumnya gagal.
const LOAD_STRATEGIES = [
  {
    name: 'jsDelivr CDN (default)',
    wasmPaths: `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ONNX_RUNTIME_VERSION}/dist/`
  },
  {
    name: 'unpkg CDN (fallback)',
    wasmPaths: `https://unpkg.com/onnxruntime-web@${ONNX_RUNTIME_VERSION}/dist/`
  }
];

// Inisialisasi pipeline model SBERT
let extractorPromise = null;

async function loadExtractorWithFallback() {
  let lastError = null;

  for (const strategy of LOAD_STRATEGIES) {
    try {
      // Setel ulang path WASM sesuai strategi yang sedang dicoba.
      // Selalu eksplisit dan tidak pernah kosong.
      env.backends.onnx.wasm.wasmPaths = strategy.wasmPaths;
      env.backends.onnx.wasm.numThreads = 1;
      env.backends.onnx.wasm.proxy = false;

      console.log(`GovConnect Offscreen: Mencoba memuat model SBERT via ${strategy.name}...`);
      console.log(`GovConnect Offscreen: wasmPaths = ${env.backends.onnx.wasm.wasmPaths}`);

      const extractor = await pipeline('feature-extraction', MODEL_ID);
      console.log(`GovConnect Offscreen: Model SBERT berhasil dimuat via ${strategy.name}.`);
      return extractor;
    } catch (err) {
      lastError = err;
      console.error(
        `GovConnect Offscreen: Gagal memuat model via ${strategy.name}. ` +
        `Mencoba strategi berikutnya...`,
        err
      );
    }
  }

  // Semua strategi gagal → lempar error terakhir dengan pesan yang jelas.
  const finalErr = new Error(
    `Gagal memuat model SBERT "${MODEL_ID}" dari semua sumber CDN. ` +
    `Penyebab terakhir: ${lastError?.message || lastError}`
  );
  finalErr.cause = lastError;
  throw finalErr;
}

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = loadExtractorWithFallback()
      .catch(err => {
        // Penting: reset promise agar percobaan berikutnya bisa mencoba lagi,
        // alih-alih menyimpan promise yang sudah rejected selamanya.
        console.error("GovConnect Offscreen: Inisialisasi model SBERT gagal total:", err);
        extractorPromise = null;
        throw err;
      });
  }
  return extractorPromise;
}

// Picu pemuatan model dan WASM saat offscreen document dimuat.
// Setelah model siap, langsung pre-compute embedding referensi 54 profile keys
// agar request SEMANTIC_FALLBACK pertama pun sudah menggunakan cache (warm-up eager).
getExtractor()
  .then(extractor => getReferenceEmbeddings(extractor))
  .catch(err => {
    console.warn("GovConnect Offscreen: Pemuatan awal model atau pre-compute referensi ditunda/gagal:", err);
  });

// Cache label → profileKey agar SBERT tidak menghitung ulang label yang sama.
// Dideklarasikan di scope MODUL (bukan di dalam listener) agar persisten
// sepanjang lifetime offscreen document dan tidak direset setiap pesan masuk.
const semanticCache = new Map();

// Listener pesan chrome.runtime
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "PING_OFFSCREEN") {
    sendResponse({ success: true });
    return true;
  }

if (message.action === "SEMANTIC_FALLBACK") {
    (async () => {
        try {
            // Jika label sudah pernah dihitung, langsung ambil dari cache! (Bypass SBERT)
            if (semanticCache.has(message.label)) {
                chrome.runtime.sendMessage({
                    action: "SEMANTIC_RESULT",
                    targetElementId: message.targetElementId,
                    profileKey: semanticCache.get(message.label)
                }).catch(() => {});
                return;
            }

            // Jika belum ada di cache, biarkan SBERT berpikir
            const result = await processSemanticFallback(message.label, message.targetElementId);
            
            // Simpan hasilnya ke memori agar perhitungan berikutnya instan
            semanticCache.set(message.label, result);

            chrome.runtime.sendMessage({
                action: "SEMANTIC_RESULT",
                targetElementId: message.targetElementId,
                profileKey: result
            }).catch(() => {});
        } catch (err) {
            console.error("Offscreen: Semantic Fallback Error", err);
            chrome.runtime.sendMessage({
                action: "SEMANTIC_RESULT",
                targetElementId: message.targetElementId,
                profileKey: null
            }).catch(() => {});
        }
    })();
    return true; 
}
});

// ============================================================
// Referensi label teks per profile key untuk komputasi SBERT
// ============================================================
const PROFILE_KEY_LABELS = {
  full_name:               "nama lengkap full name",
  first_name:              "nama depan first name given name",
  last_name:               "nama belakang last name family name surname",
  middle_initial:          "nama tengah middle name initial",
  title:                   "gelar title salutation",
  mother_name:             "nama ibu kandung mother name orang yang melahirkan",
  father_name:             "nama ayah kandung father name",
  birth_date:              "tanggal lahir birth date date of birth",
  birth_place:             "tempat lahir birth place city of birth",
  birth_month:             "bulan lahir birth month",
  birth_day:               "hari lahir birth day",
  birth_year:              "tahun lahir birth year",
  age:                     "umur usia age",
  gender:                  "jenis kelamin gender sex",
  nik:                     "nomor induk kependudukan nik identity number citizen id ktp",
  phone:                   "nomor telepon handphone phone mobile whatsapp",
  home_phone:              "telepon rumah home phone",
  work_telephone:          "telepon kantor work phone",
  fax:                     "nomor fax fax number",
  email:                   "email alamat email",
  address:                 "alamat lengkap address street jalan domisili",
  address_line_1:          "alamat baris satu address line one",
  address_line_2:          "alamat baris dua address line two apartment",
  province:                "provinsi province state",
  city:                    "kota kabupaten city",
  district:                "kecamatan district",
  village:                 "kelurahan desa village",
  postal_code:             "kode pos postal code zip code",
  country:                 "negara country nationality",
  religion:                "agama religion kepercayaan",
  marital_status:          "status pernikahan perkawinan marital status",
  education_level:         "pendidikan terakhir jenjang pendidikan education level",
  occupation:              "pekerjaan jabatan posisi occupation job",
  organization:            "nama perusahaan instansi kantor organization company",
  institution:             "nama kampus universitas sekolah institusi",
  student_id:              "nomor induk mahasiswa siswa nim nip student id",
  nisn:                    "nomor induk siswa nasional nisn",
  family_card_number:      "nomor kartu keluarga nkk family card number",
  family_relationship:     "hubungan keluarga family relationship status",
  blood_type:              "golongan darah blood type",
  npwp:                    "nomor npwp tax id pajak",
  bpjs_number:             "nomor bpjs kesehatan ketenagakerjaan",
  driver_license:          "nomor sim surat izin mengemudi driver license",
  website:                 "website url situs web homepage",
  income:                  "pendapatan gaji penghasilan income salary",
  emergency_contact_name:  "nama kontak darurat emergency contact",
  emergency_contact_phone: "nomor kontak darurat emergency phone",
  work_address:            "alamat kantor perusahaan work office address",
  foto_ktp:                "foto scan ktp upload berkas ktp",
  foto_kk:                 "foto scan kartu keluarga upload kk",
  pasfoto:                 "pas foto foto profil photo avatar",
  foto_npwp:               "foto scan npwp upload kartu npwp",
  foto_ijazah:             "foto scan ijazah upload berkas ijazah",
  comments:                "catatan keterangan komentar notes remark"
};

// Cache embedding referensi agar tidak dihitung ulang setiap request
let referenceEmbeddingsCache = null;

async function getReferenceEmbeddings(extractor) {
  if (referenceEmbeddingsCache) return referenceEmbeddingsCache;

  const keys   = Object.keys(PROFILE_KEY_LABELS);
  const labels = Object.values(PROFILE_KEY_LABELS);

  console.log("GovConnect Offscreen: Menghitung embedding referensi untuk", keys.length, "profile keys...");
  const output = await extractor(labels, { pooling: "mean", normalize: true });

  // output.data adalah Float32Array panjang (n_keys * hidden_dim)
  const hiddenDim = output.data.length / keys.length;
  referenceEmbeddingsCache = keys.map((key, i) => ({
    key,
    vector: output.data.slice(i * hiddenDim, (i + 1) * hiddenDim)
  }));

  console.log("GovConnect Offscreen: Embedding referensi siap. Hidden dim:", hiddenDim);
  return referenceEmbeddingsCache;
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================================
// Pemrosesan Semantic Fallback dengan model ONNX / Transformers.js
// ============================================================
async function processSemanticFallback(labelText, targetElementId) {
  console.log(`Offscreen: Menerima request semantic fallback untuk label: "${labelText}"`);
  try {
    const extractor = await getExtractor();

    // 1. Hitung embedding label input dari form
    const queryOutput = await extractor([labelText], { pooling: "mean", normalize: true });
    const queryVector = queryOutput.data;

    // 2. Ambil / bangun embedding referensi semua profile keys
    const references = await getReferenceEmbeddings(extractor);

    // 3. Hitung cosine similarity dan temukan best match
    let bestMatchKey   = null;
    let bestMatchScore = 0;

    for (const ref of references) {
      const score = cosineSimilarity(queryVector, ref.vector);
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatchKey   = ref.key;
      }
    }

    const SEMANTIC_THRESHOLD = 0.50;
    console.log(`GovConnect Offscreen: Best match → "${bestMatchKey}" (score: ${bestMatchScore.toFixed(4)}) untuk label: "${labelText}"`);

    if (bestMatchScore >= SEMANTIC_THRESHOLD) {
      // 4. Kirim SEMANTIC_RESULT ke background.js agar diteruskan ke content script
      chrome.runtime.sendMessage({
        action: "SEMANTIC_RESULT",
        targetElementId: targetElementId,
        profileKey: bestMatchKey,
        score: bestMatchScore
      }).catch(() => {});

      return bestMatchKey;
    }

    console.log(`GovConnect Offscreen: Skor di bawah threshold (${SEMANTIC_THRESHOLD}), tidak ada profil yang cocok untuk label: "${labelText}"`);
    return null;

  } catch (err) {
    console.error("Offscreen: Model SBERT belum siap atau gagal saat inferensi:", err);
    return null;
  }
}
