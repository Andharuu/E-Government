// Content Script — GovConnect
// Mendeteksi form secara aktif dan mengisi field berdasarkan profil user

(function() {
  if (window.__GOVCONNECT_CONTENT_SCRIPT_INITIALIZED__) {
    return;
  }
  window.__GOVCONNECT_CONTENT_SCRIPT_INITIALIZED__ = true;

// ============================================================
// Keyword mapping: profile attribute → list keyword
// Sesuai PRD §14 — multi-level matching (Spesifik -> Umum)
// ============================================================
// Kata kunci pendek (2-3 huruf) yang dilarang dicocokkan secara longgar via substring .includes()
// Hanya boleh dicocokkan jika persis (exact token match)
const SHORT_KEYWORDS = new Set([
  "wa", "hp", "kab", "kot", "zip", "nim", "nip", "nrp", "dob", "sex", "job", "telp"
]);

const KEYWORD_MAP = {
  full_name: [
    "nama_lengkap", "nama_pemohon", "nama_siswa", "nama_mahasiswa", "nama_lengkap_pemohon",
    "nama", "name", "full_name", "fullname", "nama_pelamar"
  ],
  address: [
    "alamat_ktp", "alamat_saatini", "alamat_domisili", "alamat_lengkap",
    "alamat_tinggal", "alamat_surat", "alamat", "address", "domisili", "street", "jalan"
  ],
  organization: [
    "nama_perusahaan", "nama_instansi", "instansi_pekerjaan", "nama_organisasi", "nama_kantor",
    "instansi", "organisasi", "perusahaan", "organization", "company"
  ],
  occupation: [
    "posisi_di_perusahaan", "posisi_pekerjaan", "posisi", "jabatan", "role",
    "pekerjaan", "occupation", "profesi", "job"
  ],
  education_level: [
    "pendidikan_terakhir", "jenjang_pendidikan", "pendidikan", "education_level", "jenjang"
  ],
  birth_date: [
    "tanggal_lahir", "tgl_lahir", "birth_date", "birthdate", "dob", "tanggallahir", "tanggal_lahir_pemohon", "tgl_lahir_pemohon"
  ],
  birth_place: [
    "tempat_lahir", "tempatlahir", "birth_place", "birthplace", "tempat_lahir_pemohon"
  ],
  gender: [
    "jenis_kelamin", "jeniskelamin", "gender", "sex", "kelamin"
  ],
  nik: [
    "nomor_identitas", "no_identitas", "nik", "no_ktp", "noktp", "nomor_ktp",
    "nomor_induk_kependudukan", "nomor_induk", "identity_number", "citizen_id"
  ],
  phone: [
    "nomor_hp", "no_hp", "nohp", "no_telepon", "notelepon", "nomor_telepon",
    "nomor_handphone", "handphone", "telepon", "phone", "hp", "telp", "whatsapp", "wa"
  ],
  email: [
    "email", "surel", "e_mail", "alamat_email"
  ],
  province: [
    "provinsi", "province", "propinsi"
  ],
  city: [
    "kota", "kabupaten", "city", "kab", "kot"
  ],
  district: [
    "kecamatan", "district"
  ],
  village: [
    "kelurahan", "desa", "village"
  ],
  postal_code: [
    "kode_pos", "postal_code", "zip", "kodepos"
  ],
  student_id: [
    "nim", "nip", "nrp", "student_id", "nomor_mahasiswa"
  ],
  institution: [
    "nama_kampus", "nama_sekolah", "nama_universitas", "nama_institusi", "perguruan_tinggi",
    "institusi", "institution", "sekolah", "universitas", "kampus"
  ],
  nisn: [
    "nisn", "nomor_induk_siswa", "student_number"
  ],
  religion: [
    "agama", "religion", "kepercayaan"
  ],
  marital_status: [
    "status_perkawinan", "status_nikah", "status_pernikahan", "status_kawin", "marital_status"
  ],
  blood_type: [
    "golongan_darah", "gol_darah", "goldarah", "blood_type", "blood_group"
  ],
  mother_name: [
    "nama_ibu", "nama_ibu_kandung", "ibu_kandung", "mother_name", "namaibu"
  ],
  father_name: [
    "nama_ayah", "nama_ayah_kandung", "ayah_kandung", "father_name", "namaayah"
  ],
  emergency_contact_name: [
    "kontak_darurat", "nama_kontak_darurat", "emergency_contact", "nama_darurat"
  ],
  emergency_contact_phone: [
    "no_kontak_darurat", "nomor_kontak_darurat", "telp_darurat", "hp_darurat", "emergency_phone"
  ],
  work_address: [
    "alamat_kantor", "alamat_perusahaan", "alamat_instansi", "alamat_pekerjaan", "work_address", "office_address"
  ],
  npwp: [
    "npwp", "nomor_npwp", "no_npwp", "tax_id"
  ],
  bpjs_number: [
    "bpjs", "no_bpjs", "nomor_bpjs", "bpjs_kesehatan", "bpjs_ketenagakerjaan"
  ],
  foto_ktp: [
    "foto_ktp", "upload_ktp", "scan_ktp", "berkas_ktp", "file_ktp", "dokumen_ktp", "ktp_file", "fotoktp"
  ],
  foto_kk: [
    "foto_kk", "upload_kk", "scan_kk", "berkas_kk", "file_kk", "kartu_keluarga_file", "fotokk", "kk_file"
  ],
  pasfoto: [
    "pasfoto", "pas_foto", "foto_profil", "photo_file", "avatar_file", "foto_diri", "foto_wajah", "foto_formal", "fotodiri", "pas_photo"
  ],
  foto_npwp: [
    "foto_npwp", "upload_npwp", "scan_npwp", "kartu_npwp_file", "berkas_npwp", "npwp_file"
  ],
  foto_ijazah: [
    "foto_ijazah", "upload_ijazah", "scan_ijazah", "berkas_ijazah", "dokumen_ijazah", "ijazah_file"
  ]
};

// ============================================================
// Helper: Periksa Apakah Element Benar-benar Terlihat di Layar
// ============================================================
function isElementVisible(el) {
  if (!el) return false;
  if (el.type === "hidden") return false;

  // Native checkVisibility (Chrome 105+) - Akurat mendeteksi ancestor display:none
  if (typeof el.checkVisibility === "function") {
    return el.checkVisibility({
      checkOpacity: true,
      checkVisibilityCSS: true
    });
  }

  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }

  // Jika parent tersembunyi (offsetParent null)
  if (el.offsetParent === null && style.position !== "fixed") {
    return false;
  }

  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }

  return true;
}

