// Side Panel Script — GovConnect
// Asisten Autofill Cerdas dengan Transisi Fluid Scanning & Sinkronisasi Real-Time

var API_BASE = (typeof GovConnectConfig !== "undefined" && GovConnectConfig.API_BASE) || "http://127.0.0.1:8000/api/v1";
var DASHBOARD_URL = (typeof GovConnectConfig !== "undefined" && GovConnectConfig.DASHBOARD_URL) || "http://localhost:5173/dashboard";

// Verifikasi origin dashboard SECARA PERSIS (bukan substring).
var GOVCONNECT_WEB_ORIGINS = (typeof GovConnectConfig !== "undefined" && GovConnectConfig.WEB_ORIGINS) || [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];
function isGovConnectDashboardUrl(url) {
  if (!url) return false;
  try {
    return GOVCONNECT_WEB_ORIGINS.includes(new URL(url).origin);
  } catch {
    return false;
  }
}

let cachedProfile = null;
let detectedFields = [];
let currentTab = null;
let customFieldLabels = {};
let domainMappingsCache = {};
let allDetectedResult = null;
let currentActiveScreen = "screenDetect";
let isAutofillingInProgress = false;
let userSelectedMap = {};
let isScanningActive = false;
let hasPendingScan = false;
let formUpdateDebounceTimer = null;
let detectedFrameId = 0;

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return "";
  }
}

async function loadDomainMappings(domain) {
  if (!domain) return;
  const token = await getToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/mappings?domain=${encodeURIComponent(domain)}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      domainMappingsCache = {};
      if (Array.isArray(data)) {
        data.forEach(m => {
          if (m.website_field && m.govconnect_field) {
            domainMappingsCache[m.website_field] = m.govconnect_field;
          }
        });
      }
    }
  } catch (e) {
    console.warn("GovConnect: Gagal memuat domain mappings:", e);
  }
}

async function saveDomainMapping(domain, fieldIdentifier, govconnectField) {
  const token = await getToken();
  if (!token || !domain || !fieldIdentifier || !govconnectField) return;
  try {
    await fetch(`${API_BASE}/mappings`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        website_domain: domain,
        website_field: fieldIdentifier,
        govconnect_field: govconnectField,
        selector_query: fieldIdentifier.startsWith("#") ? fieldIdentifier : `[name="${fieldIdentifier}"]`
      })
    });
  } catch (e) {
    console.warn("GovConnect: Gagal menyimpan mapping ke server:", e);
  }
}

function renderFieldOptionsHtml(currentSelectedKey) {
  let html = `<option value="">-- Pilih Data Profil / Kustom --</option>`;

  // 1. Group Kolom Kustom Pengguna
  const customKeys = Object.keys(customFieldLabels);
  if (customKeys.length > 0) {
    html += `<optgroup label="Kolom Kustom Pengguna">`;
    customKeys.forEach(k => {
      const selected = k === currentSelectedKey ? "selected" : "";
      const val = cachedProfile ? cachedProfile[k] : "";
      const valSnippet = val ? ` (${truncate(val, 15)})` : "";
      html += `<option value="${escapeHtml(k)}" ${selected}>${escapeHtml(customFieldLabels[k])}${escapeHtml(valSnippet)}</option>`;
    });
    html += `</optgroup>`;
  }

  // 2. Group Standar
  const standardKeys = [
    { key: "full_name", label: "Nama Lengkap" },
    { key: "first_name", label: "Nama Depan" },
    { key: "last_name", label: "Nama Belakang" },
    { key: "nik", label: "NIK (KTP)" },
    { key: "phone", label: "Nomor HP / WhatsApp" },
    { key: "email", label: "Email" },
    { key: "address", label: "Alamat Lengkap" },
    { key: "city", label: "Kota / Kabupaten" },
    { key: "province", label: "Provinsi" },
    { key: "postal_code", label: "Kode Pos" },
    { key: "birth_date", label: "Tanggal Lahir" },
    { key: "birth_place", label: "Tempat Lahir" },
    { key: "gender", label: "Jenis Kelamin" },
    { key: "occupation", label: "Pekerjaan" },
    { key: "organization", label: "Instansi / Perusahaan" },
    { key: "education_level", label: "Pendidikan Terakhir" },
    { key: "mother_name", label: "Nama Ibu Kandung" },
    { key: "npwp", label: "Nomor NPWP" },
    { key: "bpjs_number", label: "Nomor BPJS" },
    { key: "driver_license", label: "Nomor SIM" }
  ];

  html += `<optgroup label="Data Profil Standar">`;
  standardKeys.forEach(item => {
    const selected = item.key === currentSelectedKey ? "selected" : "";
    const val = cachedProfile ? cachedProfile[item.key] : "";
    const valSnippet = val ? ` (${truncate(val, 15)})` : "";
    html += `<option value="${item.key}" ${selected}>${item.label}${escapeHtml(valSnippet)}</option>`;
  });
  html += `</optgroup>`;

  // 3. Group Berkas & Foto Dokumen Resmi
  const documentPhotoKeys = [
    { key: "foto_ktp", label: "Foto e-KTP" },
    { key: "foto_kk", label: "Foto Kartu Keluarga (KK)" },
    { key: "pasfoto", label: "Pasfoto Diri" },
    { key: "foto_npwp", label: "Foto Kartu NPWP" },
    { key: "foto_ijazah", label: "Foto Ijazah" }
  ];
  html += `<optgroup label="Berkas & Foto Dokumen">`;
  documentPhotoKeys.forEach(item => {
    const selected = item.key === currentSelectedKey ? "selected" : "";
    const val = cachedProfile ? cachedProfile[item.key] : "";
    const valSnippet = val ? ` (${truncate(val, 15)})` : "";
    html += `<option value="${item.key}" ${selected}>${item.label}${escapeHtml(valSnippet)}</option>`;
  });
  html += `</optgroup>`;

  return html;
}

function parseBirthDate(dateStr) {
  if (!dateStr) return { day: "", month: "", year: "" };
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
  return age >= 0 ? String(age) : "";
}

function autoDeriveProfileFields(profile) {
  if (!profile) return;

  // Auto-derive first_name dan last_name
  if (profile.full_name && (!profile.first_name || !profile.last_name)) {
    const parts = profile.full_name.trim().split(/\s+/);
    if (!profile.first_name) profile.first_name = parts[0] || "";
    if (!profile.last_name) profile.last_name = parts.slice(1).join(" ") || parts[0] || "";
  }

  // Auto-derive middle_initial
  if (!profile.middle_initial && profile.full_name) {
    const parts = profile.full_name.trim().split(/\s+/);
    if (parts.length > 2) {
      profile.middle_initial = parts[1].charAt(0).toUpperCase();
    }
  }

  // Auto-derive title
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

  // Auto-derive hari, bulan, tahun, dan umur dari birth_date
  if (profile.birth_date) {
    const bParts = parseBirthDate(profile.birth_date);
    if (!profile.birth_day && bParts.day) profile.birth_day = bParts.day;
    if (!profile.birth_month && bParts.month) profile.birth_month = bParts.month;
    if (!profile.birth_year && bParts.year) profile.birth_year = bParts.year;
    if (!profile.age) profile.age = calculateAge(profile.birth_date);
  }

  // Auto-derive telephone aliases
  if (!profile.home_phone && profile.telepon_rumah) profile.home_phone = profile.telepon_rumah;
  if (!profile.work_telephone && profile.telepon_kantor) profile.work_telephone = profile.telepon_kantor;
  if (!profile.work_telephone && profile.work_phone) profile.work_telephone = profile.work_phone;
  if (!profile.fax && profile.nomor_fax) profile.fax = profile.nomor_fax;
}

