// Side Panel Script — GovConnect
// Workspace utama autofill sesuai PRD §9.2 dan Design System v2.0

const API_BASE = "http://127.0.0.1:8000/api/v1";
const DASHBOARD_URL = "http://localhost:5173/dashboard";

let cachedProfile = null;
let detectedFields = [];
let currentTab = null;
let customFieldLabels = {};

function processCustomFields(profile) {
  if (!profile) return;

  // Process Document Photos
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
  // 1. Cek koneksi backend riil
  await checkBackendHealth();

  // 2. Cek token atau auto-sinkron dari tab dashboard yang sedang terbuka
  let token = await getToken();
  if (!token) {
    token = await tryAutoSyncFromOpenTabs();
  }

  if (!token) {
    showScreen("screenAuth");
    setupAuthListeners();
    return;
  }

  // 3. User terautentikasi -> jalankan flow autofill
  await initAuthenticatedSession(token);
});

// ============================================================
// Segarkan Profil dari API Backend (Selalu Terkini & Tersinkron)
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

// Dengarkan perpindahan tab atau refresh halaman aktif agar otomatis update & sync profil
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const token = await getToken();
  if (!token) return;
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab) {
      currentTab = tab;
      updatePageHeader(tab);
      await refreshProfile();
      await detectPageFields();
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
    await detectPageFields();
  }
});

// Auto-sync profil saat window/panel mendapatkan fokus kembali dari tab lain (misal dari dashboard)
window.addEventListener("focus", async () => {
  const token = await getToken();
  if (token) {
    await refreshProfile();
    if (currentTab?.id && currentActiveScreen !== "screenResult") {
      await detectPageFields();
    }
  }
});

// ============================================================
// Cek Kesehatan Backend
// ============================================================
async function checkBackendHealth() {
  try {
    const res = await fetch("http://127.0.0.1:8000/", { method: "GET" });
    if (res.ok) {
      setApiStatus("online");
    } else {
      setApiStatus("error");
    }
  } catch (err) {
    setApiStatus("offline");
  }
}

// ============================================================
// Coba Ambil Token Otomatis dari Tab Web Dashboard yang Terbuka
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
        func: () => {
          return {
            token: localStorage.getItem("govconnect_token"),
            email: localStorage.getItem("govconnect_email")
          };
        }
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
    console.log("Auto-sync from open tabs:", err);
  }
  return null;
}

// ============================================================
// Setup Sesi Terautentikasi
// ============================================================
async function initAuthenticatedSession(token) {
  const profile = await refreshProfile();
  if (!profile) {
    setApiStatus("error");
    showStatus("Gagal memuat profil. Periksa koneksi backend.");
    return;
  }

  // Dapatkan tab aktif
  currentTab = await getActiveTab();
  if (currentTab) {
    updatePageHeader(currentTab);
  }

  // Deteksi field di halaman aktif
  await detectPageFields();

  // Setup event listener tombol
  setupMainListeners();
}

// ============================================================
// Auth Form Listener (Side Panel Inline Auth)
// ============================================================
function setupAuthListeners() {
  const btnLogin = document.getElementById("btnSideLogin");
  const btnSync = document.getElementById("btnAutoSyncTab");

  if (btnLogin) {
    btnLogin.onclick = async () => {
      const email = document.getElementById("sideEmail").value.trim();
      const password = document.getElementById("sidePassword").value;
      const alertEl = document.getElementById("sideAuthAlert");

      alertEl.style.display = "none";
      if (!email || !password) {
        alertEl.textContent = "Email dan password wajib diisi.";
        alertEl.style.display = "block";
        return;
      }

      btnLogin.disabled = true;
      btnLogin.textContent = "Memproses...";

      try {
        const body = new URLSearchParams({ username: email, password });
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString()
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Email atau password salah");
        }

        const data = await res.json();
        await chrome.storage.local.set({
          govconnect_token: data.access_token,
          govconnect_email: email
        });

        // Sukses login -> inisialisasi
        await initAuthenticatedSession(data.access_token);
      } catch (err) {
        alertEl.textContent = err.message || "Gagal masuk.";
        alertEl.style.display = "block";
      } finally {
        btnLogin.disabled = false;
        btnLogin.textContent = "Masuk";
      }
    };
  }

  if (btnSync) {
    btnSync.onclick = async () => {
      btnSync.textContent = "Mencari tab dashboard...";
      const token = await tryAutoSyncFromOpenTabs();
      if (token) {
        await initAuthenticatedSession(token);
      } else {
        const alertEl = document.getElementById("sideAuthAlert");
        alertEl.textContent = "Tidak ditemukan tab dashboard yang sedang login. Silakan login manual.";
        alertEl.style.display = "block";
        btnSync.textContent = "⚡ Sinkronkan dari Dashboard Aktif";
      }
    };
  }
}

