# Design System — GovConnect
**Versi 2.0 — disesuaikan dengan PRD v3.0 (Final MVP)**

> **Catatan revisi v2.0:** Menyamakan nomenklatur navigasi dengan PRD (§10), memisahkan sistem badge/status menjadi tiga level yang berbeda sesuai PRD (§16, §17, §19), melengkapi spesifikasi Side Panel (popup, checklist field, hasil autofill) sesuai PRD §9.2, menambahkan catatan "estimasi" pada KPI Estimated Time Saved (PRD §20), serta melengkapi Component Structure dengan Field Mapping/Manual Override dan Unsupported State yang sebelumnya belum tercantum.

---

## 1. Design Principles

GovConnect menggunakan prinsip:

- **Simple** — tampilan mudah dipahami.
- **Clean** — minim elemen yang tidak diperlukan.
- **Trustworthy** — memberikan kesan aman dan terpercaya.
- **Consistent** — komponen memiliki pola visual yang sama.
- **Accessible** — teks dan kontrol mudah dibaca serta digunakan.

Prinsip ini juga menopang UX Principles pada PRD §31: *User in Control*, *No Silent Action*, *Review Before Submit*, *Minimal Complexity*, *Clear Feedback*, *Privacy by Design*.

---

## 2. Color System

| Token | Warna | Penggunaan |
|---|---|---|
| Primary | #2563EB | Tombol utama, link, active state |
| Primary Dark | #1D4ED8 | Hover / pressed |
| Background | #F8FAFC | Background dashboard |
| Surface | #FFFFFF | Card, form, panel |
| Text Primary | #0F172A | Judul dan teks utama |
| Text Secondary | #64748B | Deskripsi dan secondary text |
| Border | #E2E8F0 | Border input dan card |
| Success | #16A34A | Autofill berhasil, field terisi |
| Warning | #F59E0B | Partial / potential match / perlu perhatian |
| Error | #DC2626 | Error / gagal |
| Neutral | #94A3B8 | Not Found, Skipped, Unsupported (status netral, bukan kegagalan sistem) |

Prinsip: warna status digunakan secara konsisten pada seluruh extension dan dashboard, mengikuti tiga level status pada §9.

---

## 3. Typography

Gunakan **system font stack** sebagai font utama.

| Element | Size | Weight |
|---|---|---|
| H1 | 32px | 700 |
| H2 | 24px | 600 |
| H3 | 20px | 600 |
| Body | 14–16px | 400 |
| Small | 12px | 400 |
| Button | 14px | 500 |
| Caption | 12px | 400 |

Contoh hierarki:

```
Dashboard
24px / Semibold

Welcome back!
14px / Regular

Total Autofill
12px / Regular

47
24px / Semibold
```

---

## 4. Spacing System

Gunakan basis 4px.

```
4px   → XS
8px   → SM
12px  → MD
16px  → LG
24px  → XL
32px  → 2XL
48px  → 3XL
```

Contoh:
- Padding input: 12px
- Gap antar form: 16px
- Padding card: 24px
- Gap antar section: 32px

---

## 5. Border & Radius

| Component | Radius |
|---|---|
| Input | 8px |
| Button | 8px |
| Card | 12px |
| Side Panel | 12px |
| Badge | 999px |

Gunakan border tipis: `1px solid #E2E8F0`

Shadow digunakan secara minimal agar tampilan tetap clean.

---

## 6. Button

**Primary**
```
┌──────────────────────────┐
│     Fill Selected Fields │
└──────────────────────────┘
```
Digunakan untuk aksi utama (mis. autofill pada Side Panel — PRD §9.2).

**Secondary**
```
┌──────────────────────────┐
│          Cancel          │
└──────────────────────────┘
```
Digunakan untuk aksi alternatif.

**Danger**
Digunakan untuk aksi seperti menghapus field mapping/override (PRD §16) atau logout.

Button memiliki state: Default → Hover → Active → Disabled → Loading

---

## 7. Input

Format standar:

```
Nama Lengkap
┌────────────────────────────────┐
│ Andharu Raffi                  │
└────────────────────────────────┘
```

State: Default · Focus · Filled · Error · Disabled

Error:

```
NIK
┌────────────────────────────────┐
│ 12345                          │
└────────────────────────────────┘
NIK harus terdiri dari 16 digit.
```

---