// ============================================================
// Memproses Custom Fields & Foto Dokumen
// ============================================================
function processCustomFields(profile) {
  if (!profile) return;
  autoDeriveProfileFields(profile);

  if (profile.document_photos) {
    try {
      const docs = typeof profile.document_photos === "string"
        ? JSON.parse(profile.document_photos)
        : profile.document_photos;

      const photoSlotMap = {
        ktp: "foto_ktp",
        kk: "foto_kk",
        pasfoto: "pasfoto",
        npwp_card: "foto_npwp",
        ijazah: "foto_ijazah"
      };
      if (docs && typeof docs === "object") {
        Object.entries(docs).forEach(([slotKey, slotVal]) => {
          if (slotVal && slotVal.data) {
            const fileName = slotVal.name || `${slotKey}.jpg`;
            const mappedKey = photoSlotMap[slotKey] || slotKey;
            if (!profile[mappedKey]) profile[mappedKey] = fileName;
            if (slotKey !== mappedKey && !profile[slotKey]) profile[slotKey] = fileName;
          }
        });
      }
    } catch (e) {
      console.warn("GovConnect: Gagal memproses document_photos di sidepanel:", e);
    }
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
        if (item.type === "image" && item.photoData) {
          profile[item.key] = item.photoName || item.value || `${item.key}.jpg`;
        } else {
          profile[item.key] = item.value;
        }
        customFieldLabels[item.key] = item.label || item.key;

        // Auto-Cross-Binding cerdas ke profil standar jika field standar kosong
        const valStr = (item.value || "").toString().trim();
        const lowerK = `${item.key} ${item.label || ""}`.toLowerCase();
        if (valStr) {
          if (!profile.driver_license && (lowerK.includes("sim") || lowerK.includes("mengemudi") || lowerK.includes("driver"))) {
            profile.driver_license = item.value;
          }
          if (!profile.npwp && (lowerK.includes("npwp") || lowerK.includes("tax") || lowerK.includes("wajib_pajak"))) {
            profile.npwp = item.value;
          }
          if (!profile.bpjs_number && lowerK.includes("bpjs")) {
            profile.bpjs_number = item.value;
          }
          if (!profile.passport && (lowerK.includes("paspor") || lowerK.includes("passport"))) {
            profile.passport = item.value;
          }
          if (!profile.nik && (lowerK.includes("nik") || lowerK.includes("ktp") || lowerK.includes("kependudukan"))) {
            profile.nik = item.value;
          }
        }
      }
    });

    // Re-check aliases after custom fields are unpacked
    if (!profile.home_phone && profile.telepon_rumah) profile.home_phone = profile.telepon_rumah;
    if (!profile.work_telephone && profile.telepon_kantor) profile.work_telephone = profile.telepon_kantor;
    if (!profile.work_telephone && profile.work_phone) profile.work_telephone = profile.work_phone;
    if (!profile.fax && profile.nomor_fax) profile.fax = profile.nomor_fax;
  } catch (e) {
    console.warn("GovConnect: Gagal memproses custom_fields di sidepanel:", e);
  }
}

// ============================================================
// Inisialisasi
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  setupUIEvents();

  let token = await getToken();
  if (!token) {
    token = await tryAutoSyncFromOpenTabs();
  }

  if (!token) {
    showScreen("screenAuth");
    setupAuthListeners();
    setApiStatus("warning");
    return;
  }

  await initAuthenticatedSession(token);
});

async function initAuthenticatedSession(token) {
  setApiStatus("online");
  showScreen("screenScanning");
  setScanPhase("sync", "Menghubungkan Sesi...", "Memuat data profil kependudukan terenkripsi...", "35%");
  await refreshProfile();
  setScanPhase("profile", "Menganalisis Profil...", "Mempersiapkan kolom identitas dan data kustom...", "65%");
  await new Promise(r => setTimeout(r, 220));
  await detectPageFieldsWithFluidScan();
}

function setScanPhase(phase, title, desc, width) {
  const stepTitle = document.getElementById("scanStepTitle");
  const stepDesc = document.getElementById("scanStepDesc");
  const progressFill = document.getElementById("scanProgressFill");
  const chipSync = document.getElementById("chipSync");
  const chipProfile = document.getElementById("chipProfile");
  const chipForm = document.getElementById("chipForm");

  if (stepTitle) stepTitle.textContent = title;
  if (stepDesc) stepDesc.textContent = desc;
  if (progressFill) progressFill.style.width = width;

  if (chipSync && chipProfile && chipForm) {
    chipSync.className = `scan-badge-chip ${phase === "sync" || phase === "profile" || phase === "form" ? "active" : ""}`;
    chipProfile.className = `scan-badge-chip ${phase === "profile" || phase === "form" ? "active" : ""}`;
    chipForm.className = `scan-badge-chip ${phase === "form" ? "active" : ""}`;
  }
}

// ============================================================
// Setup Event Listeners UI
// ============================================================
function setupUIEvents() {
  const btnRefresh = document.getElementById("btnRefreshProfile");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", async () => {
      btnRefresh.style.animation = "spin 0.8s linear infinite";
      await refreshProfile();
      await detectPageFieldsWithFluidScan();
      btnRefresh.style.animation = "";
    });
  }

  const btnRetry = document.getElementById("btnRetryDetect");
  if (btnRetry) {
    btnRetry.addEventListener("click", () => {
      detectPageFieldsWithFluidScan();
    });
  }

  const btnSelectAll = document.getElementById("btnSelectAll");
  if (btnSelectAll) {
    btnSelectAll.addEventListener("click", selectAllFields);
  }

  const btnDeselectAll = document.getElementById("btnDeselectAll");
  if (btnDeselectAll) {
    btnDeselectAll.addEventListener("click", deselectAllFields);
  }

  const btnCloseSidebar = document.getElementById("btnCloseSidebar");
  if (btnCloseSidebar) {
    btnCloseSidebar.addEventListener("click", () => {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ action: "CLOSE_GOVCONNECT_SIDEBAR" }, "*");
      }
      chrome.runtime.sendMessage({ action: "CLOSE_SIDEBAR" }).catch(() => {});
    });
  }

  const btnFill = document.getElementById("btnFill");
  if (btnFill) {
    btnFill.addEventListener("click", executeAutofill);
  }

  const btnRefill = document.getElementById("btnRefill");
  if (btnRefill) {
    btnRefill.addEventListener("click", () => {
      showScreen("screenDetect");
    });
  }

  const btnGoDashboard = document.getElementById("btnGoDashboard");
  if (btnGoDashboard) {
    btnGoDashboard.addEventListener("click", async () => {
      // Token tidak lagi dikirim via URL hash; sinkronisasi aman via bridge content-script.
      await getToken();
      chrome.tabs.create({ url: DASHBOARD_URL });
    });
  }
}