// ============================================================
// Penanda Kolom Form di Halaman Web (In-Page Field Markers)
// Menampilkan border highlight dan badge "⚡ GovConnect" pada kolom yang akan diisi
// ============================================================
const MARKER_LABELS = {
  full_name: "Nama Lengkap",
  nik: "NIK",
  birth_date: "Tgl Lahir",
  birth_place: "Tempat Lahir",
  gender: "Jenis Kelamin",
  religion: "Agama",
  marital_status: "Status Nikah",
  blood_type: "Gol. Darah",
  address: "Alamat",
  province: "Provinsi",
  city: "Kota/Kab",
  district: "Kecamatan",
  village: "Kelurahan/Desa",
  postal_code: "Kode Pos",
  phone: "Telepon/WA",
  email: "Email",
  occupation: "Pekerjaan",
  organization: "Instansi",
  work_address: "Alamat Kantor",
  education_level: "Pendidikan",
  institution: "Institusi",
  student_id: "NIM",
  nisn: "NISN",
  mother_name: "Nama Ibu",
  father_name: "Nama Ayah",
  emergency_contact_name: "Kontak Darurat",
  emergency_contact_phone: "No. Darurat",
  npwp: "NPWP",
  bpjs_number: "BPJS",
  foto_ktp: "Foto e-KTP",
  foto_kk: "Foto KK",
  pasfoto: "Pasfoto Diri",
  foto_npwp: "Foto Kartu NPWP",
  foto_ijazah: "Foto Ijazah"
};

let activeMarkers = []; // Array of { el, badge, profileKey }
let cachedLastProfile = null;
let cachedActiveKeys = null;

function registerDocumentPhotos(profile) {
  if (!profile || !profile.document_photos) return;
  try {
    const docs = typeof profile.document_photos === "string"
      ? JSON.parse(profile.document_photos)
      : profile.document_photos;
    
    if (docs.ktp && docs.ktp.data) profile.foto_ktp = docs.ktp.name || "ktp.jpg";
    if (docs.kk && docs.kk.data) profile.foto_kk = docs.kk.name || "kk.jpg";
    if (docs.pasfoto && docs.pasfoto.data) profile.pasfoto = docs.pasfoto.name || "pasfoto.jpg";
    if (docs.npwp_card && docs.npwp_card.data) profile.foto_npwp = docs.npwp_card.name || "npwp.jpg";
    if (docs.ijazah && docs.ijazah.data) profile.foto_ijazah = docs.ijazah.name || "ijazah.jpg";
  } catch (e) {
    console.warn("GovConnect: Gagal memproses document_photos:", e);
  }
}

