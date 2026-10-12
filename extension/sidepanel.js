// Side Panel Script — GovConnect
// Asisten Autofill Cerdas dengan Transisi Fluid Scanning & Sinkronisasi Real-Time

const API_BASE = "http://127.0.0.1:8000/api/v1";
const DASHBOARD_URL = "http://localhost:5173/dashboard";

let cachedProfile = null;
let detectedFields = [];
let currentTab = null;
let customFieldLabels = {};
let allDetectedResult = null;
let currentActiveScreen = "screenDetect";
let isAutofillingInProgress = false;
let userSelectedMap = {};

// ============================================================
// Memproses Custom Fields & Foto Dokumen
// ============================================================
function processCustomFields(profile) {
  if (!profile) return;

  if (profile.document_photos) {
    try {
      const docs = typeof profile.document_photos === "string"
        ? JSON.parse(profile.document_photos)
        : profile.document_photos;

      if (docs.ktp?.data) profile.foto_ktp = docs.ktp.name || "ktp.jpg";
      if (docs.kk?.data) profile.foto_kk = docs.kk.name || "kk.jpg";
      if (docs.pasfoto?.data) profile.pasfoto = docs.pasfoto.name || "pasfoto.jpg";
      if (docs.npwp_card?.data) profile.foto_npwp = docs.npwp_card.name || "npwp.jpg";
      if (docs.ijazah?.data) profile.foto_ijazah = docs.ijazah.name || "ijazah.jpg";
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
        profile[item.key] = item.value;
        customFieldLabels[item.key] = item.label || item.key;
      }
    });
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
      const token = await getToken();
      const url = token
        ? `${DASHBOARD_URL}#token=${encodeURIComponent(token)}`
        : DASHBOARD_URL;
      chrome.tabs.create({ url });
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
    await chrome.storage.local.set({ govconnect_cached_profile: cachedProfile });
    setApiStatus("online");
    return cachedProfile;
  } catch (err) {
    console.warn("GovConnect: Peringatan saat menyegarkan profil:", err);
    return cachedProfile;
  }
}

// Dengarkan perpindahan tab atau update halaman aktif
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
    detectPageFieldsWithFluidScan();
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
async function detectPageFieldsWithFluidScan() {
  currentTab = await getActiveTab();
  if (!currentTab?.id) {
    showScreen("screenUnsupported");
    return;
  }

  if (currentTab.url?.startsWith("chrome://") || currentTab.url?.startsWith("chrome-extension://")) {
    showScreen("screenUnsupported");
    return;
  }

  updatePageHeader(currentTab);

  // 1. Tampilkan layar pemindaian fluid dengan animasi progress & jeda elegan
  showScreen("screenScanning");
  setScanPhase("form", "Memindai Formulir Web...", "Menganalisis elemen input formulir dan atribut semantik...", "45%");

  // Jeda fluid awal (200ms)
  await new Promise(r => setTimeout(r, 200));

  try {
    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ["content_script.js"]
    }).catch(() => {});

    setScanPhase("form", "Mencocokkan Profil Kependudukan...", "Memvalidasi NIK, nama lengkap, dan berkas foto terenkripsi...", "80%");

    // Jeda transisi kedua (250ms)
    await new Promise(r => setTimeout(r, 250));

    const result = await sendMessageToTab(currentTab.id, {
      action: "DETECT_FIELDS",
      profile: cachedProfile
    });

    setScanPhase("form", "Pemindaian Selesai", "Menyiapkan daftar kolom formulir...", "100%");

    // Jeda akhir agar transisi terasa halus sebelum layar beralih (200ms)
    await new Promise(r => setTimeout(r, 200));

    if (!result || result.total === 0 || (result.matched === 0 && result.hiddenMatchedCount === 0)) {
      showScreen("screenUnsupported");
      return;
    }

    allDetectedResult = result;
    renderFieldList();
    showScreen("screenDetect");

  } catch (err) {
    console.warn("Scan failed:", err);
    showScreen("screenUnsupported");
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
    summaryEl.textContent = `${checkedCount} dari ${detectedFields.length} dipilih`;
  }

  const btnEl = document.getElementById("btnFill");
  if (btnEl) {
    if (checkedCount === 0) {
      btnEl.disabled = true;
      btnEl.innerHTML = '<i class="fa-regular fa-file-lines" style="margin-right: 6px;"></i> Pilih Minimal 1 Kolom';
    } else {
      btnEl.disabled = false;
      btnEl.innerHTML = `<i class="fa-solid fa-bolt" style="margin-right: 6px;"></i> Isi ${checkedCount} Kolom Formulir`;
    }
  }
}