// ============================================================
// Segarkan Profil dari API Backend
// ============================================================
async function refreshProfile() {
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE}/profile/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) {
      if (res.status === 401) {
        await chrome.storage.local.remove(["govconnect_token", "govconnect_email", "govconnect_cached_profile"]);
        showScreen("screenAuth");
        setupAuthListeners();
        setApiStatus("warning");
        return null;
      }
      throw new Error("Gagal mengambil profil terbaru");
    }
    cachedProfile = await res.json();
    processCustomFields(cachedProfile);
    // T6: simpan DI MEMORI service worker, bukan chrome.storage.local (disk plaintext).
    chrome.runtime.sendMessage({ action: "SET_CACHED_PROFILE", profile: cachedProfile }).catch(() => {});
    setApiStatus("online");
    return cachedProfile;
  } catch (err) {
    console.warn("GovConnect: Peringatan saat menyegarkan profil:", err);
    return cachedProfile;
  }
}

// Dengarkan perpindahan tab atau update halaman aktif (dengan pengecekan lingkungan aman)
if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.onActivated && chrome.tabs.onActivated.addListener) {
  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const token = await getToken();
    if (!token) return;
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab) {
        currentTab = tab;
        updatePageHeader(tab);
        await refreshProfile();
        await detectPageFieldsWithFluidScan();
      }
    } catch {}
  });
}

if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.onUpdated && chrome.tabs.onUpdated.addListener) {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active) {
      const token = await getToken();
      if (!token) return;
      currentTab = tab;
      updatePageHeader(tab);
      await refreshProfile();
      await detectPageFieldsWithFluidScan();
    }
  });
}

window.addEventListener("focus", async () => {
  const token = await getToken();
  if (!token) return;
  await refreshProfile();
});

// Dengarkan pesan runtime
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "PROFILE_UPDATED") {
    await refreshProfile();
    if (currentActiveScreen !== "screenResult") {
      await detectPageFieldsWithFluidScan();
    }
    showStatus("✓ Data profil berhasil diperbarui!");
    setTimeout(() => showStatus(""), 3000);
  }

  if (message.action === "FORM_UPDATED") {
    if (currentActiveScreen === "screenResult" || isAutofillingInProgress) {
      return;
    }
    clearTimeout(formUpdateDebounceTimer);
    formUpdateDebounceTimer = setTimeout(() => {
      if (isScanningActive) {
        hasPendingScan = true;
        return;
      }
      // Jika pengguna sudah berada di screenDetect, jalankan silent update agar tidak flicker/reload
      const isAlreadyOnDetect = (currentActiveScreen === "screenDetect");
      detectPageFieldsWithFluidScan({ silent: isAlreadyOnDetect });
    }, 600);
  }
});

// ============================================================
// Dapatkan Tab Aktif & Header
// ============================================================
async function getActiveTab() {
  try {
    if (chrome.tabs && chrome.tabs.query) {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tabs && tabs.length > 0) return tabs[0];
      const fallback = await chrome.tabs.query({ active: true, currentWindow: true });
      if (fallback && fallback[0]) return fallback[0];
    }
  } catch {}

  try {
    const res = await chrome.runtime.sendMessage({ action: "GET_CURRENT_TAB_INFO" });
    if (res?.tab) return res.tab;
  } catch {}

  return null;
}

function updatePageHeader(tab) {
  const pageTitleEl = document.getElementById("pageTitle");
  if (pageTitleEl && tab?.url) {
    try {
      const url = new URL(tab.url);
      pageTitleEl.textContent = url.hostname + (url.pathname !== "/" ? url.pathname : "");
    } catch {
      pageTitleEl.textContent = tab.title || "Halaman aktif";
    }
  }
}

// ============================================================
// FLUID SCANNING TRANSITION: Pindai halaman dengan animasi jeda
// ============================================================
async function detectPageFieldsWithFluidScan(options = {}) {
  const silent = !!(options && options.silent);

  if (isScanningActive) {
    hasPendingScan = true;
    return;
  }
  isScanningActive = true;

  try {
    currentTab = await getActiveTab();
    if (!currentTab?.id) {
      if (!silent) showScreen("screenUnsupported");
      return;
    }

    if (currentTab.url?.startsWith("chrome://") || currentTab.url?.startsWith("chrome-extension://")) {
      if (!silent) showScreen("screenUnsupported");
      return;
    }

    updatePageHeader(currentTab);

    // Tampilkan layar pemindaian HANYA jika bukan silent scan
    if (!silent) {
      showScreen("screenScanning");
      setScanPhase("form", "Memindai Formulir...", "Menganalisis kolom input web...", "60%");
    }

    // 1. Coba kirim pesan deteksi langsung ke top frame ({ frameId: 0 }) agar respon tidak dicuri oleh iklan/iframe lain
    let result = await sendMessageToTab(currentTab.id, {
      action: "DETECT_FIELDS",
      profile: cachedProfile
    }, 2500, { frameId: 0 });

    // 2. Fallback: Jika tab belum memuat content script pada frameId 0, suntikkan sekali
    if (!result) {
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id, frameIds: [0] },
        files: ["content_script.js"]
      }).catch(() => {});

      result = await sendMessageToTab(currentTab.id, {
        action: "DETECT_FIELDS",
        profile: cachedProfile
      }, 2500, { frameId: 0 });
    }

    if (result && (result.matched > 0 || result.hiddenMatchedCount > 0)) {
      detectedFrameId = 0;
    } else {
      // 3. Fallback jika frameId: 0 tidak memiliki form cocok sama sekali, cek child frames (broadcast)
      const broadcastResult = await sendMessageToTab(currentTab.id, {
        action: "DETECT_FIELDS",
        profile: cachedProfile
      }, 2500);

      if (broadcastResult && (broadcastResult.matched > 0 || broadcastResult.hiddenMatchedCount > 0)) {
        result = broadcastResult;
        detectedFrameId = null;
      }
    }

    // Muat domain mapping yang tersimpan di backend
    const currentDomain = getDomainFromUrl(currentTab?.url);
    await loadDomainMappings(currentDomain);

    if (result && Array.isArray(result.fields)) {
      result.fields.forEach(f => {
        const idKey = f.id || f.name;
        if (!f.profileKey && idKey && domainMappingsCache[idKey]) {
          f.profileKey = domainMappingsCache[idKey];
          f.status = "matched";
          f.isCustomMapped = true;
        }
      });
      // Re-calculate matched counters
      const visibleMatched = result.fields.filter(d => d.profileKey && d.isVisible);
      const hiddenMatched = result.fields.filter(d => d.profileKey && !d.isVisible);
      result.matched = visibleMatched.length;
      result.hiddenMatchedCount = hiddenMatched.length;
    }

    if (!result || result.total === 0) {
      if (!silent) showScreen("screenUnsupported");
      return;
    }

    // Jika mode silent, cek apakah struktur kolom berubah. Jika identik, jangan buang DOM yang sedang dilihat pengguna
    if (silent && allDetectedResult && Array.isArray(allDetectedResult.fields)) {
      const prevSig = (allDetectedResult.fields || []).map(f => `${f.id || ''}_${f.name || ''}_${f.profileKey || ''}_${f.status || ''}`).join('|');
      const newSig = (result.fields || []).map(f => `${f.id || ''}_${f.name || ''}_${f.profileKey || ''}_${f.status || ''}`).join('|');
      if (prevSig === newSig) {
        return;
      }
    }

    allDetectedResult = result;
    renderFieldList();
    if (!silent || currentActiveScreen !== "screenDetect") {
      showScreen("screenDetect");
    }

  } catch (err) {
    console.warn("Scan failed:", err);
    if (!silent) showScreen("screenUnsupported");
  } finally {
    isScanningActive = false;
    if (hasPendingScan) {
      hasPendingScan = false;
      setTimeout(() => {
        if (!isAutofillingInProgress && currentActiveScreen !== "screenResult") {
          const isAlreadyOnDetect = (currentActiveScreen === "screenDetect");
          detectPageFieldsWithFluidScan({ silent: isAlreadyOnDetect });
        }
      }, 300);
    }
  }
}

