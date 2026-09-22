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
  "wa", "hp", "kab", "kot", "zip", "nim", "nip", "nrp", "dob", "sex", "job", "telp", "age", "sim", "day"
]);

// ============================================================
// HTML5 Standard Autocomplete Attribute Map (W3C Standard)
// Menjamin deteksi instan 100% akurat untuk web modern
// ============================================================
const AUTOCOMPLETE_MAP = {
  "given-name": "first_name",
  "additional-name": "full_name",
  "family-name": "last_name",
  "name": "full_name",
  "email": "email",
  "tel": "phone",
  "tel-national": "phone",
  "street-address": "address",
  "address-line1": "address",
  "address-line2": "address",
  "address-level1": "province",
  "address-level2": "city",
  "postal-code": "postal_code",
  "country": "country",
  "country-name": "country",
  "organization": "organization",
  "organization-title": "occupation",
  "bday": "birth_date",
  "bday-day": "birth_day",
  "bday-month": "birth_month",
  "bday-year": "birth_year",
  "sex": "gender",
  "url": "website"
};

function getAutocompleteProfileKey(el) {
  if (!el) return null;
  const rawAuto = (el.getAttribute("autocomplete") || "").toLowerCase().trim();
  if (!rawAuto || ["off", "false", "none", "new-password", "current-password", "one-time-code"].includes(rawAuto)) {
    return null;
  }
  const tokens = rawAuto.split(/\s+/);
  for (const t of tokens) {
    if (t in AUTOCOMPLETE_MAP) {
      return AUTOCOMPLETE_MAP[t];
    }
  }
  return null;
}

// ============================================================
// Universal Abbreviation / Truncated Form Field Dictionary
// Menerjemahkan singkatan teknis form legacy (seperti RoboForm, vBulletion, SAP)
// ============================================================
const ABBREVIATION_MAP = {
  "frstname": "first_name",
  "frst": "first",
  "fname": "first_name",
  "lstname": "last_name",
  "lname": "last_name",
  "fullname": "full_name",
  "homephon": "phone",
  "workphon": "phone",
  "cellphon": "phone",
  "faxphone": "phone",
  "emailadr": "email",
  "emailaddr": "email",
  "adrstate": "province",
  "adr_city": "city",
  "adrcity": "city",
  "addr_zip": "postal_code",
  "addrzip": "postal_code",
  "driv_lic": "driver_license",
  "drivlic": "driver_license",
  "birth_pl": "birth_place",
  "birthpl": "birth_place",
  "pers_sex": "gender",
  "perssex": "gender",
  "pers_ssn": "nik",
  "ssn": "nik",
  "web_site": "website",
  "addr": "address",
  "addr1": "address",
  "addr2": "address",
  "tel": "phone",
  "phon": "phone",
  "org": "organization",
  "comp": "company",
  "occ": "occupation",
  "pos": "occupation"
};

/**
 * Membersihkan prefiks angka dan underscore di awal nama field
 * Contoh: "02frstname" -> "frstname", "68__income" -> "income", "13adr_city" -> "adr_city"
 * SAFEGUARD: Hanya hapus jika setelah angka/simbol terdapat minimal 2 karakter huruf
 */
function stripNumericPrefix(str) {
  if (!str || typeof str !== "string") return "";
  const cleaned = str.replace(/^[0-9]+[_\s-]*/, "").replace(/^_+/, "");
  return cleaned.length >= 2 ? cleaned : str;
}

