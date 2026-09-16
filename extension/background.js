// Background Service Worker — GovConnect
// Mendukung Mode 1-Klik Instan (One-Click Autofill) & Mode Panel Samping

const API_BASE = "http://127.0.0.1:8000/api/v1";
const DASHBOARD_URL = "http://localhost:5173/dashboard";

// ============================================================
// Matikan openPanelOnActionClick agar chrome.action.onClicked BISA TERPANGGIL
// ============================================================
function resetPanelBehavior() {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }
}

resetPanelBehavior();

chrome.runtime.onInstalled.addListener(() => {
  resetPanelBehavior();
  setupContextMenus();
  updateActionBehavior();
});

chrome.runtime.onStartup.addListener(() => {
  resetPanelBehavior();
  updateActionBehavior();
});

// ============================================================
// Inisialisasi Menu Klik Kanan
// ============================================================
async function setupContextMenus() {
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.storage.local.get("govconnect_one_click_mode", (res) => {
        const isOneClick = res.govconnect_one_click_mode !== false; // Default: true

        chrome.contextMenus.create({
          id: "govconnect_toggle_one_click",
          title: `⚡ Mode 1-Klik Instan: ${isOneClick ? "AKTIF" : "NONAKTIF"} (Klik untuk ubah)`,
          contexts: ["action"]
        });

        chrome.contextMenus.create({
          id: "govconnect_open_sidepanel",
          title: "📋 Buka Panel Samping GovConnect",
          contexts: ["action", "page"]
        });

        chrome.contextMenus.create({
          id: "govconnect_open_dashboard",
          title: "🌐 Buka Dashboard Web GovConnect",
          contexts: ["action", "page"]
        });
      });
    });
  } catch (err) {
    console.warn("Context menu setup warning:", err);
  }
}

// ============================================================
// Update Label & Tooltip Action Toolbar
// ============================================================
async function updateActionBehavior() {
  const res = await chrome.storage.local.get("govconnect_one_click_mode");
  const isOneClick = res.govconnect_one_click_mode !== false; // default true

  chrome.action.setTitle({
    title: isOneClick
      ? "GovConnect — ⚡ Mode 1-Klik Aktif (Klik untuk mengisi form langsung)"
      : "GovConnect — 📋 Mode Panel (Klik untuk membuka panel samping)"
  });

  chrome.contextMenus.update("govconnect_toggle_one_click", {
    title: `⚡ Mode 1-Klik Instan: ${isOneClick ? "AKTIF" : "NONAKTIF"} (Klik untuk ubah)`
  }).catch(() => {});
}

// ============================================================
// Klik Kanan Context Menu Handler
// ============================================================
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "govconnect_toggle_one_click") {
    const res = await chrome.storage.local.get("govconnect_one_click_mode");
    const newMode = !(res.govconnect_one_click_mode !== false);
    await chrome.storage.local.set({ govconnect_one_click_mode: newMode });
    await updateActionBehavior();
    notifyTabsModeChanged(newMode);
  } else if (info.menuItemId === "govconnect_open_sidepanel") {
    if (tab && tab.id) {
      chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    }
  } else if (info.menuItemId === "govconnect_open_dashboard") {
    let res = await chrome.storage.local.get("govconnect_token");
    let token = res.govconnect_token;
    if (!token) token = await tryAutoSyncFromOpenTabs();
    const url = token
      ? `${DASHBOARD_URL}#token=${encodeURIComponent(token)}`
      : DASHBOARD_URL;
    chrome.tabs.create({ url });
  }
});

// ============================================================
// Auto-Sync Token dari Tab Dashboard Terbuka
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
    console.warn("Auto-sync from open tabs error:", err);
  }
  return null;
}

// ============================================================
// KLIK TOMBOL EKSTENSI DI TOOLBAR BROWSER (1-KLIK)
// ============================================================
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab || !tab.id) return;

  // Halaman internal chrome:// tidak dapat diakses
  if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("chrome-extension://")) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    return;
  }

  const storage = await chrome.storage.local.get([
    "govconnect_one_click_mode",
    "govconnect_token",
    "govconnect_cached_profile"
  ]);

  let token = storage.govconnect_token;
  const isOneClick = storage.govconnect_one_click_mode !== false; // default true

  // Coba auto-sync jika token belum ada di storage
  if (!token) {
    token = await tryAutoSyncFromOpenTabs();
  }

  // Jika belum login sama sekali, buka side panel untuk login
  if (!token) {
    chrome.action.setBadgeText({ text: "?", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#EF4444", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2500);
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    return;
  }

  // Jika user memilih Mode Panel (Manual), buka Side Panel
  if (!isOneClick) {
    chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
    return;
  }

  // ==========================================================
  // MODE 1-KLIK INSTAN: Langsung isi form pada tab aktif!
  // ==========================================================
  await executeOneClickAutofill(tab, token, storage.govconnect_cached_profile);
});