// ============================================================
// Render daftar field dengan transisi staggered fluid
// ============================================================
function renderFieldList() {
  const container = document.getElementById("fieldList");
  const detectCountEl = document.getElementById("detectCount");

  container.innerHTML = "";
  if (!allDetectedResult) return;

  const allMatched = (allDetectedResult.fields || []).filter(f => f.profileKey);

  detectedFields = allMatched;

  if (detectCountEl) {
    detectCountEl.textContent = `${detectedFields.length} Kolom Terdeteksi`;
  }

  if (detectedFields.length === 0) {
    container.innerHTML = `<div style="padding: 24px; font-size: 12px; color: #64748B; text-align: center;">Tidak ada kolom yang cocok dengan profil.</div>`;
    const btnFill = document.getElementById("btnFill");
    if (btnFill) btnFill.disabled = true;
    updateSelectionUI();
    syncMarkersWithCheckedFields();
    return;
  }

  detectedFields.forEach((field, i) => {
    const uid = getFieldUid(field, i);
    const profileValue = cachedProfile ? cachedProfile[field.profileKey] : null;
    const hasValue = !!(profileValue && profileValue.toString().trim() !== "");
    const isVis = field.isVisible;

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
      <label for="chk_${i}" class="field-info">
        <div class="field-name">
          <span>${field.name || field.id || formatFieldLabel(field.profileKey) || "(field)"}</span>
        </div>
        <div class="field-profile-preview">
          ${formatFieldLabel(field.profileKey)}: ${hasValue ? `<span class="field-profile-val">${escapeHtml(truncate(profileValue, 24))}</span>` : "<span style='color: #94A3B8;'>data belum terisi di profil</span>"}
        </div>
      </label>
      <span class="badge-tag ${hasValue ? "tag-matched" : "tag-empty"}">
        ${hasValue ? '<i class="fa-regular fa-circle-check" style="font-size: 8.5px; margin-right: 3px;"></i>Cocok' : '<i class="fa-solid fa-xmark" style="font-size: 8px; margin-right: 2px;"></i>Kosong'}
      </span>
    `;

    // Highlight pada hover di tab web
    item.addEventListener("mouseenter", () => {
      if (currentTab?.id && field.profileKey) {
        sendMessageToTab(currentTab.id, {
          action: "HOVER_FIELD",
          profileKey: field.profileKey,
          name: field.name,
          id: field.id
        });
      }
    });

    item.addEventListener("mouseleave", () => {
      if (currentTab?.id) {
        sendMessageToTab(currentTab.id, { action: "UNHOVER_FIELD" });
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

    item.addEventListener("click", (e) => {
      if (e.target.tagName.toLowerCase() === "input" || e.target.closest("label")) {
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

  updateSelectionUI();
  syncMarkersWithCheckedFields();
}

function syncMarkersWithCheckedFields() {
  if (!currentTab?.id) return;
  const checkedInputs = document.querySelectorAll("#fieldList input[type=checkbox]:checked");
  const activeKeys = Array.from(checkedInputs).map(input => {
    const idx = parseInt(input.dataset.index);
    return detectedFields[idx]?.profileKey;
  }).filter(Boolean);

  sendMessageToTab(currentTab.id, {
    action: "UPDATE_ACTIVE_MARKERS",
    activeKeys: activeKeys,
    profile: cachedProfile
  });
}

// ============================================================
// Eksekusi Autofill dengan Transisi & Animasi Pengisian Fluid
// ============================================================
async function executeAutofill() {
  const btn = document.getElementById("btnFill");
  isAutofillingInProgress = true;
  btn.innerHTML = `<i class="fa-solid fa-rotate-right" style="margin-right: 6px; display: inline-block; animation: spin 0.8s linear infinite;"></i> Mengisi Formulir...`;

  const checkedInputs = Array.from(
    document.querySelectorAll("#fieldList input[type=checkbox]:checked")
  );

  if (checkedInputs.length === 0) {
    btn.textContent = "Pilih Minimal 1 Kolom";
    btn.disabled = true;
    isAutofillingInProgress = false;
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

  try {
    if (currentTab?.id) {
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        files: ["content_script.js"]
      }).catch(() => {});
    }

    const result = await sendMessageToTab(currentTab.id, {
      action: "EXECUTE_AUTOFILL",
      profile: selectedProfile,
      targetFields: targetFields
    }, 15000);

    if (!result) throw new Error("Tidak ada respons dari halaman");

    renderResult(result);
    showScreen("screenResult");

    // Catat log aktivitas ke API
    const token = await getToken();
    if (token) {
      try {
        let domain = "";
        if (currentTab?.url) {
          try {
            const parsed = new URL(currentTab.url);
            domain = parsed.protocol === "file:" ? "Local File (HTML)" : (parsed.hostname || "");
          } catch {
            domain = "";
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
            target_url: currentTab?.url || "",
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
    if (btn) {
      btn.disabled = false;
      btn.textContent = "⚡ Isi Formulir Otomatis";
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
    listFilled.innerHTML = `<div style="font-size: 11px; color: #94A3B8; padding: 4px 6px;">Tidak ada kolom yang terisi</div>`;
  } else {
    filledItems.forEach(item => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; background: #F0FDF4; border: 1px solid #DCFCE7; border-radius: 8px;";
      row.innerHTML = `
        <span style="font-size: 11.5px; font-weight: 600; color: #166534; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.name)}</span>
        <span style="font-size: 11px; color: #15803D; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${escapeHtml(truncate(item.val || "Terisi", 20))}</span>
      `;
      listFilled.appendChild(row);
    });
  }

  // 2. Kolom Terlewati / Tanpa Data
  if (skippedItems.length === 0) {
    listSkipped.innerHTML = `<div style="font-size: 11px; color: #94A3B8; padding: 4px 6px;">Tidak ada kolom yang terlewati</div>`;
  } else {
    skippedItems.forEach(item => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; background: #FFFBEB; border: 1px solid #FEF3C7; border-radius: 8px;";
      row.innerHTML = `
        <span style="font-size: 11.5px; font-weight: 500; color: #92400E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.name)}</span>
        <span style="font-size: 10.5px; color: #B45309; font-weight: 500;">${item.hasVal ? "Tidak dipilih" : "Data kosong"}</span>
      `;
      listSkipped.appendChild(row);
    });
  }

  // 3. Kolom Gagal Diisi
  if (failedItems.length > 0) {
    if (failedSection) failedSection.style.display = "block";
    failedItems.forEach(item => {
      const row = document.createElement("div");
      row.style.cssText = "display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px; background: #FEF2F2; border: 1px solid #FEE2E2; border-radius: 8px;";
      row.innerHTML = `
        <span style="font-size: 11.5px; font-weight: 600; color: #991B1B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.name)}</span>
        <span style="font-size: 10.5px; color: #DC2626; font-weight: 500;">Gagal disuntik</span>
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
      const isHidden = content.style.display === "none";
      content.style.display = isHidden ? "block" : "none";
      if (label) label.textContent = isHidden ? "Sembunyikan" : "Tampilkan";
      if (chevron) chevron.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
    });
  }
}