function setupMainListeners() {
  const btnFill = document.getElementById("btnFill");
  if (btnFill) btnFill.onclick = executeAutofill;

  const btnRefill = document.getElementById("btnRefill");
  if (btnRefill) {
    btnRefill.onclick = () => {
      const btn = document.getElementById("btnFill");
      if (btn) {
        btn.textContent = "⚡ Isi Formulir Otomatis";
        btn.disabled = false;
      }
      showScreen("screenDetect");
      renderFieldList();
    };
  }

  const btnRetry = document.getElementById("btnRetryDetect");
  if (btnRetry) {
    btnRetry.onclick = async () => {
      currentTab = await getActiveTab();
      if (currentTab) updatePageHeader(currentTab);
      await refreshProfile();
      await detectPageFields();
    };
  }

  // Tombol Refresh Profil di Header
  const btnRefresh = document.getElementById("btnRefreshProfile");
  if (btnRefresh) {
    btnRefresh.onclick = async () => {
      btnRefresh.style.transform = "rotate(360deg)";
      btnRefresh.style.transition = "transform 0.5s ease";
      setTimeout(() => {
        btnRefresh.style.transform = "none";
        btnRefresh.style.transition = "none";
      }, 500);

      showStatus("Menyinkronkan profil dari dashboard...");
      await refreshProfile();
      await detectPageFields();
      showStatus("✓ Profil terbaru berhasil dimuat!");
      setTimeout(() => showStatus(""), 3000);
    };
  }

  // Tombol Pilih Semua
  const btnSelectAll = document.getElementById("btnSelectAll");
  if (btnSelectAll) {
    btnSelectAll.onclick = selectAllFields;
  }

  // Tombol Batal Pilih (Deselect All)
  const btnDeselectAll = document.getElementById("btnDeselectAll");
  if (btnDeselectAll) {
    btnDeselectAll.onclick = deselectAllFields;
  }

  const btnGoDash = document.getElementById("btnGoDashboard");
  if (btnGoDash) {
    btnGoDash.onclick = async () => {
      const activeToken = await getToken();
      const url = activeToken
        ? `${DASHBOARD_URL}#token=${encodeURIComponent(activeToken)}`
        : DASHBOARD_URL;
      chrome.tabs.create({ url });
    };
  }

  const toggleHidden = document.getElementById("toggleShowHidden");
  if (toggleHidden) {
    toggleHidden.onchange = () => {
      renderFieldList();
    };
  }

  // Toggle Mode 1-Klik Instan
  const toggleOneClick = document.getElementById("toggleOneClick");
  if (toggleOneClick) {
    chrome.storage.local.get("govconnect_one_click_mode", (res) => {
      const isOneClick = res.govconnect_one_click_mode !== false;
      toggleOneClick.checked = isOneClick;
      updateModeBarUI(isOneClick);
    });

    toggleOneClick.addEventListener("change", async (e) => {
      const isEnabled = e.target.checked;
      await chrome.storage.local.set({ govconnect_one_click_mode: isEnabled });
      chrome.runtime.sendMessage({ action: "SET_ONE_CLICK_MODE", enabled: isEnabled }).catch(() => {});
      updateModeBarUI(isEnabled);
    });
  }
}

function updateModeBarUI(isEnabled) {
  const icon = document.getElementById("modeIcon");
  const title = document.getElementById("modeTitle");
  const desc = document.getElementById("modeDesc");
  if (icon && title && desc) {
    if (isEnabled) {
      icon.textContent = "⚡";
      title.textContent = "Mode 1-Klik: Aktif";
      desc.textContent = "Klik ikon di toolbar langsung mengisi form";
    } else {
      icon.textContent = "📋";
      title.textContent = "Mode Panel: Aktif";
      desc.textContent = "Klik ikon di toolbar membuka panel samping ini";
    }
  }
}

// ============================================================
// Dapatkan Tab Aktif
// ============================================================
async function getActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tabs && tabs.length > 0) return tabs[0];
    const fallback = await chrome.tabs.query({ active: true, currentWindow: true });
    return fallback[0] || null;
  } catch {
    return null;
  }
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

let allDetectedResult = null;
let currentActiveScreen = "screenDetect";
let isAutofillingInProgress = false;