const KEYWORD_MAP = {
  full_name: [
    "nama_lengkap", "nama_pemohon", "nama_siswa", "nama_mahasiswa", "nama_lengkap_pemohon",
    "nama", "name", "full_name", "fullname", "nama_pelamar",
    "taxpayer_name", "taxpayername", "reginput_taxpayername", "nama_wajib_pajak", "wajib_pajak",
    "card_user_name", "cardusername", "card_name"
  ],
  title: [
    "title", "gelar", "salutation", "prefix", "mr_mrs", "titel"
  ],
  first_name: [
    "first_name", "firstname", "fname", "first", "given_name", "givenname", "nama_depan", "namadepan",
    "frstname", "frst"
  ],
  middle_initial: [
    "middle_initial", "middleinitial", "initial", "m_i", "mi", "middle_name", "middlename"
  ],
  last_name: [
    "last_name", "lastname", "lname", "last", "surname", "family_name", "familyname", "nama_belakang", "namabelakang",
    "lstname"
  ],
  address: [
    "alamat_ktp", "alamat_saatini", "alamat_domisili", "alamat_lengkap",
    "alamat_tinggal", "alamat_surat", "alamat", "address", "domisili", "street", "jalan",
    "address_line_1", "address_line_2", "address1", "address2", "currentaddress", "current_address",
    "addr", "addr1", "addr2"
  ],
  address_line_1: [
    "address_line_1", "address_line1", "address1", "addr1", "alamat1", "alamat_1"
  ],
  address_line_2: [
    "address_line_2", "address_line2", "address2", "addr2", "alamat2", "alamat_2", "apartment", "suite", "unit"
  ],
  organization: [
    "nama_perusahaan", "nama_instansi", "instansi_pekerjaan", "nama_organisasi", "nama_kantor",
    "instansi", "organisasi", "perusahaan", "organization", "company", "perusahaan_tempat_bekerja"
  ],
  occupation: [
    "posisi_di_perusahaan", "posisi_pekerjaan", "posisi", "jabatan", "role",
    "pekerjaan", "occupation", "profesi", "job", "position",
    "jenis_pekerjaan", "jenispekerjaan", "reginput_occupation", "reginput_job", "reginput_jenispekerjaan"
  ],
  education_level: [
    "pendidikan_terakhir", "jenjang_pendidikan", "pendidikan", "education_level", "jenjang"
  ],
  birth_date: [
    "tanggal_lahir", "tgl_lahir", "birth_date", "birthdate", "dob", "tanggallahir", "tanggal_lahir_pemohon", "tgl_lahir_pemohon",
    "reginput_birthdate", "reginput_tanggallahir", "dateofbirth", "date_of_birth"
  ],
  birth_month: [
    "birth_month", "dob_month", "month_of_birth", "bulan_lahir", "month", "dob_m", "mm"
  ],
  birth_day: [
    "birth_day", "dob_day", "day_of_birth", "hari_lahir", "day", "dob_d", "dd"
  ],
  birth_year: [
    "birth_year", "dob_year", "year_of_birth", "tahun_lahir", "year", "dob_y", "yy", "yyyy"
  ],
  age: [
    "age", "umur", "usia"
  ],
  birth_place: [
    "tempat_lahir", "tempatlahir", "birth_place", "birthplace", "tempat_lahir_pemohon",
    "birth_pl", "birthpl", "reginput_placeofbirth", "reginput_birthplace", "reginput_tempatlahir"
  ],
  gender: [
    "jenis_kelamin", "jeniskelamin", "gender", "sex", "kelamin",
    "pers_sex", "perssex", "reginput_gender", "reginput_sex", "reginput_jeniskelamin"
  ],
  nik: [
    "nomor_identitas", "no_identitas", "nik", "no_ktp", "noktp", "nomor_ktp",
    "nomor_induk_kependudukan", "nomor_induk", "identity_number", "citizen_id", "reginput_nik",
    "pers_ssn", "ssn", "social_security_number", "social_security"
  ],
  phone: [
    "nomor_hp", "no_hp", "nohp", "no_telepon", "notelepon", "nomor_telepon",
    "nomor_handphone", "handphone", "telepon", "phone", "hp", "telp", "whatsapp", "wa",
    "cell_phone", "mobile", "usernumber", "user_number", "phone_number", "contact_number",
    "cellphon"
  ],
  home_phone: [
    "home_phone", "homephone", "homephon", "telepon_rumah", "telp_rumah", "tel_rumah"
  ],
  work_telephone: [
    "work_telephone", "work_phone", "workphone", "workphon", "telepon_kantor", "telp_kantor", "work_tel", "worktel"
  ],
  fax: [
    "fax", "fax_number", "faxphone", "nomor_fax", "telefax"
  ],
  email: [
    "email", "surel", "e_mail", "alamat_email", "useremail", "user_email",
    "emailadr", "emailaddr"
  ],
  province: [
    "provinsi", "province", "propinsi", "state", "state_province",
    "adrstate", "adr_state"
  ],
  city: [
    "kota", "kabupaten", "city", "kab", "kot",
    "adr_city", "adrcity"
  ],
  district: [
    "kecamatan", "district"
  ],
  village: [
    "kelurahan", "desa", "village"
  ],
  postal_code: [
    "kode_pos", "postal_code", "zip", "kodepos", "zipcode", "zip_code",
    "addr_zip", "addrzip", "postalcode"
  ],
  country: [
    "country", "negara", "kewarganegaraan", "nationality"
  ],
  driver_license: [
    "driver_license", "driver_license_number", "driverlicense", "driving_license", "driver_licence", "nomor_sim", "no_sim", "sim",
    "driv_lic", "drivlic", "drivinglicense", "drvlic"
  ],
  website: [
    "website", "web_site", "url", "web", "homepage", "situs"
  ],
  income: [
    "income", "pendapatan", "penghasilan", "gaji", "salary", "__income", "income_field"
  ],
  comments: [
    "comments", "comment", "catatan", "keterangan", "notes", "pesan", "remark", "remarks"
  ],
  student_id: [
    "nim", "nip", "nrp", "student_id", "nomor_mahasiswa", "nomor_induk_mahasiswa", "nomor_induk_siswa"
  ],
  institution: [
    "nama_kampus", "nama_sekolah", "nama_universitas", "nama_institusi", "perguruan_tinggi",
    "institusi", "institution", "sekolah", "universitas", "kampus"
  ],
  nisn: [
    "nisn", "nomor_induk_siswa", "student_number"
  ],
  religion: [
    "agama", "religion", "kepercayaan",
    "reginput_religion", "reginput_agama", "reginputreligion", "reginputagama"
  ],
  marital_status: [
    "status_perkawinan", "statusperkawinan", "status_nikah", "statusnikah",
    "status_pernikahan", "statuspernikahan", "status_kawin", "statuskawin",
    "marital_status", "maritalstatus", "perkawinan", "pernikahan",
    "reginput_maritalstatus", "reginput_statusperkawinan", "reginputmaritalstatus", "reginputstatusperkawinan"
  ],
  family_card_number: [
    "nomor_kartu_keluarga", "nomor_kk", "no_kk", "noktp", "kartu_keluarga",
    "family_card_number", "family_card_no", "family_id", "reginput_familycardnumber", "reginput_nokk"
  ],
  family_relationship: [
    "status_hubungan_keluarga", "hubungan_keluarga", "family_status", "family_relationship",
    "status_keluarga", "reginput_familyrelationship", "reginput_statushubungankeluarga"
  ],
  blood_type: [
    "golongan_darah", "gol_darah", "goldarah", "blood_type", "blood_group"
  ],
  mother_name: [
    "nama_lengkap_ibu", "nama_lengkap_ibu_kandung", "nama_ibu_kandung", "nama_ibu",
    "ibu_kandung", "mother_name", "mother_full_name", "mothers_name", "namaibu", "nama_orang_tua_ibu",
    "mothername", "mothersname", "reginput_mothersname", "reginput_mothername"
  ],
  father_name: [
    "nama_lengkap_ayah", "nama_lengkap_ayah_kandung", "nama_ayah_kandung", "nama_ayah",
    "ayah_kandung", "father_name", "father_full_name", "fathers_name", "namaayah", "nama_orang_tua_ayah",
    "fathername", "fathersname", "reginput_fathersname", "reginput_fathername"
  ],
  emergency_contact_name: [
    "nama_kontak_darurat", "kontak_darurat", "nama_darurat", "emergency_contact_name", "emergency_contact"
  ],
  emergency_contact_phone: [
    "no_kontak_darurat", "nomor_kontak_darurat", "telp_darurat", "hp_darurat", "emergency_contact_phone", "emergency_phone"
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
// Dropdown Value Mapping: Standarisasi & Sinonim Nilai Dropdown
// Memetakan nilai profil ke variasi penulisan opsi <select> umum
// ============================================================
const DROPDOWN_VALUE_MAP = {
  gender: {
    "laki-laki": ["laki", "pria", "male", "l", "1", "lk", "man", "cowok", "laki-laki", "laki laki", "m"],
    "perempuan": ["wanita", "perempuan", "female", "p", "pr", "2", "w", "woman", "cewek", "f"]
  },
  birth_month: {
    "01": ["1", "01", "jan", "january", "januari"],
    "02": ["2", "02", "feb", "february", "februari"],
    "03": ["3", "03", "mar", "march", "maret"],
    "04": ["4", "04", "apr", "april"],
    "05": ["5", "05", "may", "mei"],
    "06": ["6", "06", "jun", "june", "juni"],
    "07": ["7", "07", "jul", "july", "juli"],
    "08": ["8", "08", "aug", "august", "agustus"],
    "09": ["9", "09", "sep", "september"],
    "10": ["10", "oct", "october", "oktober"],
    "11": ["11", "nov", "november"],
    "12": ["12", "dec", "december", "desember"]
  },
  religion: {
    "islam": ["islam", "muslim"],
    "kristen": ["kristen", "protestan", "christian", "kristen protestan"],
    "katolik": ["katolik", "catholic", "kristen katolik"],
    "hindu": ["hindu"],
    "buddha": ["buddha", "budha", "buddhis"],
    "konghucu": ["konghucu", "khonghucu", "confucianism", "penghayat", "lainnya"]
  },
  marital_status: {
    "belum kawin": ["belum_menikah", "single", "lajang", "belum_kawin", "tidak_kawin", "belum", "b", "tidak kawin", "belum kawin", "tk", "tidak", "belum menikah", "tidak_menikah"],
    "kawin": ["menikah", "married", "sudah_menikah", "kawin", "k", "sudah kawin", "sudah menikah", "k/0", "k/1", "k/2", "k/3"],
    "cerai hidup": ["cerai", "cerai_hidup", "duda", "janda", "divorced", "ch", "cerai hidup"],
    "cerai mati": ["cerai_mati", "widow", "widower", "cm", "cerai mati"]
  },
  education_level: {
    "sd": ["sd", "sekolah_dasar", "elementary"],
    "smp": ["smp", "sltp", "junior_high"],
    "sma": ["sma", "smk", "slta", "sederajat", "senior_high", "al_iyah", "aliyah", "ma"],
    "d1": ["d1", "diploma_1", "d-1", "diploma 1"],
    "d2": ["d2", "diploma_2", "d-2", "diploma 2"],
    "d3": ["d3", "diploma", "diploma_3", "d-3", "diploma 3"],
    "d4": ["d4", "diploma_4", "d-4", "diploma 4"],
    "s1": ["s1", "sarjana", "bachelor", "s-1", "strata_1", "strata 1"],
    "s2": ["s2", "magister", "master", "s-2", "strata_2", "strata 2"],
    "s3": ["s3", "doktor", "doctoral", "phd", "s-3", "strata_3", "strata 3"]
  },
  blood_type: {
    "a": ["a", "golongan a", "gol a", "a+"],
    "b": ["b", "golongan b", "gol b", "b+"],
    "ab": ["ab", "golongan ab", "gol ab", "ab+"],
    "o": ["o", "golongan o", "gol o", "o+"]
  }
};

// ============================================================
// Helper: Periksa Apakah Element Benar-benar Terlihat di Layar
// ============================================================
function isElementVisible(el) {
  if (!el) return false;
  if (el.type === "hidden") return false;

  // Pengecualian khusus: PrimeNG host element (<p-dropdown> atau div.p-dropdown)
  // Angular sering melampirkannya di dalam portal-outlet atau container posisional
  // sehingga offsetParent bisa null meski elemen benar-benar terlihat.
  // Solusi: periksa visibilitas pada inner .p-dropdown div, bukan elemen host.
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "p-dropdown" || (el.classList && el.classList.contains("p-dropdown") && !el.closest("p-dropdown"))) {
    const inner = el.querySelector(".p-dropdown") || el;
    const innerStyle = window.getComputedStyle(inner);
    if (innerStyle.display === "none" || innerStyle.visibility === "hidden") return false;
    const innerRect = inner.getBoundingClientRect();
    return innerRect.width > 0 || innerRect.height > 0;
  }

  // Pengecualian khusus: Custom radio / checkbox (Bootstrap, Tailwind, DemoQA custom-control)
  // Seringkali input native disembunyikan dengan opacity: 0 atau position: absolute, tetapi label pendukungnya terlihat jelas
  if (el.type === "radio" || el.type === "checkbox") {
    const parentContainer = el.closest(".custom-control, .form-check, label, div");
    if (parentContainer) {
      const pStyle = window.getComputedStyle(parentContainer);
      if (pStyle.display !== "none" && pStyle.visibility !== "hidden") {
        const pRect = parentContainer.getBoundingClientRect();
        if (pRect.width > 0 || pRect.height > 0) return true;
      }
    }
  }

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

/**
 * Memeriksa apakah suatu elemen merupakan dropdown kustom PrimeNG (CoreTax DJP)
 */
function isPrimeNGDropdown(el) {
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "p-dropdown") return true;
  if (el.classList && el.classList.contains("p-dropdown")) return true;
  if (el.querySelector && (el.querySelector(".p-dropdown-label") || el.querySelector(".p-dropdown-trigger"))) return true;
  return false;
}

/**
 * Mengambil semua form field yang dapat diisi pada halaman:
 * input standar, select native, textarea, dan custom dropdown (PrimeNG, Material, combobox, React-Select).
 * Mengabaikan input pembantu internal seperti .p-hidden-accessible.
 */
function getAllFormFields() {
  const standardInputs = Array.from(document.querySelectorAll(
    "input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]), select, textarea"
  )).filter(el => {
    // Abaikan input pembantu internal yang tersembunyi di dalam custom component (PrimeNG, Material, dll.)
    if (el.closest(".p-hidden-accessible, .cdk-visually-hidden, [aria-hidden='true']")) {
      return false;
    }
    // Abaikan input jika berada di dalam p-dropdown kecuali jika berupa search filter
    if (el.closest("p-dropdown, .p-dropdown") && !el.classList.contains("p-dropdown-filter")) {
      return false;
    }
    return true;
  });

  const customDropdowns = Array.from(document.querySelectorAll(
    "p-dropdown, .p-dropdown:not(p-dropdown .p-dropdown), mat-select, [role='combobox']:not(input):not(select), [class*='react-select__control']"
  ));

  const all = [...standardInputs, ...customDropdowns];
  return all.filter(el => el && document.body.contains(el));
}

// ============================================================
// Penanda Kolom Form di Halaman Web (In-Page Field Markers)
// Menampilkan border highlight dan badge "⚡ GovConnect" pada kolom yang akan diisi
// ============================================================
const MARKER_LABELS = {
  full_name: "Nama Lengkap",
  title: "Gelar / Title",
  first_name: "Nama Depan",
  middle_initial: "Middle Initial",
  last_name: "Nama Belakang",
  nik: "NIK",
  birth_date: "Tgl Lahir",
  birth_month: "Bulan Lahir",
  birth_day: "Hari Lahir",
  birth_year: "Tahun Lahir",
  age: "Usia",
  birth_place: "Tempat Lahir",
  gender: "Jenis Kelamin",
  religion: "Agama",
  marital_status: "Status Nikah",
  family_card_number: "No. KK",
  family_relationship: "Hub. Keluarga",
  blood_type: "Gol. Darah",
  address: "Alamat",
  address_line_1: "Alamat Baris 1",
  address_line_2: "Alamat Baris 2",
  province: "Provinsi",
  city: "Kota/Kab",
  district: "Kecamatan",
  village: "Kelurahan/Desa",
  postal_code: "Kode Pos",
  country: "Negara",
  driver_license: "No. SIM",
  website: "Website",
  income: "Penghasilan",
  phone: "Telepon/WA",
  home_phone: "Telp Rumah",
  work_telephone: "Telp Kantor",
  fax: "Nomor Fax",
  comments: "Catatan",
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

function parseBirthDate(dateStr) {
  if (!dateStr) return { month: "", day: "", year: "" };
  const str = String(dateStr).trim();
  let day = "", month = "", year = "";

  // 1. YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (isoMatch) {
    year = isoMatch[1];
    month = isoMatch[2].padStart(2, "0");
    day = isoMatch[3].padStart(2, "0");
    return { day, month, year };
  }

  // 2. DD-MM-YYYY or DD/MM/YYYY
  const idMatch = str.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})/);
  if (idMatch) {
    day = idMatch[1].padStart(2, "0");
    month = idMatch[2].padStart(2, "0");
    year = idMatch[3];
    return { day, month, year };
  }

  // 3. DD Mon YYYY (e.g. 22 Sep 2026 or 15 May 1995)
  const monthNames = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", mei: "05", jun: "06",
    jul: "07", aug: "08", agu: "08", sep: "09", oct: "10", okt: "10", nov: "11", dec: "12", des: "12"
  };
  const textMatch = str.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (textMatch) {
    day = textMatch[1].padStart(2, "0");
    const mStr = textMatch[2].toLowerCase().slice(0, 3);
    month = monthNames[mStr] || "01";
    year = textMatch[3];
    return { day, month, year };
  }

  return { day, month, year };
}

