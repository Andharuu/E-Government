const API_BASE = "http://127.0.0.1:8000/api/v1";
const DASHBOARD_URL = "http://localhost:5173/dashboard";
let isRegisterMode = false;

// ============================================================
// Inisialisasi: cek apakah sudah login
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  let token = await getToken();
  if (!token) {
    token = await tryAutoSyncFromOpenTabs();
  }

  if (token) {
    await showMainScreen(token);
  } else {
    switchScreen("authScreen");
  }

  // Toggle mode Login / Register
  const btnToggle = document.getElementById("btnToggleMode");
  if (btnToggle) {
    btnToggle.addEventListener("click", toggleMode);
  }

  // Event listener tombol submit auth
  document.getElementById("btnSubmitAuth").addEventListener("click", handleAuth);

  // Enter key untuk submit
  ["inputEmail", "inputPassword", "inputConfirm"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("keydown", e => {
        if (e.key === "Enter") handleAuth();
      });
    }
  });

  // Tombol di main screen
  document.getElementById("btnOpenPanel").addEventListener("click", openSidePanel);

  const btnQuick = document.getElementById("btnPopupQuickFill");
  if (btnQuick) {
    btnQuick.addEventListener("click", async () => {
      btnQuick.disabled = true;
      btnQuick.textContent = "Mengisi...";
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        const token = await getToken();
        let cached = await chrome.storage.local.get("govconnect_cached_profile");
        let profile = cached.govconnect_cached_profile;
        if (!profile && token) {
          const res = await fetch(`${API_BASE}/profile/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) profile = await res.json();
        }
        if (profile) {
          await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content_script.js"] }).catch(() => {});
          chrome.tabs.sendMessage(tab.id, { action: "EXECUTE_ONE_CLICK_AUTOFILL", profile }, () => {
            window.close();
          });
          return;
        }
      }
      btnQuick.disabled = false;
      btnQuick.textContent = "⚡ Isi Form Halaman Ini (1-Klik)";
    });
  }

  const toggleOneClick = document.getElementById("popupToggleOneClick");
  if (toggleOneClick) {
    chrome.storage.local.get("govconnect_one_click_mode", (res) => {
      toggleOneClick.checked = res.govconnect_one_click_mode !== false;
    });
    toggleOneClick.addEventListener("change", async (e) => {
      const isEnabled = e.target.checked;
      await chrome.storage.local.set({ govconnect_one_click_mode: isEnabled });
      chrome.runtime.sendMessage({ action: "SET_ONE_CLICK_MODE", enabled: isEnabled }).catch(() => {});
    });
  }

  document.getElementById("btnDashboard").addEventListener("click", async () => {
    const activeToken = await getToken();
    const url = activeToken
      ? `${DASHBOARD_URL}#token=${encodeURIComponent(activeToken)}`
      : DASHBOARD_URL;
    chrome.tabs.create({ url });
  });

  document.getElementById("btnLogout").addEventListener("click", handleLogout);
});

// ============================================================
// Toggle antara mode Login dan Register
// ============================================================
function toggleMode() {
  isRegisterMode = !isRegisterMode;
  const confirmField = document.getElementById("confirmField");
  const authTitle = document.getElementById("authTitle");
  const btnSubmit = document.getElementById("btnSubmitAuth");
  const toggleText = document.getElementById("toggleText");
  const btnToggle = document.getElementById("btnToggleMode");

  if (isRegisterMode) {
    authTitle.textContent = "Buat Akun GovConnect";
    btnSubmit.textContent = "Daftar Akun";
    toggleText.textContent = "Sudah punya akun?";
    btnToggle.textContent = "Masuk";
    confirmField.style.display = "flex";
  } else {
    authTitle.textContent = "Masuk ke GovConnect";
    btnSubmit.textContent = "Masuk";
    toggleText.textContent = "Belum punya akun?";
    btnToggle.textContent = "Daftar Akun";
    confirmField.style.display = "none";
  }
  clearError();
}

// ============================================================
// Handle Login / Register
// ============================================================
async function handleAuth() {
  const email = document.getElementById("inputEmail").value.trim();
  const password = document.getElementById("inputPassword").value;
  const btn = document.getElementById("btnSubmitAuth");

  clearError();

  if (!email || !password) {
    showError("Email dan password wajib diisi.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Memproses...";

  try {
    if (isRegisterMode) {
      const confirm = document.getElementById("inputConfirm").value;
      if (password !== confirm) {
        showError("Konfirmasi password tidak cocok.");
        return;
      }
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Registrasi gagal");
      }
      await doLogin(email, password);
    } else {
      await doLogin(email, password);
    }
  } catch (err) {
    showError(err.message || "Terjadi kesalahan. Coba lagi.");
  } finally {
    btn.disabled = false;
    btn.textContent = isRegisterMode ? "Daftar Akun" : "Masuk";
  }
}

async function doLogin(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Email atau password salah");
  }

  const data = await res.json();
  await saveToken(data.access_token);
  await saveUserEmail(email);

  // Beritahu tab aktif jika itu web dashboard
  syncAuthToWebTabs(data.access_token, email);

  await showMainScreen(data.access_token);
}

// ============================================================
// Tampilkan Main Screen (sudah login)
// ============================================================
async function showMainScreen(token) {
  try {
    const [profRes, statsRes] = await Promise.all([
      fetch(`${API_BASE}/profile/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/activities/stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
    ]);

    if (profRes.status === 401) {
      await clearToken();
      switchScreen("authScreen");
      return;
    }

    const profile = profRes.ok ? await profRes.json() : {};
    const stats = statsRes.ok ? await statsRes.json() : { profile_completion: 0 };

    const savedEmail = await getUserEmail();
    const displayName = profile.full_name || savedEmail || "Pengguna";

    document.getElementById("profName").textContent = displayName;
    document.getElementById("userEmail").textContent = savedEmail || profile.email || "-";
    document.getElementById("profNik").textContent = profile.nik || "-";
    document.getElementById("profPhone").textContent = profile.phone || profile.phone_number || "-";

    // Set avatar initial
    const initial = (displayName.charAt(0) || "U").toUpperCase();
    document.getElementById("userAvatar").textContent = initial;

    // Progress bar
    const pct = Math.round(stats.profile_completion || 0);
    document.getElementById("completionPct").textContent = `${pct}%`;
    document.getElementById("progressFill").style.width = `${pct}%`;

    switchScreen("mainScreen");
  } catch (err) {
    showError("Gagal memuat profil. Periksa koneksi ke server backend.");
    switchScreen("authScreen");
  }
}

// ============================================================
// Buka Side Panel
// ============================================================
async function openSidePanel() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.sidePanel.open({ tabId: tab.id });
    window.close();
  }
}

// ============================================================
// Logout
// ============================================================
async function handleLogout() {
  await clearToken();
  await clearUserEmail();
  syncAuthToWebTabs(null, null);

  switchScreen("authScreen");
  document.getElementById("inputEmail").value = "";
  document.getElementById("inputPassword").value = "";
}

// ============================================================
// Sinkronisasi Sesi ke Tab Web Dashboard yang Sedang Terbuka
// ============================================================
function syncAuthToWebTabs(token, email) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && (tab.url.includes("localhost:5173") || tab.url.includes("127.0.0.1:5173"))) {
        chrome.tabs.sendMessage(tab.id, {
          action: "SYNC_AUTH_FROM_EXTENSION",
          token: token,
          email: email
        }).catch(() => {});
      }
    });
  });
}

// ============================================================
// Helper UI & Storage
// ============================================================
function switchScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const target = document.getElementById(screenId);
  if (target) target.classList.add("active");
}

function showError(msg) {
  const el = document.getElementById("authError");
  if (el) {
    el.textContent = msg;
    el.style.display = "block";
  }
}

function clearError() {
  const el = document.getElementById("authError");
  if (el) {
    el.textContent = "";
    el.style.display = "none";
  }
}

function saveToken(token) {
  return chrome.storage.local.set({ govconnect_token: token });
}

function getToken() {
  return new Promise(resolve => {
    chrome.storage.local.get("govconnect_token", r => resolve(r.govconnect_token || null));
  });
}

function clearToken() {
  return chrome.storage.local.remove("govconnect_token");
}

function saveUserEmail(email) {
  return chrome.storage.local.set({ govconnect_email: email });
}

function getUserEmail() {
  return new Promise(resolve => {
    chrome.storage.local.get("govconnect_email", r => resolve(r.govconnect_email || null));
  });
}

function clearUserEmail() {
  return chrome.storage.local.remove("govconnect_email");
}

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
    console.log("Auto-sync from open tabs in popup:", err);
  }
  return null;
}