// ============================================================
// Checkbox Management
// ============================================================
function getFieldUid(f, idx) {
  return `${f.tag || 'input'}_${f.id || ''}_${f.name || ''}_${f.profileKey || ''}_${idx}`;
}

function selectAllFields() {
  detectedFields.forEach((field, i) => {
    const uid = getFieldUid(field, i);
    const profileValue = cachedProfile ? cachedProfile[field.profileKey] : null;
    const hasValue = !!(profileValue && profileValue.toString().trim() !== "");
    if (hasValue) {
      userSelectedMap[uid] = true;
    }
  });
  renderFieldList();
}

function deselectAllFields() {
  detectedFields.forEach((field, i) => {
    const uid = getFieldUid(field, i);
    userSelectedMap[uid] = false;
  });
  renderFieldList();
}

function updateSelectionUI() {
  const checkedBoxes = document.querySelectorAll("#fieldList input[type=checkbox]:checked");
  const checkedCount = checkedBoxes.length;
  const summaryEl = document.getElementById("selectionSummary");
  if (summaryEl) {
    summaryEl.innerHTML = `<span><strong>${checkedCount}</strong> dari ${detectedFields.length} dipilih</span>`;
  }

  const btnEl = document.getElementById("btnFill");
  if (btnEl) {
    if (checkedCount === 0) {
      btnEl.disabled = true;
      btnEl.innerHTML = '<i class="fa-regular fa-file-lines" style="font-size: 11.5px; margin-right: 5px;"></i><span>Pilih Minimal 1 Kolom</span>';
    } else {
      btnEl.disabled = false;
      btnEl.innerHTML = `<i class="fa-solid fa-bolt" style="font-size: 11.5px; margin-right: 5px;"></i><span>Isi ${checkedCount} Kolom Formulir</span>`;
    }
  }
}

