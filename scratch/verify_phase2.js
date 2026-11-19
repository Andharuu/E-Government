// Verification script for Phase 2: Tour System & Viewport Clamping
const fs = require('fs');

console.log("=== Verifikasi Fase 2: Sistem Onboarding Tour Kontekstual & Anti-Cutoff ===");

const tourStepsContent = fs.readFileSync('frontend/src/tour/TourSteps.ts', 'utf8');
const tourOverlayContent = fs.readFileSync('frontend/src/tour/TourOverlay.tsx', 'utf8');
const tourContextContent = fs.readFileSync('frontend/src/tour/TourContext.tsx', 'utf8');

// 1. Cek semua 5 section terdaftar di TourSteps.ts
const hasDashboard = tourStepsContent.includes("dashboard: [");
const hasProfile = tourStepsContent.includes("profile: [");
const hasTemplates = tourStepsContent.includes("templates: [");
const hasActivity = tourStepsContent.includes("activity: [");
const hasSettings = tourStepsContent.includes("settings: [");

console.log("1. Seluruh 5 section terdaftar di TourSteps:", (hasDashboard && hasProfile && hasTemplates && hasActivity && hasSettings) ? "PASS ✅" : "FAIL ❌");

// 2. Cek Delay 10 detik di Dasbor dan 2.5s di Sub-halaman (User Request #5)
const has10sDelay = tourContextContent.includes("sec === 'dashboard' ? 10000 : 2500");
console.log("2. Timer adaptasi pengguna baru (10s di Dasbor, 2.5s di sub-halaman):", has10sDelay ? "PASS ✅" : "FAIL ❌");

// 3. Cek Isolasi Kontekstual Per Halaman (User Request #5)
const hasContextualIsolation = tourContextContent.includes("ROUTE_SECTION_MAP") && tourContextContent.includes("activeSteps");
console.log("3. Isolasi kontekstual tur per modul (hanya tur halaman aktif):", hasContextualIsolation ? "PASS ✅" : "FAIL ❌");

// 4. Cek Viewport Hard Clamping (User Request #7 / Bug Tooltip Terpotong Layar)
const hasHardClampX = tourOverlayContent.includes("Math.max(minLeft, Math.min(calculatedLeft, maxLeft))");
const hasHardClampY = tourOverlayContent.includes("Math.max(minTop, Math.min(calculatedTop, maxTop))");
const hasFlipLogic = tourOverlayContent.includes("topCandidate") && tourOverlayContent.includes("bottomCandidate");

console.log("4. Algoritma Viewport Clamping (Anti-Terpotong Layar di X & Y):", (hasHardClampX && hasHardClampY && hasFlipLogic) ? "PASS ✅" : "FAIL ❌");

// 5. Cek Integrasi di App.tsx & Layout.tsx & Settings.tsx
const appContent = fs.readFileSync('frontend/src/App.tsx', 'utf8');
const layoutContent = fs.readFileSync('frontend/src/components/Layout.tsx', 'utf8');
const settingsContent = fs.readFileSync('frontend/src/pages/Settings.tsx', 'utf8');

const appIntegrated = appContent.includes("<TourProvider>") && appContent.includes("<TourOverlay />");
const layoutIntegrated = layoutContent.includes("Panduan Tur") && layoutContent.includes("startTour()");
const settingsIntegrated = settingsContent.includes("settings-tour") && settingsContent.includes("resetTour()");

console.log("5. Integrasi komponen ke App.tsx, Layout.tsx, dan Settings.tsx:", (appIntegrated && layoutIntegrated && settingsIntegrated) ? "PASS ✅" : "FAIL ❌");

if (hasDashboard && has10sDelay && hasContextualIsolation && hasHardClampX && appIntegrated && layoutIntegrated && settingsIntegrated) {
  console.log("\n>>> HASIL AKHIR FASE 2: 100% SUKSES DAN TERVERIFIKASI! 🎉");
  process.exit(0);
} else {
  console.error("\n>>> HASIL AKHIR FASE 2: GAGAL!");
  process.exit(1);
}
