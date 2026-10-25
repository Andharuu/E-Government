import os
import urllib.request

BASE_URL = "https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main"
TARGET_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "extension", "models", "Xenova", "all-MiniLM-L6-v2"))

FILES = [
    "config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "special_tokens_map.json",
    "onnx/model_quantized.onnx"
]

def download_model():
    print(f"Target directory: {TARGET_DIR}")
    for rel_path in FILES:
        dest_path = os.path.join(TARGET_DIR, rel_path)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        url = f"{BASE_URL}/{rel_path}"
        if os.path.exists(dest_path) and os.path.getsize(dest_path) > 0:
            print(f"Already exists: {rel_path} ({os.path.getsize(dest_path)} bytes)")
            continue
        print(f"Downloading {url} -> {dest_path} ...")
        urllib.request.urlretrieve(url, dest_path)
        print(f"Downloaded {rel_path} ({os.path.getsize(dest_path)} bytes)")

if __name__ == "__main__":
    download_model()