function calculateAge(birthDateStr) {
  const parts = parseBirthDate(birthDateStr);
  if (!parts.year) return "";
  const birthYear = parseInt(parts.year, 10);
  const birthMonth = parseInt(parts.month || "1", 10) - 1;
  const birthDay = parseInt(parts.day || "1", 10);
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return age > 0 ? String(age) : "";
}

function detectDateSelectType(el) {
  if (!el || el.tagName.toLowerCase() !== "select") return null;

  // 1. Cek dari nama/id setelah prefiks angka dibersihkan (misal name="66mm" -> "mm", name="67dd" -> "dd", name="68yy" -> "yy")
  const rawName = (el.name || el.id || "").toLowerCase();
  const cleanName = stripNumericPrefix(rawName).toLowerCase();
  if (cleanName === "mm" || cleanName === "dob_m" || cleanName === "month" || cleanName === "dob_mm" || cleanName === "ccexp_mm") {
    // Abaikan expiration credit card
    if (cleanName.includes("ccexp") || rawName.includes("ccexp")) return null;
    return "birth_month";
  }
  if (cleanName === "dd" || cleanName === "dob_d" || cleanName === "day" || cleanName === "dob_dd") {
    return "birth_day";
  }
  if (cleanName === "yy" || cleanName === "yyyy" || cleanName === "dob_y" || cleanName === "year" || cleanName === "dob_yy" || cleanName === "ccexp_yy") {
    // Abaikan expiration credit card
    if (cleanName.includes("ccexp") || rawName.includes("ccexp")) return null;
    return "birth_year";
  }

  const opts = Array.from(el.options || []).filter(o => o.value && o.value !== "");
  if (opts.length === 0) return null;
  const vals = opts.map(o => (o.value || o.text || "").trim().toLowerCase());

  // Abaikan jika ini adalah expiration dropdown kartu kredit
  if (rawName.includes("exp") || cleanName.includes("exp")) {
    return null;
  }

  // Cek apakah dropdown tahun (memiliki nilai >= 1900)
  if (vals.some(v => /^(19\d\d|20\d\d)$/.test(v))) {
    return "birth_year";
  }
  // Cek apakah dropdown bulan (mengandung nama bulan atau nilai 1-12 dengan total opsi <= 13)
  if (vals.some(v => /^(jan|feb|mar|apr|may|mei|jun|jul|aug|sep|oct|nov|dec)/i.test(v))) {
    return "birth_month";
  }
  const nums = vals.map(v => parseInt(v, 10)).filter(n => !isNaN(n));
  if (nums.length > 0) {
    const max = Math.max(...nums);
    if (max <= 12 && nums.length <= 13) return "birth_month";
    if (max <= 31 && nums.length <= 32) return "birth_day";
  }
  return null;
}

function isReactSelect(el) {
  if (!el) return false;
  if (el.classList && Array.from(el.classList).some(c => c.includes("react-select"))) return true;
  if (el.closest && el.closest("[class*='react-select'], .css-2b097c-container, #state, #city")) return true;
  return false;
}

