"""Router untuk jadwal & agenda layanan publik Indonesia."""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Literal

router = APIRouter(prefix="/public-services", tags=["Layanan Publik"])


class AgendaItem(BaseModel):
    id: int
    title: str
    agency: str
    agency_url: str
    logo_url: str
    category: str
    deadline: str
    description: str
    importance: Literal["tinggi", "sedang", "biasa"]
    url: str


class CategoryInfo(BaseModel):
    id: str
    label: str
    icon: str
    color: str
    count: int


class PublicServicesResponse(BaseModel):
    categories: list[CategoryInfo]
    agendas: list[AgendaItem]


def _build_agendas() -> list[dict]:
    """Data statis jadwal layanan publik Indonesia — dapat diperbarui secara periodik."""
    return [
        # ─── PENDIDIKAN ───
        {
            "id": 1,
            "title": "Pendaftaran SNMPTN / SBMPTN / Mandiri",
            "agency": "LTMPT (Kementerian Pendidikan)",
            "agency_url": "https://ltmpt.ac.id",
            "logo_url": "/logos/kemendikbud.svg",
            "category": "pendidikan",
            "deadline": "Februari – Maret 2026 (SNBP / SNBT)",
            "description": "Pendaftaran seleksi nasional masuk perguruan tinggi negeri. Periode berbeda tiap gelombang.",
            "importance": "tinggi",
            "url": "https://portal.ltmpt.ac.id",
        },
        {
            "id": 2,
            "title": "Penerimaan CASN & PPPK",
            "agency": "BKN (Badan Kepegawaian Negara)",
            "logo_url": "/logos/bkn.png",
            "agency_url": "https://sscasn.bkn.go.id",
            "category": "pendidikan",
            "deadline": "Agustus – Oktober 2026 (Seleksi Nasional)",
            "description": "Seleksi CASN dan PPPK nasional untuk formasi guru, kesehatan, dan teknis.",
            "importance": "tinggi",
            "url": "https://sscasn.bkn.go.id",
        },
        {
            "id": 3,
            "title": "Pendaftaran PPG Prajabatan / Dalam Jabatan",
            "agency": "Kementerian Pendidikan & Budaya",
            "logo_url": "/logos/kemendikbud.svg",
            "agency_url": "https://ppg.kemendikbud.go.id",
            "category": "pendidikan",
            "deadline": "Mei – Juli 2026 (Gelombang 1 & 2)",
            "description": "Program Pendidikan Profesi Guru untuk fresh graduate dan guru dalam jabatan.",
            "importance": "sedang",
            "url": "https://ppg.kemendikbud.go.id",
        },
        {
            "id": 4,
            "title": "Beasiswa LPDP / Kuttab / lainnya",
            "agency": "LPDP Kemendikbud",
            "logo_url": "/logos/lpdp.png",
            "agency_url": "https://beasiswalpdp.net",
            "category": "pendidikan",
            "deadline": "Tahap 1 (Februari) & Tahap 2 (Juli 2026)",
            "description": "Beasiswa tugas belajar dan izin belajar LPDP untuk jenjang S2 & S3 dalam/luar negeri.",
            "importance": "sedang",
            "url": "https://www.lpdp.go.id",
        },
        # ─── EKONOMI & KEUANGAN ───
        {
            "id": 10,
            "title": "Pelaporan SPT Tahunan PPh Orang Pribadi",
            "agency": "DJP (Direktorat Jenderal Pajak)",
            "logo_url": "/logos/pajak.svg",
            "agency_url": "https://pajak.go.id",
            "category": "ekonomi",
            "deadline": "31 Maret setiap tahun",
            "description": "Kewajiban pelaporan SPT tahunan WP Orang Pribadi melalui DJP Online / CoreTax.",
            "importance": "tinggi",
            "url": "https://djponline.pajak.go.id",
        },
        {
            "id": 11,
            "title": "Pencatatan NPWP & PKP",
            "agency": "DJP (Direktorat Jenderal Pajak)",
            "logo_url": "/logos/pajak.svg",
            "agency_url": "https://pajak.go.id",
            "category": "ekonomi",
            "deadline": "Berkala / saat dibutuhkan",
            "description": "Pendaftaran NPWP dan pengajuan PKP (Pengusaha Kena Pajak) bagi wajib pajak baru.",
            "importance": "tinggi",
            "url": "https://ereg.pajak.go.id",
        },
        {
            "id": 12,
            "title": "Pelaporan SPT Masa PPh Pasal 21/23/26",
            "agency": "DJP (Direktorat Jenderal Pajak)",
            "logo_url": "/logos/pajak.svg",
            "agency_url": "https://pajak.go.id",
            "category": "ekonomi",
            "deadline": "Setiap tanggal 10 bulan berikutnya",
            "description": "Pelaporan SPT Masa PPh untuk pemotongan pihak perusahaan/institusi.",
            "importance": "sedang",
            "url": "https://djponline.pajak.go.id",
        },
        {
            "id": 13,
            "title": "Pendaftaran NIB / Izin Usaha via OSS",
            "agency": "BKPM / Lembaga OSS",
            "logo_url": "/logos/bkpm.svg",
            "agency_url": "https://oss.go.id",
            "category": "ekonomi",
            "deadline": "Berkala",
            "description": "Pendaftaran Nomor Induk Berusaha dan izin usaha melalui sistem OSS RBA.",
            "importance": "sedang",
            "url": "https://oss.go.id",
        },
        {
            "id": 14,
            "title": "Pencatatan Laporan Keuangan Nonprofit",
            "agency": "Kemkeu / DJPK",
            "logo_url": "/logos/kemenkeu.svg",
            "agency_url": "https://djpk.kemenkeu.go.id",
            "category": "ekonomi",
            "deadline": "Setiap tahun fiskal",
            "description": "Kewajiban pelaporan keuangan untuk lembaga nonprofit dan organisasi pemerintah.",
            "importance": "biasa",
            "url": "https://djpk.kemenkeu.go.id",
        },
        # ─── ADMINISTRASI & KEPENDUDUKAN ───
        {
            "id": 20,
            "title": "Penerbitan KTP-El & KK Baru",
            "agency": "Ditjen Dukcapil Kemendagri",
            "logo_url": "/logos/dukcapil.svg",
            "agency_url": "https://dukcapil.kemendagri.go.id",
            "category": "administrasi",
            "deadline": "Sesuai kebutuhan / 14 hari",
            "description": "Pembuatan KTP Elektronik dan Kartu Keluarga baru di Disdukcapil.",
            "importance": "tinggi",
            "url": "https://dukcapil.kemendagri.go.id",
        },
        {
            "id": 21,
            "title": "Aktivasi Identitas Kependudukan Digital (IKD)",
            "agency": "Ditjen Dukcapil Kemendagri",
            "logo_url": "/logos/dukcapil.svg",
            "agency_url": "https://dukcapil.kemendagri.go.id",
            "category": "administrasi",
            "deadline": "Berkala 2026",
            "description": "Aktivasi IKD melalui aplikasi Identitas Kependudukan Digital di smartphone.",
            "importance": "sedang",
            "url": "https://ikd.dukcapil.go.id",
        },
        {
            "id": 22,
            "title": "Penerbitan Akta Kelahiran / Kematian",
            "agency": "Ditjen Dukcapil Kemendagri",
            "logo_url": "/logos/dukcapil.svg",
            "agency_url": "https://dukcapil.kemendagri.go.id",
            "category": "administrasi",
            "deadline": "60 hari (kelahiran) / segera (kematian)",
            "description": "Pendaftaran akta kelahiran dan kematian di Dinas Kependudukan.",
            "importance": "tinggi",
            "url": "https://dukcapil.kemendagri.go.id",
        },
        {
            "id": 23,
            "title": "Penerbitan Paspor RI ( Baru / Perpanjangan)",
            "agency": "Ditjen Imigrasi",
            "logo_url": "/logos/imigrasi.svg",
            "agency_url": "https://imigrasi.go.id",
            "category": "administrasi",
            "deadline": "Sesuai jadwal booking",
            "description": "Pengajuan paspor biasa baru, perpanjangan, dan pergantian akibat penuh/habis.",
            "importance": "sedang",
            "url": "https://www.imigrasi.go.id",
        },
        {
            "id": 24,
            "title": "Penerbitan Visa & ITAS / ITAP",
            "agency": "Ditjen Imigrasi",
            "logo_url": "/logos/imigrasi.svg",
            "agency_url": "https://imigrasi.go.id",
            "category": "administrasi",
            "deadline": "Sebelum masa berlaku habis",
            "description": "Permohonan visa baru, Itas (Izin Tinggal Terbatas), dan ITAP (Izin Tinggal Tetap).",
            "importance": "sedang",
            "url": "https://imigrasi.go.id",
        },
        # ─── KESEHATAN ───
        {
            "id": 30,
            "title": "Pendaftaran & Validasi BPJS Kesehatan",
            "agency": "BPJS Kesehatan",
            "logo_url": "/logos/bpjs.svg",
            "agency_url": "https://bpjs-kesehatan.go.id",
            "category": "kesehatan",
            "deadline": "Setiap bulan (pembayaran iuran)",
            "description": "Pendaftaran peserta baru, validasi, dan pembayaran iuran BPJS Kesehatan.",
            "importance": "tinggi",
            "url": "https://bpjs-kesehatan.go.id",
        },
        {
            "id": 31,
            "title": "Pendaftaran & Validasi BPJS Ketenagakerjaan",
            "agency": "BPJS Ketenagakerjaan",
            "logo_url": "/logos/bpjs-ketenagakerjaan.svg",
            "agency_url": "https://bpjsketenagakerjaan.go.id",
            "category": "kesehatan",
            "deadline": "Saat onboarding karyawan baru",
            "description": "Pendaftaran program JHT, JP, JKK, JKM, dan JPK bagi pekerja formal.",
            "importance": "tinggi",
            "url": "https://bpjs-ketenagakerjaan.go.id",
        },
        {
            "id": 32,
            "title": "Pemeriksaan & Layanan Kesehatan Gratis (Pemkab/Pemkot)",
            "agency": "Dinas Kesehatan Daerah",
            "logo_url": "/logos/kemenkes.svg",
            "agency_url": "https://kemkes.go.id",
            "category": "kesehatan",
            "deadline": "Senin – Sabtu (08.00 – 14.00 WIB) / UGD 24 Jam",
            "description": "Program pengobatan gratis, screening kesehatan, dan jaminan kesehatan daerah.",
            "importance": "sedang",
            "url": "https://www.kemkes.go.id",
        },
        # ─── PERIZINAN ───
        {
            "id": 40,
            "title": "Perpanjangan & Penertiban IMB / PBG",
            "agency": "Dinas PU / Cipta Karya Daerah",
            "logo_url": "/logos/pupr.svg",
            "agency_url": "https://ciptakarya.pu.go.id",
            "category": "perizinan",
            "deadline": "Berkala",
            "description": "Penerbitan Persetujuan Bangunan Gedung (PBG) atau perpanjangan IMB.",
            "importance": "sedang",
            "url": "https://air.bangunan.pu.go.id",
        },
        {
            "id": 41,
            "title": "Penerbitan SIUP / NIB untuk UMKM",
            "agency": "DPMPTSP / OSS",
            "logo_url": "/logos/bkpm.svg",
            "agency_url": "https://oss.go.id",
            "category": "perizinan",
            "deadline": "Saat pendirian usaha",
            "description": "Pendaftaran NIB dan SIUP untuk pelaku usaha mikro, kecil, dan menengah.",
            "importance": "sedang",
            "url": "https://oss.go.id",
        },
        {
            "id": 42,
            "title": "Penerbitan STNK & Plat Kendaraan Baru / Perpanjangan",
            "agency": "Korlantas POLRI",
            "logo_url": "/logos/polri.svg",
            "agency_url": "https://polri.go.id",
            "category": "perizinan",
            "deadline": "Setiap 5 tahun (plat) / tahunan (pajak)",
            "description": "Pendaftaran kendaraan baru, mutasi, dan perpanjangan STNK serta plat nomor.",
            "importance": "tinggi",
            "url": "https://etiket.polri.go.id",
        },
        {
            "id": 43,
            "title": "Penerbitan Surat Keterangan Catatan Kepolisian (SKCK)",
            "agency": "Kepolisian RI (POLRI)",
            "logo_url": "/logos/polri.svg",
            "agency_url": "https://polri.go.id",
            "category": "perizinan",
            "deadline": "Saat dibutuhkan",
            "description": "Pengajuan SKCK untuk melamar kerja, visa, atau keperluan administratif lainnya.",
            "importance": "biasa",
            "url": "https://skck.polri.go.id",
        },
        # ─── SOSIAL & PROGRAM ───
        {
            "id": 50,
            "title": "Pendaftaran Program Keluarga Harapan (PKH)",
            "agency": "Kemensos RI",
            "logo_url": "/logos/kemensos.svg",
            "agency_url": "https://kemensos.go.id",
            "category": "sosial",
            "deadline": "Penyaluran Triwulan (Tahap 1 – 4 Tahun 2026)",
            "description": "Bantuan sosial bersyarat untuk keluarga miskin dengan verifikasi DTKS.",
            "importance": "sedang",
            "url": "https://bansos.kemensos.go.id",
        },
        {
            "id": 51,
            "title": "Pendaftaran Kartu Indonesia Pintar (KIP) & Prakerja",
            "agency": "Kemensos / Manajemen Pelaksana KIP",
            "logo_url": "/logos/kemensos.svg",
            "agency_url": "https://prakerja.go.id",
            "category": "sosial",
            "deadline": "Gelombang Aktif Dibuka Setiap Bulan",
            "description": "Pendaftaran KIP untuk pelajar/mahasiswa dan Program Kartu Prakerja untuk pencari kerja.",
            "importance": "sedang",
            "url": "https://kip.kemendikbud.go.id",
        },
        {
            "id": 52,
            "title": "Validasi & Pembaruan Data DTKS / Data Terpadu Kesejahteraan",
            "agency": "Kemensos RI",
            "logo_url": "/logos/kemensos.svg",
            "agency_url": "https://kemensos.go.id",
            "category": "sosial",
            "deadline": "Berkala / tahunan",
            "description": "Validasi data keluarga penerima manfaat program kesejahteraan sosial.",
            "importance": "sedang",
            "url": "https://dtks.kemensos.go.id",
        },
    ]


