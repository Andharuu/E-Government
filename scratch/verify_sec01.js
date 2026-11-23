// Test script to verify SEC-01 Password Exclusion Guard
const fs = require('fs');

const contentScript = fs.readFileSync('extension/content_script.js', 'utf8').replace(/\r\n/g, '\n');

console.log("=== Verifikasi SEC-01 pada content_script.js ===");

// 1. Cek getAllFormFields selector
const selectorMatch = contentScript.includes("input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=password]):not([type=image])");
console.log("1. Selektor getAllFormFields mengecualikan :not([type=password]):", selectorMatch ? "PASS ✅" : "FAIL ❌");

// 2. Cek filter password di getAllFormFields
const filterMatch = contentScript.includes("if (type === \"password\")");
console.log("2. Filter getAllFormFields menolak eksplisit elemen password:", filterMatch ? "PASS ✅" : "FAIL ❌");

// 3. Cek guard awal di matchProfileKey
const earlyGuardMatch = contentScript.includes("if (inputType === \"password\") {\n    return null;\n  }");
console.log("3. Early Guard di matchProfileKey menolak elemen password:", earlyGuardMatch ? "PASS ✅" : "FAIL ❌");

// 4. Cek guard di fillForm
const fillFormGuardMatch = contentScript.includes("if (inputType === \"password\") {\n      continue;\n    }");
console.log("4. Guard di fillForm melewatkan elemen password:", fillFormGuardMatch ? "PASS ✅" : "FAIL ❌");

// 5. Cek guard di detectFields
const detectFieldsGuardMatch = contentScript.includes("if (inputType === \"password\") {\n        continue;\n      }");
console.log("5. Guard di detectFields mengabaikan elemen password:", detectFieldsGuardMatch ? "PASS ✅" : "FAIL ❌");

if (selectorMatch && filterMatch && earlyGuardMatch && fillFormGuardMatch && detectFieldsGuardMatch) {
  console.log("\n>>> HASIL AKHIR: SEC-01 100% TERVERIFIKASI AMAN! 🛡️");
  process.exit(0);
} else {
  console.error("\n>>> HASIL AKHIR: ADA CHECKPOINT YANG GAGAL! ❌");
  process.exit(1);
}