## 8. Card

Card digunakan untuk KPI, informasi profil, dan section dashboard.

```
┌──────────────────────────────┐
│ Total Autofill               │
│                              │
│ 47                           │
│ +12% this month              │
└──────────────────────────────┘
```

**KPI Card pada Dashboard Overview (PRD §10):**
- Total Autofill
- Success Rate
- Estimated Time Saved *(harus ditandai eksplisit sebagai estimasi — lihat catatan di bawah)*
- Profile Completion

> **Catatan khusus — Estimated Time Saved:** sesuai PRD §20, metrik ini adalah estimasi, bukan pengukuran aktual. Card harus menampilkan label kecil "(Estimated)" di bawah angka, menggunakan Caption 12px / Text Secondary, agar tidak disalahartikan sebagai data terukur presisi.

```
┌──────────────────────────────┐
│ Estimated Time Saved         │
│                              │
│ 12,5 menit                   │
│ Estimated · bulan ini        │
└──────────────────────────────┘
```

Karakteristik card:
- Background putih
- Border 1px
- Radius 12px
- Padding 24px
- Shadow ringan atau tanpa shadow

---

## 9. Badge & Status

PRD mendefinisikan **tiga level status yang berbeda konteks** (§16, §17, §19). Sebelumnya kelima status ini dicampur dalam satu tabel — pada versi ini dipisah agar tidak ambigu saat diimplementasikan.

### 9.1 Activity Status *(level: riwayat/log autofill — PRD §19)*

