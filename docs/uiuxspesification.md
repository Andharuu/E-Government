# UI/UX Specification — GovConnect
**Versi 2.0 — disesuaikan dengan PRD v3.0 (Final MVP) & Design System v2.0**

> **Catatan revisi v2.0:** Melengkapi grup field **Education** dan **Additional** pada My Profile & Profile Setup yang sebelumnya hilang (PRD §11, §21); melengkapi field **Postal Code** pada Address Step; menyamakan label sidebar "Overview" → **"Dashboard"** (PRD §10); menambahkan wireframe **Manual Override** yang sebelumnya belum ada padahal wajib pada MVP (PRD §16, FR-10); menambahkan label eksplisit **"(Estimated)"** pada KPI Estimated Time Saved (PRD §20); memisahkan istilah **Error (sistem)** vs **Failed (status autofill)** pada UI States agar tidak ambigu.

---

## 1. Tujuan UI/UX

UI/UX GovConnect dirancang untuk membuat proses pengisian formulir layanan publik menjadi:

- **Mudah** — pengguna tidak perlu mengisi data yang sama berulang kali.
- **Cepat** — proses autofill dilakukan dengan beberapa klik.
- **Terpercaya** — pengguna tetap memiliki kontrol atas data.
- **Konsisten** — Extension dan Web Dashboard menggunakan pola desain yang sama.

---

## 2. Struktur Produk

| Interface | Fungsi |
|---|---|
| Chrome Web Store | Instalasi extension |
| Extension Popup | Entry point dan autentikasi |
| Web Dashboard | Mengelola profil dan melihat aktivitas |
| Profile Setup | Mengatur data pengguna |
| Activity | Melihat riwayat penggunaan |
| Settings | Pengaturan akun dan extension |
| Extension Side Panel | Proses deteksi, mapping, dan autofill |
| Government Website | Formulir yang diisi pengguna |

---

## 3. User Flow Utama

```
Chrome Web Store
       ↓
Install Extension
       ↓
Open Extension
       ↓
Login / Create Account
       ↓
Web Dashboard
       ↓
Profile Setup
       ↓
Profile Complete
       ↓
Government Website
       ↓
Form Detection
       ↓
Side Panel
       ↓
Field Mapping
       ↓
Manual Override (jika diperlukan)
       ↓
Autofill
       ↓
Review
       ↓
User Manual Submit
       ↓
Activity Logged
```

---

## 4. Extension Popup

Popup merupakan entry point, bukan tempat utama untuk mengelola profil (PRD §9.1).

**First Launch**
```
┌──────────────────────────┐
│        GOVCONNECT        │
│                          │
│    Fill forms faster.    │
│ Keep control of your data│
│                          │
│  ┌────────────────────┐  │
│  │       Login        │  │
│  └────────────────────┘  │
│                          │
│  ┌────────────────────┐  │
│  │   Create Account   │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

**Returning User**

Jika pengguna sudah login:
```
┌──────────────────────────┐
│        GOVCONNECT        │
│                          │
│ ✓ You're logged in       │
│                          │
│ Profile       95%        │
│                          │
│ [ Open Side Panel ]      │
│                          │
│ Dashboard   Settings     │
└──────────────────────────┘
```

---

## 5. Authentication

**Login**
```
Login to GovConnect

Email
[______________________]

Password
[______________________]

[ Login ]

Don't have an account?
Create Account
```

**Register**
```
Create your account

Email
[______________________]

Password
[______________________]

Confirm Password
[______________________]

[ Create Account ]
```

Setelah berhasil login, pengguna diarahkan ke Web Dashboard.

---

## 6. Profile Setup

Profile Setup menggunakan wizard agar pengguna tidak langsung berhadapan dengan form yang panjang. Struktur field mengikuti **lengkap** PRD §11 (Identity, Address, Contact, Education, Additional).

### Step 1 — Identity
```
Profile Setup
Step 1 of 3

Identity Information

Full Name
[________________]

NIK
[________________]

Birth Place (Optional)
[________________]

Birth Date
[________________]

Gender
[ Select       ]

[ Continue ]
```

### Step 2 — Address
```
Step 2 of 3

Address Information

Address
[________________]

Province
[ Select       ]

City
[ Select       ]

District
[ Select       ]

Village
[ Select       ]

Postal Code (Optional)
[________________]

