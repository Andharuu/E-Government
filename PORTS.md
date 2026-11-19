# Peta Port Dev Server — GovConnect

Setiap proyek dipatok ke satu port dengan `strictPort: true`. Kalau port sedang
dipakai, Vite **gagal** dan menyebut port-nya — bukan diam-diam pindah ke port
lain (itu penyebab "refresh tapi tampilan tidak berubah").

| Port | Proyek | Folder | Cara jalan |
|---|---|---|---|
| **5173** | GovConnect (repo kerja) | `D:\02_Project\Web Development\GovConnect\frontend` | `npm run dev` |
| **5174** | SIMPustaka (PBO) | `D:\01_Academics\01_College\Semester 3\Pemrograman Beriorientasi Objek\Projek\SIMPustaka\frontend` | `npm run dev` |
| 8000 | GovConnect API (FastAPI) | `...\GovConnect\backend` | `.venv/Scripts/python.exe -m uvicorn app.main:app --port 8000` |

Salinan akademik Semester 3 (`...\Workshop Pemrograman Framework\GovConnect\E-Government`)
tidak dipakai lagi untuk pengembangan aktif, jadi tidak dipetakan ke port mana pun.

## Frontend memanggil API lewat proxy

`vite.config.ts` mem-proxy `/api` → `http://127.0.0.1:8000`, sehingga frontend
dan API berada di origin yang sama. Ini menghilangkan CORS dan memperbaiki cookie
HttpOnly yang sebelumnya diblokir SameSite karena `localhost:5173` dan
`127.0.0.1:8000` dianggap situs berbeda.

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
