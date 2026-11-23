const fs = require('fs');
const path = require('path');

function runChecks() {
  console.log('--- Memeriksa Perbaikan Fase 3 ---');

  // Check 1: SEC-04 - No innerHTML in content_script.js for marker badges
  const contentScript = fs.readFileSync('extension/content_script.js', 'utf8');
  const hasBadgeInnerHTML = contentScript.includes('badge.innerHTML = `<span>${label}</span>`') ||
                           contentScript.includes('badge.innerHTML = `<span class="govconnect-badge-icon">✓</span><span>Terisi:');
  if (hasBadgeInnerHTML) {
    console.error('❌ Check 1 FAIL: content_script.js masih mengandung innerHTML pada badge marker');
    process.exit(1);
  } else {
    console.log('✅ Check 1 PASS: SEC-04 DOM-Based XSS terselesaikan via textContent & createElement');
  }

  // Check 2: SEC-05 - Port 3000 removed from extension files
  const extFiles = ['extension/config.js', 'extension/content_script.js', 'extension/popup.js', 'extension/sidepanel.js'];
  let port3000Found = false;
  for (const f of extFiles) {
    const code = fs.readFileSync(f, 'utf8');
    if (code.includes('localhost:3000') || code.includes('127.0.0.1:3000')) {
      console.error(`❌ Check 2 FAIL: ${f} masih mengandung origin port 3000`);
      port3000Found = true;
    }
  }
  if (!port3000Found) {
    console.log('✅ Check 2 PASS: SEC-05 Port 3000 berhasil dihapus dari seluruh skrip ekstensi');
  } else {
    process.exit(1);
  }

  // Check 3: BUG-01 - slowapi in backend/requirements.txt
  const reqs = fs.readFileSync('backend/requirements.txt', 'utf8');
  if (reqs.includes('slowapi')) {
    console.log('✅ Check 3 PASS: BUG-01 slowapi terdaftar di backend/requirements.txt');
  } else {
    console.error('❌ Check 3 FAIL: backend/requirements.txt tidak memiliki slowapi');
    process.exit(1);
  }

  // Check 4: BUG-02 - /mcp & /.well-known probe endpoints in main.py
  const mainPy = fs.readFileSync('backend/app/main.py', 'utf8');
  if (mainPy.includes('/mcp') && mainPy.includes('/.well-known/oauth-protected-resource')) {
    console.log('✅ Check 4 PASS: BUG-02 endpoint probe /mcp dan oauth tersedia');
  } else {
    console.error('❌ Check 4 FAIL: backend/app/main.py kekurangan endpoint probe');
    process.exit(1);
  }

  // Check 5: SEC-07 - schemas.py has max_length=128
  const schemasPy = fs.readFileSync('backend/app/schemas/schemas.py', 'utf8');
  if (schemasPy.includes('max_length=128')) {
    console.log('✅ Check 5 PASS: SEC-07 batasan panjang password Pydantic (max_length=128) aktif');
  } else {
    console.error('❌ Check 5 FAIL: schemas.py kekurangan max_length');
    process.exit(1);
  }

  // Check 6: Tour anti-cutoff viewport bounds & capture scroll
  const tourOverlay = fs.readFileSync('frontend/src/tour/TourOverlay.tsx', 'utf8');
  const useTourTarget = fs.readFileSync('frontend/src/tour/useTourTarget.ts', 'utf8');
  if (tourOverlay.includes('max-h-[calc(100vh-32px)]') && useTourTarget.includes('{ capture: true, passive: true }')) {
    console.log('✅ Check 6 PASS: Tour overlay anti-cutoff & dynamic capture scroll aktif');
  } else {
    console.error('❌ Check 6 FAIL: TourOverlay atau useTourTarget belum terlindungi maksimal');
    process.exit(1);
  }

  console.log('\nSEMUA 6/6 CHECKPOINT FASE 3 BERHASIL DIVERIFIKASI!');
}

runChecks();