async function fillReactSelect(el, value, profileKey) {
  const container = el.closest("[class*='react-select'], .css-2b097c-container, #state, #city") || el;
  try {
    container.scrollIntoView({ behavior: "instant", block: "center" });
  } catch (e) {}

  // 1. Klik control untuk membuka menu
  const control = container.querySelector("[class*='control'], [class*='placeholder'], .css-1wa3eu0-placeholder") || container;
  control.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
  control.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
  control.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));

  await new Promise(r => setTimeout(r, 120));

  // 2. Ketik teks ke input react-select
  const inputEl = container.querySelector("input") || (el.tagName.toLowerCase() === "input" ? el : null);
  if (inputEl) {
    inputEl.focus();
    inputEl.value = value;
    inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    inputEl.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter", code: "Enter" }));
    await new Promise(r => setTimeout(r, 150));
  }

  // 3. Cari menu/opsi yang muncul
  const menuOptions = Array.from(document.querySelectorAll("[class*='option'], [id*='react-select'][id*='option']"));
  if (menuOptions.length > 0) {
    const wrappers = menuOptions.map(opt => ({
      rawElement: opt,
      value: opt.textContent.trim(),
      text: opt.textContent.trim()
    }));
    const matched = bestMatchOption(wrappers, value, profileKey) || wrappers[0];
    if (matched && matched.rawElement) {
      matched.rawElement.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      matched.rawElement.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      matched.rawElement.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      if (typeof matched.rawElement.click === "function") {
        try { matched.rawElement.click(); } catch(e) {}
      }
      await new Promise(r => setTimeout(r, 120));
      return true;
    }
  }

  if (inputEl) {
    inputEl.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
    return true;
  }
  return false;
}

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

  // Auto-derive first_name dan last_name jika belum ada di profile
  if (profile.full_name && (!profile.first_name || !profile.last_name)) {
    const parts = profile.full_name.trim().split(/\s+/);
    if (!profile.first_name) profile.first_name = parts[0] || "";
    if (!profile.last_name) profile.last_name = parts.slice(1).join(" ") || parts[0] || "";
  }

  // Auto-derive middle_initial jika belum ada di profile
  if (!profile.middle_initial && profile.full_name) {
    const parts = profile.full_name.trim().split(/\s+/);
    if (parts.length > 2) {
      profile.middle_initial = parts[1].charAt(0).toUpperCase();
    }
  }

  // Auto-derive title jika belum ada
  if (!profile.title) {
    const g = (profile.gender || "").toLowerCase();
    if (g.includes("laki") || g.includes("pria") || g.includes("male") || g === "l") {
      profile.title = "Mr";
    } else if (g.includes("perempuan") || g.includes("wanita") || g.includes("female") || g === "p") {
      profile.title = "Ms";
    }
  }

  // Auto-derive address_line_1 fallback
  if (!profile.address_line_1 && profile.address) {
    profile.address_line_1 = profile.address;
  }

  // Auto-derive komponen tanggal lahir (birth_month, birth_day, birth_year, age)
  if (profile.birth_date) {
    const bParts = parseBirthDate(profile.birth_date);
    if (!profile.birth_month) profile.birth_month = bParts.month;
    if (!profile.birth_day) profile.birth_day = bParts.day;
    if (!profile.birth_year) profile.birth_year = bParts.year;
    if (!profile.age) profile.age = calculateAge(profile.birth_date);
  }

  // Auto-derive country default "Indonesia" jika belum ada
  if (!profile.country) {
    profile.country = "Indonesia";
  }

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
    p-dropdown.govconnect-field-ready .p-dropdown,
    .p-dropdown.govconnect-field-ready {
      outline: 2px solid #2563EB !important;
      outline-offset: 1px !important;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.16) !important;
      border-color: #2563EB !important;
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
    p-dropdown.govconnect-field-filled .p-dropdown,
    .p-dropdown.govconnect-field-filled {
      outline: 2px solid #16A34A !important;
      outline-offset: 1px !important;
      box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.22) !important;
      border-color: #16A34A !important;
      background-color: #F0FDF4 !important;
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

  const inputs = getAllFormFields();

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
      const trigger = el.querySelector?.(".p-dropdown-trigger, .p-dropdown") || el;
      trigger.focus();
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
      (async () => {
        try {
          const result = await fillForm(request.profile, request.targetFields);
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
        } catch (fillErr) {
          console.error("GovConnect: Error saat proses autofill:", fillErr);
          sendResponse({ success: false, error: fillErr.message });
        } finally {
          // Bebaskan flag isFillingProcess setelah animasi fade-out selesai
          setTimeout(() => {
            isFillingProcess = false;
          }, 3200);
        }
      })();
      return true; // Menandakan asynchronous sendResponse ke Chrome Extension runtime
    }
  } catch (err) {
    console.error("Error in onMessage listener:", err);
    sendResponse({ success: false, error: err.message });
    return false;
  }
  return false;
});

// ============================================================
// Deteksi semua field pada form (Termasuk Status Visibilitas & Custom Dropdown)
// ============================================================
function detectFields() {
  const inputs = getAllFormFields();

  const detected = [];
  inputs.forEach(el => {
    const profileKey = matchProfileKey(el);
    const visible = isElementVisible(el);
    const isPrime = isPrimeNGDropdown(el);
    const hostEl = el.closest("p-dropdown, mat-select") || el;
    const formControl = hostEl.getAttribute("formcontrolname") || hostEl.getAttribute("ng-reflect-name") || "";
    const label = getLabelText(el);

    const displayName = el.name || hostEl.getAttribute("name") || formControl || el.id || label || (isPrime ? "Dropdown" : "");
    const tag = isPrime ? "select (primeng)" : el.tagName.toLowerCase();
    const pLabel = el.querySelector?.(".p-dropdown-label")?.textContent?.trim() || "";
    const placeholder = el.placeholder || pLabel || "";

    detected.push({
      tag: tag,
      name: displayName,
      id: el.id || hostEl.id || "",
      placeholder: placeholder,
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
// Mendukung Input, Dropdown Native (<select>), File, dan Dropdown PrimeNG
// ============================================================
async function fillForm(profile, targetFields = null) {
  if (profile) registerCustomProfileFields(profile);
  const inputs = getAllFormFields();

  const results = [];
  let filledCount = 0;

  for (const el of inputs) {
    const profileKey = matchProfileKey(el);
    const hostEl = el.closest("p-dropdown, mat-select") || el;
    const formControl = hostEl.getAttribute("formcontrolname") || hostEl.getAttribute("ng-reflect-name") || "";
    const fieldIdentifier = el.id || hostEl.id || el.name || formControl || "";

    if (!profileKey) {
      results.push({ id: fieldIdentifier, status: "not_found" });
      continue;
    }

    // Jika targetFields diberikan, HANYA isi jika elemen ini termasuk dalam target yang dicentang oleh user
    if (Array.isArray(targetFields) && targetFields.length > 0) {
      const isSelected = targetFields.some(tf => {
        if (tf.id && (el.id === tf.id || hostEl.id === tf.id)) return true;
        if (tf.name && (el.name === tf.name || formControl === tf.name)) return true;
        if (!tf.id && !tf.name && tf.profileKey === profileKey) return true;
        if (tf.profileKey === profileKey) return true;
        return false;
      });
      if (!isSelected) {
        results.push({ id: fieldIdentifier, status: "skipped", profileKey });
        continue;
      }
    }

    // Hanya isi jika field tersebut dicentang/ada dalam profile yang dikirim
    if (!profile || !(profileKey in profile)) {
      results.push({ id: fieldIdentifier, status: "skipped", profileKey });
      continue;
    }

    const value = profile[profileKey];
    if (value === undefined || value === null || value === "") {
      results.push({ id: fieldIdentifier, status: "skipped", profileKey });
      continue;
    }

    // Jika elemen adalah PrimeNG dropdown (CoreTax DJP)
    if (isPrimeNGDropdown(el)) {
      const ok = await fillPrimeNGDropdown(el, value, profileKey);
      if (ok) {
        filledCount++;
        results.push({ id: fieldIdentifier, status: "filled", profileKey });
      } else {
        results.push({ id: fieldIdentifier, status: "skipped", profileKey });
      }
      continue;
    }

    // Jika elemen adalah custom React Select (DemoQA State/City dll.)
    if (isReactSelect(el)) {
      const ok = await fillReactSelect(el, value, profileKey);
      if (ok) {
        filledCount++;
        results.push({ id: fieldIdentifier, status: "filled", profileKey });
      } else {
        results.push({ id: fieldIdentifier, status: "skipped", profileKey });
      }
      continue;
    }

    // Jika tag adalah select (dropdown native)
    if (el.tagName.toLowerCase() === "select") {
      let selectVal = value;
      // Jika profileKey adalah birth_date namun dropdown ini adalah sub-komponen tanggal (bulan/hari/tahun)
      const subType = detectDateSelectType(el);
      if (subType && profile.birth_date) {
        const bParts = parseBirthDate(profile.birth_date);
        if (subType === "birth_month") selectVal = bParts.month;
        else if (subType === "birth_day") selectVal = bParts.day;
        else if (subType === "birth_year") selectVal = bParts.year;
      }

      const matchedOpt = bestMatchOption(Array.from(el.options), selectVal, subType || profileKey);
      if (matchedOpt) {
        el.value = matchedOpt.value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        filledCount++;
        results.push({ id: fieldIdentifier, status: "filled", profileKey });
      } else {
        results.push({ id: fieldIdentifier, status: "skipped", profileKey });
      }
      continue;
    }

    // Jika tag adalah input type=radio (DemoQA Gender dll.)
    if (el.tagName.toLowerCase() === "input" && (el.type || "").toLowerCase() === "radio") {
      const radioVal = (el.value || "").toLowerCase().trim();
      const radioLabel = (getLabelText(el) || "").toLowerCase().trim();
      const profileVal = String(value).toLowerCase().trim();

      let candidates = [profileVal];
      if (DROPDOWN_VALUE_MAP[profileKey]) {
        const fieldMap = DROPDOWN_VALUE_MAP[profileKey];
        for (const [canon, syns] of Object.entries(fieldMap)) {
          if (canon === profileVal || syns.includes(profileVal)) {
            candidates = [canon, ...syns];
            break;
          }
        }
      }

      const isMatch = candidates.some(c => {
        const cleanC = c.replace(/[^a-z0-9]/g, "");
        const cleanVal = radioVal.replace(/[^a-z0-9]/g, "");
        const cleanLbl = radioLabel.replace(/[^a-z0-9]/g, "");
        return radioVal === c || radioLabel === c ||
               (cleanC.length >= 3 && cleanVal.includes(cleanC)) ||
               (cleanC.length >= 3 && cleanLbl.includes(cleanC)) ||
               (cleanVal.length >= 3 && cleanC.includes(cleanVal));
      });

      if (isMatch) {
        el.checked = true;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        if (typeof el.click === "function") {
          try { el.click(); } catch (e) {}
        }
        filledCount++;
        results.push({ id: fieldIdentifier, status: "filled", profileKey });
      } else {
        results.push({ id: fieldIdentifier, status: "skipped", profileKey });
      }
      continue;
    }

    // Jika tag adalah input type=checkbox (DemoQA Hobbies dll.)
    if (el.tagName.toLowerCase() === "input" && (el.type || "").toLowerCase() === "checkbox") {
      const chkVal = (el.value || "").toLowerCase().trim();
      const chkLabel = (getLabelText(el) || "").toLowerCase().trim();
      const profileVal = String(value).toLowerCase().trim();

      const isPositive = ["1", "true", "yes", "ya", "aktif", "on"].includes(profileVal);
      const isMatch = isPositive || profileVal.includes(chkVal) || profileVal.includes(chkLabel);

      if (isMatch) {
        el.checked = true;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        if (typeof el.click === "function") {
          try { el.click(); } catch (e) {}
        }
        filledCount++;
        results.push({ id: fieldIdentifier, status: "filled", profileKey });
      } else {
        results.push({ id: fieldIdentifier, status: "skipped", profileKey });
      }
      continue;
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
          results.push({ id: fieldIdentifier, status: "filled", profileKey });
          continue;
        } catch (fileErr) {
          console.warn("GovConnect: Error saat autofill file input:", fileErr);
          results.push({ id: fieldIdentifier, status: "skipped", profileKey });
          continue;
        }
      } else {
        results.push({ id: fieldIdentifier, status: "skipped", profileKey });
        continue;
      }
    }

    // Input text / textarea / date / tel / email
    let finalVal = value;
    if (el.tagName.toLowerCase() === "input" && (el.type || "").toLowerCase() === "date") {
      const bParts = parseBirthDate(value);
      if (bParts.year && bParts.month && bParts.day) {
        finalVal = `${bParts.year}-${bParts.month}-${bParts.day}`;
      }
    }

    el.value = finalVal;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));

    filledCount++;
    results.push({ id: fieldIdentifier, status: "filled", profileKey });
  }

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
// NLP Similarity Engine: Levenshtein Distance & Cosine Similarity
// ============================================================

/**
 * Menghitung Wagner-Fischer edit distance antara dua string.
 */
function computeLevenshteinDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // Deletion
        dp[i][j - 1] + 1,       // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }
  return dp[a.length][b.length];
}

/**
 * Normalisasi Levenshtein Distance menjadi skor kemiripan [0.0 - 1.0].
 */
function computeLevenshteinSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const a = s1.trim().toLowerCase();
  const b = s2.trim().toLowerCase();
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = computeLevenshteinDistance(a, b);
  return Math.max(0, 1.0 - dist / maxLen);
}

