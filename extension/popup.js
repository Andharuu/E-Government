const API_BASE = "http://127.0.0.1:8000/api/v1";
let isRegisterMode = false;

// ============================================================
// Inisialisasi: cek apakah sudah login
// ============================================================
document.addEventListener("DOMContentLoaded", async () => {
  const token = await getToken();
  if (token) {
    await showMainScreen(token);
  }

  // Event listener tombol submit auth
  document.getElementById("btnSubmitAuth").addEventListener("click", handleAuth);

  // Enter key untuk submit
  ["inputEmail", "inputPassword", "inputConfirm"].forEach(id => {
    document.getElementById(id).addEventListener("keydown", e => {
      if (e.key === "Enter") handleAuth();
    });
  });

  // Tombol di main screen
  document.getElementById("btnOpenPanel").addEventListener("click", openSidePanel);
  document.getElementById("btnDashboard").addEventListener("click", () => {
    chrome.tabs.create({ url: "http://127.0.0.1:8000/dashboard" });
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
  const toggleLink = document.getElementById("toggleLink");

  if (isRegisterMode) {
    authTitle.textContent = "Buat akun baru";
    btnSubmit.textContent = "Daftar";
    toggleText.textContent = "Sudah punya akun?";
    toggleLink.textContent = " Masuk";
    confirmField.style.display = "flex";
  } else {
    authTitle.textContent = "Masuk ke akun Anda";
    btnSubmit.textContent = "Masuk";
    toggleText.textContent = "Belum punya akun?";
    toggleLink.textContent = " Daftar";
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
      // --- REGISTER ---
      const confirm = document.getElementById("inputConfirm").value;
      if (password !== confirm) {
        showError("Password tidak cocok.");
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
      // Setelah register, langsung login
      await doLogin(email, password);
    } else {
      // --- LOGIN ---
      await doLogin(email, password);
    }
  } catch (err) {
    showError(err.message || "Terjadi kesalahan. Coba lagi.");
  } finally {
    btn.disabled = false;
    btn.textContent = isRegisterMode ? "Daftar" : "Masuk";
  }
}

async function doLogin(email, password) {
  // OAuth2PasswordRequestForm mengharapkan form-urlencoded
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login gagal");
  }
  const data = await res.json();
  await saveToken(data.access_token);
  await saveUserEmail(email);
  await showMainScreen(data.access_token);
}

// ============================================================
// Tampilkan Main Screen (sudah login)
// ============================================================
async function showMainScreen(token) {
  try {
    // Fetch profil
    const res = await fetch(`${API_BASE}/profile/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.status === 401) {
      // Token kedaluwarsa
      await clearToken();
      return;
    }
    const profile = await res.json();

    // Fetch stats
    const statsRes = await fetch(`${API_BASE}/activities/stats`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const stats = statsRes.ok ? await statsRes.json() : { profile_completion: 0 };

    // Isi data profil
    document.getElementById("profName").textContent = profile.full_name || "-";
    document.getElementById("profNik").textContent = profile.nik || "-";
    document.getElementById("profPhone").textContent = profile.phone_number || "-";

    // Completion bar
    const pct = stats.profile_completion || 0;
    document.getElementById("completionPct").textContent = `${pct}%`;
    document.getElementById("progressFill").style.width = `${pct}%`;

    // Email user
    const savedEmail = await getUserEmail();
    document.getElementById("userEmail").textContent = savedEmail || "";

    // Pindah ke main screen
    switchScreen("mainScreen");
  } catch (err) {
    showError("Gagal memuat profil. Periksa koneksi ke server.");
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
  switchScreen("authScreen");
  document.getElementById("inputEmail").value = "";
  document.getElementById("inputPassword").value = "";
  document.getElementById("statusMsg").textContent = "";
}

// ============================================================
// Helper UI
// ============================================================
function switchScreen(screenId) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(screenId).classList.add("active");
}

function showError(msg) {
  const el = document.getElementById("authError");
  el.textContent = msg;
  el.style.display = "block";
}

function clearError() {
  const el = document.getElementById("authError");
  el.textContent = "";
  el.style.display = "none";
}

// ============================================================
// Chrome Storage helpers
// ============================================================
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