[ Back ] [ Continue ]
```

### Step 3 — Contact, Education & Additional

> Digabung dalam satu step karena seluruh field pada grup ini bersifat **Optional** (PRD §11) — konsisten dengan prinsip *Progressive Disclosure* (§17).

```
Step 3 of 3

Contact
Phone (Optional)
[________________]

Email (Optional)
[________________]

Education
NISN (Optional)
[________________]

Institution Name (Optional)
[________________]

Education Level (Optional)
[ Select       ]

Student ID (Optional)
[________________]

Additional
Occupation (Optional)
[________________]

Organization Name (Optional)
[________________]

[ Back ] [ Save Profile ]
```

Field yang tidak wajib diberi label **Optional** langsung pada nama field, sesuai prinsip Accessibility (Design System §14).

---

## 7. Dashboard

Dashboard menjadi pusat pengelolaan GovConnect.

### Layout
```
┌──────────────┬─────────────────────────────────────────────┐
│ GOVCONNECT   │ Dashboard                    Last 7 Days ▾ │
│              │                                             │
│ Dashboard    │ Welcome back!                              │
│ My Profile   │                                             │
│ Activity     │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│ Settings     │ │  47   │ │  92%  │ │2h35m* │ │  95%  │   │
│              │ │Autofill│ │Success│ │Saved  │ │Profile│   │
│              │ └───────┘ └───────┘ └───────┘ └───────┘   │
│              │                     *Estimated               │
│              │ ┌─────────────────────────────────────────┐ │
│              │ │         Autofill Activity               │ │
│              │ │              Line Chart                 │ │
│              │ └─────────────────────────────────────────┘ │
│              │                                             │
│              │ ┌────────────────┐ ┌──────────────────────┐│
│              │ │ Autofill       │ │ Most Used Fields     ││
│              │ │ Results        │ │                      ││
│              │ │ Donut Chart    │ │ Horizontal Bar       ││
│              │ └────────────────┘ └──────────────────────┘│
│              │                                             │
│              │ Recent Activity                             │
└──────────────┴─────────────────────────────────────────────┘
```

> Sidebar item disamakan menjadi **"Dashboard"** (bukan "Overview") agar konsisten dengan navigasi resmi PRD §10 dan Design System §10.1. Label **"Estimated"** pada KPI *Estimated Time Saved* wajib ditampilkan sesuai catatan PRD §20.

### Dashboard Components

**KPI Cards**
- Total Autofill
- Success Rate
- Estimated Time Saved *(harus berlabel "Estimated")*
- Profile Completion

**Charts**
- Autofill Activity
- Autofill Results
- Most Used Fields
- Autofill by Website

**Recent Activity**
Menampilkan aktivitas terbaru tanpa menampilkan nilai data pribadi.

---

## 8. My Profile

Digunakan untuk melihat dan mengubah data yang digunakan oleh autofill. Struktur field disamakan **lengkap** dengan PRD §11 dan skema `profiles` (PRD §21) — sebelumnya grup Education dan Additional belum tercantum.

```
My Profile

Identity
────────────────────────────
Full Name       [__________]
NIK             [__________]
Birth Place     [__________]
Birth Date      [__________]
Gender          [__________]

Address
────────────────────────────
Address         [__________]
Province        [__________]
City            [__________]
District        [__________]
Village         [__________]
Postal Code     [__________]

Contact
────────────────────────────
Phone           [__________]
Email           [__________]

Education
────────────────────────────
NISN                    [__________]
Institution Name        [__________]
Education Level         [__________]
Student ID              [__________]

Additional
────────────────────────────
Occupation              [__________]
Organization Name       [__________]

                    [Save Changes]
```

---

## 9. Activity

Menampilkan histori penggunaan autofill.

```
Activity

Filter: [Last 7 Days ▾] [Website ▾]

┌──────────────┬────────────┬────────┬─────────┐
│ Website      │ Date       │ Fields │ Status  │
├──────────────┼────────────┼────────┼─────────┤
│ service.go.id│ Sep 8 2026 │ 5/6    │ Partial │
│ layanan.go.id│ Sep 7 2026 │ 8/8    │ Success │
└──────────────┴────────────┴────────┴─────────┘
```

Status pada kolom ini mengikuti **Activity Status** (Design System §9.1: Success · Partial · Failed). Activity hanya menyimpan metadata penggunaan, bukan nilai data pribadi (PRD §18).

---

## 10. Settings

> Ditambahkan sebagai kelengkapan minimal — PRD §27 menyebut "Settings dasar" tanpa merinci isi, sehingga struktur berikut adalah inferensi wajar dari kebutuhan akun & extension. Mohon dikonfirmasi bila tim produk sudah punya rincian tersendiri.

```
Settings