/**
 * Tokenisasi teks menjadi array kata bersih dengan pemecahan camelCase
 * dan ekstraksi kata dasar (stemming) sederhana.
 */
function tokenize(text) {
  if (!text) return [];
  // 1. Pecah camelCase (misal: mothersName -> mothers Name, taxpayerName -> taxpayer Name, regInput -> reg Input)
  let expanded = text.replace(/([a-z])([A-Z])/g, "$1 $2");
  // 2. Normalisasi karakter khusus dan simbol menjadi spasi
  expanded = expanded.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  // 3. Ekstrak token dasar
  const rawTokens = expanded.split(/\s+/).filter(Boolean);
  const tokenSet = new Set(rawTokens);

  // 4. Morfologi / stemming sederhana untuk imbuhan bahasa Inggris dan kata majemuk Indonesia
  rawTokens.forEach(t => {
    if (t.endsWith("s") && t.length > 3) {
      tokenSet.add(t.slice(0, -1)); // mothers -> mother, fathers -> father
    }
    if (t.includes("mother") && t !== "mother") {
      tokenSet.add("mother");
      if (t.includes("name")) tokenSet.add("name");
    }
    if (t.includes("father") && t !== "father") {
      tokenSet.add("father");
      if (t.includes("name")) tokenSet.add("name");
    }
    if (t.includes("namaibu")) {
      tokenSet.add("nama");
      tokenSet.add("ibu");
    }
    if (t.includes("namaayah")) {
      tokenSet.add("nama");
      tokenSet.add("ayah");
    }
  });

  return Array.from(tokenSet);
}

/**
 * Menghitung Cosine Similarity antara dua himpunan vektor token (Term Frequency).
 * cos(theta) = (A . B) / (||A|| * ||B||)
 */
function computeCosineSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;

  const freqA = {};
  const freqB = {};
  tokensA.forEach(t => freqA[t] = (freqA[t] || 0) + 1);
  tokensB.forEach(t => freqB[t] = (freqB[t] || 0) + 1);

  const allTerms = new Set([...Object.keys(freqA), ...Object.keys(freqB)]);

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  allTerms.forEach(term => {
    const valA = freqA[term] || 0;
    const valB = freqB[term] || 0;
    dotProduct += valA * valB;
  });

  Object.values(freqA).forEach(v => magA += v * v);
  Object.values(freqB).forEach(v => magB += v * v);

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  if (magnitude === 0) return 0;

  return dotProduct / magnitude;
}

/**
 * Mencocokkan nilai profil ke opsi <select> terbaik menggunakan NLP Hybrid Engine & Synonym Map.
 * @param {Array<HTMLOptionElement>} options
 * @param {string} profileValue
 * @param {string} profileKey
 * @returns {HTMLOptionElement|null}
 */
function bestMatchOption(options, profileValue, profileKey = "") {
  if (!options || options.length === 0 || !profileValue) return null;

  const rawVal = profileValue.toString().trim();
  const valLower = rawVal.toLowerCase();
  const valTokens = tokenize(rawVal);
  const valNorm = valTokens.join("_");

  // Step 1: Exact match O(1) pada value atau text
  for (const opt of options) {
    if (!opt.value && !opt.text) continue;
    const optVal = (opt.value || "").trim().toLowerCase();
    const optText = (opt.text || "").trim().toLowerCase();
    if (optVal === valLower || optText === valLower) {
      return opt;
    }
  }

  // Step 2: Cek Sinonim Khusus dari DROPDOWN_VALUE_MAP jika profileKey terdaftar
  if (profileKey && DROPDOWN_VALUE_MAP[profileKey]) {
    const fieldSynonyms = DROPDOWN_VALUE_MAP[profileKey];
    let canonicalKey = null;
    for (const [canon, synList] of Object.entries(fieldSynonyms)) {
      const allCanonForms = [canon, canon.replace(/_/g, " "), canon.replace(/ /g, "_"), ...synList];
      if (
        allCanonForms.includes(valLower) ||
        allCanonForms.includes(valNorm) ||
        synList.some(s => s === valLower || s === valNorm || s.replace(/_/g, " ") === valLower)
      ) {
        canonicalKey = canon;
        break;
      }
    }

    if (canonicalKey) {
      const allowedSynonyms = fieldSynonyms[canonicalKey];
      for (const opt of options) {
        if (!opt.value && !opt.text) continue;
        const optText = (opt.text || "").trim().toLowerCase();
        const optVal = (opt.value || "").trim().toLowerCase();
        const optTokens = tokenize(`${optVal} ${optText}`);
        const optClean = optText.replace(/[^a-z0-9]/g, "");

        const matchesSynonym = allowedSynonyms.some(syn => {
          const synClean = syn.replace(/[^a-z0-9]/g, "");
          return (
            optVal === syn ||
            optText === syn ||
            optTokens.includes(syn) ||
            (synClean.length >= 3 && optClean.includes(synClean)) ||
            (optClean.length >= 3 && synClean.includes(optClean))
          );
        });

        if (matchesSynonym) {
          return opt;
        }
      }
    }
  }

  // Step 3: NLP Hybrid Matching (Cosine + Levenshtein) untuk opsi dinamis / bebas
  let bestOpt = null;
  let highestScore = 0;

  for (const opt of options) {
    if (!opt.value && !opt.text) continue;
    const optText = (opt.text || "").trim();
    const optVal = (opt.value || "").trim();

    // Skip opsi placeholder seperti "-- Pilih --", "Pilih...", "Select..."
    if (/^(pilih|select|--|none|kosong)/i.test(optText) && !opt.value) {
      continue;
    }

    const optTokens = tokenize(`${optVal} ${optText}`);
    const optNorm = optTokens.join("_");

    const cosSim = computeCosineSimilarity(valTokens, optTokens);
    let levSim = computeLevenshteinSimilarity(valNorm, optNorm);
    if (optNorm.includes(valNorm) || valNorm.includes(optNorm)) {
      levSim = Math.max(levSim, 0.90);
    }

    let score = (0.65 * cosSim) + (0.35 * levSim);

    const overlapTokens = valTokens.filter(t => optTokens.includes(t));
    if (overlapTokens.length > 0 && valTokens.length > 0) {
      score += 0.20 * (overlapTokens.length / valTokens.length);
    }

    if (score > highestScore && score >= 0.48) {
      highestScore = score;
      bestOpt = opt;
    }
  }

  return bestOpt;
}

