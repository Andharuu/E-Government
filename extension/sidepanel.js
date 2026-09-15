// Side Panel Script — GovConnect
// Workspace utama autofill sesuai PRD §9.2

const API_BASE = "http://127.0.0.1:8000/api/v1";
let cachedProfile = null;
let detectedFields = [];
let currentTab = null;

// ============================================================
// Inisialisasi
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  const token = await getToken();
  if (!token) {
    // Tidak ada sesi — arahkan ke popup untuk login
    showStatus("Silakan login melalui popup ekstensi terlebih dahulu.");
    setApiStatus(false);
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  if (tab?.url) {
    try {
      const url = new URL(tab.url);
      document.getElementById("pageTitle").textContent = url.hostname;
    } catch {
      document.getElementById("pageTitle").textContent = "Halaman aktif";
    }
  }

  // Fetch profil dari API
  try {
    const res = await fetch(`${API_BASE}/profile/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Unauthorized");
    cachedProfile = await res.json();
    setApiStatus(true);
  } catch (err) {
    setApiStatus(false);
    showStatus("Gagal memuat profil. Periksa koneksi server.");
    return;
  }

  // Deteksi field pada halaman aktif
  await detectPageFields();

  // Event listeners
  document.getElementById("btnFill").addEventListener("click", executeAutofill);
  document.getElementById("btnRefill").addEventListener("click", () => {
    showScreen("screenDetect");
    renderFieldList();
  });
});

// ============================================================
// Deteksi field dari content script
// ============================================================
async function detectPageFields() {
  if (!currentTab?.id) {
    showScreen("screenUnsupported");
    return;
  }

  try {
    // Pastikan content script ter-inject
    await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      files: ["content_script.js"]
    }).catch(() => {});

    const result = await sendMessageToTab(currentTab.id, { action: "DETECT_FIELDS" });

    if (!result || result.total === 0 || result.matched === 0) {
      showScreen("screenUnsupported");
      return;
    }

    detectedFields = result.fields.filter(f => f.profileKey); // hanya yang matched
    document.getElementById("detectCount").textContent = `${result.matched} field`;
    renderFieldList();
    showScreen("screenDetect");

  } catch (err) {
    showScreen("screenUnsupported");
  }
}

// ============================================================
// Render daftar field dengan checkbox
// ============================================================
function renderFieldList() {
  const container = document.getElementById("fieldList");
  container.innerHTML = "";

  if (detectedFields.length === 0) {
    container.innerHTML = `<div style="padding: 12px; font-size: 12px; color: #64748b; text-align: center;">Tidak ada field yang cocok ditemukan.</div>`;
    document.getElementById("btnFill").disabled = true;
    return;
  }

  detectedFields.forEach((field, i) => {
    const item = document.createElement("label");
    item.className = "field-item";
    item.htmlFor = `chk_${i}`;

    const profileValue = cachedProfile[field.profileKey];
    const hasValue = !!(profileValue && profileValue.toString().trim() !== "");

    item.innerHTML = `
      <input type="checkbox" id="chk_${i}" data-index="${i}" ${hasValue ? "checked" : ""} ${!hasValue ? "disabled" : ""}>
      <div style="flex:1; min-width: 0;">
        <div class="field-name">${field.id || field.name || "(no id)"}</div>
        <div class="field-profile">${field.profileKey} ${hasValue ? `→ ${truncate(profileValue, 20)}` : "— data tidak tersedia"}</div>
      </div>
      <span class="field-badge ${hasValue ? "fb-matched" : "fb-notfound"}">${hasValue ? "✓" : "○"}</span>
    `;
    container.appendChild(item);
  });

  // Enable tombol jika ada minimal 1 yang bisa diisi
  const anyFillable = detectedFields.some(f => {
    const v = cachedProfile[f.profileKey];
    return v && v.toString().trim() !== "";
  });
  document.getElementById("btnFill").disabled = !anyFillable;
}

// ============================================================
// Eksekusi autofill
// ============================================================
async function executeAutofill() {
  const btn = document.getElementById("btnFill");
  btn.disabled = true;
  btn.textContent = "Mengisi...";

  // Kumpulkan field yang dicentang
  const checkedIndices = Array.from(
    document.querySelectorAll("#fieldList input[type=checkbox]:checked")
  ).map(el => parseInt(el.dataset.index));

  if (checkedIndices.length === 0) {
    btn.textContent = "⚡ Fill Selected Fields";
    btn.disabled = false;
    showStatus("Pilih minimal satu field terlebih dahulu.");
    return;
  }

  // Buat profil yang hanya berisi field yang dicentang
  const selectedProfile = {};
  checkedIndices.forEach(i => {
    const field = detectedFields[i];
    if (field && cachedProfile[field.profileKey] !== undefined) {
      selectedProfile[field.profileKey] = cachedProfile[field.profileKey];
    }
  });

  try {
    const result = await sendMessageToTab(currentTab.id, {
      action: "EXECUTE_AUTOFILL",
      profile: selectedProfile
    });

    if (!result) throw new Error("Tidak ada respons");

    // Tampilkan hasil
    renderResult(result);
    showScreen("screenResult");

    // Catat aktivitas ke API
    const token = await getToken();
    if (token) {
      const domain = currentTab?.url ? new URL(currentTab.url).hostname : "";
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
          status: result.status
        })
      });
    }

  } catch (err) {
    showStatus("Gagal mengisi form. Refresh halaman target dan coba lagi.");
    btn.disabled = false;
    btn.textContent = "⚡ Fill Selected Fields";
  }
}

// ============================================================
// Render hasil autofill (State 3)
// ============================================================
function renderResult(result) {
  // Summary
  const statusEl = document.getElementById("resultStatus");
  if (result.status === "success") {
    statusEl.textContent = "✓ Berhasil";
    statusEl.className = "result-val val-success";
  } else if (result.status === "partial") {
    statusEl.textContent = "⚠ Sebagian";
    statusEl.className = "result-val val-partial";
  } else {
    statusEl.textContent = "✕ Gagal";
    statusEl.className = "result-val val-failed";
  }

  document.getElementById("resultFilled").textContent = result.count;
  const notFound = (result.fields || []).filter(f => f.status !== "filled").length;
  document.getElementById("resultSkipped").textContent = notFound;

  // Per-field detail
  const container = document.getElementById("resultFields");
  container.innerHTML = "";
  (result.fields || []).forEach(f => {
    const div = document.createElement("div");
    div.className = "rfield";

    const icon = f.status === "filled" ? "✓" : f.status === "skipped" ? "—" : "○";
    const statusClass = f.status === "filled" ? "rs-filled" : f.status === "skipped" ? "rs-skipped" : "rs-notfound";
    const statusText = f.status === "filled" ? "Terisi" : f.status === "skipped" ? "Dilewati" : "Tidak ditemukan";

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
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function setApiStatus(online) {
  const el = document.getElementById("apiStatus");
  if (online) {
    el.textContent = "Online";
    el.className = "badge badge-connected";
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
  return str.length > n ? str.substring(0, n) + "…" : str;
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) resolve(null);
      else resolve(response);
    });
  });
}

function getToken() {
  return new Promise(resolve => {
    chrome.storage.local.get("govconnect_token", r => resolve(r.govconnect_token || null));
  });
}
