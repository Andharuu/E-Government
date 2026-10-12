import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Flaticon } from './ui';
import { profileApi, activityApi, type Profile } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';

interface SearchResultItem {
  id: string;
  title: string;
  category: SearchCategory;
  path: string;
  desc: string;
  keywords?: string;
}

type SearchCategory = 'Halaman' | 'Data Profil' | 'Layanan E-Gov' | 'Aktivitas' | 'Pengaturan & Fitur';

const SEARCH_ITEMS: SearchResultItem[] = [
  // ── PAGES / HALAMAN ──────────────────────────────────────────────────────────
  { id: 'p1', title: 'Dasbor / Ringkasan', category: 'Halaman', path: '/dashboard', desc: 'Ringkasan analitik, KPI & efisiensi autofill', keywords: 'dashboard ringkasan analitik statistik' },
  { id: 'p2', title: 'Profil Saya', category: 'Halaman', path: '/profile', desc: 'Kelola data identitas, kontak, pekerjaan & dokumen', keywords: 'profil data diri atur ubah' },
  { id: 'p3', title: 'Grup Layanan & Template', category: 'Halaman', path: '/templates', desc: 'Template form Dukcapil, Kepolisian, Pajak, SSCASN & kustom', keywords: 'template grup layanan form template' },
  { id: 'p4', title: 'Riwayat Aktivitas', category: 'Halaman', path: '/activity', desc: 'Catatan formulir yang pernah diisi otomatis', keywords: 'riwayat aktivitas log catatan' },
  { id: 'p5', title: 'Notifikasi', category: 'Halaman', path: '/notifications', desc: 'Semua notifikasi dan peringatan sistem', keywords: 'notifikasi notif pesan alert' },
  { id: 'p6', title: 'Layanan Publik', category: 'Halaman', path: '/public-services', desc: 'Jadwal & agenda layanan pemerintah per kategori', keywords: 'layanan publik jadwal agenda pemerintah pendidikan ekonomi' },
  { id: 'p7', title: 'Pengaturan & Keamanan', category: 'Halaman', path: '/settings', desc: 'Ganti kata sandi, keamanan, enkripsi & kontrol privasi', keywords: 'pengaturan settings keamanan privasi' },

  // ── PROFILE DATA / DATA PROFIL ───────────────────────────────────────────────
  { id: 'd1', title: 'Identitas Kependudukan', category: 'Data Profil', path: '/profile#section-identity', desc: 'NIK, Nama Lengkap, Tempat/Tgl Lahir, Jenis Kelamin, Agama', keywords: 'nik ktp identitas nama lahir gender agama' },
  { id: 'd2', title: 'Alamat & Domisili', category: 'Data Profil', path: '/profile#section-address', desc: 'Provinsi, Kota/Kab, Kecamatan, Kelurahan, Kode Pos', keywords: 'alamat domisili provinsi kota kabupaten kecamatan' },
  { id: 'd3', title: 'Kontak & Telepon', category: 'Data Profil', path: '/profile#section-contact', desc: 'Nomor HP, WhatsApp, Email', keywords: 'telepon hp whatsapp email kontak' },
  { id: 'd4', title: 'Dokumen & Foto', category: 'Data Profil', path: '/profile#section-documents', desc: 'Foto KTP, KK, Pasfoto untuk unggah form instan', keywords: 'ktp kk foto dokumen upload scan' },
  { id: 'd5', title: 'Pekerjaan & Pendidikan', category: 'Data Profil', path: '/profile#section-occupation', desc: 'Pekerjaan, Institusi, NISN, Pendidikan Terakhir', keywords: 'pekerjaan jabatan institusi pendidikan' },
  { id: 'd6', title: 'Kartu & Nomor Penting', category: 'Data Profil', path: '/profile', desc: 'NPWP, BPJS, SIM, Surat Izin', keywords: 'npwp bpjs sim surat izin nomor penting' },
  { id: 'd7', title: 'Data Keluarga', category: 'Data Profil', path: '/profile', desc: 'Nama Ayah, Ibu, Kontak Darurat', keywords: 'keluarga ayah ibu orang tua darurat' },

  // ── SERVICE TEMPLATES & E-GOV ────────────────────────────────────────────────
  { id: 'e1', title: 'Dukcapil — KTP & Akta', category: 'Layanan E-Gov', path: '/templates', desc: 'Form isian otomatis untuk layanan Kemendagri / Dukcapil', keywords: 'dukcapil ktp akta kelahiran kematian nik' },
  { id: 'e2', title: 'Polri — SKCK & Layanan Kepolisian', category: 'Layanan E-Gov', path: '/templates', desc: 'Pengajuan SKCK dan layanan kepolisian online', keywords: 'polri skck kepolisian polisi' },
  { id: 'e3', title: 'BKN / SSCASN — Pendaftaran CASN', category: 'Layanan E-Gov', path: '/templates', desc: 'Pendaftaran seleksi CASN & PPPK terintegrasi BKN', keywords: 'bkn sscasn casn cpns p3k pppkcpns' },
  { id: 'e4', title: 'DJP CoreTax — Pajak Online', category: 'Layanan E-Gov', path: '/templates', desc: 'Pelaporan SPT Tahunan & validasi NPWP DJP', keywords: 'pajak spt npwp djp coretax online' },
  { id: 'e5', title: 'BPJS Kesehatan & Ketenagakerjaan', category: 'Layanan E-Gov', path: '/templates', desc: 'Klaim jaminan, verifikasi kepesertaan & iuran BPJS', keywords: 'bpjs kesehatan ketenagakerjaan jaminan' },
  { id: 'e6', title: 'Imigrasi — Paspor & M-Paspor', category: 'Layanan E-Gov', path: '/templates', desc: 'Permohonan paspor baru, perpanjangan & M-Paspor Imigrasi', keywords: 'imigrasi paspor mpaspor passport' },
  { id: 'e7', title: 'Template Kustom / Baru', category: 'Layanan E-Gov', path: '/templates', desc: 'Buat template isian baru untuk layanan apa pun', keywords: 'kustom custom baru template baru layanan' },

  // ── ACTIVITIES / AKTIVITAS ───────────────────────────────────────────────────
  { id: 'a1', title: 'Isi Form Otomatis (Autofill)', category: 'Aktivitas', path: '/activity', desc: 'Proses pengisian otomatis dari profil ke formulir government', keywords: 'autofill otomatis isi form' },
  { id: 'a2', title: 'Statistik & Laporan', category: 'Aktivitas', path: '/activity', desc: 'Grafik tren autofill, tingkat keberhasilan & waktu hemat per hari', keywords: 'statistik grafik laporan analisis' },
  { id: 'a3', title: 'Hapus Riwayat', category: 'Aktivitas', path: '/activity', desc: 'Hapus satu atau semua catatan aktivitas', keywords: 'hapus riwayat delete log clear' },
  { id: 'a4', title: 'Filter & Sortir Aktivitas', category: 'Aktivitas', path: '/activity', desc: 'Filter berdasarkan domain, status sukses/gagal', keywords: 'filter sortir search cari' },

  // ── SETTINGS / PENGATURAN & FITUR ────────────────────────────────────────────
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


export function Layout() {
  const token = localStorage.getItem('govconnect_token');
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  // Search feature state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notification feature state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  // Recent activities & notifications for search indexing
  const [recentActivities, setRecentActivities] = useState<{ id: number; title: string; domain: string; status: string; filled: number; created_at: string }[]>([]);

  const {
    notifications,
    unreadCount,
    isLoading: notifsLoading,
    markRead,
    markAllRead,
    remove,
  } = useNotifications(token, { pollInterval: 20000, useSSE: true });

  useEffect(() => {
    profileApi.get().then(res => {
      setUserProfile(res.data);
    }).catch(() => {});
  }, []);

  // Load recent activities for search indexing
  useEffect(() => {
    if (!token) return;
    activityApi.get(5).then(res => {
      setRecentActivities(
        res.data.slice(0, 5).map((a: any) => ({
          id: a.id,
          title: a.website_domain || a.action || 'Aktivitas',
          domain: a.website_domain || '-',
          status: a.status || 'success',
          filled: a.fields_filled || 0,
          created_at: a.created_at || '',
        }))
      );
    }).catch(() => {});
  }, [token]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Dynamic searchable items including every piece of user profile data
  const dynamicSearchItems = useMemo(() => {
    const items: SearchResultItem[] = [...SEARCH_ITEMS];
    // Masking PII di indeks pencarian (medium finding): hasil pencarian tetap
    // dapat ditemukan berdasarkan kata kunci, tetapi nilai sensitif ditampilkan
    // tersamar agar tidak bocor lewat shoulder-surfing/screenshot.
    const mask = (val: string, visible = 4): string => {
      const s = String(val);
      if (s.length <= visible) return '••••';
      return s.slice(0, visible) + '•'.repeat(Math.min(s.length - visible, 12));
    };
    if (userProfile) {
      if (userProfile.nik) {
        items.push({ id: 'u_nik', title: `NIK: ${mask(userProfile.nik)}`, keywords: `${userProfile.nik} nik ktp identitas`, category: 'Data Profil', path: '/profile#section-identity', desc: 'Nomor Induk Kependudukan KTP' });
      }
      if (userProfile.full_name) {
        items.push({ id: 'u_name', title: `Nama: ${userProfile.full_name}`, category: 'Data Profil', path: '/profile#section-identity', desc: 'Nama lengkap resmi kependudukan' });
      }
      if (userProfile.birth_place || userProfile.birth_date) {
        items.push({ id: 'u_birth', title: `Tempat/Tgl Lahir: ${[userProfile.birth_place, userProfile.birth_date].filter(Boolean).join(', ')}`, category: 'Data Profil', path: '/profile#section-identity', desc: 'Data kelahiran' });
      }
      if (userProfile.gender) {
        items.push({ id: 'u_gender', title: `Jenis Kelamin: ${userProfile.gender}`, category: 'Data Profil', path: '/profile#section-identity', desc: 'Jenis kelamin resmi' });
      }
      if (userProfile.religion) {
        items.push({ id: 'u_religion', title: `Agama: ${userProfile.religion}`, category: 'Data Profil', path: '/profile#section-identity', desc: 'Agama kependudukan' });
      }
      if (userProfile.phone) {
        items.push({ id: 'u_phone', title: `Nomor HP: ${mask(userProfile.phone, 4)}`, keywords: `${userProfile.phone} nomor hp telepon phone`, category: 'Data Profil', path: '/profile#section-contact', desc: 'Kontak telepon seluler terdaftar' });
      }
      if (userProfile.email) {
        items.push({ id: 'u_email', title: `Email: ${userProfile.email}`, category: 'Data Profil', path: '/profile#section-contact', desc: 'Alamat surel kontak resmi' });
      }
      if (userProfile.address) {
        items.push({ id: 'u_addr', title: `Alamat: ${mask(userProfile.address, 6)}`, keywords: `${userProfile.address} alamat domisili`, category: 'Data Profil', path: '/profile#section-address', desc: [userProfile.district, userProfile.city, userProfile.province].filter(Boolean).join(', ') || 'Alamat domisili' });
      }
      if (userProfile.city) {
        items.push({ id: 'u_city', title: `Kota/Kabupaten: ${userProfile.city}`, category: 'Data Profil', path: '/profile#section-address', desc: 'Daerah tingkat II domisili' });
      }
      if (userProfile.province) {
        items.push({ id: 'u_prov', title: `Provinsi: ${userProfile.province}`, category: 'Data Profil', path: '/profile#section-address', desc: 'Provinsi domisili KTP' });
      }
      if (userProfile.postal_code) {
        items.push({ id: 'u_pos', title: `Kode Pos: ${userProfile.postal_code}`, category: 'Data Profil', path: '/profile#section-address', desc: 'Kode pos domisili' });
      }
      if (userProfile.occupation) {
        items.push({ id: 'u_occ', title: `Pekerjaan: ${userProfile.occupation}`, category: 'Data Profil', path: '/profile#section-occupation', desc: 'Mata pencaharian profil' });
      }
      if (userProfile.education_level) {
        items.push({ id: 'u_edu', title: `Pendidikan: ${userProfile.education_level}`, category: 'Data Profil', path: '/profile#section-occupation', desc: 'Jenjang pendidikan terakhir' });
      }
      if (userProfile.institution) {
        items.push({ id: 'u_inst', title: `Institusi: ${userProfile.institution}`, category: 'Data Profil', path: '/profile#section-occupation', desc: 'Lembaga atau universitas' });
      }
      if (userProfile.nisn) {
        items.push({ id: 'u_nisn', title: `NISN: ${mask(userProfile.nisn, 4)}`, category: 'Data Profil', path: '/profile#section-occupation', desc: 'Nomor Induk Siswa Nasional' });
      }
      // Check custom fields
      if (userProfile.custom_fields && Array.isArray(userProfile.custom_fields)) {
        userProfile.custom_fields.forEach((cf: any, idx: number) => {
          if (cf.label || cf.value) {
            items.push({
              id: `u_cf_${idx}`,
              title: `${cf.label || 'Kustom'}: ${mask(String(cf.value ?? '-'), 4)}`,
              keywords: `${cf.label || ''} ${cf.value ?? ''} kustom profil`,
              category: 'Data Profil',
              path: '/profile',
              desc: 'Data profil kustom pengguna'
            });
          }
        });
      }
    }

    // Recent activities
    recentActivities.forEach((a) => {
      items.push({
        id: `act_${a.id}`,
        title: `${a.domain}`,
        category: 'Aktivitas',
        path: '/activity',
        desc: `${a.status === 'success' ? 'Autofill sukses' : a.status === 'partial' ? 'Autofill sebagian' : 'Autofill gagal'} • ${a.filled} field • ${new Date(a.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`,
      });
    });

    // Recent notifications
    notifications.slice(0, 10).forEach((n) => {
      items.push({
        id: `notif_${n.id}`,
        title: n.title,
        category: 'Pengaturan & Fitur',
        path: '/notifications',
        desc: n.desc || 'Notifikasi GovConnect',
      });
    });
    return items;
  }, [userProfile, recentActivities, notifications]);

  // Filter search results against dynamic items
  const filteredSearchResults = useMemo(() => {
    if (searchQuery.trim() === '') return dynamicSearchItems.slice(0, 6);
    const q = searchQuery.toLowerCase();
    return dynamicSearchItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    );
  }, [searchQuery, dynamicSearchItems]);

  const handleSelectSearchResult = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const isAdmin = !!user?.is_admin;

  // Regular user navigation (hidden entirely for admins)
  const menuNavItems = [
    { path: '/dashboard', label: 'Dasbor', iconName: 'apps' },
    { path: '/profile', label: 'Profil saya', iconName: 'user' },
    { path: '/templates', label: 'Grup layanan', iconName: 'folder' },
    { path: '/activity', label: 'Riwayat aktivitas', iconName: 'time-past' },
    { path: '/public-services', label: 'Layanan Publik', iconName: 'book' },
    { path: '/complaints', label: 'Pengaduan', iconName: 'sheet' },
    { path: '/notifications', label: 'Notifikasi', iconName: 'bell' },
  ];

  const generalNavItems = [
    { path: '/settings', label: 'Pengaturan & keamanan', iconName: 'settings' },
  ];

  // Admin-only navigation (replaces the entire menu when admin)
  const adminNavItems = isAdmin
    ? [
        { path: '/admin', label: 'Ringkasan', iconName: 'grid', end: true },
        { path: '/admin/complaints', label: 'Pengaduan', iconName: 'inbox' },
        { path: '/admin/users', label: 'Pengguna', iconName: 'id-card' },
        { path: '/admin/audit', label: 'Audit Log', iconName: 'shield-check' },
        { path: '/admin/announcements', label: 'Pengumuman', iconName: 'paper-plane' },
      ]
    : [];

  const userInitial = (user?.email?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="h-screen bg-gradient-to-b from-[#001D39] via-[#0A4174] to-[#001D39] text-[#001D39] font-sans flex flex-col md:flex-row overflow-hidden selection:bg-[#BDD8E9]">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs transition-opacity duration-150"
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR: Modern Blue Gradient with Pill Active Indicator (Reference Style)*/}
      {/* ========================================================================= */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 h-screen w-[230px] flex flex-col justify-between shrink-0 bg-gradient-to-b from-[#001D39] via-[#0A4174] to-[#001D39] border-r border-[#49769F]/20 transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center h-[76px] px-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0 p-1.5 shadow-sm">
                  <img
                    src="/logo-white.png"
                    alt="GovConnect"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-white text-[19px] tracking-tight block">
                    GovConnect
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Sections */}
            <div className="px-3 py-2 space-y-6 overflow-y-auto no-scrollbar max-h-[calc(100vh-170px)]">
              {isAdmin ? (
                /* ===== ADMIN: only the admin panel navigation ===== */
                <div>
                  <div className="mx-1 mb-3 p-3 rounded-xl bg-white/[0.06] border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#7BBDE8]/20 text-[#7BBDE8] flex items-center justify-center shrink-0">
                        <Flaticon name="shield-check" className="text-[13px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-white leading-tight">Admin Panel</p>
                        <p className="text-[10px] text-slate-300 leading-tight mt-0.5">GovConnect Administration</p>
                      </div>
                    </div>
                  </div>
                  <nav className="space-y-1">
                    {adminNavItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                          `relative flex items-center gap-3 px-3.5 h-[44px] text-[14px] font-medium rounded-xl transition-all duration-150 cursor-pointer ${
                            isActive
                              ? 'bg-white/[0.12] text-white shadow-sm'
                              : 'text-slate-300/70 hover:bg-white/[0.06] hover:text-white'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {isActive && (
                              <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-[#7BBDE8]" />
                            )}
                            <Flaticon
                              name={item.iconName}
                              variant={isActive ? 'br' : 'rr'}
                              className={`text-[17px] shrink-0 ${
                                isActive ? 'text-[#bef264]' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              ) : (
                /* ===== REGULAR USER: menu + general ===== */
                <>
                  <div>
                    <p className="px-3.5 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Menu
                    </p>
                    <nav className="space-y-1">
                      {menuNavItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            `relative flex items-center gap-3 px-3.5 h-[44px] text-[14px] font-medium rounded-xl transition-all duration-150 cursor-pointer ${
                              isActive
                                ? 'bg-white/[0.12] text-white shadow-sm'
                                : 'text-slate-300/70 hover:bg-white/[0.06] hover:text-white'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-[#7BBDE8]" />
                              )}
                              <Flaticon
                                name={item.iconName}
                                variant={isActive ? 'br' : 'rr'}
                                className={`text-[17px] shrink-0 ${
                                  isActive ? 'text-[#7BBDE8]' : 'text-slate-400 group-hover:text-white'
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                              {item.path === '/notifications' && unreadCount > 0 && (
                                <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold rounded-full bg-rose-500 text-white px-1.5 shadow-sm">
                                  {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </nav>
                  </div>

                  <div>
                    <p className="px-3.5 pb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      General
                    </p>
                    <nav className="space-y-1">
                      {generalNavItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          className={({ isActive }) =>
                            `relative flex items-center gap-3 px-3.5 h-[44px] text-[14px] font-medium rounded-xl transition-all duration-150 cursor-pointer ${
                              isActive
                                ? 'bg-white/[0.12] text-white shadow-sm'
                                : 'text-slate-300/70 hover:bg-white/[0.06] hover:text-white'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {isActive && (
                                <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full bg-[#7BBDE8]" />
                              )}
                              <Flaticon
                                name={item.iconName}
                                variant={isActive ? 'br' : 'rr'}
                                className={`text-[17px] shrink-0 ${
                                  isActive ? 'text-[#7BBDE8]' : 'text-slate-400'
                                }`}
                              />
                              <span className="truncate">{item.label}</span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </nav>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* User Profile Card at Bottom (Matching Reference Bottom Style) */}
          <div className="p-3 border-t border-white/10">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.06] border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#7BBDE8] text-[#001D39] font-bold text-[13px] flex items-center justify-center shrink-0 shadow-sm">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate leading-tight">
                    {user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[11px] text-slate-300 truncate leading-tight mt-0.5">
                    {isAdmin ? 'Administrator' : user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                title="Keluar"
              >
                <Flaticon name="sign-out-alt" className="text-[14px]" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA: Rounded canvas panel                                   */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[230px] md:my-3 md:mr-3 rounded-none md:rounded-[28px] bg-[#F6F8FB] h-screen md:h-[calc(100vh-24px)] overflow-hidden shadow-2xl w-full max-w-full">
        {/* Topbar: Search Bar Panjang, Notifikasi, dan Profil Memenuhi Navbar */}
        <header className="shrink-0 z-30 h-[72px] bg-white border-b border-[#BDD8E9]/60 px-6 sm:px-8 flex items-center justify-between gap-4">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-xl text-[#475569] hover:bg-[#F6F8FB] md:hidden cursor-pointer shrink-0"
            aria-label="Buka menu"
          >
            <Flaticon name="menu-burger" className="text-base" />
          </button>

          {/* Search Bar / Admin Title */}
          {isAdmin ? (
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-bold text-[#001D39] truncate">Panel Administrator</h2>
              <p className="text-[11px] text-[#49769F] truncate">Manajemen pengaduan, pengguna & kepatuhan privasi</p>
            </div>
          ) : (
          <div className="flex-1 max-w-3xl relative" ref={searchContainerRef}>
            <div className="relative w-full">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search anything in GovConnect..."
                className="w-full h-11 pl-4 pr-10 bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#BDD8E9] focus:border-[#0A4174] focus:ring-4 focus:ring-[#7BBDE8]/30 rounded-full text-[14px] text-[#001D39] placeholder-[#6EA2B3] transition-all duration-150 outline-none"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[#49769F]">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="hover:text-[#001D39] p-0.5"
                  >
                    <Flaticon name="cross" className="text-[10px]" />
                  </button>
                )}
                <Flaticon name="search" className="text-[16px] pointer-events-none" />
              </div>
            </div>

            {/* Quick Search Dropdown Panel */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#BDD8E9] shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 border-b border-[#E2EBF2] bg-[#F8FAFC] flex items-center justify-between text-[11px] text-[#49769F] font-medium">
                  <span>Hasil Pencarian Cepat</span>
                  <span className="text-[10px] text-[#6EA2B3]">{filteredSearchResults.length} item</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-[#E2EBF2]">
                  {filteredSearchResults.length > 0 ? (
                    filteredSearchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSearchResult(item.path)}
                        className="w-full p-3 text-left hover:bg-[#BDD8E9]/25 transition-colors flex items-start justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-[#001D39] group-hover:text-[#0A4174] transition-colors">
                              {item.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#BDD8E9]/30 text-[#0A4174] font-normal border border-[#BDD8E9]">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#49769F] truncate mt-0.5">{item.desc}</p>
                        </div>
                        <Flaticon name="arrow-right" className="text-xs text-[#49769F] group-hover:text-[#0A4174] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-[#49769F]">
                      Tidak ditemukan hasil untuk &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          )}

          {/* Right: Notifikasi & Profil Memenuhi Navbar */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Notification Bell */}
            <div className="relative" ref={notifContainerRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative w-10 h-10 rounded-full border border-[#BDD8E9] hover:bg-[#BDD8E9]/20 flex items-center justify-center text-[#49769F] hover:text-[#001D39] transition-colors cursor-pointer"
                aria-label="Notifikasi"
              >
                <Flaticon name="bell" className="text-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#0A4174] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#BDD8E9] shadow-2xl overflow-hidden z-50">
                  <div className="p-3.5 border-b border-[#E2EBF2] bg-[#F8FAFC] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#001D39]">Notifikasi</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] bg-[#BDD8E9]/50 text-[#0A4174] font-semibold px-2 py-0.5 rounded-full">
                          {unreadCount} baru
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllRead()}
                        className="text-[12px] font-medium text-[#0A4174] hover:text-[#001D39] cursor-pointer"
                      >
                        Tandai sudah dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#E2EBF2]">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) markRead(n.id);
                          }}
                          className={`p-3.5 hover:bg-[#BDD8E9]/15 transition-colors flex items-start gap-3 cursor-pointer ${
                            !n.read ? 'bg-[#BDD8E9]/25' : ''
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              n.type === 'success'
                                ? 'bg-[#4E8EA2]/15 text-[#0A4174]'
                                : n.type === 'warning'
                                ? 'bg-amber-50 text-amber-600'
                                : n.type === 'info'
                                ? 'bg-[#BDD8E9]/40 text-[#0A4174]'
                                : 'bg-[#6EA2B3]/20 text-[#0A4174]'
                            }`}
                          >
                            {n.type === 'success' ? (
                              <Flaticon name="check" className="text-xs" />
                            ) : n.type === 'warning' ? (
                              <Flaticon name="exclamation" className="text-xs" />
                            ) : (
                              <Flaticon name="sparkles" className="text-xs" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[13px] font-semibold text-[#001D39] truncate">
                                {n.title}
                              </span>
                              <span className="text-[11px] text-[#49769F] shrink-0">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[12px] text-[#49769F] mt-0.5 leading-relaxed">
                              {n.desc}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(n.id);
                            }}
                            className="text-[#49769F] hover:text-[#001D39] p-0.5 cursor-pointer"
                            title="Hapus"
                          >
                            <Flaticon name="cross" className="text-[9px]" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-[13px] text-[#49769F]">
                        {notifsLoading ? 'Memuat notifikasi...' : 'Tidak ada notifikasi saat ini'}
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 border-t border-[#E2EBF2] bg-[#F8FAFC] text-center">
                    <span className="text-[11px] text-[#49769F] font-normal">
                      Notifikasi sistem otomatis GovConnect
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill in Navbar */}
            <div className="flex items-center gap-3 pl-3 border-l border-[#BDD8E9]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0A4174] to-[#7BBDE8] text-white font-bold text-[14px] flex items-center justify-center shadow-sm shrink-0">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[14px] font-semibold text-[#001D39] leading-tight truncate max-w-[130px]">
                  {user?.email?.split('@')[0]}
                </p>
                <p className="text-[12px] text-[#49769F] leading-tight mt-0.5">
                  {isAdmin ? 'Administrator' : 'Warga Terverifikasi'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main
          ref={mainRef}
          className="flex-1 min-h-0 p-3 sm:p-4 md:p-6 lg:p-7 overflow-y-auto overflow-x-hidden page-enter w-full"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}