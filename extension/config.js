// Konfigurasi Terpusat Ekstensi GovConnect
// Menggunakan IIFE agar tidak mencemari atau bertabrakan dengan lingkup leksikal skrip lain
(function(global) {
  const DEFAULT_API_BASE = "http://127.0.0.1:8000/api/v1";
  const DEFAULT_DASHBOARD_URL = "http://localhost:5173/dashboard";

  const WEB_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
  ];

  const GovConnectConfig = {
    API_BASE: DEFAULT_API_BASE,
    DASHBOARD_URL: DEFAULT_DASHBOARD_URL,
    WEB_ORIGINS: WEB_ORIGINS,

    async init() {
      try {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.sync) {
          const data = await chrome.storage.sync.get(["customApiBase", "customDashboardUrl"]);
          if (data.customApiBase) this.API_BASE = data.customApiBase.replace(/\/+$/, "");
          if (data.customDashboardUrl) this.DASHBOARD_URL = data.customDashboardUrl.replace(/\/+$/, "");
        }
      } catch (e) {
        // Fallback silently to defaults
      }
      return this;
    },

    isDashboardUrl(url) {
      if (!url) return false;
      try {
        const origin = new URL(url).origin;
        return this.WEB_ORIGINS.includes(origin) || (this.DASHBOARD_URL && origin === new URL(this.DASHBOARD_URL).origin);
      } catch {
        return false;
      }
    }
  };

  global.GovConnectConfig = GovConnectConfig;
})(typeof globalThis !== "undefined" ? globalThis : (typeof self !== "undefined" ? self : this));