CATEGORIES = {
    "pendidikan": {"id": "pendidikan", "label": "Pendidikan", "icon": "graduation-cap", "color": "#3B82F6"},
    "ekonomi":    {"id": "ekonomi",    "label": "Ekonomi & Keuangan", "icon": "wallet", "color": "#10B981"},
    "administrasi": {"id": "administrasi", "label": "Administrasi & Kependudukan", "icon": "id-card", "color": "#8B5CF6"},
    "kesehatan":  {"id": "kesehatan",  "label": "Kesehatan & BPJS", "icon": "heart-pulse", "color": "#EF4444"},
    "perizinan":   {"id": "perizinan",   "label": "Perizinan & Regulasi", "icon": "file-check", "color": "#F59E0B"},
    "sosial":     {"id": "sosial",     "label": "Sosial & Program Pemerintah", "icon": "hand-heart", "color": "#06B6D4"},
}


@router.get("", response_model=PublicServicesResponse)
def get_public_services():
    """
    Mengembalikan seluruh jadwal & agenda layanan publik Indonesia
    yang terorganisir berdasarkan kategori.
    """
    agendas = _build_agendas()

    categories = []
    for cat_id, cat_meta in CATEGORIES.items():
        count = sum(1 for a in agendas if a["category"] == cat_id)
        categories.append({
            "id": cat_meta["id"],
            "label": cat_meta["label"],
            "icon": cat_meta["icon"],
            "color": cat_meta["color"],
            "count": count,
        })

    return PublicServicesResponse(
        categories=categories,
        agendas=[AgendaItem(**a) for a in agendas],
    )


@router.get("/category/{category_id}", response_model=list[AgendaItem])
def get_by_category(category_id: str):
    """Ambil jadwal berdasarkan kategori tertentu."""
    agendas = _build_agendas()
    filtered = [a for a in agendas if a["category"] == category_id]
    return [AgendaItem(**a) for a in filtered]