// ============================================================
// Eksekusi Pengisian Form 1-Klik Instan
// ============================================================
async function executeOneClickAutofill(tab, token, cachedProfile) {
  try {
    // 1. Tampilkan animasi badge "..." di icon ekstensi menandakan sedang bekerja
    chrome.action.setBadgeText({ text: "...", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#2563EB", tabId: tab.id });

    // 2. Ambil data profil terbaru jika belum di-cache
    let profile = cachedProfile;
    if (!profile) {
      try {
        const res = await fetch(`${API_BASE}/profile/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          profile = await res.json();
          await chrome.storage.local.set({ govconnect_cached_profile: profile });
        }
      } catch (fetchErr) {
        console.warn("Failed to fetch fresh profile, using cached if available:", fetchErr);
      }
    }

    if (!profile) {
      chrome.action.setBadgeText({ text: "!", tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: "#EF4444", tabId: tab.id });
      setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2500);
      chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
      return;
    }

    // 3. Kirim pesan ke content script dengan mekanisme fallback injection
    chrome.tabs.sendMessage(tab.id, {
      action: "EXECUTE_ONE_CLICK_AUTOFILL",
      profile: profile
    }, async (response) => {
      // Jika terjadi error koneksi (misal tab dibuka sebelum ekstensi direload), inject lalu kirim ulang
      if (chrome.runtime.lastError || !response) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content_script.js"]
          });

          // Kirim ulang setelah injection berhasil
          chrome.tabs.sendMessage(tab.id, {
            action: "EXECUTE_ONE_CLICK_AUTOFILL",
            profile: profile
          }, (retryResponse) => {
            if (chrome.runtime.lastError || !retryResponse) {
              chrome.action.setBadgeText({ text: "!", tabId: tab.id });
              chrome.action.setBadgeBackgroundColor({ color: "#EF4444", tabId: tab.id });
              setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2500);
              return;
            }
            handleAutofillResult(tab, retryResponse, token);
          });
        } catch (injectErr) {
          console.warn("Failed to inject content script on click:", injectErr);
          chrome.action.setBadgeText({ text: "!", tabId: tab.id });
          chrome.action.setBadgeBackgroundColor({ color: "#EF4444", tabId: tab.id });
          setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2500);
        }
        return;
      }

      handleAutofillResult(tab, response, token);
    });
  } catch (err) {
    console.error("Error in executeOneClickAutofill:", err);
    chrome.action.setBadgeText({ text: "ERR", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#EF4444", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2500);
  }
}

// ============================================================
// Penanganan Hasil Autofill & Log Aktivitas
// ============================================================
async function handleAutofillResult(tab, response, token) {
  const count = response.count || 0;
  if (count > 0) {
    // Tampilkan badge jumlah kolom yang sukses diisi dengan warna hijau
    chrome.action.setBadgeText({ text: `${count}`, tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#16A34A", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 3000);

    // Catat log aktivitas ke backend secara asynchronous
    try {
      let domain = "";
      if (tab.url) {
        try {
          const parsed = new URL(tab.url);
          domain = parsed.protocol === "file:" ? "Local File (HTML)" : (parsed.hostname || "");
        } catch {
          domain = "";
        }
      }
      const filledFieldKeys = (response.fields || [])
        .filter(f => f.status === "filled" && f.profileKey)
        .map(f => f.profileKey);

      await fetch(`${API_BASE}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          target_url: tab.url || "",
          website_domain: domain,
          action: "autofill_one_click",
          fields_detected: response.total || count,
          fields_filled: count,
          status: "success",
          filled_fields_summary: filledFieldKeys.join(",")
        })
      });
    } catch (logErr) {
      console.warn("Failed to log one-click activity:", logErr);
    }
  } else {
    // Jika 0 kolom yang cocok
    chrome.action.setBadgeText({ text: "0", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: "#F59E0B", tabId: tab.id });
    setTimeout(() => chrome.action.setBadgeText({ text: "", tabId: tab.id }), 2500);
  }
}

// Beritahu tab saat mode diubah
function notifyTabsModeChanged(isOneClick) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: "ONE_CLICK_MODE_CHANGED",
        isOneClick: isOneClick
      }).catch(() => {});
    });
  });
}

// ============================================================
// Komunikasi Pesan Antar Komponen Ekstensi & Web App
// ============================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_TOKEN") {
    chrome.storage.local.get("govconnect_token", (result) => {
      sendResponse({ token: result.govconnect_token || null });
    });
    return true;
  }

  if (message.action === "CLEAR_TOKEN") {
    chrome.storage.local.remove([
      "govconnect_token",
      "govconnect_email",
      "govconnect_cached_profile"
    ], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === "SET_ONE_CLICK_MODE") {
    const mode = !!message.enabled;
    chrome.storage.local.set({ govconnect_one_click_mode: mode }, () => {
      resetPanelBehavior();
      updateActionBehavior();
      notifyTabsModeChanged(mode);
      sendResponse({ success: true, mode });
    });
    return true;
  }

  if (message.action === "GET_ONE_CLICK_MODE") {
    chrome.storage.local.get("govconnect_one_click_mode", (result) => {
      sendResponse({ mode: result.govconnect_one_click_mode !== false });
    });
    return true;
  }

  if (message.action === "OPEN_SIDEPANEL") {
    const tabId = message.tabId || sender.tab?.id;
    if (tabId) {
      chrome.sidePanel.open({ tabId }).catch(() => {});
    }
    sendResponse({ success: true });
    return true;
  }
});
