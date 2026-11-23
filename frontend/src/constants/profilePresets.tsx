import { FontAwesome } from '../components/ui';
import type { CustomFieldType } from '../types/profile';

const createFaIcon = (name: string) => {
  return function FaIconWrapper({ className }: { className?: string }) {
    return <FontAwesome name={name} className={className} />;
  };
};

export const STANDARD_CATEGORIES = [
  { id: 'identity', title: 'Identitas & kependudukan', icon: createFaIcon('user'), iconName: 'user', desc: 'Sesuai KTP resmi' },
  { id: 'address', title: 'Alamat & domisili', icon: createFaIcon('map'), iconName: 'map', desc: 'Tempat tinggal saat ini' },
  { id: 'contact', title: 'Kontak pribadi', icon: createFaIcon('phone'), iconName: 'phone', desc: 'Nomor HP dan email' },
  { id: 'education', title: 'Pendidikan & akademik', icon: createFaIcon('graduation-cap'), iconName: 'graduation-cap', desc: 'Riwayat sekolah & kampus' },
  { id: 'career', title: 'Pekerjaan & karir', icon: createFaIcon('building'), iconName: 'building', desc: 'Profesi dan instansi kerja' },
  { id: 'family', title: 'Keluarga & kontak darurat', icon: createFaIcon('heart'), iconName: 'heart', desc: 'Orang tua dan kontak darurat' },
  { id: 'documents', title: 'Dokumen resmi & berkas foto', icon: createFaIcon('file-lines'), iconName: 'file-lines', desc: 'NPWP, BPJS & Foto KTP/KK' },
];

