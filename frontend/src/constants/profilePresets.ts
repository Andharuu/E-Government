import {
  User, MapPin, Phone, GraduationCap, Briefcase, HeartHandshake, FileText, Camera
} from 'lucide-react';
import type { CustomFieldType } from '../types/profile';

export const STANDARD_CATEGORIES = [
  { id: 'identity', title: 'Identitas & Kependudukan', icon: User, desc: 'Sesuai KTP resmi' },
  { id: 'address', title: 'Alamat & Domisili', icon: MapPin, desc: 'Tempat tinggal saat ini' },
  { id: 'contact', title: 'Kontak Pribadi', icon: Phone, desc: 'Nomor HP dan email' },
  { id: 'education', title: 'Pendidikan & Akademik', icon: GraduationCap, desc: 'Riwayat sekolah & kampus' },
  { id: 'career', title: 'Pekerjaan & Karir', icon: Briefcase, desc: 'Profesi dan instansi kerja' },
  { id: 'family', title: 'Keluarga & Kontak Darurat', icon: HeartHandshake, desc: 'Orang tua dan kontak darurat' },
  { id: 'documents', title: 'Dokumen Resmi & Berkas Foto', icon: FileText, desc: 'NPWP, BPJS & Foto KTP/KK' },
];

export const PHOTO_DOCUMENT_SLOTS = [
  {
    id: 'ktp',
    title: 'Foto e-KTP Asli',
    desc: 'Foto KTP tampak depan, tulisan & NIK terbaca jelas.',
    icon: User,
    fieldKey: 'foto_ktp',
    badge: 'Autofill Berkas KTP'
  },
  {
    id: 'kk',
    title: 'Foto / Scan Kartu Keluarga',
    desc: 'Lembar Kartu Keluarga tampak penuh dan jelas.',
    icon: HeartHandshake,
    fieldKey: 'foto_kk',
    badge: 'Autofill Berkas KK'
  },
  {
    id: 'pasfoto',
    title: 'Pasfoto Formal Diri',
    desc: 'Foto wajah resmi 3x4 / 4x6 latar merah atau biru.',
    icon: Camera,
    fieldKey: 'pasfoto',
    badge: 'Autofill Pasfoto'
  },
  {
    id: 'npwp_card',
    title: 'Foto Kartu NPWP',
    desc: 'Foto fisik kartu NPWP atau bukti cetak resmi.',
    icon: FileText,
    fieldKey: 'foto_npwp',
    badge: 'Autofill NPWP'
  },
  {
    id: 'ijazah',
    title: 'Foto Ijazah / Dokumen Akademik',
    desc: 'Ijazah terakhir atau surat keterangan lulus.',
    icon: GraduationCap,
    fieldKey: 'foto_ijazah',
    badge: 'Autofill Ijazah'
  },
];

export interface RichPreset {
  label: string;
  key: string;
  type: CustomFieldType;
  placeholder?: string;
  badge?: string;
}