function registerCustomProfileFields(profile) {
  if (!profile) return;
  registerDocumentPhotos(profile);

  if (!profile.custom_fields) return;
  try {
    const cf = typeof profile.custom_fields === "string"
      ? JSON.parse(profile.custom_fields)
      : profile.custom_fields;
    
    let items = [];
    if (Array.isArray(cf)) {
      items = cf;
    } else if (typeof cf === "object" && cf !== null) {
      if (Array.isArray(cf.fields)) {
        items = cf.fields;
      } else {
        items = Object.entries(cf).map(([k, v]) => ({
          key: k,
          label: typeof v === "object" ? (v.label || k) : k,
          value: typeof v === "object" ? v.value : v
        }));
      }
    }

    items.forEach(item => {
      if (item && item.key) {
        const key = item.key;
        profile[key] = item.value;
        if (!MARKER_LABELS[key]) {
          MARKER_LABELS[key] = item.label || key;
        }
        if (!KEYWORD_MAP[key]) {
          const kLower = key.toLowerCase();
          const cleanLabel = (item.label || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
          KEYWORD_MAP[key] = Array.from(new Set([
            kLower,
            kLower.replace(/_/g, ""),
            cleanLabel,
            (item.label || "").toLowerCase()
          ])).filter(Boolean);
        }
      }
    });
  } catch (e) {
    console.warn("GovConnect: Gagal memproses custom_fields:", e);
  }
}

function ensureMarkerStyles() {
  if (document.getElementById("govconnect-marker-styles")) return;
  const style = document.createElement("style");
  style.id = "govconnect-marker-styles";
  style.textContent = `
    .govconnect-field-ready {
      outline: 2px solid #2563EB !important;
      outline-offset: 1px !important;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16) !important;
      border-color: #2563EB !important;
      transition: outline 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease !important;
    }
    .govconnect-field-filled {
      outline: 2px solid #16A34A !important;
      outline-offset: 1px !important;
      box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.22) !important;
      border-color: #16A34A !important;
      background-color: #F0FDF4 !important;
      animation: govconnectPopIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      transition: outline 0.4s ease, box-shadow 0.4s ease, background-color 0.4s ease !important;
    }
    .govconnect-field-fadeout {
      outline: 2px solid transparent !important;
      box-shadow: none !important;
      background-color: transparent !important;
      border-color: inherit !important;
      transition: outline 0.7s ease, box-shadow 0.7s ease, background-color 0.7s ease !important;
    }
    .govconnect-field-focus {
      outline: 3px solid #1D4ED8 !important;
      outline-offset: 2px !important;
      box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.35) !important;
      animation: govconnectPulse 1s ease-in-out infinite alternate !important;
    }
    @keyframes govconnectPulse {
      0% { box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25); }
      100% { box-shadow: 0 0 0 7px rgba(37, 99, 235, 0.45); }
    }
    @keyframes govconnectPopIn {
      0% { transform: scale(0.99); }
      50% { transform: scale(1.01); }
      100% { transform: scale(1); }
    }
    @keyframes govconnectBadgePop {
      0% { transform: translateX(-100%) scale(0.85); opacity: 0.7; }
      100% { transform: translateX(-100%) scale(1); opacity: 1; }
    }
    #govconnect-markers-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483640;
    }
    .govconnect-badge {
      position: absolute;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: linear-gradient(135deg, #2563EB, #1D4ED8);
      color: #FFFFFF !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      font-size: 10px !important;
      font-weight: 600 !important;
      line-height: 1.2 !important;
      border-radius: 999px;
      box-shadow: 0 2px 5px rgba(37, 99, 235, 0.3), 0 1px 2px rgba(0,0,0,0.08);
      pointer-events: auto;
      cursor: pointer;
      user-select: none;
      transform: translateX(-100%);
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease, opacity 0.6s ease;
      white-space: nowrap;
    }
    .govconnect-badge:hover {
      transform: translateX(-100%) scale(1.05);
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.45);
    }
    .govconnect-badge-filled {
      background: linear-gradient(135deg, #16A34A, #15803D) !important;
      box-shadow: 0 3px 8px rgba(22, 163, 74, 0.35), 0 1px 2px rgba(0,0,0,0.08) !important;
      animation: govconnectBadgePop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    }
    .govconnect-badge-fadeout {
      opacity: 0 !important;
      transform: translateX(-100%) translateY(-6px) scale(0.92) !important;
      transition: opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), transform 0.7s cubic-bezier(0.4, 0, 0.2, 1) !important;
    }
    .govconnect-badge-icon {
      font-size: 9px;
    }
  `;
  document.head.appendChild(style);
}

function ensureMarkerLayer() {
  let layer = document.getElementById("govconnect-markers-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "govconnect-markers-layer";
    document.body.appendChild(layer);
  }
  return layer;
}

function clearFieldMarkers() {
  activeMarkers.forEach(({ el, badge }) => {
    if (el) {
      el.classList.remove(
        "govconnect-field-ready",
        "govconnect-field-filled",
        "govconnect-field-focus",
        "govconnect-field-fadeout"
      );
    }
    if (badge && badge.parentNode) {
      badge.remove();
    }
  });
  activeMarkers = [];
}

function renderFieldMarkers(activeKeys = null, profile = null) {
  ensureMarkerStyles();
  const layer = ensureMarkerLayer();
  clearFieldMarkers();

  if (profile) {
    cachedLastProfile = profile;
    registerCustomProfileFields(profile);
  }
  if (activeKeys) cachedActiveKeys = activeKeys;

  const currentProfile = cachedLastProfile || {};
  const allowedKeys = cachedActiveKeys;

  const inputs = document.querySelectorAll(
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea"
  );

  inputs.forEach(el => {
    const profileKey = matchProfileKey(el);
    if (!profileKey) return;

    // Filter berdasarkan activeKeys jika diberikan
    if (allowedKeys && !allowedKeys.includes(profileKey)) return;

    // Filter jika profil tidak memiliki nilai untuk key ini
    const val = currentProfile[profileKey];
    if (currentProfile && Object.keys(currentProfile).length > 0 && (!val || val.toString().trim() === "")) {
      return;
    }

    if (!isElementVisible(el)) return;

    // Pasang highlight border
    el.classList.add("govconnect-field-ready");

    // Pasang badge floating di sudut kanan atas kolom
    const badge = document.createElement("div");
    badge.className = "govconnect-badge";
    badge.dataset.key = profileKey;
    const label = MARKER_LABELS[profileKey] || profileKey;
    badge.title = val ? `GovConnect siap mengisi: ${val}` : `Kolom terdeteksi: ${label}`;
    badge.innerHTML = `<span class="govconnect-badge-icon">⚡</span><span>GovConnect: ${label}</span>`;

    badge.addEventListener("click", (e) => {
      e.stopPropagation();
      el.focus();
    });

    layer.appendChild(badge);
    activeMarkers.push({ el, badge, profileKey });
  });

  repositionMarkers();
}

function repositionMarkers() {
  activeMarkers.forEach(({ el, badge }) => {
    if (!el || !document.body.contains(el)) {
      badge.remove();
      return;
    }
    if (!isElementVisible(el)) {
      badge.style.display = "none";
      return;
    }

    badge.style.display = "inline-flex";
    const rect = el.getBoundingClientRect();
    const isNearTop = rect.top + window.scrollY < 16;
    const top = isNearTop
      ? (rect.top + window.scrollY + 3)
      : (rect.top + window.scrollY - 9);
    const left = (rect.right + window.scrollX - 6);

    badge.style.top = `${top}px`;
    badge.style.left = `${left}px`;
  });
}

function highlightFieldOnPage(profileKey, name, id) {
  activeMarkers.forEach(({ el, badge, profileKey: key }) => {
    const isMatch = (profileKey && key === profileKey) ||
                    (name && el.name === name) ||
                    (id && el.id === id);
    if (isMatch) {
      el.classList.add("govconnect-field-focus");
      const rect = el.getBoundingClientRect();
      if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      el.classList.remove("govconnect-field-focus");
    }
  });
}

function unhighlightFieldOnPage() {
  activeMarkers.forEach(({ el }) => {
    if (el) el.classList.remove("govconnect-field-focus");
  });
}

let markerFadeOutTimer = null;

function markFieldsAsFilled(filledKeys, profile) {
  if (markerFadeOutTimer) {
    clearTimeout(markerFadeOutTimer);
    markerFadeOutTimer = null;
  }

  activeMarkers.forEach(({ el, badge, profileKey }) => {
    if (filledKeys && filledKeys.includes(profileKey)) {
      if (el) {
        el.classList.remove("govconnect-field-ready", "govconnect-field-focus", "govconnect-field-fadeout");
        el.classList.add("govconnect-field-filled");
      }
      if (badge) {
        badge.classList.remove("govconnect-badge-fadeout");
        badge.className = "govconnect-badge govconnect-badge-filled";
        const label = MARKER_LABELS[profileKey] || profileKey;
        badge.innerHTML = `<span class="govconnect-badge-icon">✓</span><span>Terisi: ${label}</span>`;
        if (profile && profile[profileKey]) {
          badge.title = `Berhasil diisi: ${profile[profileKey]}`;
        }
      }
    }
  });

  // Animasi menghilang (Fade out) secara mulus setelah 2.2 detik
  markerFadeOutTimer = setTimeout(() => {
    activeMarkers.forEach(({ el, badge }) => {
      if (el && el.classList.contains("govconnect-field-filled")) {
        el.classList.remove("govconnect-field-filled");
        el.classList.add("govconnect-field-fadeout");
      }
      if (badge && badge.classList.contains("govconnect-badge-filled")) {
        badge.classList.add("govconnect-badge-fadeout");
      }
    });

    // Hapus total elemen setelah transisi CSS selesai (0.8s kemudian)
    setTimeout(() => {
      clearFieldMarkers();
    }, 850);
  }, 2200);
}

// Throttled listener untuk scroll dan resize agar badge selalu menempel sempurna
let markerScrollThrottle = false;
window.addEventListener("scroll", () => {
  if (!markerScrollThrottle) {
    requestAnimationFrame(() => {
      repositionMarkers();
      markerScrollThrottle = false;
    });
    markerScrollThrottle = true;
  }
}, { passive: true });

window.addEventListener("resize", () => {
  repositionMarkers();
}, { passive: true });

// ============================================================
// Listener untuk pesan dari side panel / popup
// ============================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === "DETECT_FIELDS") {
      if (request.profile) {
        cachedLastProfile = request.profile;
        registerCustomProfileFields(request.profile);
      }
      const result = detectFields();
      if (request.profile) {
        renderFieldMarkers(null, request.profile);
      }
      sendResponse(result);
      return false;
    }

    if (request.action === "UPDATE_ACTIVE_MARKERS") {
      renderFieldMarkers(request.activeKeys, request.profile);
      sendResponse({ success: true });
      return false;
    }

    if (request.action === "HOVER_FIELD") {
      highlightFieldOnPage(request.profileKey, request.name, request.id);
      sendResponse({ success: true });
      return false;
    }

    if (request.action === "UNHOVER_FIELD") {
      unhighlightFieldOnPage();
      sendResponse({ success: true });
      return false;
    }

    if (request.action === "CLEAR_MARKERS") {
      clearFieldMarkers();
      sendResponse({ success: true });
      return false;
    }

    if (request.action === "EXECUTE_AUTOFILL" || request.action === "EXECUTE_ONE_CLICK_AUTOFILL") {
      isFillingProcess = true;
      const result = fillForm(request.profile, request.targetFields);
      try {
        const filledKeys = (result.fields || [])
          .filter(f => f.status === "filled")
          .map(f => f.profileKey);
        markFieldsAsFilled(filledKeys, request.profile);
      } catch (markErr) {
        console.warn("markFieldsAsFilled error:", markErr);
      }

      // Jika dijalankan via mode 1-klik, tampilkan floating toast notifikasi yang menawan di halaman
      if (request.action === "EXECUTE_ONE_CLICK_AUTOFILL") {
        showOneClickFloatingToast(result);
      }

      sendResponse(result);

      // Bebaskan flag isFillingProcess setelah animasi fade-out selesai
      setTimeout(() => {
        isFillingProcess = false;
      }, 3200);

      return false;
    }
  } catch (err) {
    console.error("Error in onMessage listener:", err);
    sendResponse({ success: false, error: err.message });
    return false;
  }
  return false;
});