// Dengarkan notifikasi perubahan form dari content script (misal ganti dropdown) atau pembaruan profil
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "ONE_CLICK_MODE_CHANGED") {
    const toggle = document.getElementById("toggleOneClick");
    if (toggle) {
      toggle.checked = message.isOneClick;
      updateModeBarUI(message.isOneClick);
    }
  }

  if (message.action === "PROFILE_UPDATED") {
    await refreshProfile();
    if (currentActiveScreen !== "screenResult") {
      await detectPageFields();
    }
    showStatus("✓ Data profil berhasil diperbarui!");
    setTimeout(() => showStatus(""), 3000);
  }

  if (message.action === "FORM_UPDATED") {
    // JANGAN lakukan re-detect otomatis jika sedang menampilkan hasil (screenResult) atau sedang proses autofill
    if (currentActiveScreen === "screenResult" || isAutofillingInProgress) {
      return;
    }
    detectPageFields();
  }
});

// ============================================================
// Deteksi field dari content script
// ============================================================
async function detectPageFields() {
  currentTab = await getActiveTab();
  if (!currentTab?.id) {
    showScreen("screenUnsupported");
    return;
  }

  // Jangan scan halaman internal chrome
  if (currentTab.url?.startsWith("chrome://") || currentTab.url?.startsWith("chrome-extension://")) {
    showScreen("screenUnsupported");
    return;
  }

  try {
    // Pastikan content script ter-inject
    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ["content_script.js"]
    }).catch(() => {});

    const result = await sendMessageToTab(currentTab.id, {
      action: "DETECT_FIELDS",
      profile: cachedProfile
    });

    if (!result || result.total === 0 || (result.matched === 0 && result.hiddenMatchedCount === 0)) {
      showScreen("screenUnsupported");
      return;
    }

    allDetectedResult = result;
    renderFieldList();
    showScreen("screenDetect");

  } catch (err) {
    showScreen("screenUnsupported");
  }
}

// ============================================================
// Render daftar field dengan checklist
// ============================================================
// ============================================================
// State Manajemen Pilihan Checkbox (Preserves Selection)
// ============================================================
let userSelectedMap = {};

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
      btnEl.textContent = "⚡ Pilih Minimal 1 Field";
    } else {
      btnEl.disabled = false;
      btnEl.textContent = `⚡ Isi ${checkedCount} Kolom Formulir`;
    }
  }
}

