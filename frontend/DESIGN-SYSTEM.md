# GovConnect — Design System v3 (kontrak kerja UI)

Dokumen ini adalah **kontrak wajib** untuk semua pekerjaan tampilan di `frontend/`.
Tujuannya: satu bahasa visual, tanpa kelas hex hardcoded, tanpa `!important`.

---

## 1. Prinsip

- **Tenang, padat, presisi.** Referensi rasa: Linear / Vercel / Stripe dashboard — bukan template SaaS.
- **Hierarki lewat ukuran, berat, dan jarak** — bukan lewat kotak berwarna, ikon besar, atau gradient.
- **Satu aksen saja** (navy). Status boleh punya warna sendiri (ok/warn/danger).
- **Tanpa dekorasi tanpa alasan**: tidak ada gradient dekoratif, glassmorphism, emoji, ikon di atas setiap judul, atau angka besar tanpa konteks.
- **Motion hanya untuk perubahan state**: 120–200ms, tanpa `scale` pada hover, tanpa rotasi ikon.

---

## 2. Token warna (pakai lewat kelas Tailwind)

Jangan pernah menulis `bg-[#...]`, `text-[#...]`, atau `dark:` untuk warna.
Semua token sudah otomatis berganti di light/dark.

| Kelas | Arti |
|---|---|
| `bg-canvas` | latar halaman |
| `bg-surface` | kartu, panel, topbar, sidebar |
| `bg-surface-2` | header tabel, area sekunder |
| `bg-surface-3` | hover, chip, track |
| `border-line` | garis normal |
| `border-line-2` | garis lebih tegas (input, tombol sekunder) |
| `text-ink` | teks utama |
| `text-ink-2` | teks sekunder |
| `text-ink-3` | teks muted / label |
| `bg-accent` `text-accent-fg` | tombol utama |
| `text-accent-text` `bg-accent-soft` `border-accent-line` | aksen lembut |
| `text-ok` `bg-ok-soft` `border-ok-line` | sukses |
| `text-warn` `bg-warn-soft` `border-warn-line` | peringatan |
| `text-danger` `bg-danger-soft` `border-danger-line` | bahaya/gagal |

---

## 3. Kelas komponen (pakai ini, jangan bikin ulang)

**Layout**
`page` (wrapper vertikal gap 20) · `page-head` · `eyebrow` · `page-title` · `page-sub` · `grid-auto`

**Kartu**
`card` · `card-flat` · `card-hover` · `card-head` · `card-title` · `card-desc` · `card-body` · `card-foot`

**Tombol**
`btn` + salah satu: `btn-primary` `btn-secondary` `btn-soft` `btn-ghost` `btn-danger`
Ukuran: `btn-sm` `btn-lg` · ikon saja: `btn-icon`

**Form**
`label` · `input` · `textarea` · `select` · `hint` · `err` · `input-error`

**Badge**
`badge` + `badge-neutral` `badge-accent` `badge-ok` `badge-warn` `badge-danger` · dot: `dot`

**Tabel**
`table-wrap` > `table` (th/td otomatis) · sel khusus: `cell-strong` `cell-mono`

**Tab**
`segmented` + `segmented-item` dengan `data-active="true"`
atau `tab-underline` + `tab-underline-item` dengan `data-active="true"`

**KPI**
`kpi` > `kpi-label` / `kpi-value` / `kpi-foot`

**Lain**
`empty` + `empty-icon` · `skeleton` · `divider` · `mono` · `link` · `no-scrollbar` · `page-enter` · `stagger` (animasi baris)

Komponen React di `src/components/ui/` sudah memakai kelas ini:
`Button`, `Card` (+Header/Title/Description/Content/Footer), `Input`/`Textarea`/`Select`/`FormField`,
`Table` (+Header/Body/Row/Head/Cell), `Badge`, `StatCard`, `Tabs`, `EmptyState`, `SectionHeader`,
`CustomSelect`, `FontAwesome`. **Pakai komponen ini dulu** sebelum menulis markup manual.

---

## 4. Skala

- Radius: kartu `rounded-lg` (12px), kontrol `rounded-md` (8px), chip `rounded-full`. Tidak ada 24–28px.
- Padding kartu: `18px` (`card-body`). Jarak antar blok: `16px`, antar section: `20–24px`.
- Font size: label `11–12`, body `12.5–13.5`, judul kartu `14`, judul halaman `22`, angka KPI `26`.
- Berat: body `400/500`, label & judul `600`, judul halaman `700`. Hindari `font-black`/`font-extrabold`.
- Angka: tambahkan `tabular-nums` untuk nilai yang berubah.
- Bayangan: `shadow-xs` untuk kartu. Jangan pakai `shadow-2xl`.

---

## 5. Larangan keras

1. `bg-[#...]`, `text-[#...]`, `border-[#...]` — pakai token.
2. Prefix `dark:` untuk warna — token sudah menangani.
3. `!important` di CSS.
4. `hover:scale-*`, `group-hover:rotate-*`, animasi infinite pada ikon.
5. Gradient, glassmorphism, emoji, ilustrasi SVG dekoratif baru.
6. Menambah fitur, field, tombol, atau teks yang tidak ada sebelumnya. **Hanya presentasi.**
7. Mengubah logika: state, handler, API call, tipe, props, export, nama route.
8. Menyentuh `src/index.css`, `src/components/ui/*`, atau file halaman lain.

---

## 6. Verifikasi wajib

```bash
cd "D:/02_Project/Web Development/GovConnect/frontend"
npx tsc -b --pretty false
```

Harus keluar tanpa error. Jangan laporkan selesai sebelum ini bersih.