// ============================================================
// Deteksi semua field pada form (Termasuk Status Visibilitas)
// ============================================================
function detectFields() {
  const inputs = document.querySelectorAll(
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea"
  );

  const detected = [];
  inputs.forEach(el => {
    const profileKey = matchProfileKey(el);
    const visible = isElementVisible(el);

    detected.push({
      tag: el.tagName.toLowerCase(),
      name: el.name || "",
      id: el.id || "",
      placeholder: el.placeholder || "",
      profileKey: profileKey,
      isVisible: visible,
      status: profileKey ? "matched" : "not_found"
    });
  });

  const visibleMatched = detected.filter(d => d.profileKey && d.isVisible);
  const hiddenMatched = detected.filter(d => d.profileKey && !d.isVisible);

  return {
    total: detected.length,
    matched: visibleMatched.length,
    hiddenMatchedCount: hiddenMatched.length,
    totalMatched: visibleMatched.length + hiddenMatched.length,
    fields: detected,
    visibleFields: visibleMatched,
    hiddenFields: hiddenMatched
  };
}

// ============================================================
// Isi field berdasarkan profil yang dipilih
// Mengisi semua field yang dicentang oleh user tanpa terlewat
// ============================================================
function fillForm(profile, targetFields = null) {
  if (profile) registerCustomProfileFields(profile);
  const inputs = document.querySelectorAll(
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), textarea, select"
  );

  const results = [];
  let filledCount = 0;

  inputs.forEach(el => {
    const profileKey = matchProfileKey(el);
    if (!profileKey) {
      results.push({ id: el.id || el.name, status: "not_found" });
      return;
    }

    // Jika targetFields diberikan, HANYA isi jika elemen ini termasuk dalam target yang dicentang oleh user
    if (Array.isArray(targetFields) && targetFields.length > 0) {
      const isSelected = targetFields.some(tf => {
        if (tf.id && el.id && tf.id === el.id) return true;
        if (tf.name && el.name && tf.name === el.name) return true;
        if (!tf.id && !tf.name && tf.profileKey === profileKey) return true;
        return false;
      });
      if (!isSelected) {
        results.push({ id: el.id || el.name, status: "skipped", profileKey });
        return;
      }
    }

    // Hanya isi jika field tersebut dicentang/ada dalam profile yang dikirim
    if (!profile || !(profileKey in profile)) {
      results.push({ id: el.id || el.name, status: "skipped", profileKey });
      return;
    }

    const value = profile[profileKey];
    if (value === undefined || value === null || value === "") {
      results.push({ id: el.id || el.name, status: "skipped", profileKey });
      return;
    }

    // Jika tag adalah select (dropdown)
    if (el.tagName.toLowerCase() === "select") {
      let matchedOpt = false;
      const targetVal = value.toString().toLowerCase();
      for (const opt of el.options) {
        if (
          opt.value.toLowerCase() === targetVal ||
          opt.text.toLowerCase().includes(targetVal)
        ) {
          el.value = opt.value;
          matchedOpt = true;
          break;
        }
      }
      if (matchedOpt) {
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        filledCount++;
        results.push({ id: el.id || el.name, status: "filled", profileKey });
      } else {
        results.push({ id: el.id || el.name, status: "skipped", profileKey });
      }
      return;
    }

    // Jika tag adalah input type=file (Autofill Berkas & Foto Dokumen)
    if (el.tagName.toLowerCase() === "input" && (el.type || "").toLowerCase() === "file") {
      let docPhotos = {};
      if (profile && profile.document_photos) {
        try {
          docPhotos = typeof profile.document_photos === "string"
            ? JSON.parse(profile.document_photos)
            : profile.document_photos;
        } catch (e) {}
      }

      let photoSlot = null;
      if (profileKey === "foto_ktp" || profileKey === "ktp") photoSlot = docPhotos.ktp;
      else if (profileKey === "foto_kk" || profileKey === "kk") photoSlot = docPhotos.kk;
      else if (profileKey === "pasfoto") photoSlot = docPhotos.pasfoto;
      else if (profileKey === "foto_npwp" || profileKey === "npwp_card") photoSlot = docPhotos.npwp_card;
      else if (profileKey === "foto_ijazah" || profileKey === "ijazah") photoSlot = docPhotos.ijazah;
      else if (docPhotos[profileKey]) photoSlot = docPhotos[profileKey];

      if (photoSlot && photoSlot.data) {
        try {
          const parts = photoSlot.data.split(",");
          const mimeType = photoSlot.type || (parts[0].match(/:(.*?);/) ? parts[0].match(/:(.*?);/)[1] : "image/jpeg");
          const byteString = atob(parts[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeType });
          const file = new File([blob], photoSlot.name || `${profileKey}.jpg`, { type: mimeType });

          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          el.files = dataTransfer.files;

          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));

          filledCount++;
          results.push({ id: el.id || el.name, status: "filled", profileKey });
          return;
        } catch (fileErr) {
          console.warn("GovConnect: Error saat autofill file input:", fileErr);
          results.push({ id: el.id || el.name, status: "skipped", profileKey });
          return;
        }
      } else {
        results.push({ id: el.id || el.name, status: "skipped", profileKey });
        return;
      }
    }

    // Input text / textarea / date / tel / email
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

    filledCount++;
    results.push({ id: el.id || el.name, status: "filled", profileKey });
  });

  const total = inputs.length;
  const overallStatus = filledCount === 0 ? "failed"
                      : filledCount < total ? "partial"
                      : "success";

  return {
    success: true,
    count: filledCount,
    total,
    status: overallStatus,
    fields: results
  };
}