Account
────────────────────────────
Email           [__________]
[ Change Password ]

Extension
────────────────────────────
Connection Status    ✓ Connected

                    [ Logout ]
```

---

## 11. Extension Side Panel

Side Panel merupakan UI utama saat pengguna melakukan autofill (PRD §9.2).

**Form Detected**
```
┌─────────────────────────────┐
│ GovConnect                  │
│ Government Service          │
│                             │
│ ✓ 6 fields detected         │
│                             │
│ ☑ NIK                       │
│ ☑ Nama Lengkap              │
│ ☑ Tanggal Lahir              │
│ ☑ Alamat                    │
│ ☑ Email                     │
│ ☐ NISN                      │
│                             │
│ [ Fill Selected Fields ]    │
└─────────────────────────────┘
```

Pengguna dapat memilih field yang ingin diisi.

---

## 12. Field Mapping

Sebelum autofill, sistem mencocokkan field website dengan profile GovConnect (PRD §14).

```
Website Field
      ↓
Field Detection
      ↓
Field Mapping
      ↓
GovConnect Profile
```

Contoh:
```
"Nomor Induk Kependudukan"
              ↓
             NIK
              ↓
       profile.nik
```

Jika mapping tidak yakin, pengguna dapat melakukan **manual override** (lihat §12.1).

### 12.1 Manual Override *(baru — sebelumnya belum ada wireframe)*

Ditampilkan ketika status field adalah **Potential Match** atau **Not Found** (Design System §9.2), sesuai PRD §16/FR-10.

```
⚠ Nomor KTP  →  Potential Match: NIK

[ Confirm Mapping ]   [ Change Mapping ▾ ]

Change Mapping ▾
┌─────────────────────────┐
│ NIK                     │
│ Full Name               │
│ Birth Date              │
│ Address                 │
│ ...                     │
│ Skip this field         │
└─────────────────────────┘
```

Setelah dikonfirmasi, mapping tersimpan sebagai **override khusus untuk pengguna tersebut** pada website terkait (`field_mappings.user_id`, PRD §14 & §21), dan akan digunakan secara otomatis pada kunjungan berikutnya ke website yang sama — pengguna tidak perlu mengulang override.

---

## 13. Autofill Result

Setelah proses autofill:

```
┌─────────────────────────────┐
│ Autofill Complete           │
│                             │
│ ✓ 5 fields filled           │
│ ⚠ 1 field skipped           │
│                             │
│ ✓ NIK                       │
│ ✓ Nama Lengkap               │
│ ✓ Tanggal Lahir               │
│ ✓ Alamat                    │
│ ✓ Email                     │
│ ○ NISN — Not found          │
│                             │
│ Review the form before      │
│ submitting                  │
└─────────────────────────────┘
```

Status per field mengikuti **Field-Level Status** (Design System §9.2). Tidak ada tombol *Submit Government Form* di GovConnect — pengguna tetap melakukan submit secara manual pada website pemerintah (PRD §15, §17, FR-13).

---

## 14. Website Tidak Didukung

Jika form tidak dapat dikenali (Design System §9.3):

```
┌─────────────────────────────┐
│ GovConnect                  │
│                             │
│ Website belum didukung      │
│                             │
│ GovConnect belum dapat      │
│ mengenali form pada         │
│ website ini.                │
│                             │
│ [ Back ]                    │
└─────────────────────────────┘
```

---

## 15. UI States

Dipisah menjadi dua kelompok agar tidak tercampur dengan status Activity/Field/Website pada Design System §9:

### 15.1 Generic Component States

| State | Contoh |
|---|---|
| Default | Tampilan normal |
| Loading | Sedang mengambil data |
| Empty | Belum terdapat data |
| Disabled | Fitur tidak tersedia |
| Error | Kegagalan sistem/koneksi (bukan status autofill — lihat §15.2) |

### 15.2 Domain Status (referensi ke Design System §9)

| State | Sumber |
|---|---|
| Success / Partial / Failed | Activity Status (§9.1) |
| Matched / Filled / Potential Match / Not Found / Skipped | Field-Level Status (§9.2) |
| Unsupported | Website Support Status (§9.3) |

> Perbedaan ini penting: *"Error"* (§15.1) adalah kegagalan teknis (mis. server tidak dapat dihubungi — lihat contoh toast §16), sedangkan *"Failed"* (§15.2) adalah hasil proses autofill yang memang tidak berhasil memetakan field. Menyamakan keduanya berisiko membingungkan pengguna saat troubleshooting.

---

## 16. Feedback & Notification

Gunakan Toast untuk feedback singkat.

Contoh:
```
✓ Profile updated successfully
```
atau:
```
✓ 5 fields filled successfully
```

Error (sistem, bukan status autofill — lihat §15):
```
⚠ Unable to connect to GovConnect server
```

Feedback tidak boleh mengganggu proses pengguna.

---

## 17. Responsive Behavior

**Desktop** — Dashboard menggunakan sidebar + content area.

**Tablet** — Sidebar dapat diperkecil atau diubah menjadi navigation drawer.

**Mobile** — Dashboard menggunakan layout satu kolom.

**Extension** — Side Panel menggunakan layout vertikal yang compact dan memprioritaskan:
```
Status
  ↓
