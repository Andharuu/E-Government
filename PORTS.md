# Peta Port Dev Server — GovConnect

Supaya tidak salah alamat lagi: setiap proyek dipatok ke satu port dengan
`strictPort: true`. Kalau port sedang dipakai, Vite **gagal** dan menyebut
port-nya — bukan diam-diam pindah ke port lain.

| Port | Proyek | Folder | Cara jalan |
|---|---|---|---|
| **5173** | GovConnect (repo kerja) — desain terbaru | `D:\02_Project\Web Development\GovConnect\frontend` | `npm run dev` |
| **5174** | SIMPustaka (PBO) | `D:\01_Academics\01_College\Semester 3\Pemrograman Beriorientasi Objek\Projek\SIMPustaka\frontend` | `npm run dev` |
| **5175** | Salinan akademik GovConnect (Semester 3) | `D:\01_Academics\01_College\Semester 3\Workshop Pemrograman Framework\GovConnect\E-Government\frontend` | `npm run dev` |
| 8000 | GovConnect API (FastAPI) | `...\GovConnect\backend` | `.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000` |

## Cara memastikan sedang melihat build yang benar

Buka `http://localhost:5173` lalu jalankan di console browser:

```js
getComputedStyle(document.body).fontFamily  // "Plus Jakarta Sans", ...
```

Kalau yang muncul `Inter` atau ada font `Outfit`, itu build lama.

Cek cepat lewat terminal:

```bash
curl -s http://localhost:5173/ | grep -o "JetBrains+Mono"
```

Ada hasilnya = build baru.