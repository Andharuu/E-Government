import { pipeline, env } from './lib/transformers.js';

// Offscreen Document - GovConnect
// Digunakan untuk menjalankan komputasi berat (Web Workers / ONNX) secara background tanpa memblokir UI thread

// Konfigurasi ONNX Runtime WebAssembly
env.backends.onnx.wasm.numThreads = 1;
if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL('lib/') + '/';
}

// Inisialisasi pipeline model SBERT
let extractorPromise = null;

async function getExtractor() {
  if (!extractorPromise) {
    console.log("GovConnect Offscreen: Memulai inisialisasi model SBERT (Xenova/all-MiniLM-L6-v2)...");
    extractorPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
      .then(extractor => {
        console.log("GovConnect Offscreen: Model SBERT berhasil dimuat dan siap digunakan.");
        return extractor;
      })
      .catch(err => {
        console.error("GovConnect Offscreen: Gagal memuat model SBERT:", err);
        extractorPromise = null;
        throw err;
      });
  }
  return extractorPromise;
}

// Picu pemuatan model dan WASM saat offscreen document dimuat
getExtractor().catch(err => {
  console.warn("GovConnect Offscreen: Pemuatan awal model ditunda/gagal:", err);
});

// Listener pesan chrome.runtime (logika tetap dipertahankan)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "PING_OFFSCREEN") {
    sendResponse({ success: true });
    return true;
  }

  // Memori pelindung agar SBERT tidak menghitung label yang sama berkali-kali
const semanticCache = new Map();

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

    const SEMANTIC_THRESHOLD = 0.40;
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
