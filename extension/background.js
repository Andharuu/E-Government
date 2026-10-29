// Background Service Worker — GovConnect
// Mode Panel Samping Cerdas dengan Deteksi Semantik & Sinkronisasi Profil Otomatis

importScripts('config.js');

function isGovConnectDashboardUrl(url) {
  if (typeof GovConnectConfig !== "undefined") {
    return GovConnectConfig.isDashboardUrl(url);
  }
  if (!url) return false;
  try {
    return (self.GOVCONNECT_WEB_ORIGINS || []).includes(new URL(url).origin);
  } catch {
    return false;
  }
}

// ============================================================
// Cache Profil DI MEMORI (T6)
// Profil berisi PII lengkap. Kita TIDAK lagi menyimpannya ke
// chrome.storage.local (disk, plaintext). Hanya hidup di memori
// service worker dan dihapus saat browser/logout. Bila SW tidur,
// profil diambil ulang dari API saat dibutuhkan.
// ============================================================
let memoryProfile = null;

// ============================================================
// Klik ikon toolbar ekstensi membuka/menutup panel samping melayang yang menimpa web (tanpa membelah layar)
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  if (tab.url?.startsWith("chrome://") || tab.url?.startsWith("chrome-extension://")) return;

  chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_FLOATING_SIDEBAR" }).catch(() => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content_script.js"]
    }).then(() => {
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_FLOATING_SIDEBAR" }).catch(() => {});
      }, 120);
    }).catch(() => {});
  });
});

// ============================================================
// Konfigurasi Perilaku Panel
// ============================================================
// GovConnect menggunakan floating overlay sidebar yang disuntikkan ke halaman
// sehingga tidak memerlukan konfigurasi chrome.sidePanel bawaan Chrome.
function setupPanelBehavior() {
  // No-op / fallback aman agar tidak memicu ReferenceError pada service worker
}

chrome.runtime.onInstalled.addListener(() => {
  setupPanelBehavior();
  setupContextMenus();
  updateActionBehavior();
  checkAndUpdateDictionaries();
  setupOffscreenDocument();
});

chrome.runtime.onStartup.addListener(() => {
  setupPanelBehavior();
  updateActionBehavior();
  checkAndUpdateDictionaries();
  setupOffscreenDocument();
});

// ============================================================
// Inisialisasi Offscreen Document
// ============================================================
async function setupOffscreenDocument() {
  try {
    if (await chrome.offscreen.hasDocument()) {
      return;
    }
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['WORKERS'],
      justification: 'Menjalankan komputasi semantik untuk pencocokan formulir di background worker'
    });
    console.log("GovConnect: Offscreen document berhasil dibuat.");
  } catch (err) {
    console.warn("GovConnect: Gagal membuat offscreen document:", err);
  }
}

// ============================================================
// Data Drift Security - Update Dictionaries dengan Retry Logic (E-M3)
// ============================================================
async function checkAndUpdateDictionaries(retries = 3, delayMs = 1500) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch("https://api.govconnect.app/dict-manifest.json").catch(() => null);
      if (!res || !res.ok) {
        if (attempt < retries) {
          await new Promise(r => setTimeout(r, delayMs * attempt));
          continue;
        }
        return;
      }

      const manifest = await res.json().catch(() => null);
      if (!manifest) return;
      const remoteVersion = manifest.version;
      if (!remoteVersion) return;

      // T9: integritas WAJIB — tolak update tanpa hash yang benar.
      if (!manifest.hash) {
        console.warn("GovConnect: Update kamus tanpa hash — DITOLAK (integritas tidak terverifikasi).");
        return;
      }

      const storage = await chrome.storage.local.get("govconnect_keyword_version");
      const localVersion = storage.govconnect_keyword_version;

      if (localVersion !== remoteVersion) {
        const dataString = JSON.stringify(manifest.data);
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataString);
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        if (hashHex !== manifest.hash) {
          console.warn("GovConnect: SHA-256 validation failed for dictionary update!");
          return;
        }

        await chrome.storage.local.set({
          govconnect_keyword_version: remoteVersion,
          govconnect_keywords: manifest.data
        });
        console.log(`GovConnect: Dictionary updated to version ${remoteVersion}`);
      }
      return; // Berhasil, keluar dari loop
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs * attempt));
      }
    }
  }
}