/**
 * Mengisi dropdown kustom PrimeNG (<p-dropdown>) yang digunakan oleh CoreTax DJP.
 * Menstimulasi klik buka dropdown, menunggu overlay panel (.p-dropdown-panel) muncul,
 * mencocokkan opsi via NLP / kamus sinonim, lalu mengklik li.p-dropdown-item agar Angular model terupdate.
 *
 * FIXES:
 * - Bug #2: Trigger selection menggunakan .p-dropdown-trigger, bukan .p-dropdown (self-reference)
 * - Bug #3: Panel detection menandai panel lama sebelum klik, lalu menunggu panel BARU
 * - Bug #4: closePrimeNGPanel tidak lagi mengklik trigger (mencegah panel terbuka kembali)
 */
async function fillPrimeNGDropdown(dropdownEl, value, profileKey) {
  if (!dropdownEl || !value) return false;

  // Temukan elemen host p-dropdown
  const hostEl = dropdownEl.closest("p-dropdown") || dropdownEl;

  try {
    hostEl.scrollIntoView({ behavior: "instant", block: "center" });
  } catch (e) {}

  // Bug #2 Fix: Cari trigger dengan urutan yang benar.
  // .p-dropdown-trigger adalah ikon chevron di ujung kanan PrimeNG.
  // JANGAN gunakan .querySelector(".p-dropdown") karena akan menemukan dirinya sendiri.
  const trigger = hostEl.querySelector(".p-dropdown-trigger") ||
                  hostEl.querySelector(".p-dropdown-label") ||
                  hostEl;

  // Bug #3 Fix: Tandai semua panel yang sudah ada sebelum membuka dropdown ini
  const existingPanels = new Set(
    Array.from(document.querySelectorAll(".p-dropdown-panel"))
  );

  // Tutup panel lain yang masih terbuka (dari dropdown sebelumnya)
  if (existingPanels.size > 0) {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
    await new Promise(r => setTimeout(r, 80));
  }

  // 1. Simulasikan klik pada trigger untuk membuka dropdown ini (urutan mousedown -> mouseup -> click)
  function dispatchClick(targetEl) {
    if (!targetEl) return;
    targetEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    targetEl.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    targetEl.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  }

  dispatchClick(trigger);

  // 2. Tunggu overlay panel BARU (.p-dropdown-panel) di-render oleh Angular / PrimeNG
  // PrimeNG biasanya append panel ke <body> sebagai overlay.
  let panel = null;
  for (let attempt = 0; attempt < 15; attempt++) {
    await new Promise(r => setTimeout(r, 50));

    // Fallback: Jika setelah attempt ke-5 panel belum muncul, coba klik label atau container host
    if (attempt === 5 && !panel) {
      const altTrigger = hostEl.querySelector(".p-dropdown-label") || hostEl.querySelector(".p-dropdown") || hostEl;
      if (altTrigger && altTrigger !== trigger) {
        dispatchClick(altTrigger);
      }
    }

    // Cari panel yang BARU muncul (tidak ada di existingPanels)
    const allPanels = Array.from(document.querySelectorAll(".p-dropdown-panel"));
    const newPanels = allPanels.filter(p => !existingPanels.has(p));

    if (newPanels.length > 0) {
      // Ambil panel baru yang terlihat
      panel = newPanels.find(p => {
        const style = window.getComputedStyle(p);
        return style.display !== "none" && style.visibility !== "hidden";
      }) || newPanels[0];
      if (panel) break;
    }

    // Fallback: jika tidak ada panel baru, cari panel apapun yang terlihat
    const visiblePanel = allPanels.find(p => {
      const style = window.getComputedStyle(p);
      return style.display !== "none" && style.visibility !== "hidden";
    });
    if (visiblePanel) {
      panel = visiblePanel;
      break;
    }
  }

  if (!panel) {
    console.warn("GovConnect: Panel PrimeNG tidak ditemukan untuk", profileKey);
    return false;
  }

  // Tunggu sebentar agar opsi-opsi benar-benar ter-render di dalam panel
  await new Promise(r => setTimeout(r, 60));

  // 3. Ekstrak opsi-opsi (li.p-dropdown-item atau [role="option"])
  const items = Array.from(panel.querySelectorAll(".p-dropdown-item, li[role='option'], [role='option']"));
  if (items.length === 0) {
    closePrimeNGPanel(panel);
    return false;
  }

  // 4. Bungkus opsi ke format { rawElement, value, text } untuk dicocokkan bestMatchOption
  const optionWrappers = items.map(item => ({
    rawElement: item,
    // Prioritas: aria-label > data-value > textContent (bersih tanpa whitespace berlebih)
    value: (item.getAttribute("aria-label") || item.getAttribute("data-value") || item.textContent || "").trim(),
    text: (item.getAttribute("aria-label") || item.textContent || "").replace(/\s+/g, " ").trim()
  }));

  const matchedWrapper = bestMatchOption(optionWrappers, value, profileKey);

  if (!matchedWrapper || !matchedWrapper.rawElement) {
    console.warn("GovConnect: Tidak ada opsi PrimeNG yang cocok untuk:", value, "pada field:", profileKey);
    closePrimeNGPanel(panel);
    return false;
  }

  const targetLi = matchedWrapper.rawElement;
  try {
    targetLi.scrollIntoView({ block: "nearest" });
  } catch (e) {}

  // Jeda sebentar sebelum klik agar scroll selesai
  await new Promise(r => setTimeout(r, 30));

  // 5. Klik opsi terpilih dengan event mouse lengkap
  targetLi.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true, cancelable: true, view: window }));
  targetLi.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
  targetLi.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
  targetLi.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
  if (typeof targetLi.click === "function") {
    try { targetLi.click(); } catch (e) {}
  }

  // Berikan jeda agar Angular / PrimeNG memproses pemilihan opsi dan menutup panel
  await new Promise(r => setTimeout(r, 150));

  // 6. Tutup panel jika masih terbuka (Bug #4 Fix: TIDAK klik trigger lagi)
  closePrimeNGPanel(panel);

  // Jeda antar dropdown agar Angular model stabil sebelum membuka dropdown berikutnya
  await new Promise(r => setTimeout(r, 200));

  return true;
}

/**
 * Menutup panel PrimeNG yang terbuka.
 * Bug #4 Fix: Hanya kirim Escape ke document, TIDAK mengklik trigger lagi
 * (klik trigger akan membuka kembali panel yang baru saja ditutup).
 * Aman: tidak klik document.body langsung (bisa menutup modal CoreTax).
 */
function closePrimeNGPanel(panel) {
  try {
    if (panel && document.body.contains(panel)) {
      const style = window.getComputedStyle(panel);
      if (style.display !== "none" && style.visibility !== "hidden") {
        // Kirim Escape ke document untuk menutup overlay PrimeNG
        document.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Escape",
          code: "Escape",
          keyCode: 27,
          bubbles: true,
          cancelable: true
        }));
        // Klik pada overlay backdrop PrimeNG (bukan body) jika ada
        // PrimeNG menambahkan .p-overlay-container atau .cdk-overlay-container
        const backdrop = document.querySelector(".p-overlay-container, .cdk-overlay-container");
        if (backdrop && backdrop !== panel && !panel.contains(backdrop)) {
          backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
        }
      }
    }
  } catch (e) {}
}

