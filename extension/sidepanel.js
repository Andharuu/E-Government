const API_BASE = "http://127.0.0.1:8000/api/v1";
let cachedProfile = null;

document.addEventListener("DOMContentLoaded", async () => {
  const apiBadge = document.getElementById("apiStatus");
  const btn = document.getElementById("btnAutofill");

  try {
    const res = await fetch(`${API_BASE}/profile/me`);
    if (!res.ok) throw new Error("Gagal memuat profil");
    
    cachedProfile = await res.json();
    
    document.getElementById("profName").innerText = cachedProfile.full_name || "-";
    document.getElementById("profNik").innerText = cachedProfile.nik || "-";
    document.getElementById("profAddress").innerText = cachedProfile.address || "-";
    
    apiBadge.innerText = "API: Terhubung";
    apiBadge.style.background = "#dcfce7";
    apiBadge.style.color = "#166534";
    btn.disabled = false;
  } catch (err) {
    apiBadge.innerText = "API: Gagal Terhubung";
    apiBadge.style.background = "#fee2e2";
    apiBadge.style.color = "#991b1b";
    document.getElementById("status").innerText = "Pastikan server FastAPI menyala di port 8000.";
  }
});

document.getElementById("btnAutofill").addEventListener("click", async () => {
  const statusDiv = document.getElementById("status");
  statusDiv.innerText = "Mengisi formulir...";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  chrome.tabs.sendMessage(tab.id, { action: "EXECUTE_AUTOFILL", data: cachedProfile }, async (res) => {
    if (chrome.runtime.lastError || !res) {
      statusDiv.innerText = "Gagal menyuntik data. Refresh halaman target.";
      return;
    }

    statusDiv.innerText = `Berhasil mengisi ${res.count} kolom!`;

    // Catat riwayat ke API activities
    try {
      await fetch(`${API_BASE}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_url: tab.url,
          fields_filled_count: res.count,
          status: "success"
        })
      });
    } catch (e) {
      console.error("Gagal mencatat log aktivitas:", e);
    }
  });
});