// ============================================================
// Cocokkan element HTML ke profile key (Multi-phase Heuristic)
// Mencegah alamat_ktp tertukar dengan nik!
// ============================================================
function matchProfileKey(el) {
  const elName = (el.name || "").toLowerCase().trim();
  const elId = (el.id || "").toLowerCase().trim();
  const labelText = getLabelText(el).toLowerCase().trim();
  const placeholder = (el.placeholder || "").toLowerCase().trim();
  const ariaLabel = (el.getAttribute("aria-label") || "").toLowerCase().trim();

  // Phase 1: Exact Name atau ID Match
  for (const [profileKey, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (elName === kw || elId === kw) {
        return profileKey;
      }
    }
  }

  // Phase 2: Heuristik Token Kata (Pemisah underscore/dash/spasi)
  const combined = `${elName} ${elId} ${labelText} ${placeholder} ${ariaLabel}`;
  const tokens = combined.split(/[\s_\-]+/).filter(Boolean);

  // 1. Email (prioritas sebelum address karena sering ada teks 'alamat email')
  if (tokens.includes("email") || tokens.includes("surel")) {
    return "email";
  }

  // 2. Telepon / WA (cek exact token agar 'awal' pada 'tgl_awal_bekerja' tidak kena 'wa')
  if (
    tokens.includes("telepon") || tokens.includes("phone") || tokens.includes("handphone") ||
    tokens.includes("hp") || tokens.includes("nohp") || tokens.includes("no_hp") ||
    tokens.includes("telp") || tokens.includes("whatsapp") || tokens.includes("wa")
  ) {
    if (!tokens.includes("darurat") && !tokens.includes("emergency")) {
      return "phone";
    }
  }

  // 3. Tanggal (tgl / tanggal / date)
  if (tokens.includes("tgl") || tokens.includes("tanggal") || tokens.includes("date") || tokens.includes("birthdate")) {
    if (tokens.includes("lahir") || tokens.includes("birth") || tokens.includes("dob")) {
      return "birth_date";
    }
    // Jika tanggal lain (misal tgl_awal_bekerja), cari di custom_fields jika ada yang persis
    for (const [profileKey, keywords] of Object.entries(KEYWORD_MAP)) {
      if (profileKey.startsWith("custom_") || profileKey === "tgl_awal_bekerja") {
        for (const kw of keywords) {
          if (tokens.includes(kw) || elName === kw || elId === kw) return profileKey;
        }
      }
    }
    // Cegah tanggal jatuh ke phone atau birth_date sembarangan
    return null;
  }

  // 4. Posisi / Jabatan / Pekerjaan (Prioritaskan posisi_di_perusahaan ke occupation, BUKAN organization!)
  if (
    tokens.includes("posisi") || tokens.includes("jabatan") || tokens.includes("role") ||
    tokens.includes("pekerjaan") || tokens.includes("profesi") || tokens.includes("occupation")
  ) {
    return "occupation";
  }

  // 5. Institusi / Kampus / Sekolah (Prioritaskan nama_kampus ke institution, BUKAN full_name!)
  if (
    tokens.includes("kampus") || tokens.includes("universitas") || tokens.includes("sekolah") ||
    tokens.includes("institusi") || tokens.includes("perguruantinggi") || tokens.includes("institution") ||
    tokens.includes("fakultas") || tokens.includes("prodi")
  ) {
    return "institution";
  }

  // 6. Instansi / Perusahaan / Kantor / Organisasi
  if (
    tokens.includes("instansi") || tokens.includes("organisasi") || tokens.includes("perusahaan") ||
    tokens.includes("company") || tokens.includes("kantor")
  ) {
    return "organization";
  }

  // 7. Alamat Domisili vs Alamat Kantor
  if (tokens.includes("alamat") || tokens.includes("domisili") || tokens.includes("address")) {
    if (tokens.includes("kantor") || tokens.includes("perusahaan") || tokens.includes("instansi") || tokens.includes("kerja")) {
      return "work_address";
    }
    return "address";
  }

  // 8. Nama Lengkap Pemohon (Exclude kampus, sekolah, perusahaan, kantor, usaha, ibu, ayah, darurat)
  if (tokens.includes("nama") || tokens.includes("name") || tokens.includes("fullname")) {
    if (
      !tokens.includes("instansi") && !tokens.includes("perusahaan") && !tokens.includes("sekolah") &&
      !tokens.includes("kampus") && !tokens.includes("universitas") && !tokens.includes("kantor") &&
      !tokens.includes("usaha") && !tokens.includes("ibu") && !tokens.includes("ayah") &&
      !tokens.includes("ortu") && !tokens.includes("darurat") && !tokens.includes("kontak")
    ) {
      return "full_name";
    }
  }

  // 9. NIK / Identitas
  if (tokens.includes("nik") || tokens.includes("identitas") || tokens.includes("noktp")) {
    return "nik";
  }

  // 10. NISN
  if (tokens.includes("nisn")) {
    return "nisn";
  }

  // 11. NIM / NIP / NRP
  if (tokens.includes("nim") || tokens.includes("nip") || tokens.includes("nrp")) {
    return "student_id";
  }

  // 12. Pendidikan
  if (tokens.includes("pendidikan") || tokens.includes("jenjang")) {
    return "education_level";
  }

  // Phase 3: Substring search bertingkat (HANYA untuk kata kunci panjang >= 4 karakter, cegah false positive dari 'wa', 'hp', dll)
  for (const [profileKey, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      if (SHORT_KEYWORDS.has(kw) || kw.length <= 3) continue;
      if (combined.includes(kw)) {
        return profileKey;
      }
    }
  }

  return null;
}

