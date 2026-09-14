chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "EXECUTE_AUTOFILL") {
    const result = fillForm(request.data);
    sendResponse(result);
  }
  return true;
});

function fillForm(profile) {
  // Kamus pencocokan atribut profil ke keyword selector input
  const fieldMapping = {
    nik: ["nik", "no_ktp", "identitas"],
    full_name: ["nama", "name", "full_name"],
    address: ["alamat", "address", "domisili"],
    phone_number: ["telepon", "phone", "hp", "telp", "whatsapp"]
  };

  let filledCount = 0;

  for (const [key, value] of Object.entries(profile)) {
    if (!value || !fieldMapping[key]) continue;

    const keywords = fieldMapping[key];
    for (const kw of keywords) {
      const input = document.querySelector(
        `input[name*="${kw}" i], input[id*="${kw}" i], input[placeholder*="${kw}" i]`
      );

      if (input && input.value.trim() === "") {
        input.value = value;
        // Picu event agar framework frontend (React/Vue/vanilla) mengenali perubahan
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
        filledCount++;
        break;
      }
    }
  }

  return { success: true, count: filledCount };
}