export const PHOTO_DOCUMENT_SLOTS = [
  {
    id: 'ktp',
    title: 'Foto e-KTP asli',
    desc: 'Foto KTP tampak depan, tulisan & NIK terbaca jelas.',
    icon: createFaIcon('id-card'),
    iconName: 'id-card',
    fieldKey: 'foto_ktp',
    badge: 'Autofill Berkas KTP'
  },
  {
    id: 'kk',
    title: 'Foto / scan kartu keluarga',
    desc: 'Lembar Kartu Keluarga tampak penuh dan jelas.',
    icon: createFaIcon('heart'),
    iconName: 'heart',
    fieldKey: 'foto_kk',
    badge: 'Autofill Berkas KK'
  },
  {
    id: 'pasfoto',
    title: 'Pasfoto formal diri',
    desc: 'Foto wajah resmi 3x4 / 4x6 latar merah atau biru.',
    icon: createFaIcon('image'),
    iconName: 'image',
    fieldKey: 'pasfoto',
    badge: 'Autofill Pasfoto'
  },
  {
    id: 'npwp_card',
    title: 'Foto kartu NPWP',
    desc: 'Foto fisik kartu NPWP atau bukti cetak resmi.',
    icon: createFaIcon('credit-card'),
    iconName: 'credit-card',
    fieldKey: 'foto_npwp',
    badge: 'Autofill NPWP'
  },
  {
    id: 'ijazah',
    title: 'Foto ijazah / dokumen akademik',
    desc: 'Ijazah terakhir atau surat keterangan lulus.',
    icon: createFaIcon('graduation-cap'),
    iconName: 'graduation-cap',
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
  aliases?: string[];
}

export const RICH_CATEGORY_PRESETS: Record<string, RichPreset[]> = {
  identity: [
    { label: 'Title / Gelar (RoboForm)', key: 'title', type: 'text', placeholder: 'Mr / Mrs / Ms / Dr', aliases: ['title', 'salutation', 'sapaan', 'gelar'] },
    { label: 'Nama Depan (First Name)', key: 'first_name', type: 'text', placeholder: 'Ahmad', aliases: ['first_name', 'firstname', 'fname', 'nama_depan'] },
    { label: 'Inisial Tengah (Middle Initial)', key: 'middle_initial', type: 'text', placeholder: 'N', aliases: ['middle_initial', 'middle_name', 'inisial_tengah'] },
    { label: 'Nama Belakang (Last Name)', key: 'last_name', type: 'text', placeholder: 'Hidayat', aliases: ['last_name', 'lastname', 'lname', 'surname', 'nama_belakang'] },
    { label: 'Umur / Usia', key: 'age', type: 'text', placeholder: 'Contoh: 28', aliases: ['age', 'umur', 'usia'] },
    { label: 'Nama Panggilan', key: 'nama_panggilan', type: 'text', placeholder: 'Raffi', aliases: ['nickname', 'panggilan', 'nama_panggilan', 'alias'] },
    { label: 'Suku Bangsa', key: 'suku_bangsa', type: 'text', placeholder: 'Jawa / Sunda / Batak', aliases: ['suku', 'suku_bangsa', 'etnis', 'ethnicity'] },
    { label: 'Kepenggunanegaraan Asal', key: 'kepenggunanegaraan_asal', type: 'text', placeholder: 'Indonesia', aliases: ['kewarganegaraan_asal', 'citizenship_origin'] },
    { label: 'Gelar Akademik', key: 'gelar_akademik', type: 'text', placeholder: 'S.Kom., M.Cs.', aliases: ['gelar', 'gelar_akademik', 'academic_degree', 'degree'] },
    { label: 'Foto Tanda Tangan Digital', key: 'foto_ttd', type: 'image', placeholder: 'Foto tanda tangan', aliases: ['ttd', 'signature', 'tanda_tangan', 'foto_ttd'] },
  ],
  address: [
    { label: 'Alamat Baris 1 (Address Line 1)', key: 'address_line_1', type: 'text', placeholder: 'Jl. Malioboro No. 45', aliases: ['address_line_1', 'address1', 'alamat_1', 'street_address'] },
    { label: 'Alamat Baris 2 (Address Line 2)', key: 'address_line_2', type: 'text', placeholder: 'Kavling 12 / Suite 3A', aliases: ['address_line_2', 'address2', 'alamat_2'] },
    { label: 'Negara (Country)', key: 'country', type: 'text', placeholder: 'Indonesia', aliases: ['country', 'negara', 'kewarganegaraan', 'nationality'] },
    { label: 'Nama Komplek / Perumahan', key: 'nama_komplek', type: 'text', placeholder: 'Griya Indah Asri Blok B No. 12', aliases: ['komplek', 'perumahan', 'cluster', 'nama_komplek'] },
    { label: 'Nomor RT / RW', key: 'rt_rw', type: 'text', placeholder: 'RT 003 / RW 005', aliases: ['rt_rw', 'rt', 'rw', 'nomor_rt_rw'] },
    { label: 'Patokan Alamat', key: 'patokan_alamat', type: 'textarea', placeholder: 'Depan Masjid Al-Ikhlas / sebelah Indomaret', aliases: ['patokan', 'landmark', 'petunjuk_arah'] },
    { label: 'Foto Rumah / Tempat Tinggal', key: 'foto_rumah', type: 'image', placeholder: 'Foto tampak depan rumah', aliases: ['foto_rumah', 'tampak_rumah', 'foto_tempat_tinggal'] },
  ],
  contact: [
    { label: 'Nomor Telepon Rumah (Home Phone)', key: 'home_phone', type: 'text', placeholder: '021-5551234', aliases: ['home_phone', 'telepon_rumah', 'telp_rumah', 'phone_home'] },
    { label: 'Nomor Telepon Kantor (Work Phone)', key: 'work_telephone', type: 'text', placeholder: '021-5559876', aliases: ['work_telephone', 'telepon_kantor', 'telp_kantor', 'work_phone', 'office_phone'] },
    { label: 'Nomor Fax', key: 'fax', type: 'text', placeholder: '021-5559877', aliases: ['fax', 'telefax', 'facsimile', 'nomor_fax'] },
    { label: 'Situs Web (Website / URL)', key: 'website', type: 'text', placeholder: 'https://govconnect.id', aliases: ['website', 'situs', 'url', 'web', 'homepage'] },
    { label: 'Nomor Telepon Rumah', key: 'telepon_rumah', type: 'text', placeholder: '031-8912345', aliases: ['telepon_rumah', 'telp_rumah', 'home_phone'] },
    { label: 'Username Telegram', key: 'telegram_username', type: 'text', placeholder: '@username', aliases: ['telegram', 'tg_username', 'telegram_id'] },
    { label: 'Email Alternatif / Kantor', key: 'email_kantor', type: 'text', placeholder: 'work@company.com', aliases: ['email_kantor', 'work_email', 'corporate_email', 'surel_kantor'] },
    { label: 'Nomor WhatsApp Darurat', key: 'wa_darurat', type: 'text', placeholder: '081298765432', aliases: ['wa_darurat', 'whatsapp_darurat', 'emergency_wa'] },
  ],
  education: [
    { label: 'Fakultas / Program Studi', key: 'jurusan', type: 'text', placeholder: 'Informatika', aliases: ['jurusan', 'program_studi', 'prodi', 'major', 'fakultas', 'department'] },
    { label: 'Tahun Kelulusan', key: 'tahun_lulus', type: 'text', placeholder: '2024', aliases: ['tahun_lulus', 'graduation_year', 'thn_lulus', 'lulus_tahun'] },
    { label: 'Nilai IPK Terakhir', key: 'ipk', type: 'text', placeholder: '3.85', aliases: ['ipk', 'gpa', 'nilai_ipk', 'grade_point'] },
    { label: 'Nomor Ijazah Nasional', key: 'nomor_ijazah', type: 'text', placeholder: '12345/UN/2024', aliases: ['nomor_ijazah', 'no_ijazah', 'ijazah_number', 'certificate_number'] },
    { label: 'Foto Transkrip Nilai', key: 'foto_transkrip', type: 'image', placeholder: 'Foto transkrip nilai', aliases: ['foto_transkrip', 'transkrip_nilai', 'scan_transkrip'] },
  ],
  career: [
    { label: 'Penghasilan per Bulan (Income)', key: 'income', type: 'text', placeholder: '15000000', aliases: ['income', 'penghasilan', 'gaji', 'salary'] },
    { label: 'Nomor Induk Pegawai (NIP)', key: 'nip', type: 'text', placeholder: '199001012020121001', aliases: ['nip', 'nomor_induk_pegawai', 'employee_id'] },
    { label: 'Divisi / Departemen', key: 'departemen', type: 'text', placeholder: 'Direktorat Sistem Informasi', aliases: ['departemen', 'divisi', 'division', 'department', 'unit_kerja'] },
    { label: 'Tanggal Mulai Bekerja', key: 'tgl_mulai_kerja', type: 'date', aliases: ['tgl_mulai_kerja', 'tanggal_masuk', 'join_date', 'start_date'] },
    { label: 'Nama Atasan Langsung', key: 'nama_atasan', type: 'text', placeholder: 'Nama Manajer / Kepala Dinas', aliases: ['atasan', 'nama_atasan', 'supervisor', 'manager_name'] },
    { label: 'Foto Kartu Pegawai (ID Card)', key: 'foto_id_card', type: 'image', placeholder: 'Foto ID Card kerja', aliases: ['id_card', 'kartu_pegawai', 'foto_id_card', 'nametag'] },
  ],
  family: [
    { label: 'Jumlah Tanggungan Anak', key: 'jumlah_tanggungan', type: 'text', placeholder: '2 orang', aliases: ['tanggungan', 'jumlah_tanggungan', 'dependents', 'anak'] },
    { label: 'Nama Pasangan (Suami/Istri)', key: 'nama_pasangan', type: 'text', placeholder: 'Nama lengkap pasangan', aliases: ['nama_pasangan', 'suami', 'istri', 'spouse', 'pasangan'] },
    { label: 'NIK Pasangan', key: 'nik_pasangan', type: 'text', placeholder: '16 digit NIK pasangan', aliases: ['nik_pasangan', 'spouse_nik', 'nik_istri', 'nik_suami'] },
    { label: 'Foto Buku Nikah / Akta Cerai', key: 'foto_buku_nikah', type: 'image', placeholder: 'Scan buku nikah', aliases: ['buku_nikah', 'akta_nikah', 'marriage_certificate'] },
    { label: 'Foto Akta Kelahiran Anak', key: 'foto_akta_kelahiran', type: 'image', placeholder: 'Scan akta lahir', aliases: ['akta_kelahiran', 'akta_lahir', 'birth_certificate'] },
  ],
  documents: [
    { label: 'Catatan Formulir (Comments)', key: 'comments', type: 'textarea', placeholder: 'Catatan standar benchmark RoboForm...', aliases: ['comments', 'catatan', 'keterangan', 'pesan'] },
    { label: 'Nomor Paspor', key: 'nomor_paspor', type: 'text', placeholder: 'A 1234567', aliases: ['passport', 'no_paspor', 'passport_no', 'passport_number', 'paspor'] },
    { label: 'Masa Berlaku Paspor', key: 'paspor_expired', type: 'date', aliases: ['paspor_expired', 'passport_expiry', 'tgl_kadaluarsa_paspor'] },
    { label: 'Foto Halaman Paspor', key: 'foto_paspor', type: 'image', placeholder: 'Foto identitas paspor', aliases: ['foto_paspor', 'scan_paspor', 'passport_photo'] },
    { label: 'Nomor SIM (Surat Izin Mengemudi)', key: 'nomor_sim', type: 'text', placeholder: '1234-5678-9012', aliases: ['sim', 'driving_license', 'driver_license', 'no_sim', 'nomor_sim'] },
    { label: 'Foto Fisik SIM', key: 'foto_sim', type: 'image', placeholder: 'Foto SIM A / C', aliases: ['foto_sim', 'scan_sim'] },
    { label: 'Nomor Rekening Bank', key: 'nomor_rekening', type: 'text', placeholder: '123-456-7890', aliases: ['rekening', 'no_rek', 'bank_account', 'account_number', 'rek_bank'] },
    { label: 'Nama Bank', key: 'nama_bank', type: 'text', placeholder: 'Bank Mandiri / BCA / BNI', aliases: ['bank', 'bank_name', 'nama_bank'] },
    { label: 'Foto Buku Tabungan', key: 'foto_buku_tabungan', type: 'image', placeholder: 'Foto nomor rekening', aliases: ['buku_tabungan', 'foto_buku_tabungan', 'bank_book'] },
  ],
  other: [
    { label: 'Plat Nomor Kendaraan', key: 'plat_nomor', type: 'text', placeholder: 'B 1234 ABC', aliases: ['plat', 'nopol', 'no_polisi', 'plat_nomor', 'license_plate'] },
    { label: 'Foto STNK Kendaraan', key: 'foto_stnk', type: 'image', placeholder: 'Scan STNK asli', aliases: ['foto_stnk', 'scan_stnk', 'stnk', 'no_stnk'] },
    { label: 'Nomor Polis Asuransi', key: 'nomor_polis', type: 'text', placeholder: 'POLIS-998877', aliases: ['polis', 'nomor_polis', 'policy_number', 'no_polis'] },
    { label: 'Foto Kartu Asuransi', key: 'foto_asuransi', type: 'image', placeholder: 'Foto kartu asuransi', aliases: ['foto_asuransi', 'kartu_asuransi', 'insurance_card'] },
    { label: 'Tautan Profil LinkedIn', key: 'linkedin_url', type: 'text', placeholder: 'https://linkedin.com/in/...', aliases: ['linkedin', 'linkedin_url', 'profil_linkedin'] },
  ]
};
