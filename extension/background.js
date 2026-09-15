// Background Service Worker — GovConnect
// Mengelola sesi JWT dan membuka side panel saat icon diklik

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

// Dengarkan pesan dari popup/sidepanel untuk operasi storage token
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "GET_TOKEN") {
    chrome.storage.local.get("govconnect_token", (result) => {
      sendResponse({ token: result.govconnect_token || null });
    });
    return true; // async response
  }

  if (message.action === "CLEAR_TOKEN") {
    chrome.storage.local.remove(["govconnect_token", "govconnect_email"], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