// ============================================================
// Inisialisasi Menu Klik Kanan
// ============================================================
async function setupContextMenus() {
  try {
    chrome.contextMenus.removeAll(() => {
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
  } catch (err) {
    console.warn("Context menu setup warning:", err);
  }
}

// ============================================================
// Update Label & Tooltip Action Toolbar
// ============================================================
async function updateActionBehavior() {
  chrome.action.setTitle({
    title: "GovConnect — Asisten Pengisian Formulir Otomatis"
  });
}

// ============================================================
// Klik Kanan Context Menu Handler
// ============================================================
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "govconnect_open_sidepanel") {
    if (tab && tab.id) {
      if (chrome.sidePanel && typeof chrome.sidePanel.open === "function") {
        chrome.sidePanel.open({ tabId: tab.id }).catch(() => {
          chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_FLOATING_SIDEBAR" }).catch(() => {});
        });
      } else {
        chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_FLOATING_SIDEBAR" }).catch(() => {});
      }
    }
  } else if (info.menuItemId === "govconnect_open_dashboard") {
    // Token TIDAK lagi ditempel di URL (#token=) — hash bocor ke riwayat/Referer.
    // Sinkronisasi sesi terjadi otomatis lewat bridge content-script (origin-verified).
    await chrome.storage.local.get("govconnect_token");
    chrome.tabs.create({ url: DASHBOARD_URL });
  }
});

// ============================================================
// Auto-Sync Token dari Tab Dashboard Terbuka
// ============================================================
async function tryAutoSyncFromOpenTabs() {
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

// Duplicate action click listener removed

// ============================================================
// Komunikasi Pesan Antar Komponen Ekstensi & Web App
// ============================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_CURRENT_TAB_INFO") {
    if (sender.tab) {
      sendResponse({ tab: sender.tab });
      return false;
    }
    chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(tabs => {
      if (tabs && tabs.length > 0) {
        sendResponse({ tab: tabs[0] });
      } else {
        chrome.tabs.query({ active: true }).then(allActive => {
          sendResponse({ tab: allActive[0] || null });
        });
      }
    }).catch(() => {
      sendResponse({ tab: null });
    });
    return true;
  }

  if (message.action === "FORWARD_TO_TAB") {
    const targetTabId = message.tabId;
    if (targetTabId) {
      chrome.tabs.sendMessage(targetTabId, message.tabMessage, (resp) => {
        const err = chrome.runtime.lastError;
        sendResponse(err ? { error: err.message } : resp);
      });
      return true;
    }
  }

  if (message.action === "SEND_TAB_MESSAGE") {
    const tabId = message.tabId || sender.tab?.id;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, message.message).then(res => {
        sendResponse(res || null);
      }).catch(() => {
        sendResponse(null);
      });
      return true;
    }
    sendResponse(null);
    return false;
  }

  if (message.action === "CLOSE_SIDEBAR") {
    const tabId = sender.tab?.id;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { action: "CLOSE_FLOATING_SIDEBAR" }).catch(() => {});
    }
    sendResponse({ success: true });
    return false;
  }
  if (message.action === "SEMANTIC_RESULT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message).catch(() => { });
      } else {
        chrome.tabs.query({ active: true }, (allTabs) => {
          if (allTabs && allTabs[0]?.id) {
            chrome.tabs.sendMessage(allTabs[0].id, message).catch(() => { });
          }
        });
      }
    });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "SEMANTIC_FALLBACK") {
    setupOffscreenDocument().catch(() => { });
    return false;
  }

  if (message.action === "FORM_UPDATED") {
    sendResponse({ success: true });
    return false;
  }

  if (message.action === "GET_TOKEN") {
    chrome.storage.local.get("govconnect_token", (result) => {
      sendResponse({ token: result.govconnect_token || null });
    });
    return true;
  }

  if (message.action === "CLEAR_TOKEN") {
    memoryProfile = null;
    chrome.storage.local.remove([
      "govconnect_token",
      "govconnect_email",
      "govconnect_cached_profile"
    ], () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === "PROFILE_UPDATED" || message.action === "SET_CACHED_PROFILE") {
    // Simpan profil DI MEMORI saja (T6) — jangan tulis PII ke disk.
    if (message.profile) {
      memoryProfile = message.profile;
    }
    // Bersihkan sisa cache lama yang mungkin masih tertulis di versi sebelumnya.
    chrome.storage.local.remove("govconnect_cached_profile");
    if (sendResponse) sendResponse({ success: true });
    return true;
  }

  if (message.action === "GET_CACHED_PROFILE") {
    sendResponse({ profile: memoryProfile });
    return true;
  }

  if (message.action === "OPEN_SIDEPANEL") {
    const tabId = message.tabId || sender.tab?.id;
    if (tabId) {
      chrome.tabs.sendMessage(tabId, { action: "TOGGLE_FLOATING_ASSISTANT" }).catch(() => { });
    }
    sendResponse({ success: true });
    return true;
  }
});
