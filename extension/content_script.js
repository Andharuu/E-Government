// Content Script — GovConnect
// Mendeteksi form secara aktif dan mengisi field berdasarkan profil user

// ============================================================
// Keyword mapping: profile attribute → list keyword
// Sesuai PRD §14 — multi-level matching
// ============================================================
const KEYWORD_MAP = {
  nik:            ["nik", "no_ktp", "noktp", "ktp", "identitas", "nomor_induk", "identity_number", "citizen_id", "nomor_induk_kependudukan"],
  full_name:      ["nama", "name", "full_name", "fullname", "nama_lengkap", "namalengkap", "nama_depan", "nama_pemohon"],
  birth_date:     ["tanggal_lahir", "tgl_lahir", "birth_date", "birthdate", "dob", "tanggallahir", "tanggal_lahir_pemohon"],
  birth_place:    ["tempat_lahir", "birth_place", "birthplace", "tempatLahir"],
  gender:         ["jenis_kelamin", "gender", "sex", "kelamin"],
  address:        ["alamat", "address", "domisili", "alamat_lengkap"],
  province:       ["provinsi", "province", "propinsi"],
  city:           ["kota", "kabupaten", "city", "kab", "kot"],
  district:       ["kecamatan", "district"],
  village:        ["kelurahan", "desa", "village"],
  postal_code:    ["kode_pos", "postal_code", "zip", "kodepos"],
  phone:          ["telepon", "phone", "hp", "handphone", "telp", "whatsapp", "wa", "no_hp", "nohp"],
  email:          ["email", "surel", "e_mail"],
  nisn:           ["nisn", "nomor_induk_siswa", "student_number"],
  institution:    ["institusi", "institution", "sekolah", "universitas", "kampus"],
  education_level:["jenjang", "education_level", "pendidikan"],
  student_id:     ["nim", "nip", "nrp", "student_id", "nomor_mahasiswa"],
  occupation:     ["pekerjaan", "occupation", "jabatan", "job", "profesi"],
  organization:   ["instansi", "organisasi", "perusahaan", "organization", "company"],
};

// ============================================================
// Form detection & reporting saat halaman dimuat
// ============================================================
(function detectForm() {
  const inputs = document.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea");
  if (inputs.length > 0) {
    const detectedFields = Array.from(inputs).map(el => ({
      tag: el.tagName.toLowerCase(),
      type: el.type || "",
      name: el.name || "",
      id: el.id || "",
      placeholder: el.placeholder || "",
      ariaLabel: el.getAttribute("aria-label") || "",
      autocomplete: el.autocomplete || "",
    }));
    // Kirim info ke background (side panel akan mengambil lewat message)
    chrome.runtime.sendMessage({
      action: "FORM_DETECTED",
      count: detectedFields.length,
      fields: detectedFields
    }).catch(() => {}); // abaikan jika side panel belum buka
  }
})();

// ============================================================
// Listener untuk pesan dari side panel / popup
// ============================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "DETECT_FIELDS") {
    const result = detectFields();
    sendResponse(result);
  }

  if (request.action === "EXECUTE_AUTOFILL") {
    const result = fillForm(request.profile);
    sendResponse(result);
  }

  return true;
});

// ============================================================
// Deteksi semua field pada form
// ============================================================
function detectFields() {
  const inputs = document.querySelectorAll(
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea"
  );

  const detected = [];
  inputs.forEach(el => {
    const profileKey = matchProfileKey(el);
    detected.push({
      tag: el.tagName.toLowerCase(),
      name: el.name || "",
      id: el.id || "",
      placeholder: el.placeholder || "",
      profileKey: profileKey,          // null jika tidak cocok
      status: profileKey ? "matched" : "not_found"
    });
  });

  return {
    total: detected.length,
    matched: detected.filter(d => d.profileKey).length,
    fields: detected
  };
}

// ============================================================
// Isi field berdasarkan profil
// ============================================================
function fillForm(profile) {
  const inputs = document.querySelectorAll(
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), textarea"
  );

  const results = [];
  let filledCount = 0;

  inputs.forEach(el => {
    // Skip field yang sudah terisi
    if (el.value && el.value.trim() !== "") {
      results.push({ id: el.id || el.name, status: "skipped" });
      return;
    }

    const profileKey = matchProfileKey(el);
    if (!profileKey) {
      results.push({ id: el.id || el.name, status: "not_found" });
      return;
    }

    const value = profile[profileKey];
    if (!value) {
      results.push({ id: el.id || el.name, status: "not_found", profileKey });
      return;
    }

    el.value = value;
    // Trigger event agar framework (React/Vue/dll) mengenali perubahan
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

    filledCount++;
    results.push({ id: el.id || el.name, status: "filled", profileKey });
  });

  // Hitung status keseluruhan sesuai PRD §19
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
// Cocokkan element HTML ke profile key (multi-level matching)
// Sesuai PRD §14: Exact → Keyword → Attribute
// ============================================================
function matchProfileKey(el) {
  // Kumpulkan semua teks yang bisa dipakai untuk matching
  const haystack = [
    el.name,
    el.id,
    el.placeholder,
    el.getAttribute("aria-label"),
    el.autocomplete,
    getLabelText(el)
  ].filter(Boolean).join(" ").toLowerCase();

  for (const [profileKey, keywords] of Object.entries(KEYWORD_MAP)) {
    for (const kw of keywords) {
      // Level 1: Exact match
      if (
        el.name?.toLowerCase() === kw ||
        el.id?.toLowerCase() === kw
      ) return profileKey;

      // Level 2: Contains keyword
      if (haystack.includes(kw)) return profileKey;
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
  // Coba ancestor label
  const parent = el.closest("label");
  if (parent) return parent.textContent;
  return "";
}