// ============================================================
// Render daftar field dengan transisi staggered fluid
// ============================================================
// Tampilan saat tidak ada kolom sama sekali (belum terdeteksi / tidak cocok)
function renderEmptyFieldState(container, detectCountEl) {
  detectedFields = [];
  if (detectCountEl) detectCountEl.textContent = "0 Kolom Terdeteksi";

  const statusPill = document.querySelector(".detect-status-pill");
  const selControls = document.querySelector(".selection-controls");
  if (statusPill) {
    statusPill.innerHTML =
      '<i class="fa-solid fa-circle-info" style="font-size: 10px;"></i><span>Belum ada kolom</span>';
  }
  if (selControls) selControls.style.display = "none";

  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
      <p class="empty-state-title">Tidak ada kolom yang cocok</p>
      <p class="empty-state-desc">Buka halaman formulir instansi terlebih dahulu, lalu pindai ulang. GovConnect akan mencocokkan kolom dengan profil Anda.</p>
      <button type="button" class="btn-outline" id="btnRetryFromEmpty">
        <i class="fa-solid fa-rotate-right" style="font-size: 11px;"></i> Pindai ulang
      </button>
    </div>`;

  document.getElementById("btnRetryFromEmpty")?.addEventListener("click", () => {
    document.getElementById("btnRetryDetect")?.click();
  });

  const btnFill = document.getElementById("btnFill");
  if (btnFill) btnFill.disabled = true;

  updateSelectionUI();
  syncMarkersWithCheckedFields();
}

function renderFieldList() {
  const container = document.getElementById("fieldList");
  const detectCountEl = document.getElementById("detectCount");
  const scrollWrap = document.querySelector(".fields-scroll-wrap");
  const prevScrollTop = scrollWrap ? scrollWrap.scrollTop : 0;

  container.innerHTML = "";
  if (!allDetectedResult) {
    renderEmptyFieldState(container, detectCountEl);
    return;
  }

  const allMatched = (allDetectedResult.fields || []).filter(f => f.profileKey);
  const allUnmatched = (allDetectedResult.fields || []).filter(f => !f.profileKey);

  detectedFields = allMatched;

  if (detectCountEl) {
    detectCountEl.textContent = `${detectedFields.length} Kolom Terdeteksi`;
  }

  const statusPill = document.querySelector(".detect-status-pill");
  const selControls = document.querySelector(".selection-controls");
  const hasMatchedFields = detectedFields.length > 0;
  const hasAnyFields = (allDetectedResult.fields || []).length > 0;

  if (statusPill) {
    statusPill.innerHTML = hasMatchedFields
      ? '<i class="fa-solid fa-bolt" style="font-size: 10px;"></i><span>Siap Isi</span>'
      : hasAnyFields
      ? '<i class="fa-solid fa-sliders" style="font-size: 10px;"></i><span>Atur Pemetaan</span>'
      : '<i class="fa-solid fa-circle-info" style="font-size: 10px;"></i><span>Belum ada kolom</span>';
  }
  if (selControls) selControls.style.display = hasMatchedFields ? "" : "none";

  if (!hasAnyFields) {
    renderEmptyFieldState(container, detectCountEl);
    return;
  }

  const currentDomain = getDomainFromUrl(currentTab?.url);

  // 1. Render Matched Fields
  detectedFields.forEach((field, i) => {
    const uid = getFieldUid(field, i);
    const profileValue = cachedProfile ? cachedProfile[field.profileKey] : null;
    const hasValue = !!(profileValue && profileValue.toString().trim() !== "");
    const isCustom = field.profileKey && (customFieldLabels[field.profileKey] !== undefined || field.isCustomMapped);

    let isChecked = false;
    if (uid in userSelectedMap) {
      isChecked = userSelectedMap[uid] && hasValue;
    } else {
      isChecked = hasValue;
      userSelectedMap[uid] = isChecked;
    }

    const item = document.createElement("div");
    item.className = `field-item ${isChecked ? 'is-selected' : ''}`;
    item.dataset.uid = uid;
    item.dataset.index = i;
    // Fluid staggered entrance animation delay
    item.style.animationDelay = `${Math.min(i * 35, 450)}ms`;

    item.innerHTML = `
      <input type="checkbox" id="chk_${i}" class="field-checkbox" data-index="${i}" data-uid="${uid}" ${isChecked ? "checked" : ""} ${!hasValue ? "disabled" : ""}>
      <div class="field-content">
        <div class="field-name" style="display: flex; align-items: center; justify-content: space-between; gap: 4px;">
          <span style="display: inline-flex; align-items: center; gap: 4px; min-width: 0;">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(field.name || field.id || formatFieldLabel(field.profileKey) || "(field)")}</span>
            ${isCustom ? '<span class="badge-custom" title="Kolom Kustom Profil"><i class="fa-solid fa-puzzle-piece" style="font-size: 7.5px;"></i> Kustom</span>' : ''}
          </span>
          <button type="button" class="btn-field-remap" id="btnRemap_${i}" title="Ubah Pemetaan Kolom">
            <i class="fa-solid fa-sliders" style="font-size: 9.5px;"></i>
          </button>
        </div>
        <div class="field-meta">
          <span>${escapeHtml(formatFieldLabel(field.profileKey))}:</span> ${hasValue ? `<span class="field-val-matched">${escapeHtml(truncate(profileValue, 24))}</span>` : "<span class='field-val-empty'>Data belum ada di profil</span>"}
        </div>
        <div class="field-remap-wrap" id="remapWrap_${i}" style="display: none; margin-top: 4px;">
          <select class="remap-select" id="remapSelect_${i}">
            ${renderFieldOptionsHtml(field.profileKey)}
          </select>
        </div>
      </div>
      <span class="status-pill ${hasValue ? "matched" : "empty"}">
        ${hasValue ? '<i class="fa-solid fa-check" style="font-size: 8.5px;"></i><span>Cocok</span>' : '<span>Kosong</span>'}
      </span>
    `;

    // Highlight pada hover di tab web
    item.addEventListener("mouseenter", () => {
      if (currentTab?.id && field.profileKey) {
        const targetOpts = (typeof detectedFrameId === "number") ? { frameId: detectedFrameId } : null;
        sendMessageToTab(currentTab.id, {
          action: "HOVER_FIELD",
          profileKey: field.profileKey,
          name: field.name,
          id: field.id
        }, 1500, targetOpts);
      }
    });

    item.addEventListener("mouseleave", () => {
      if (currentTab?.id) {
        const targetOpts = (typeof detectedFrameId === "number") ? { frameId: detectedFrameId } : null;
        sendMessageToTab(currentTab.id, { action: "UNHOVER_FIELD" }, 1500, targetOpts);
      }
    });

    const chk = item.querySelector("input[type=checkbox]");
    if (chk) {
      chk.addEventListener("change", (e) => {
        e.stopPropagation();
        userSelectedMap[uid] = chk.checked;
        item.classList.toggle("is-selected", chk.checked);
        updateSelectionUI();
        syncMarkersWithCheckedFields();
      });
    }

    const btnRemap = item.querySelector(`#btnRemap_${i}`);
    const remapWrap = item.querySelector(`#remapWrap_${i}`);
    const remapSelect = item.querySelector(`#remapSelect_${i}`);

    if (btnRemap && remapWrap && remapSelect) {
      btnRemap.addEventListener("click", (e) => {
        e.stopPropagation();
        const isOpen = remapWrap.style.display !== "none";
        remapWrap.style.display = isOpen ? "none" : "block";
      });

      remapSelect.addEventListener("click", (e) => e.stopPropagation());
      remapSelect.addEventListener("change", (e) => {
        e.stopPropagation();
        const newKey = remapSelect.value;
        if (!newKey) return;
        field.profileKey = newKey;
        field.isCustomMapped = true;
        const fId = field.id || field.name;
        if (fId && currentDomain) {
          domainMappingsCache[fId] = newKey;
          saveDomainMapping(currentDomain, fId, newKey);
        }
        userSelectedMap[uid] = true;
        renderFieldList();
      });
    }

    item.addEventListener("click", (e) => {
      if (e.target.tagName.toLowerCase() === "input" || e.target.tagName.toLowerCase() === "select" || e.target.closest(".btn-field-remap") || e.target.closest(".field-remap-wrap")) {
        return;
      }
      if (chk && !chk.disabled) {
        chk.checked = !chk.checked;
        userSelectedMap[uid] = chk.checked;
        item.classList.toggle("is-selected", chk.checked);
        updateSelectionUI();
        syncMarkersWithCheckedFields();
      }
    });

    container.appendChild(item);
  });

  // 2. Render Unmatched Fields Section (jika ada form input yang belum terpetakan)
  if (allUnmatched.length > 0) {
    const unmatchedSection = document.createElement("div");
    unmatchedSection.className = "unmatched-section";
    const defaultOpen = allMatched.length === 0;

    unmatchedSection.innerHTML = `
      <button type="button" class="unmatched-toggle-btn" id="btnToggleUnmatched">
        <span><i class="fa-solid fa-circle-question" style="font-size: 11px; margin-right: 5px; color: var(--ink-3);"></i>Kolom Belum Terpetakan (${allUnmatched.length})</span>
        <i class="fa-solid fa-chevron-down" id="iconUnmatchedChevron" style="font-size: 10px; transition: transform 0.2s ease; ${defaultOpen ? 'transform: rotate(180deg);' : ''}"></i>
      </button>
      <div class="unmatched-content" id="unmatchedContent" style="display: ${defaultOpen ? 'flex' : 'none'};">
        <p style="font-size: 10.5px; color: var(--ink-3); margin-bottom: 2px;">Petakan kolom web liar di bawah ke kolom profil atau kustom Anda:</p>
      </div>
    `;

    const unmatchedContent = unmatchedSection.querySelector("#unmatchedContent");
    allUnmatched.forEach((uField, uIdx) => {
      const uItem = document.createElement("div");
      uItem.className = "field-item is-unmatched";
      const uName = uField.name || uField.id || `Input #${uIdx + 1}`;
      uItem.innerHTML = `
        <div style="min-width: 0; width: 100%;">
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11.5px; font-weight: 600; color: var(--ink);">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(uName)}</span>
            <span style="font-size: 9.5px; color: var(--ink-3); font-weight: normal;">${escapeHtml(uField.placeholder ? `(${truncate(uField.placeholder, 18)})` : '')}</span>
          </div>
          <select class="remap-select" id="unmatchedSelect_${uIdx}">
            ${renderFieldOptionsHtml("")}
          </select>
        </div>
      `;

      const uSelect = uItem.querySelector(`#unmatchedSelect_${uIdx}`);
      uSelect.addEventListener("change", (e) => {
        e.stopPropagation();
        const chosenKey = uSelect.value;
        if (!chosenKey) return;
        uField.profileKey = chosenKey;
        uField.status = "matched";
        uField.isCustomMapped = true;

        const fId = uField.id || uField.name;
        if (fId && currentDomain) {
          domainMappingsCache[fId] = chosenKey;
          saveDomainMapping(currentDomain, fId, chosenKey);
        }

        renderFieldList();
      });

      unmatchedContent.appendChild(uItem);
    });

    const toggleBtn = unmatchedSection.querySelector("#btnToggleUnmatched");
    const chevron = unmatchedSection.querySelector("#iconUnmatchedChevron");
    toggleBtn.addEventListener("click", () => {
      const isHidden = unmatchedContent.style.display === "none";
      unmatchedContent.style.display = isHidden ? "flex" : "none";
      chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    });

    container.appendChild(unmatchedSection);
  }

  updateSelectionUI();
  syncMarkersWithCheckedFields();

  if (scrollWrap && prevScrollTop > 0) {
    scrollWrap.scrollTop = prevScrollTop;
  }
}