// ============================================================
// Render daftar field dengan checklist
// ============================================================
function renderFieldList() {
  const container = document.getElementById("fieldList");
  const noticeEl = document.getElementById("dynamicFormNotice");
  const toggleHidden = document.getElementById("toggleShowHidden");
  const detectCountEl = document.getElementById("detectCount");

  container.innerHTML = "";
  if (!allDetectedResult) return;

  const showAll = toggleHidden ? toggleHidden.checked : false;
  const allMatched = (allDetectedResult.fields || []).filter(f => f.profileKey);
  const visibleMatched = allMatched.filter(f => f.isVisible);
  const hiddenMatched = allMatched.filter(f => !f.isVisible);

  // Filter field yang akan ditampilkan:
  // Jika showAll dicentang, tampilkan semua (termasuk yang tersembunyi)
  // Jika tidak, HANYA tampilkan field yang benar-benar terlihat di layar (visible)
  detectedFields = showAll ? allMatched : visibleMatched;

  // Update counter
  if (detectCountEl) {
    if (!showAll && visibleMatched.length > 0 && hiddenMatched.length > 0) {
      detectCountEl.textContent = `${visibleMatched.length} field terlihat (${hiddenMatched.length} tersembunyi)`;
    } else if (!showAll && visibleMatched.length === 0 && hiddenMatched.length > 0) {
      detectCountEl.textContent = `0 field terlihat (${hiddenMatched.length} tersembunyi di web)`;
    } else {
      detectCountEl.textContent = `${detectedFields.length} field`;
    }
  }

  // Tampilkan notice formulir dinamis jika ada field tersembunyi
  if (noticeEl) {
    if (hiddenMatched.length > 0) {
      if (visibleMatched.length === 0) {
        noticeEl.innerHTML = `💡 <b>Formulir Bersyarat:</b> Halaman web menyembunyikan <b>${hiddenMatched.length} kolom input</b>. Silakan pilih opsi pada formulir web (seperti <i>Program Bantuan yang Diajukan</i>) agar kolom isian muncul di layar.`;
      } else {
        noticeEl.innerHTML = `💡 <b>${visibleMatched.length} field terlihat di layar</b> (${hiddenMatched.length} field lainnya masih tersembunyi di web).`;
      }
      noticeEl.style.display = "block";
    } else {
      noticeEl.style.display = "none";
    }
  }

  if (detectedFields.length === 0) {
    if (hiddenMatched.length > 0) {
      container.innerHTML = `
        <div style="padding: 20px 14px; font-size: 12px; color: #475569; text-align: center; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px;">
          <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
          <div style="font-weight: 600; color: #0F172A; margin-bottom: 4px; font-size: 13px;">Kolom Isian Belum Muncul di Web</div>
          <p style="margin: 0 0 12px 0; color: #64748B; font-size: 11px; line-height: 1.5;">
            Website ini menyembunyikan formulir sampai Anda memilih opsi pada dropdown web (misal: <b>Program Bantuan</b>).<br>
            Pilihlah salah satu program pada formulir di sebelah kiri.
          </p>
          <button type="button" id="btnForceShowAll" style="background: #FFFFFF; border: 1px solid #CBD5E1; color: #2563EB; font-weight: 600; font-size: 11px; padding: 6px 12px; border-radius: 6px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            Tampilkan ${hiddenMatched.length} Field yang Masih Tersembunyi
          </button>
        </div>
      `;
      const btnForce = document.getElementById("btnForceShowAll");
      if (btnForce) {
        btnForce.onclick = () => {
          if (toggleHidden) toggleHidden.checked = true;
          renderFieldList();
        };
      }
    } else {
      container.innerHTML = `<div style="padding: 16px; font-size: 12px; color: #64748B; text-align: center;">Tidak ada field yang cocok ditemukan.</div>`;
    }
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

    // Periksa status centang: gunakan preferensi user jika sudah pernah diklik, default centang jika profil ada nilai
    let isChecked = false;
    if (uid in userSelectedMap) {
      isChecked = userSelectedMap[uid] && hasValue;
    } else {
      isChecked = hasValue;
      userSelectedMap[uid] = isChecked;
    }

    const item = document.createElement("div");
    item.className = "field-item";
    item.dataset.uid = uid;
    item.dataset.index = i;

    item.innerHTML = `
      <input type="checkbox" id="chk_${i}" data-index="${i}" data-uid="${uid}" ${isChecked ? "checked" : ""} ${!hasValue ? "disabled" : ""}>
      <label for="chk_${i}" class="field-info" style="cursor: pointer; flex: 1; min-width: 0;">
        <div class="field-name">
          ${field.name || field.id || "(field)"}
          ${!isVis ? `<span style="font-size: 9px; color: #D97706; margin-left: 4px; font-weight: 500;">(Tersembunyi di Web)</span>` : ""}
        </div>
        <div class="field-profile">${formatFieldLabel(field.profileKey)} ${hasValue ? `→ <b>${truncate(profileValue, 22)}</b>` : "— belum ada di profil"}</div>
      </label>
      <span class="field-badge ${hasValue ? "fb-matched" : "fb-notfound"}">${hasValue ? "✓ Matched" : "○ Kosong"}</span>
    `;

    // Interaktivitas: sorot field di halaman web saat kursor diarahkan ke daftar di Side Panel
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

    // Checkbox change listener
    const chk = item.querySelector("input[type=checkbox]");
    if (chk) {
      chk.addEventListener("change", (e) => {
        e.stopPropagation();
        userSelectedMap[uid] = chk.checked;
        updateSelectionUI();
        syncMarkersWithCheckedFields();
      });
    }

    // Klik pada baris container (di luar input dan label bawaan)
    item.addEventListener("click", (e) => {
      if (e.target.tagName.toLowerCase() === "input" || e.target.closest("label")) {
        return;
      }
      if (chk && !chk.disabled) {
        chk.checked = !chk.checked;
        userSelectedMap[uid] = chk.checked;
        updateSelectionUI();
        syncMarkersWithCheckedFields();
      }
    });

    container.appendChild(item);
  });

  updateSelectionUI();
  syncMarkersWithCheckedFields();
}