| Status | Ikon | Warna | Penggunaan |
|---|---|---|---|
| Success | ✓ | Success (#16A34A) | Semua field yang dapat dipetakan berhasil diisi |
| Partial | ⚠ | Warning (#F59E0B) | Sebagian field berhasil diisi |
| Failed | ✕ | Error (#DC2626) | Autofill tidak berhasil dilakukan |

Digunakan pada Activity History dan Dashboard Analytics.

### 9.2 Field-Level Status *(level: per-field pada Side Panel — PRD §16)*

| Status | Ikon | Warna | Penggunaan |
|---|---|---|---|
| Matched | ✓ | Success (#16A34A) | Field website berhasil dipetakan ke profil |
| Filled | ✓ | Success (#16A34A) | Field berhasil diisi |
| Potential Match | ⚠ | Warning (#F59E0B) | Pemetaan belum pasti, perlu konfirmasi pengguna |
| Not Found | ○ | Neutral (#94A3B8) | Field tidak ditemukan pada form |
| Skipped | ○ | Neutral (#94A3B8) | Field sengaja dilewati oleh pengguna |

Digunakan pada checklist field di Side Panel (lihat §10.2).

### 9.3 Website Support Status *(level: halaman/website — PRD §17)*

| Status | Ikon | Warna | Penggunaan |
|---|---|---|---|
| Unsupported | — | Neutral (#94A3B8) | Struktur form pada website belum dapat dikenali |

Status ini ditampilkan sebagai empty state pada Side Panel, bukan sebagai badge inline (lihat §10.2).

> Semua status harus menggunakan **ikon + teks**, tidak hanya warna (selaras dengan Accessibility §14 dan PRD §31 poin 5 — Clear Feedback).

---

## 10. Navigation

### 10.1 Web Dashboard

Sidebar (disamakan dengan penamaan menu pada PRD §10):

```
GOVCONNECT

Dashboard
My Profile
Activity
Settings
────────────
Logout
```

Active menu ditandai dengan:
- Background primary ringan
- Text primary
- Icon aktif

### 10.2 Extension

**Popup** — entry point & authentication gateway (PRD §9.1):

```
GovConnect

Fill forms faster.
Keep control of your data.

[ Login ]
[ Create Account ]
```

**Side Panel** — workspace utama autofill (PRD §9.2). Terdiri dari 3 state:

**State 1 — Field terdeteksi (sebelum autofill):**
```
GovConnect
Government Service

✓ 6 fields detected

☑ NIK
☑ Nama Lengkap
☑ Tanggal Lahir
☑ Alamat
☑ Email
☐ NISN

[ Fill Selected Fields ]
```

**State 2 — Hasil autofill (setelah autofill, menggunakan Field-Level Status §9.2):**
```
Autofill Complete

✓ 5 fields filled
⚠ 1 field skipped

✓ NIK
✓ Nama Lengkap
✓ Tanggal Lahir
✓ Alamat
✓ Email
○ NISN — Not found

Review the form before submitting
```

**State 3 — Website belum didukung (Website Support Status §9.3):**
```
GovConnect

Website belum didukung

GovConnect belum dapat mengenali
form pada website ini.
```

Ketiga state menggunakan komponen dasar yang sama (checkbox, badge, button) agar tetap konsisten dengan design token.

---

## 11. Charts

Dashboard menggunakan **Recharts**, sesuai dengan 4 kategori Analytics pada PRD §10:

| Chart | Fungsi (PRD §10) |
|---|---|
| Line Chart | Autofill Activity |
| Donut Chart | Autofill Results |
| Horizontal Bar | Most Used Fields |
| Horizontal Bar | Autofill by Website |

Chart harus memiliki:
- Judul
- Legend jika diperlukan
- Tooltip
- Label yang jelas
- Empty state jika belum ada data

---

## 12. Iconography

Gunakan icon set yang konsisten, misalnya **Lucide Icons**.

| Elemen | Icon |
|---|---|
| Dashboard | LayoutDashboard |
| Profile | User |
| Activity | History |
| Settings | Settings |
| Matched / Filled / Success | Check |
| Potential Match / Partial | AlertTriangle |
| Failed / Error | XCircle |
| Not Found / Skipped / Unsupported | Circle |

Hindari penggunaan terlalu banyak jenis icon dalam satu halaman.

---

## 13. Responsive Design

Dashboard harus mendukung:

```
Desktop
   ↓
Tablet
   ↓
Mobile
```

Untuk Chrome Extension, desain harus tetap nyaman pada ukuran side panel yang relatif sempit.

Prioritas:
1. Informasi penting
2. Aksi utama
3. Status
4. Informasi tambahan

---

## 14. Accessibility

Standar dasar:
- Kontras teks yang cukup.
- Semua input memiliki label.
- Tombol memiliki nama yang jelas.
- Jangan hanya menggunakan warna untuk menunjukkan status (lihat §9).
- Focus state harus terlihat.
- Ukuran teks minimal nyaman dibaca.

---

## 15. Component Structure

```
Design System
│
├── Typography
├── Colors
├── Spacing
├── Buttons
├── Inputs
├── Cards
├── Badges
│   ├── Activity Status
│   ├── Field-Level Status
│   └── Website Support Status
├── Tables
├── Navigation
├── Field Mapping / Manual Override      ← baru (PRD §14, §16)
├── Modal
├── Toast
├── Empty State
│   └── Unsupported Website              ← baru (PRD §17)
├── Loading State
└── Charts
```

---

## 16. Visual Direction

Secara keseluruhan, GovConnect menggunakan gaya: **Clean, modern, minimal, professional, dan trustworthy.**

Desain harus terasa seperti produk productivity/fintech modern, bukan seperti portal pemerintahan yang penuh tabel dan elemen visual. Extension dan dashboard harus menggunakan design token dan komponen yang sama agar keduanya terasa sebagai satu produk.

---

## Ringkasan Perubahan dari v1.0 → v2.0

| Aspek | v1.0 | v2.0 (dokumen ini) |
|---|---|---|
| Sidebar nav | "Overview" | **"Dashboard"** — disamakan dengan PRD §10 |
| Icon nav | Overview → LayoutDashboard | **Dashboard → LayoutDashboard** |
| Badge & Status | 1 tabel campuran (Success, Partial, Failed, Not Found, Unsupported) | **3 level terpisah**: Activity Status, Field-Level Status, Website Support Status (PRD §16, §17, §19) |
| Warna status | Tanpa token netral | **Ditambahkan token Neutral (#94A3B8)** untuk Not Found/Skipped/Unsupported |
| Side Panel | Disebut sekilas ("digunakan untuk proses autofill") | **Dijabarkan 3 state**: field terdeteksi, hasil autofill, unsupported (PRD §9.2, §17) |
| KPI Card | Contoh generik (Total Autofill) | **Ditambahkan 4 KPI resmi** + catatan wajib "(Estimated)" untuk Estimated Time Saved (PRD §20) |
| Component Structure | Tidak ada Field Mapping/Override & Unsupported State | **Ditambahkan** keduanya sebagai komponen eksplisit (PRD §14, §16, §17) |