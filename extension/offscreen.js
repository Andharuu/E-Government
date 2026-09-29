// Offscreen Document - GovConnect
// Digunakan untuk menjalankan komputasi berat (Web Workers) secara background tanpa memblokir UI thread

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "PING_OFFSCREEN") {
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "SEMANTIC_FALLBACK") {
    (async () => {
      try {
        const result = await processSemanticFallback(message.label);
        sendResponse({ profileKey: result });
      } catch (err) {
        console.error("Offscreen: Semantic Fallback Error", err);
        sendResponse({ profileKey: null });
      }
    })();
    return true; // Keep message channel open for async response
  }
});

// Skeleton untuk loading model ONNX / Transformers.js
async function processSemanticFallback(labelText) {
  // TODO: Load all-MiniLM-L6-v2 via transformers.js
  // TODO: Hitung embedding text label
  // TODO: Bandingkan cosine similarity dengan reference embeddings
  // Sementara me-return null hingga model diintegrasikan penuh
  console.log(`Offscreen: Menerima request semantic fallback untuk label: "${labelText}"`);
  return null;
}