// ============================================================
// Cocokkan element HTML ke profile key (Hybrid Similarity Engine)
// Mencegah greedy substring collision (misal nama ibu vs nama pemohon)
// ============================================================
function matchProfileKey(el) {
  // Pass 0: Standard W3C HTML5 autocomplete attribute (100% confidence)
  const autoKey = getAutocompleteProfileKey(el);
  if (autoKey) return autoKey;

  const hostEl = el.closest("p-dropdown, mat-select") || el;
  const rawFormControl = hostEl.getAttribute("formcontrolname") || hostEl.getAttribute("ng-reflect-name") || "";
  const rawElName = el.name || hostEl.getAttribute("name") || rawFormControl || "";
  const rawElId = el.id || hostEl.id || "";
  const formControl = rawFormControl.toLowerCase().trim();
  const elName = rawElName.toLowerCase().trim();
  const elId = rawElId.toLowerCase().trim();
  const labelText = getLabelText(el).toLowerCase().trim();
  const pLabel = el.querySelector?.(".p-dropdown-label")?.textContent?.trim() || "";
  const placeholder = (el.placeholder || pLabel || "").toLowerCase().trim();
  const ariaLabel = (el.getAttribute("aria-label") || hostEl.getAttribute("aria-label") || "").toLowerCase().trim();

  // Phase 1: Exact Name, ID, atau formControl Match (O(1) Shortcut jika atribut persis sama atau ternormalisasi)
  // SAFEGUARD: CoreTax (formcontrolname, ng-reflect-name, reginput_*) diperiksa pertama kali tanpa distorsi!
  const cleanElName = elName.replace(/[^a-z0-9]/g, "_");
  const cleanElId = elId.replace(/[^a-z0-9]/g, "_");
  const cleanFormControl = formControl.replace(/[^a-z0-9]/g, "_");

  const strip = s => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const strippedElName = strip(elName);
  const strippedElId = strip(elId);
  const strippedFormControl = strip(formControl);

  // Normalisasi prefiks numerik & ekspansi singkatan (misal 02frstname -> frstname -> first_name)
  const sanitizedName = stripNumericPrefix(elName);
  const cleanSanitizedName = sanitizedName.replace(/[^a-z0-9]/g, "_");
  const strippedSanitizedName = strip(sanitizedName);
  const expandedSanitizedName = ABBREVIATION_MAP[cleanSanitizedName] || ABBREVIATION_MAP[strippedSanitizedName] || "";

  for (const [profileKey, keywords] of Object.entries(KEYWORD_MAP)) {
    const strippedProfileKey = strip(profileKey);
    if (
      elName === profileKey || elId === profileKey || formControl === profileKey ||
      cleanElName === profileKey || cleanElId === profileKey || cleanFormControl === profileKey ||
      strippedElName === strippedProfileKey || strippedElId === strippedProfileKey || strippedFormControl === strippedProfileKey ||
      cleanSanitizedName === profileKey || expandedSanitizedName === profileKey || strippedSanitizedName === strippedProfileKey
    ) {
      return profileKey;
    }
    for (const kw of keywords) {
      const cleanKw = kw.replace(/[^a-z0-9]/g, "_");
      const strippedKw = strip(kw);
      if (
        elName === kw || elId === kw || formControl === kw ||
        cleanElName === cleanKw || cleanElId === cleanKw || cleanFormControl === cleanKw ||
        elName === cleanKw || elId === cleanKw || formControl === cleanKw ||
        strippedElName === strippedKw || strippedElId === strippedKw || strippedFormControl === strippedKw ||
        cleanSanitizedName === cleanKw || expandedSanitizedName === kw || strippedSanitizedName === strippedKw
      ) {
        return profileKey;
      }
    }
  }

  // Deteksi khusus jika elemen merupakan <select> yang merepresentasikan komponen tanggal (Bulan/Hari/Tahun)
  const dateSelectType = detectDateSelectType(el);
  if (dateSelectType) {
    return dateSelectType;
  }

  // Phase 2: Ekstraksi Token Input (sertakan raw string, sanitized string, expanded abbreviation, dan label dengan bobot ganda)
  const combinedRaw = `${rawElName} ${cleanSanitizedName} ${expandedSanitizedName} ${rawElId} ${rawFormControl} ${labelText} ${labelText} ${placeholder} ${ariaLabel}`;
  const inputTokens = tokenize(combinedRaw);
  const inputNormalized = inputTokens.join("_");

  if (inputTokens.length === 0) return null;

  // Deteksi Modifiers Konteks Kritis
  const hasIbu = inputTokens.includes("ibu") || inputTokens.includes("mother") || inputTokens.includes("mothers");
  const hasAyah = inputTokens.includes("ayah") || inputTokens.includes("father") || inputTokens.includes("fathers") || inputTokens.includes("bapak");
  const hasDarurat = inputTokens.includes("darurat") || inputTokens.includes("emergency");
  const hasKantor = inputTokens.includes("kantor") || inputTokens.includes("perusahaan") || inputTokens.includes("office") || inputTokens.includes("instansi") || inputTokens.includes("company") || inputTokens.includes("kerja");
  const hasKampus = inputTokens.includes("kampus") || inputTokens.includes("universitas") || inputTokens.includes("sekolah") || inputTokens.includes("institusi") || inputTokens.includes("perguruantinggi") || inputTokens.includes("fakultas") || inputTokens.includes("prodi");
  const hasTanggal = inputTokens.includes("tgl") || inputTokens.includes("tanggal") || inputTokens.includes("date") || inputTokens.includes("birthdate");
  const hasLahir = inputTokens.includes("lahir") || inputTokens.includes("birth") || inputTokens.includes("dob");
  const hasTelp = inputTokens.includes("telepon") || inputTokens.includes("phone") || inputTokens.includes("handphone") || inputTokens.includes("hp") || inputTokens.includes("telp") || inputTokens.includes("whatsapp") || inputTokens.includes("wa") || inputTokens.includes("phon");
  const hasPosisi = inputTokens.includes("posisi") || inputTokens.includes("jabatan") || inputTokens.includes("role") || inputTokens.includes("profesi") || inputTokens.includes("pekerjaan") || inputTokens.includes("occupation") || inputTokens.includes("position");
  const hasDomisili = inputTokens.includes("domisili") || inputTokens.includes("ktp") || inputTokens.includes("tinggal") || inputTokens.includes("rumah") || inputTokens.includes("saatini");
  const hasKependudukan = inputTokens.includes("kependudukan") || inputTokens.includes("citizen") || inputTokens.includes("ktp") || inputTokens.includes("nik");
  const hasMahasiswaSiswa = inputTokens.includes("mahasiswa") || inputTokens.includes("siswa") || inputTokens.includes("student") || inputTokens.includes("nim") || inputTokens.includes("nisn") || inputTokens.includes("nrp");

  // Shortcut Pasti Berdasarkan Semantik Universal
  // 1. Email
  if (inputTokens.includes("email") || inputTokens.includes("surel") || inputTokens.includes("emailadr")) {
    return "email";
  }

  // 2. First Name vs Last Name vs Full Name
  if (inputTokens.includes("first") && (inputTokens.includes("name") || inputTokens.includes("nama"))) {
    return "first_name";
  }
  if ((inputTokens.includes("last") || inputTokens.includes("sur")) && (inputTokens.includes("name") || inputTokens.includes("nama"))) {
    return "last_name";
  }
  if (inputTokens.includes("depan") && inputTokens.includes("nama")) {
    return "first_name";
  }
  if (inputTokens.includes("belakang") && inputTokens.includes("nama")) {
    return "last_name";
  }

  // 3. Telepon (Home, Work, Cell, Mobile, Telephone)
  if (hasTelp && !hasDarurat) {
    if (inputTokens.includes("home") || inputTokens.includes("work") || inputTokens.includes("cell") || inputTokens.includes("mobile") || inputTokens.includes("telephone") || inputTokens.includes("handphone") || inputTokens.includes("phone")) {
      return "phone";
    }
  }

  // 4. Social Security Number / NIK
  if (inputTokens.includes("ssn") || (inputTokens.includes("social") && inputTokens.includes("security"))) {
    return "nik";
  }

  // 5. Driver License Number (SIM)
  if ((inputTokens.includes("driver") || inputTokens.includes("driving")) && (inputTokens.includes("license") || inputTokens.includes("licence") || inputTokens.includes("lic"))) {
    return "driver_license";
  }

  // 6. Tanggal Lahir vs Tanggal Lain
  if (hasTanggal && hasLahir) {
    if (inputTokens.includes("month") || inputTokens.includes("bulan")) return "birth_month";
    if (inputTokens.includes("day") || inputTokens.includes("hari")) return "birth_day";
    if (inputTokens.includes("year") || inputTokens.includes("tahun")) return "birth_year";
    return "birth_date";
  }
  if (hasTanggal && !hasLahir) {
    for (const [profileKey, keywords] of Object.entries(KEYWORD_MAP)) {
      if (profileKey.startsWith("custom_") || profileKey.includes("tgl") || profileKey.includes("date")) {
        for (const kw of keywords) {
          if (inputTokens.includes(kw) || elName === kw || elId === kw) return profileKey;
        }
      }
    }
    return null;
  }

  // 7. Tempat Lahir
  if ((inputTokens.includes("tempat") || inputTokens.includes("place") || inputTokens.includes("pl")) && hasLahir) {
    return "birth_place";
  }

  // 8. Kode Pos (Zip Code)
  if (inputTokens.includes("zip") || inputTokens.includes("zipcode") || inputTokens.includes("kodepos") || inputTokens.includes("postalcode")) {
    return "postal_code";
  }

  // 9. Negara (Country)
  if (inputTokens.includes("country") || inputTokens.includes("kewarganegaraan") || inputTokens.includes("nationality")) {
    return "country";
  }

  // 10. Provinsi / State
  if ((inputTokens.includes("state") || inputTokens.includes("province") || inputTokens.includes("provinsi")) && !inputTokens.includes("statement")) {
    return "province";
  }

  // 11. Kota (City)
  if (inputTokens.includes("city") || inputTokens.includes("kota") || inputTokens.includes("kabupaten")) {
    return "city";
  }

  // 12. Usia / Age
  if ((inputTokens.includes("age") || inputTokens.includes("umur") || inputTokens.includes("usia")) && !inputTokens.includes("village") && !inputTokens.includes("page") && !inputTokens.includes("message")) {
    return "age";
  }

  // 13. Jenis Kelamin / Sex / Gender
  if (inputTokens.includes("gender") || inputTokens.includes("sex") || inputTokens.includes("kelamin")) {
    return "gender";
  }

  // 14. Website
  if (inputTokens.includes("website") || (inputTokens.includes("web") && inputTokens.includes("site")) || inputTokens.includes("situs")) {
    return "website";
  }

  // 15. Penghasilan / Income
  if (inputTokens.includes("income") || inputTokens.includes("gaji") || inputTokens.includes("penghasilan") || inputTokens.includes("salary")) {
    return "income";
  }

  // 16. Posisi / Pekerjaan
  if ((inputTokens.includes("position") || inputTokens.includes("posisi") || inputTokens.includes("jabatan") || inputTokens.includes("role") || inputTokens.includes("occupation")) && !inputTokens.includes("address") && !inputTokens.includes("alamat")) {
    return "occupation";
  }

  // 17. Perusahaan / Instansi
  if ((inputTokens.includes("company") || inputTokens.includes("perusahaan") || inputTokens.includes("instansi")) && !inputTokens.includes("position") && !inputTokens.includes("posisi")) {
    return "organization";
  }

  // Phase 3: Hybrid Scoring (Cosine Similarity + Normalized Levenshtein + Context Modifiers)
  // Menilai seluruh kandidat profil dan memilih skor tertinggi (Argmax)
  let bestCandidate = null;
  let highestScore = 0;

  for (const [profileKey, keywords] of Object.entries(KEYWORD_MAP)) {
    // Modifier Penalty: Mencegah tabrakan silang
    if (hasIbu && profileKey === "full_name") continue;
    if (hasAyah && profileKey === "full_name") continue;
    if (hasDarurat && (profileKey === "full_name" || profileKey === "phone")) continue;
    if (hasKantor && profileKey === "address" && !hasDomisili) continue;
    if (hasDomisili && profileKey === "work_address") continue;
    if (hasKampus && (profileKey === "full_name" || profileKey === "organization")) continue;
    if (hasPosisi && (inputTokens.includes("posisi") || inputTokens.includes("jabatan") || inputTokens.includes("role") || inputTokens.includes("profesi") || inputTokens.includes("position")) && profileKey === "organization") continue;
    if (hasKependudukan && (profileKey === "student_id" || profileKey === "nisn")) continue;
    if (hasMahasiswaSiswa && profileKey === "nik") continue;
    if (inputTokens.includes("first") && profileKey === "full_name") continue;
    if (inputTokens.includes("last") && profileKey === "full_name") continue;

    let candidateMaxScore = 0;

    for (const kw of keywords) {
      const kwTokens = tokenize(kw);
      const kwNormalized = kwTokens.join("_");

      // 1. Hitung Cosine Similarity antara token input form dan token kata kunci referensi
      const cosSim = computeCosineSimilarity(inputTokens, kwTokens);

      // 2. Hitung Normalized Levenshtein Similarity
      let levSim = computeLevenshteinSimilarity(inputNormalized, kwNormalized);

      // Substring bonus jika kata kunci spesifik terkandung utuh dalam input
      // SAFEGUARD: Jangan berikan substring bonus jika kata kunci adalah SHORT_KEYWORDS kecuali token persis sama
      if (inputNormalized.includes(kwNormalized)) {
        if (!SHORT_KEYWORDS.has(kwNormalized) || inputTokens.includes(kwNormalized)) {
          levSim = Math.max(levSim, 0.95);
        }
      }

      // 3. Skor Gabungan: 70% Cosine Similarity (kelengkapan kata) + 30% Levenshtein (toleransi typo)
      let score = (0.70 * cosSim) + (0.30 * levSim);

      // 4. Context Bonus untuk token spesifik yang cocok
      if (hasIbu && profileKey === "mother_name") score += 0.25;
      if (hasAyah && profileKey === "father_name") score += 0.25;
      if (hasDarurat && hasTelp && profileKey === "emergency_contact_phone") score += 0.30;
      if (hasDarurat && !hasTelp && profileKey === "emergency_contact_name") score += 0.30;
      if (hasKantor && (inputTokens.includes("alamat") || inputTokens.includes("address")) && profileKey === "work_address") score += 0.25;
      if (hasDomisili && (inputTokens.includes("alamat") || inputTokens.includes("address")) && profileKey === "address") score += 0.25;
      if (hasKantor && hasPosisi && profileKey === "occupation") score += 0.25;
      if (hasKampus && profileKey === "institution") score += 0.30;
      if (hasKependudukan && profileKey === "nik") score += 0.25;
      if (hasMahasiswaSiswa && (inputTokens.includes("nim") || inputTokens.includes("mahasiswa") || inputTokens.includes("student")) && profileKey === "student_id") score += 0.25;
      if (hasMahasiswaSiswa && (inputTokens.includes("nisn") || inputTokens.includes("siswa")) && profileKey === "nisn") score += 0.25;
      if (inputTokens.includes("first") && profileKey === "first_name") score += 0.35;
      if (inputTokens.includes("last") && profileKey === "last_name") score += 0.35;
      if (inputTokens.includes("country") && profileKey === "country") score += 0.35;
      if (inputTokens.includes("state") && profileKey === "province") score += 0.35;
      if (inputTokens.includes("city") && profileKey === "city") score += 0.35;
      if (inputTokens.includes("age") && profileKey === "age") score += 0.40;

      if (score > candidateMaxScore) {
        candidateMaxScore = score;
      }
    }

    if (candidateMaxScore > highestScore) {
      highestScore = candidateMaxScore;
      bestCandidate = profileKey;
    }
  }

  // Ambang batas (threshold) minimum untuk validasi deteksi
  if (highestScore >= 0.58 && bestCandidate) {
    return bestCandidate;
  }

  return null;
}