function syncMarkersWithCheckedFields() {
  if (!currentTab?.id) return;
  const checkedInputs = document.querySelectorAll("#fieldList input[type=checkbox]:checked");
  const activeKeys = Array.from(checkedInputs).map(input => {
    const idx = parseInt(input.dataset.index);
    return detectedFields[idx]?.profileKey;
  }).filter(Boolean);

  const targetOpts = (typeof detectedFrameId === "number") ? { frameId: detectedFrameId } : null;
  sendMessageToTab(currentTab.id, {
    action: "UPDATE_ACTIVE_MARKERS",
    activeKeys: activeKeys,
    profile: cachedProfile
  }, 3000, targetOpts);
}

// ============================================================
// Eksekusi Autofill dengan Transisi & Animasi Pengisian Fluid
// ============================================================
async function executeAutofill() {
  const btn = document.getElementById("btnFill");
  isAutofillingInProgress = true;
  setFillingProgress(true);
  btn.innerHTML = `<i class="fa-solid fa-rotate-right" style="margin-right: 6px; display: inline-block; animation: spin 0.8s linear infinite;"></i> Mengisi Formulir...`;

  const checkedInputs = Array.from(
    document.querySelectorAll("#fieldList input[type=checkbox]:checked")
  );

  if (checkedInputs.length === 0) {
    btn.textContent = "Pilih Minimal 1 Kolom";
    btn.disabled = true;
    isAutofillingInProgress = false;
    setFillingProgress(false);
    showStatus("Pilih minimal satu kolom formulir terlebih dahulu.");
    return;
  }

  const selectedProfile = {};
  const targetFields = [];
  checkedInputs.forEach(el => {
    const idx = parseInt(el.dataset.index);
    const field = detectedFields[idx];
    if (field && cachedProfile && cachedProfile[field.profileKey] !== undefined) {
      selectedProfile[field.profileKey] = cachedProfile[field.profileKey];
      targetFields.push({
        id: field.id,
        name: field.name,
        profileKey: field.profileKey,
        tag: field.tag
      });
    }
  });

  // Pastikan komponen tanggal lahir, berkas foto, dan kolom kustom tersedia di payload autofill
  if (cachedProfile) {
    if (cachedProfile.birth_date && selectedProfile.birth_date === undefined) selectedProfile.birth_date = cachedProfile.birth_date;
    if (cachedProfile.birth_day && selectedProfile.birth_day === undefined) selectedProfile.birth_day = cachedProfile.birth_day;
    if (cachedProfile.birth_month && selectedProfile.birth_month === undefined) selectedProfile.birth_month = cachedProfile.birth_month;
    if (cachedProfile.birth_year && selectedProfile.birth_year === undefined) selectedProfile.birth_year = cachedProfile.birth_year;
    if (cachedProfile.document_photos) selectedProfile.document_photos = cachedProfile.document_photos;
    if (cachedProfile.custom_fields) selectedProfile.custom_fields = cachedProfile.custom_fields;
  }

  try {
    if (currentTab?.id) {
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id, ...(typeof detectedFrameId === "number" ? { frameIds: [detectedFrameId] } : {}) },
        files: ["content_script.js"]
      }).catch(() => {});
    }

    const targetOpts = (typeof detectedFrameId === "number") ? { frameId: detectedFrameId } : null;
    const result = await sendMessageToTab(currentTab.id, {
      action: "EXECUTE_AUTOFILL",
      profile: selectedProfile,
      targetFields: targetFields
    }, 15000, targetOpts);

    if (!result) throw new Error("Tidak ada respons dari halaman");

    renderResult(result);
    showScreen("screenResult");

    // Catat log aktivitas ke API
    const token = await getToken();
    if (token) {
      try {
        let domain = "";
        let safeTargetUrl = "";
        if (currentTab?.url) {
          try {
            const parsed = new URL(currentTab.url);
            domain = parsed.protocol === "file:" ? "Local File (HTML)" : (parsed.hostname || "");
            // T7: buang query string & fragment — dapat memuat data sensitif/PII.
            safeTargetUrl = parsed.origin && parsed.origin !== "null"
              ? `${parsed.origin}${parsed.pathname}`
              : `${parsed.protocol}//${parsed.pathname}`;
          } catch {
            domain = "";
            safeTargetUrl = "";
          }
        }
        const filledFieldKeys = (result.fields || [])
          .filter(f => f.status === "filled" && f.profileKey)
          .map(f => f.profileKey);

        await fetch(`${API_BASE}/activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            target_url: safeTargetUrl,
            website_domain: domain,
            action: "autofill",
            fields_detected: detectedFields.length,
            fields_filled: result.count,
            status: result.status,
            filled_fields_summary: filledFieldKeys.join(",")
          })
        });
      } catch (logErr) {
        console.warn("Gagal mencatat log aktivitas:", logErr);
      }
    }

  } catch (err) {
    console.error("Autofill error:", err);
    showStatus("Gagal mengisi form: " + (err.message || "Timeout"));
  } finally {
    isAutofillingInProgress = false;
    setFillingProgress(false);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-bolt" style="font-size: 11.5px; margin-right: 5px;"></i><span>Isi Formulir Otomatis</span>';
    }
  }
}

// ============================================================
// Render Hasil Autofill (dengan Animasi Dinamis Centang)
// ============================================================
function renderResult(result) {
  const statusEl = document.getElementById("resultStatus");
  const heroTitle = document.getElementById("resultHeroTitle");
  const heroSub = document.getElementById("resultHeroSub");
  const heroBox = document.getElementById("resultHeroBox");
  const animWrapper = document.getElementById("checkmarkAnimWrapper");

  // Re-trigger animasi dinamis centang SVG & confetti
  if (animWrapper && (result.status === "success" || result.status === "partial")) {
    const parent = animWrapper.parentNode;
    if (parent) {
      const clone = animWrapper.cloneNode(true);
      parent.replaceChild(clone, animWrapper);
    }
  }

  if (result.status === "success") {
    statusEl.textContent = "Selesai Sempurna";
    statusEl.className = "result-metric-value text-success";
    if (heroTitle) heroTitle.textContent = "Pengisian Formulir Berhasil!";
    if (heroSub) heroSub.textContent = `${result.count} kolom formulir telah berhasil diisi secara instan.`;
    if (heroBox) heroBox.style.display = "flex";
  } else if (result.status === "partial") {
    statusEl.textContent = "Sebagian Terisi";
    statusEl.className = "result-metric-value text-warning";
    if (heroTitle) heroTitle.textContent = "Sebagian Kolom Berhasil Terisi";
    if (heroSub) heroSub.textContent = `${result.count} kolom berhasil diisi, beberapa kolom lainnya tidak ditemukan di formulir.`;
    if (heroBox) heroBox.style.display = "flex";
  } else {
    statusEl.textContent = "Gagal Mengisi";
    statusEl.className = "result-metric-value text-neutral";
    if (heroTitle) heroTitle.textContent = "Gagal Mengisi Formulir";
    if (heroSub) heroSub.textContent = "Terjadi kendala saat menyuntikkan data formulir ke halaman.";
    if (heroBox) heroBox.style.display = "none";
  }

  document.getElementById("resultFilled").textContent = `${result.count} kolom`;
  const notFound = (result.fields || []).filter(f => f.status !== "filled").length;
  document.getElementById("resultSkipped").textContent = `${notFound} kolom`;

  // Render Rincian Kolom Terisi, Terlewati, dan Gagal (Collapsible)
  renderResultBreakdown(result);
}

// ============================================================
// Render Rincian Status Data Formulir (Terisi, Terlewati, Gagal)
// ============================================================
function renderResultBreakdown(result) {
  const content = document.getElementById("resultBreakdownContent");
  const listFilled = document.getElementById("listFilled");
  const listSkipped = document.getElementById("listSkipped");
  const listFailed = document.getElementById("listFailed");
  const badgeFilled = document.getElementById("badgeCountFilled");
  const badgeSkipped = document.getElementById("badgeCountSkipped");
  const badgeFailed = document.getElementById("badgeCountFailed");
  const failedSection = document.getElementById("breakdownFailedSection");

  if (!listFilled || !listSkipped || !listFailed) return;

  listFilled.innerHTML = "";
  listSkipped.innerHTML = "";
  listFailed.innerHTML = "";

  const fields = result.fields || [];
  const filledItems = [];
  const skippedItems = [];
  const failedItems = [];

  // Peta referensi untuk mendapatkan nama kolom yang jelas
  const fieldMap = new Map();
  (detectedFields || []).forEach(f => {
    if (f.id) fieldMap.set(f.id, f);
    if (f.name) fieldMap.set(f.name, f);
    if (f.profileKey) fieldMap.set(f.profileKey, f);
  });

  fields.forEach(f => {
    const orig = fieldMap.get(f.id) || fieldMap.get(f.name) || (f.profileKey ? fieldMap.get(f.profileKey) : null) || {};
    const name = orig.name || orig.placeholder || f.name || f.id || formatFieldLabel(f.profileKey) || "Kolom Formulir";
    const profileKey = f.profileKey || orig.profileKey || "";
    const profileVal = cachedProfile && profileKey ? cachedProfile[profileKey] : "";

    if (f.status === "filled") {
      filledItems.push({ name, key: profileKey, val: profileVal });
    } else if (f.status === "failed") {
      failedItems.push({ name, key: profileKey });
    } else {
      skippedItems.push({ name, key: profileKey, hasVal: !!profileVal });
    }
  });

  // 1. Kolom Terisi
  if (filledItems.length === 0) {
    listFilled.innerHTML = `<div style="font-size: 11px; color: var(--ink-3); padding: 4px 6px;">Tidak ada kolom yang terisi</div>`;
  } else {
    filledItems.forEach(item => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; background: var(--ok-soft); border: 1px solid var(--ok-line); border-radius: 6px;";
      row.innerHTML = `
        <span style="font-size: 11.5px; font-weight: 600; color: var(--ok); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.name)}</span>
        <span style="font-size: 11px; color: var(--ink); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${escapeHtml(truncate(item.val || "Terisi", 20))}</span>
      `;
      listFilled.appendChild(row);
    });
  }

  // 2. Kolom Terlewati / Tanpa Data
  if (skippedItems.length === 0) {
    listSkipped.innerHTML = `<div style="font-size: 11px; color: var(--ink-3); padding: 4px 6px;">Tidak ada kolom yang terlewati</div>`;
  } else {
    skippedItems.forEach(item => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; background: var(--warn-soft); border: 1px solid var(--warn-line); border-radius: 6px;";
      row.innerHTML = `
        <span style="font-size: 11.5px; font-weight: 500; color: var(--warn); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.name)}</span>
        <span style="font-size: 10.5px; color: var(--ink-3); font-weight: 500;">${item.hasVal ? "Tidak dipilih" : "Data kosong"}</span>
      `;
      listSkipped.appendChild(row);
    });
  }

  // 3. Kolom Gagal Diisi
  if (failedItems.length > 0) {
    if (failedSection) failedSection.style.display = "block";
    failedItems.forEach(item => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; background: var(--danger-soft); border: 1px solid var(--danger-line); border-radius: 6px;";
      row.innerHTML = `
        <span style="font-size: 11.5px; font-weight: 600; color: var(--danger); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.name)}</span>
        <span style="font-size: 10.5px; color: var(--danger); font-weight: 500;">Gagal disuntik</span>
      `;
      listFailed.appendChild(row);
    });
  } else {
    if (failedSection) failedSection.style.display = "none";
  }

  if (badgeFilled) badgeFilled.textContent = filledItems.length;
  if (badgeSkipped) badgeSkipped.textContent = skippedItems.length;
  if (badgeFailed) badgeFailed.textContent = failedItems.length;

  // Toggle button listener
  const btnToggle = document.getElementById("btnToggleResultBreakdown");
  const label = document.getElementById("breakdownToggleLabel");
  const chevron = document.getElementById("breakdownToggleChevron");
  if (btnToggle && !btnToggle.__hasClickListener) {
    btnToggle.__hasClickListener = true;
    btnToggle.addEventListener("click", () => {
      const isHidden = content.style.display === "none" || !content.style.display;
      content.style.display = isHidden ? "block" : "none";
      if (label) label.textContent = isHidden ? "Sembunyikan" : "Tampilkan";
      if (chevron) chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
      if (isHidden) {
        setTimeout(() => {
          content.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 50);
      }
    });
  }
}

// ============================================================
// Layar & Status Helper
// ============================================================
function showScreen(id) {
  const prev = currentActiveScreen;
  currentActiveScreen = id;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) {
    const order = ["screenAuth", "screenScanning", "screenDetect", "screenResult", "screenUnsupported"];
    const pi = order.indexOf(prev);
    const ni = order.indexOf(id);
    target.dataset.dir = pi >= 0 && ni >= 0 && ni < pi ? "back" : "forward";
    target.classList.add("active");
  }
  setFillingProgress(false);
}

function setFillingProgress(active) {
  const footer = document.querySelector(".detect-footer");
  if (footer) footer.classList.toggle("is-filling", !!active);
}

function setApiStatus(status) {
  const badge = document.getElementById("apiStatusBadge");
  const text = document.getElementById("apiStatusText");
  if (!badge || !text) return;
}

function showStatus(msg) {
  const el = document.getElementById("statusMsg");
  if (el) el.textContent = msg;
}

function truncate(str, n) {
  if (!str) return "";
  const s = str.toString();
  return s.length > n ? s.substring(0, n) + "..." : s;
}

function formatFieldLabel(key) {
  const map = {
    nik: "NIK (KTP)",
    full_name: "Nama Lengkap",
    first_name: "Nama Depan",
    birth_date: "Tgl Lahir",
    birth_day: "Hari Lahir",
    birth_month: "Bulan Lahir",
    birth_year: "Tahun Lahir",
    age: "Umur / Usia",
    birth_place: "Tempat Lahir",
    gender: "Jenis Kelamin",
    religion: "Agama",
    marital_status: "Status Pernikahan",
    blood_type: "Gol. Darah",
    address: "Alamat Jalan",
    province: "Provinsi",
    city: "Kota / Kab",
    district: "Kecamatan",
    village: "Kelurahan",
    postal_code: "Kode Pos",
    phone: "No. HP / WA",
    home_phone: "Telp Rumah",
    work_telephone: "Telp Kantor",
    fax: "Nomor Fax",
    email: "Email",
    nisn: "NISN",
    institution: "Institusi / Sekolah",
    student_id: "NIM",
    occupation: "Pekerjaan",
    organization: "Instansi",
    work_address: "Alamat Kantor",
    education_level: "Pendidikan",
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
  return map[key] || customFieldLabels[key] || key;
}

function sendMessageToTab(tabId, message, timeoutMs = 5000, options = null) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(null);
      }
    }, timeoutMs);

    const tryForwardViaBackground = () => {
      try {
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: "FORWARD_TO_TAB",
            tabId: tabId,
            tabMessage: message,
            options: options
          }, (response) => {
            if (!done) {
              done = true;
              clearTimeout(timer);
              resolve(response || null);
            }
          });
          return;
        }
      } catch (e) {}
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(null);
      }
    };

    try {
      if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.sendMessage) {
        const cb = (response) => {
          if (!done) {
            if (chrome.runtime.lastError || !response) {
              tryForwardViaBackground();
            } else {
              done = true;
              clearTimeout(timer);
              resolve(response);
            }
          }
        };

        if (options && typeof options === "object") {
          chrome.tabs.sendMessage(tabId, message, options, cb);
        } else {
          chrome.tabs.sendMessage(tabId, message, cb);
        }
        return;
      }
    } catch (e) {}
    tryForwardViaBackground();
  });
}

function getToken() {
  return new Promise(resolve => {
    chrome.storage.local.get("govconnect_token", r => resolve(r.govconnect_token || null));
  });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// Auto-Sync & Auth Listener
// ============================================================
async function tryAutoSyncFromOpenTabs() {
  try {
    // 1. Coba sinkronisasi langsung dari Cookie HttpOnly (mendukung localhost:5173, 127.0.0.1:8000, dsb.)
    let cookieToken = null;
    if (typeof GovConnectConfig !== "undefined" && typeof GovConnectConfig.findAuthCookie === "function") {
      cookieToken = await GovConnectConfig.findAuthCookie();
    } else if (chrome.cookies) {
      try {
        const cookies = await chrome.cookies.getAll({ name: "govconnect_access_token" });
        if (cookies && cookies.length > 0) {
          const now = Date.now() / 1000;
          const valid = cookies.find(c => !c.expirationDate || c.expirationDate > now);
          if (valid?.value) cookieToken = valid.value;
        }
      } catch (_) {}
    }

    // 2. Ambil informasi email atau token fallback dari tab dashboard yang sedang terbuka
    let email = "";
    try {
      const tabs = await chrome.tabs.query({});
      const dashboardTab = tabs.find(t => isGovConnectDashboardUrl(t.url));

      if (dashboardTab?.id) {
        const results = await chrome.scripting.executeScript({
          target: { tabId: dashboardTab.id },
          func: () => ({
            token: localStorage.getItem("govconnect_token"),
            email: localStorage.getItem("govconnect_email")
          })
        });

        const extracted = results?.[0]?.result;
        if (extracted?.email) email = extracted.email;
        if (!cookieToken && extracted?.token) {
          cookieToken = extracted.token;
        }
      }
    } catch (_) {}

    if (cookieToken) {
      await chrome.storage.local.set({
        govconnect_token: cookieToken,
        ...(email ? { govconnect_email: email } : {})
      });
      return cookieToken;
    }
  } catch (err) {
    console.warn("Auto-sync error:", err);
  }
  return null;
}

function setupAuthListeners() {
  const btnSync = document.getElementById("btnAutoSyncTab");
  if (btnSync) {
    btnSync.onclick = async () => {
      btnSync.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size: 11px; margin-right: 4px;"></i> Memeriksa Dashboard...';
      const token = await tryAutoSyncFromOpenTabs();
      if (token) {
        btnSync.innerHTML = '<i class="fa-solid fa-check" style="font-size: 11px; margin-right: 4px;"></i> Berhasil Tersinkron!';
        setTimeout(() => {
          initAuthenticatedSession(token);
        }, 500);
      } else {
        btnSync.textContent = "Buka Dashboard Dahulu";
        chrome.tabs.create({ url: `${DASHBOARD_URL}` });
      }
    };
  }

  const btnLogin = document.getElementById("btnSideLogin");
  if (btnLogin) {
    btnLogin.onclick = async () => {
      const email = document.getElementById("sideEmail")?.value?.trim();
      const password = document.getElementById("sidePassword")?.value;
      const alertEl = document.getElementById("sideAuthAlert");

      if (!email || !password) {
        if (alertEl) {
          alertEl.textContent = "Email dan password wajib diisi.";
          alertEl.style.display = "block";
        }
        return;
      }

      btnLogin.disabled = true;
      btnLogin.textContent = "Masuk...";
      if (alertEl) alertEl.style.display = "none";

      try {
        const formParams = new URLSearchParams();
        formParams.append("username", email);
        formParams.append("password", password);

        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formParams.toString()
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Login gagal");
        }

        await chrome.storage.local.set({
          govconnect_token: data.access_token,
          govconnect_email: email
        });

        await initAuthenticatedSession(data.access_token);
      } catch (err) {
        if (alertEl) {
          alertEl.textContent = err.message || "Gagal masuk. Periksa email & password Anda.";
          alertEl.style.display = "block";
        }
      } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = "Masuk";
      }
    };
  }
}