Detected Fields
  ↓
Primary Action
  ↓
Result
```

---

## 18. UX Rules

1. **No Auto Submit** — GovConnect tidak pernah mengirim formulir secara otomatis.
2. **User Review** — pengguna selalu memeriksa data sebelum submit.
3. **Clear Status** — setiap hasil autofill harus memiliki status yang jelas (§15.2).
4. **Minimal Interaction** — autofill idealnya selesai dalam beberapa klik.
5. **Data Control** — pengguna dapat mengubah, mengoreksi (manual override, §12.1), atau menghapus profile.
6. **No Personal Data in Activity** — activity hanya menyimpan metadata.
7. **Consistent UI** — Extension dan Dashboard menggunakan design system yang sama.
8. **Progressive Disclosure** — tampilkan informasi penting terlebih dahulu, detail hanya ketika diperlukan.

---

## 19. Final UI/UX Structure

```
GOVCONNECT
│
├── Chrome Extension
│   ├── Popup
│   │   ├── Login
│   │   ├── Create Account
│   │   └── Extension Status
│   │
│   └── Side Panel
│       ├── Form Detection
│       ├── Field Selection
│       ├── Field Mapping
│       ├── Manual Override
│       ├── Autofill
│       └── Autofill Result
│
└── Web Dashboard
    ├── Authentication
    ├── Profile Setup
    ├── Dashboard
    ├── My Profile
    ├── Activity
    └── Settings
```

Inti UX GovConnect: Profile sekali → buka website pemerintah → GovConnect mendeteksi form → pilih field → (opsional) override mapping → autofill → review → pengguna submit sendiri.

---

## Ringkasan Perubahan dari v1.0 → v2.0

| Aspek | v1.0 | v2.0 (dokumen ini) |
|---|---|---|
| Sidebar / struktur nav | "Overview" | **"Dashboard"** — disamakan dengan PRD §10 & Design System §10.1 |
| My Profile | 3 grup field (Identity, Address, Contact) | **5 grup field** — ditambahkan **Education** dan **Additional** (PRD §11, §21) |
| Profile Setup Step 2 | Tanpa Postal Code | **Ditambahkan Postal Code (Optional)** |
| Profile Setup Step 3 | Phone, Email, NISN, Institution | **Dilengkapi**: + Education Level, Student ID, Occupation, Organization Name |
| Manual Override | Tidak ada wireframe | **Ditambahkan §12.1** — wireframe lengkap + penjelasan penyimpanan per-user (PRD §14, §16) |
| Settings | Hanya disebut di struktur nav, tanpa isi | **Ditambahkan wireframe minimal** (asumsi — perlu konfirmasi tim produk) |
| KPI Estimated Time Saved | Tanpa label estimasi | **Ditambahkan label "(Estimated)"** sesuai PRD §20 |
| UI States | 1 tabel campuran (termasuk "Error" & "Partial") | **Dipisah**: Generic Component States vs Domain Status (referensi ke Design System §9), agar "Error" (sistem) tidak tertukar dengan "Failed" (status autofill) |