// Sinkronkan penanda visual kolom pada tab aktif dengan daftar checkbox yang dicentang
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
// Eksekusi autofill
// ============================================================
async function executeAutofill() {
  const btn = document.getElementById("btnFill");
  isAutofillingInProgress = true;
  btn.disabled = true;
  btn.textContent = "Mengisi form...";

  const checkedInputs = Array.from(
    document.querySelectorAll("#fieldList input[type=checkbox]:checked")
  );

  if (checkedInputs.length === 0) {
    btn.textContent = "⚡ Pilih Minimal 1 Field";
    btn.disabled = true;
    isAutofillingInProgress = false;
    showStatus("Pilih minimal satu field terlebih dahulu.");
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
    }, 4000);

    if (!result) throw new Error("Tidak ada respons dari halaman");

    renderResult(result);
    showScreen("screenResult");

    // Catat log aktivitas ke API (background async, tidak memblokir UI)
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
        console.warn("Gagal menyimpan riwayat aktivitas:", logErr);
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
// Render hasil autofill (State 3)
// ============================================================
function renderResult(result) {
  const statusEl = document.getElementById("resultStatus");
  if (result.status === "success") {
    statusEl.textContent = "✓ Selesai Sempurna";
    statusEl.className = "result-val val-success";
  } else if (result.status === "partial") {
    statusEl.textContent = "⚠ Sebagian Terisi";
    statusEl.className = "result-val val-partial";
  } else {
    statusEl.textContent = "✕ Gagal";
    statusEl.className = "result-val val-failed";
  }

  document.getElementById("resultFilled").textContent = `${result.count} field`;
  const notFound = (result.fields || []).filter(f => f.status !== "filled").length;
  document.getElementById("resultSkipped").textContent = `${notFound} field`;

  const container = document.getElementById("resultFields");
  container.innerHTML = "";
  (result.fields || []).forEach(f => {
    const div = document.createElement("div");
    div.className = "rfield";

    const icon = f.status === "filled" ? "✓" : f.status === "skipped" ? "—" : "○";
    const statusClass = f.status === "filled" ? "rs-filled" : f.status === "skipped" ? "rs-skipped" : "rs-notfound";
    const statusText = f.status === "filled" ? "Terisi" : f.status === "skipped" ? "Dilewati" : "Tidak ada";

    div.innerHTML = `
      <span class="rfield-icon ${f.status === "filled" ? "val-success" : "val-neutral"}">${icon}</span>
      <span class="rfield-name">${f.id || "(field)"}</span>
      <span class="rfield-status ${statusClass}">${statusText}</span>
    `;
    container.appendChild(div);
  });
}

// ============================================================
// Helper functions
// ============================================================
function showScreen(id) {
  currentActiveScreen = id;
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(id);
  if (target) target.classList.add("active");
}

function setApiStatus(status) {
  const el = document.getElementById("apiStatus");
  if (!el) return;
  if (status === "online") {
    el.textContent = "Online";
    el.className = "badge badge-connected";
  } else if (status === "warning") {
    el.textContent = "Perlu Login";
    el.className = "badge badge-warning";
  } else {
    el.textContent = "Offline";
    el.className = "badge badge-error";
  }
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
    nik: "NIK",
    full_name: "Nama Lengkap",
    birth_date: "Tgl Lahir",
    birth_place: "Tempat Lahir",
    gender: "Jenis Kelamin",
    religion: "Agama",
    marital_status: "Status Nikah",
    blood_type: "Gol. Darah",
    address: "Alamat",
    province: "Provinsi",
    city: "Kota/Kabupaten",
    district: "Kecamatan",
    village: "Kelurahan/Desa",
    postal_code: "Kode Pos",
    phone: "Telepon/WA",
    email: "Email",
    nisn: "NISN",
    institution: "Institusi/Sekolah",
    student_id: "NIM",
    occupation: "Pekerjaan",
    organization: "Instansi / Perusahaan",
    work_address: "Alamat Kantor",
    education_level: "Pendidikan",
    mother_name: "Nama Ibu",
    father_name: "Nama Ayah",
    emergency_contact_name: "Kontak Darurat",
    emergency_contact_phone: "No. Darurat",
    npwp: "NPWP",
    bpjs_number: "BPJS",
    foto_ktp: "Foto e-KTP (Berkas)",
    foto_kk: "Foto KK (Berkas)",
    pasfoto: "Pasfoto Diri (Berkas)",
    foto_npwp: "Foto Kartu NPWP (Berkas)",
    foto_ijazah: "Foto Ijazah (Berkas)"
  };
  return map[key] || customFieldLabels[key] || key;
}

function sendMessageToTab(tabId, message, timeoutMs = 4000) {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        console.warn("sendMessageToTab timeout for action:", message?.action);
        resolve(null);
      }
    }, timeoutMs);

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        if (chrome.runtime.lastError) {
          console.warn("sendMessageToTab lastError:", chrome.runtime.lastError.message);
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