// ============================================================
// Layar & Status Helper
// ============================================================
function showScreen(id) {
  currentActiveScreen = id;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
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
  return s.length > n ? s.substring(0, n) + "…" : s;
}

function formatFieldLabel(key) {
  const map = {
    nik: "NIK (KTP)",
    full_name: "Nama Lengkap",
    first_name: "Nama Depan",
    birth_date: "Tgl Lahir",
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

function sendMessageToTab(tabId, message, timeoutMs = 4000) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        resolve(null);
      }
    }, timeoutMs);

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(response);
        }
      }
    });
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
    const tabs = await chrome.tabs.query({});
    const dashboardTab = tabs.find(t =>
      t.url && (t.url.includes("localhost:5173") || t.url.includes("127.0.0.1:5173"))
    );

    if (dashboardTab?.id) {
      const results = await chrome.scripting.executeScript({
        target: { tabId: dashboardTab.id },
        func: () => ({
          token: localStorage.getItem("govconnect_token"),
          email: localStorage.getItem("govconnect_email")
        })
      });

      const extracted = results?.[0]?.result;
      if (extracted?.token) {
        await chrome.storage.local.set({
          govconnect_token: extracted.token,
          govconnect_email: extracted.email || ""
        });
        return extracted.token;
      }
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
      btnSync.textContent = "⏳ Memeriksa Dashboard...";
      const token = await tryAutoSyncFromOpenTabs();
      if (token) {
        btnSync.textContent = "✓ Berhasil Tersinkron!";
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
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
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