// Cari teks <label for="..."> yang berelasi dengan element
function getLabelText(el) {
  if (el.id) {
    const label = document.querySelector(`label[for="${el.id}"]`);
    if (label) return label.textContent;
  }
  const parent = el.closest("label");
  if (parent) return parent.textContent;
  return "";
}

// ============================================================
// Deteksi Perubahan DOM / Dynamic Form (Misal Pilih Dropdown BMT UMY)
// ============================================================
let isFillingProcess = false;
let mutationDebounceTimer = null;

const observer = new MutationObserver((mutations) => {
  // Abaikan mutasi jika sedang dalam proses autofill atau transisi animasi
  if (isFillingProcess) return;

  // Abaikan mutasi jika hanya berasal dari elemen/kelas GovConnect sendiri
  const hasRealMutation = mutations.some(m => {
    const t = m.target;
    if (!t) return false;
    if (t.id === "govconnect-markers-layer" || t.closest?.("#govconnect-markers-layer")) return false;
    if (t.classList?.contains("govconnect-badge")) return false;
    if (m.type === "attributes" && m.attributeName === "class") {
      const cls = t.className || "";
      if (typeof cls === "string" && cls.includes("govconnect-")) return false;
    }
    return true;
  });

  if (!hasRealMutation) return;

  clearTimeout(mutationDebounceTimer);
  mutationDebounceTimer = setTimeout(() => {
    if (!isFillingProcess) {
      chrome.runtime.sendMessage({ action: "FORM_UPDATED" }).catch(() => {});
    }
  }, 400);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["style", "class", "hidden"]
});