export const RICH_CATEGORY_PRESETS: Record<string, RichPreset[]> = {
  identity: [
    { label: 'Title / Gelar (RoboForm)', key: 'title', type: 'text', placeholder: 'Mr / Mrs / Ms / Dr' },
    { label: 'Nama Depan (First Name)', key: 'first_name', type: 'text', placeholder: 'Ahmad' },
    { label: 'Inisial Tengah (Middle Initial)', key: 'middle_initial', type: 'text', placeholder: 'N' },
    { label: 'Nama Belakang (Last Name)', key: 'last_name', type: 'text', placeholder: 'Hidayat' },
    { label: 'Nama Panggilan', key: 'nama_panggilan', type: 'text', placeholder: 'Raffi' },
    { label: 'Suku Bangsa', key: 'suku_bangsa', type: 'text', placeholder: 'Jawa / Sunda / Batak' },
    { label: 'Kewarganegaraan Asal', key: 'kewarganegaraan_asal', type: 'text', placeholder: 'Indonesia' },
    { label: 'Gelar Akademik', key: 'gelar_akademik', type: 'text', placeholder: 'S.Kom., M.Cs.' },
    { label: 'Foto Tanda Tangan Digital', key: 'foto_ttd', type: 'image', placeholder: 'Foto tanda tangan' },
  ],
  address: [
    { label: 'Alamat Baris 1 (Address Line 1)', key: 'address_line_1', type: 'text', placeholder: 'Jl. Malioboro No. 45' },
    { label: 'Alamat Baris 2 (Address Line 2)', key: 'address_line_2', type: 'text', placeholder: 'Kavling 12 / Suite 3A' },
    { label: 'Negara (Country)', key: 'country', type: 'text', placeholder: 'Indonesia' },
    { label: 'Nama Komplek / Perumahan', key: 'nama_komplek', type: 'text', placeholder: 'Griya Indah Asri Blok B No. 12' },
    { label: 'Nomor RT / RW', key: 'rt_rw', type: 'text', placeholder: 'RT 003 / RW 005' },
    { label: 'Patokan Alamat', key: 'patokan_alamat', type: 'textarea', placeholder: 'Depan Masjid Al-Ikhlas / sebelah Indomaret' },
    { label: 'Foto Rumah / Tempat Tinggal', key: 'foto_rumah', type: 'image', placeholder: 'Foto tampak depan rumah' },
  ],
  contact: [
    { label: 'Nomor Telepon Rumah (Home Phone)', key: 'home_phone', type: 'text', placeholder: '021-5551234' },
    { label: 'Nomor Telepon Kantor (Work Phone)', key: 'work_telephone', type: 'text', placeholder: '021-5559876' },
    { label: 'Nomor Fax', key: 'fax', type: 'text', placeholder: '021-5559877' },
    { label: 'Situs Web (Website / URL)', key: 'website', type: 'text', placeholder: 'https://govconnect.id' },
    { label: 'Nomor Telepon Rumah', key: 'telepon_rumah', type: 'text', placeholder: '031-8912345' },
    { label: 'Username Telegram', key: 'telegram_username', type: 'text', placeholder: '@username' },
    { label: 'Email Alternatif / Kantor', key: 'email_kantor', type: 'text', placeholder: 'work@company.com' },
    { label: 'Nomor WhatsApp Darurat', key: 'wa_darurat', type: 'text', placeholder: '081298765432' },
  ],
  education: [
    { label: 'Fakultas / Program Studi', key: 'jurusan', type: 'text', placeholder: 'Informatika' },
    { label: 'Tahun Kelulusan', key: 'tahun_lulus', type: 'text', placeholder: '2024' },
    { label: 'Nilai IPK Terakhir', key: 'ipk', type: 'text', placeholder: '3.85' },
    { label: 'Nomor Ijazah Nasional', key: 'nomor_ijazah', type: 'text', placeholder: '12345/UN/2024' },
    { label: 'Foto Transkrip Nilai', key: 'foto_transkrip', type: 'image', placeholder: 'Foto transkrip nilai' },
  ],
  career: [
    { label: 'Penghasilan per Bulan (Income)', key: 'income', type: 'text', placeholder: '15000000' },
    { label: 'Nomor Induk Pegawai (NIP)', key: 'nip', type: 'text', placeholder: '199001012020121001' },
    { label: 'Divisi / Departemen', key: 'departemen', type: 'text', placeholder: 'Direktorat Sistem Informasi' },
    { label: 'Tanggal Mulai Bekerja', key: 'tgl_mulai_kerja', type: 'date' },
    { label: 'Nama Atasan Langsung', key: 'nama_atasan', type: 'text', placeholder: 'Nama Manajer / Kepala Dinas' },
    { label: 'Foto Kartu Pegawai (ID Card)', key: 'foto_id_card', type: 'image', placeholder: 'Foto ID Card kerja' },
  ],
  family: [
    { label: 'Jumlah Tanggungan Anak', key: 'jumlah_tanggungan', type: 'text', placeholder: '2 orang' },
    { label: 'Nama Pasangan (Suami/Istri)', key: 'nama_pasangan', type: 'text', placeholder: 'Nama lengkap pasangan' },
    { label: 'NIK Pasangan', key: 'nik_pasangan', type: 'text', placeholder: '16 digit NIK pasangan' },
    { label: 'Foto Buku Nikah / Akta Cerai', key: 'foto_buku_nikah', type: 'image', placeholder: 'Scan buku nikah' },
    { label: 'Foto Akta Kelahiran Anak', key: 'foto_akta_kelahiran', type: 'image', placeholder: 'Scan akta lahir' },
  ],
  documents: [
    { label: 'Catatan Formulir (Comments)', key: 'comments', type: 'textarea', placeholder: 'Catatan standar benchmark RoboForm...' },
    { label: 'Nomor Paspor', key: 'nomor_paspor', type: 'text', placeholder: 'A 1234567' },
    { label: 'Masa Berlaku Paspor', key: 'paspor_expired', type: 'date' },
    { label: 'Foto Halaman Paspor', key: 'foto_paspor', type: 'image', placeholder: 'Foto identitas paspor' },
    { label: 'Nomor SIM (Surat Izin Mengemudi)', key: 'nomor_sim', type: 'text', placeholder: '1234-5678-9012' },
    { label: 'Foto Fisik SIM', key: 'foto_sim', type: 'image', placeholder: 'Foto SIM A / C' },
    { label: 'Nomor Rekening Bank', key: 'nomor_rekening', type: 'text', placeholder: '123-456-7890' },
    { label: 'Nama Bank', key: 'nama_bank', type: 'text', placeholder: 'Bank Mandiri / BCA / BNI' },
    { label: 'Foto Buku Tabungan', key: 'foto_buku_tabungan', type: 'image', placeholder: 'Foto nomor rekening' },
  ],
  other: [
    { label: 'Plat Nomor Kendaraan', key: 'plat_nomor', type: 'text', placeholder: 'B 1234 ABC' },
    { label: 'Foto STNK Kendaraan', key: 'foto_stnk', type: 'image', placeholder: 'Scan STNK asli' },
    { label: 'Nomor Polis Asuransi', key: 'nomor_polis', type: 'text', placeholder: 'POLIS-998877' },
    { label: 'Foto Kartu Asuransi', key: 'foto_asuransi', type: 'image', placeholder: 'Foto kartu asuransi' },
    { label: 'Tautan Profil LinkedIn', key: 'linkedin_url', type: 'text', placeholder: 'https://linkedin.com/in/...' },
  ]
};