// Cari teks label yang berelasi dengan element (Mendukung PrimeNG, Angular, React, Bootstrap, Tailwind)
function getLabelText(el) {
  if (!el) return "";
  const hostEl = el.closest("p-dropdown, mat-select") || el;
  const targetId = el.id || hostEl.id;

  // 1. label[for="targetId"]
  if (targetId) {
    try {
      const escapedId = window.CSS && CSS.escape ? CSS.escape(targetId) : targetId;
      const label = document.querySelector(`label[for="${escapedId}"]`);
      if (label && label.textContent.trim()) return label.textContent.trim();
    } catch (e) {}
  }

  // 2. Jika elemen berada langsung di dalam <label>...</label>
  const parentLabel = hostEl.closest("label");
  if (parentLabel && parentLabel.textContent.trim()) return parentLabel.textContent.trim();

  // 3. Atribut aria-labelledby
  const ariaLabelledBy = el.getAttribute("aria-labelledby") || hostEl.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    try {
      const labelledEl = document.getElementById(ariaLabelledBy);
      if (labelledEl && labelledEl.textContent.trim()) return labelledEl.textContent.trim();
    } catch (e) {}
  }

  // 4. Label di dalam container form yang sama (PrimeNG .p-field, .field, Bootstrap .form-group, AntD, dll.)
  const container = hostEl.closest(".p-field, .field, .form-group, .form-item, .ant-form-item, [class*='field'], [class*='form-group'], div");
  if (container) {
    const label = container.querySelector("label, .label, [class*='label']");
    if (label && label.textContent.trim()) {
      return label.textContent.trim();
    }
  }

  // 5. Label dari elemen saudara sebelumnya (previous sibling)
  let prev = hostEl.previousElementSibling;
  while (prev) {
    if (prev.tagName.toLowerCase() === "label" || prev.classList?.contains("label") || /label/i.test(prev.className || "")) {
      if (prev.textContent.trim()) return prev.textContent.trim();
    }
    prev = prev.previousElementSibling;
  }

  // 6. SAFE FALLBACK (Khusus layout Bootstrap / Grid seperti RoboForm): Sibling column di dalam row yang sama
  // SAFEGUARD: Dinonaktifkan untuk PrimeNG dropdown (CoreTax) agar tidak mengambil teks internal panel/error
  if (!isPrimeNGDropdown(el) && !el.closest("p-dropdown, .p-dropdown")) {
    const parentRow = hostEl.closest(".row, .form-row, tr, [class*='row']");
    if (parentRow) {
      const hostCol = hostEl.closest("[class*='col-'], td, th") || hostEl.parentElement;
      if (hostCol && parentRow.contains(hostCol)) {
        let sibling = hostCol.previousElementSibling;
        while (sibling) {
          const textEl = sibling.querySelector?.(".text-right, label, th, .label") || sibling;
          if (!textEl.querySelector("input, select, textarea, button")) {
            const rawTxt = textEl.textContent.trim().replace(/[:*]+$/, "").trim();
            if (rawTxt.length >= 2 && rawTxt.length <= 45 && !/^(submit|reset|batal|simpan|next|prev)/i.test(rawTxt)) {
              return rawTxt;
            }
          }
          sibling = sibling.previousElementSibling;
        }
      }
    }
  }

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

function startMutationObserver() {
  const target = document.body || document.documentElement;
  if (target) {
    try {
      observer.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class", "hidden"]
      });
    } catch (err) {
      console.warn("GovConnect: Observer init warning:", err);
    }
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      const lateTarget = document.body || document.documentElement;
      if (lateTarget) {
        try {
          observer.observe(lateTarget, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["style", "class", "hidden"]
          });
        } catch (err) {
          console.warn("GovConnect: Late observer init warning:", err);
        }
      }
    });
  }
}
startMutationObserver();

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