// Dengarkan juga event change pada dropdown/select
document.addEventListener("change", (e) => {
  if (isFillingProcess) return;
  if (e.target && e.target.tagName === "SELECT") {
    setTimeout(() => {
      if (!isFillingProcess) {
        chrome.runtime.sendMessage({ action: "FORM_UPDATED" }).catch(() => {});
      }
    }, 300);
  }
}, true);

// ============================================================
// Notifikasi Mengambang (Floating Toast) Mode 1-Klik Instan
// ============================================================
function showOneClickFloatingToast(result) {
  const existing = document.getElementById("govconnect-oneclick-toast");
  if (existing) existing.remove();

  const count = result.count || 0;
  const isSuccess = count > 0;

  const toast = document.createElement("div");
  toast.id = "govconnect-oneclick-toast";
  toast.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 2147483647;
    background: #FFFFFF;
    color: #0F172A;
    border: 1px solid ${isSuccess ? '#BBF7D0' : '#FED7AA'};
    border-radius: 16px;
    padding: 14px 18px;
    box-shadow: 0 12px 32px -4px rgba(15, 23, 42, 0.16), 0 4px 12px -2px rgba(15, 23, 42, 0.08);
    display: flex;
    align-items: flex-start;
    gap: 12px;
    max-width: 380px;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    transform: translateX(120%);
    opacity: 0;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: auto;
  `;

  const iconBg = isSuccess ? '#ECFDF5' : '#FFF7ED';
  const iconColor = isSuccess ? '#16A34A' : '#EA580C';
  const iconSvg = isSuccess
    ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
    : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  toast.innerHTML = `
    <div style="width: 36px; height: 36px; border-radius: 10px; background: ${iconBg}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
      ${iconSvg}
    </div>
    <div style="flex: 1; min-width: 0;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <span style="font-size: 13px; font-weight: 700; color: #0F172A; letter-spacing: -0.2px;">
          ${isSuccess ? '⚡ GovConnect 1-Klik Berhasil!' : '⚡ GovConnect 1-Klik'}
        </span>
        <button id="govconnect-toast-close" style="background: none; border: none; font-size: 18px; color: #94A3B8; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
      </div>
      <p style="font-size: 12px; color: #475569; margin: 4px 0 8px 0; line-height: 1.4;">
        ${isSuccess
          ? `Berhasil mengisi <b>${count}</b> kolom formulir dan berkas foto secara otomatis.`
          : `Tidak ada kolom formulir yang cocok untuk diisi di halaman ini.`}
      </p>
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <button id="govconnect-toast-details" style="background: none; border: none; color: #2563EB; font-size: 11px; font-weight: 600; cursor: pointer; padding: 0; text-decoration: underline;">
          Buka Panel Samping &rarr;
        </button>
        <span style="font-size: 10px; color: #16A34A; font-weight: 600; background: #F0FDF4; padding: 2px 6px; border-radius: 6px;">Mode 1-Klik Aktif</span>
      </div>
    </div>
  `;

  document.body.appendChild(toast);

  // Animasi masuk
  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
    toast.style.opacity = "1";
  });

  const dismiss = () => {
    toast.style.transform = "translateX(120%)";
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  };

  const closeBtn = toast.querySelector("#govconnect-toast-close");
  if (closeBtn) closeBtn.onclick = dismiss;

  const detailBtn = toast.querySelector("#govconnect-toast-details");
  if (detailBtn) {
    detailBtn.onclick = () => {
      chrome.runtime.sendMessage({ action: "OPEN_SIDEPANEL" }).catch(() => {});
      dismiss();
    };
  }

  // Otomatis hilang setelah 4.5 detik
  setTimeout(dismiss, 4500);
}

// ============================================================
// Bridge Sinkronisasi Ekstensi <-> Web Dashboard GovConnect
// ============================================================
(function setupDashboardSync() {
  const isGovConnectApp =
    window.location.port === "5173" ||
    document.title.toLowerCase().includes("govconnect") ||
    document.getElementById("root") !== null;

  if (isGovConnectApp) {
    chrome.storage.local.get(["govconnect_token", "govconnect_email", "govconnect_one_click_mode"], (result) => {
      window.postMessage({
        type: "GOVCONNECT_EXTENSION_READY",
        isInstalled: true,
        token: result.govconnect_token || null,
        email: result.govconnect_email || null,
        oneClickMode: result.govconnect_one_click_mode !== false
      }, "*");
    });

    window.addEventListener("message", (event) => {
      if (event.source !== window || !event.data || typeof event.data !== "object") return;

      if (event.data.type === "GOVCONNECT_WEB_AUTH_SYNC") {
        if (event.data.token) {
          chrome.storage.local.set({
            govconnect_token: event.data.token,
            govconnect_email: event.data.email || ""
          });
        } else {
          chrome.storage.local.remove(["govconnect_token", "govconnect_email"]);
        }
      }

      if (event.data.type === "GOVCONNECT_SET_ONE_CLICK_MODE") {
        const enabled = !!event.data.enabled;
        chrome.storage.local.set({ govconnect_one_click_mode: enabled }, () => {
          chrome.runtime.sendMessage({ action: "SET_ONE_CLICK_MODE", enabled }).catch(() => {});
          window.postMessage({
            type: "GOVCONNECT_ONE_CLICK_MODE_UPDATED",
            oneClickMode: enabled
          }, "*");
        });
      }

      if (event.data.type === "GOVCONNECT_PING_EXTENSION") {
        chrome.storage.local.get(["govconnect_token", "govconnect_email", "govconnect_one_click_mode"], (result) => {
          window.postMessage({
            type: "GOVCONNECT_EXTENSION_PONG",
            isInstalled: true,
            token: result.govconnect_token || null,
            email: result.govconnect_email || null,
            oneClickMode: result.govconnect_one_click_mode !== false
          }, "*");
        });
      }
    });

    // Dengarkan pesan background jika mode diubah via context menu / sidepanel
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === "ONE_CLICK_MODE_CHANGED") {
        window.postMessage({
          type: "GOVCONNECT_ONE_CLICK_MODE_UPDATED",
          oneClickMode: msg.isOneClick
        }, "*");
      }
    });

    // Dengarkan notifikasi pembaruan profil dari web dashboard
    window.addEventListener("message", (event) => {
      if (event.data && event.data.type === "GOVCONNECT_PROFILE_UPDATED") {
        try {
          chrome.runtime.sendMessage({
            action: "PROFILE_UPDATED",
            profile: event.data.profile
          }).catch(() => {});
        } catch {}
      }
    });
  }
})();
})();