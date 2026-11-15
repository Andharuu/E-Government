export interface SearchResultItem {
  id: string;
  title: string;
  category: SearchCategory;
  path: string;
  desc: string;
  keywords?: string;
}

export type SearchCategory = 'Halaman' | 'Data Profil' | 'Layanan E-Gov' | 'Aktivitas' | 'Pengaturan & Fitur';

export const SEARCH_ITEMS: SearchResultItem[] = [
  { id: 'p1', title: 'Dasbor / Ringkasan', category: 'Halaman', path: '/dashboard', desc: 'Ringkasan analitik, KPI & efisiensi autofill', keywords: 'dashboard ringkasan analitik statistik' },
  { id: 'p2', title: 'Profil Saya', category: 'Halaman', path: '/profile', desc: 'Kelola data identitas, kontak, pekerjaan & dokumen', keywords: 'profil data diri atur ubah' },
  { id: 'p3', title: 'Grup Layanan & Template', category: 'Halaman', path: '/templates', desc: 'Template form Dukcapil, Kepolisian, Pajak, SSCASN & kustom', keywords: 'template grup layanan form template' },
  { id: 'p4', title: 'Riwayat Aktivitas', category: 'Halaman', path: '/activity', desc: 'Catatan formulir yang pernah diisi otomatis', keywords: 'riwayat aktivitas log catatan' },
  { id: 'p5', title: 'Notifikasi', category: 'Halaman', path: '/notifications', desc: 'Semua notifikasi dan peringatan sistem', keywords: 'notifikasi notif pesan alert' },
  { id: 'p6', title: 'Layanan Publik', category: 'Halaman', path: '/public-services', desc: 'Jadwal & agenda layanan pemerintah per kategori', keywords: 'layanan publik jadwal agenda pemerintah pendidikan ekonomi' },
  { id: 'p7', title: 'Pengaturan & Keamanan', category: 'Halaman', path: '/settings', desc: 'Ganti kata sandi, keamanan, enkripsi & kontrol privasi', keywords: 'pengaturan settings keamanan privasi' },

  { id: 'd1', title: 'Identitas Kependudukan', category: 'Data Profil', path: '/profile#section-identity', desc: 'NIK, Nama Lengkap, Tempat/Tgl Lahir, Jenis Kelamin, Agama', keywords: 'nik ktp identitas nama lahir gender agama' },
  { id: 'd2', title: 'Alamat & Domisili', category: 'Data Profil', path: '/profile#section-address', desc: 'Provinsi, Kota/Kab, Kecamatan, Kelurahan, Kode Pos', keywords: 'alamat domisili provinsi kota kabupaten kecamatan' },
  { id: 'd3', title: 'Kontak & Telepon', category: 'Data Profil', path: '/profile#section-contact', desc: 'Nomor HP, WhatsApp, Email', keywords: 'telepon hp whatsapp email kontak' },
  { id: 'd4', title: 'Dokumen & Foto', category: 'Data Profil', path: '/profile#section-documents', desc: 'Foto KTP, KK, Pasfoto untuk unggah form instan', keywords: 'ktp kk foto dokumen upload scan' },
  { id: 'd5', title: 'Pekerjaan & Pendidikan', category: 'Data Profil', path: '/profile#section-occupation', desc: 'Pekerjaan, Institusi, NISN, Pendidikan Terakhir', keywords: 'pekerjaan jabatan institusi pendidikan' },
  { id: 'd6', title: 'Kartu & Nomor Penting', category: 'Data Profil', path: '/profile', desc: 'NPWP, BPJS, SIM, Surat Izin', keywords: 'npwp bpjs sim surat izin nomor penting' },
  { id: 'd7', title: 'Data Keluarga', category: 'Data Profil', path: '/profile', desc: 'Nama Ayah, Ibu, Kontak Darurat', keywords: 'keluarga ayah ibu orang tua darurat' },

  { id: 'e1', title: 'Dukcapil â€” KTP & Akta', category: 'Layanan E-Gov', path: '/templates', desc: 'Form isian otomatis untuk layanan Kemendagri / Dukcapil', keywords: 'dukcapil ktp akta kelahiran kematian nik' },
  { id: 'e2', title: 'Polri â€” SKCK & Layanan Kepolisian', category: 'Layanan E-Gov', path: '/templates', desc: 'Pengajuan SKCK dan layanan kepolisian online', keywords: 'polri skck kepolisian polisi' },
  { id: 'e3', title: 'BKN / SSCASN â€” Pendaftaran CASN', category: 'Layanan E-Gov', path: '/templates', desc: 'Pendaftaran seleksi CASN & PPPK terintegrasi BKN', keywords: 'bkn sscasn casn cpns p3k pppkcpns' },
  { id: 'e4', title: 'DJP CoreTax â€” Pajak Online', category: 'Layanan E-Gov', path: '/templates', desc: 'Pelaporan SPT Tahunan & validasi NPWP DJP', keywords: 'pajak spt npwp djp coretax online' },
  { id: 'e5', title: 'BPJS Kesehatan & Ketenagakerjaan', category: 'Layanan E-Gov', path: '/templates', desc: 'Klaim jaminan, verifikasi kepesertaan & iuran BPJS', keywords: 'bpjs kesehatan ketenagakerjaan jaminan' },
  { id: 'e6', title: 'Imigrasi â€” Paspor & M-Paspor', category: 'Layanan E-Gov', path: '/templates', desc: 'Permohonan paspor baru, perpanjangan & M-Paspor Imigrasi', keywords: 'imigrasi paspor mpaspor passport' },
  { id: 'e7', title: 'Template Kustom / Baru', category: 'Layanan E-Gov', path: '/templates', desc: 'Buat template isian baru untuk layanan apa pun', keywords: 'kustom custom baru template baru layanan' },

  { id: 'a1', title: 'Isi Form Otomatis (Autofill)', category: 'Aktivitas', path: '/activity', desc: 'Proses pengisian otomatis dari profil ke formulir government', keywords: 'autofill otomatis isi form' },
  { id: 'a2', title: 'Statistik & Laporan', category: 'Aktivitas', path: '/activity', desc: 'Grafik tren autofill, tingkat keberhasilan & waktu hemat per hari', keywords: 'statistik grafik laporan analisis' },
  { id: 'a3', title: 'Hapus Riwayat', category: 'Aktivitas', path: '/activity', desc: 'Hapus satu atau semua catatan aktivitas', keywords: 'hapus riwayat delete log clear' },
  { id: 'a4', title: 'Filter & Sortir Aktivitas', category: 'Aktivitas', path: '/activity', desc: 'Filter berdasarkan domain, status sukses/gagal', keywords: 'filter sortir search cari' },

  { id: 's1', title: 'Ganti Kata Sandi', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Ubah password akun GovConnect secara berkala', keywords: 'sandi kata sandi password ubah ganti' },
  { id: 's2', title: 'Keamanan & Enkripsi AES-256', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Data dienkripsi dengan AES-256. Hanya Anda yang bisa membaca.', keywords: 'enkripsi aes encryption keamanan secure' },
  { id: 's3', title: 'Backup & Ekspor Data', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Unduh backup profil & template dalam format JSON/CSV', keywords: 'backup ekspor export unduh download json csv' },
  { id: 's4', title: 'Otentikasi Dua Faktor (2FA)', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Aktifkan verifikasi dua langkah untuk keamanan ekstra', keywords: '2fa autentikasi verifikasi langkah ganda' },
  { id: 's5', title: 'Hapus Semua Riwayat', category: 'Pengaturan & Fitur', path: '/activity', desc: 'Hapus permanen seluruh riwayat aktivitas autofill', keywords: 'hapus riwayat delete clear all clear' },
  { id: 's6', title: 'Kelola Template', category: 'Pengaturan & Fitur', path: '/templates', desc: 'Tambah, edit, hapus template layanan pemerintah', keywords: 'kelola template add edit delete' },
  { id: 's7', title: 'Unduh Laporan PDF / CSV', category: 'Pengaturan & Fitur', path: '/activity', desc: 'Export laporan aktivitas autofill dalam format PDF atau CSV', keywords: 'laporan pdf csv export unduh download' },
  { id: 's8', title: 'Notifikasi Sistem', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Atur preferensi notifikasi email & push', keywords: 'notifikasi email push preferensi' },
  { id: 's9', title: 'Manajemen Mappings', category: 'Pengaturan & Fitur', path: '/templates', desc: 'Kelola pemetaan field form ke profil GovConnect', keywords: 'mapping pemetaan field form isian' },
  { id: 's10', title: 'Privasi & Persetujuan Data', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Kelola consent data, lihat kebijakan privasi GovConnect', keywords: 'privasi consent persetujuan gdpr' },
  { id: 's11', title: 'Tentang GovConnect', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Informasi versi, lisensi & dokumentasi API', keywords: 'tentang about version versi info' },
  { id: 's12', title: 'Hubungi Dukungan', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Email & chat support GovConnect untuk bantuan teknis', keywords: 'dukungan support help bantuan chat email' },
  { id: 's13', title: 'Kebijakan Privasi', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Baca kebijakan privasi dan penggunaan data GovConnect', keywords: 'privasi kebijakan privacy policy' },
  { id: 's14', title: 'Mode gelap / terang', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Ganti tampilan tema GovConnect sesuai preferensi', keywords: 'tema gelap terang mode appearance' },
  { id: 's15', title: 'Bahasa / Locale', category: 'Pengaturan & Fitur', path: '/settings', desc: 'Ganti bahasa antarmuka GovConnect', keywords: 'bahasa bahasa indonesia english locale i18n' },
];
