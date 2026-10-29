import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoDark from '../assets/logo dark.png';
import logoLight from '../assets/logo light.png';
import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesome } from './ui';
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
  const { theme, toggleTheme } = useTheme();
  const token = localStorage.getItem('govconnect_token');
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('govconnect_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('govconnect_sidebar_collapsed', String(next));
        } catch {}
        return next;
      });
    }
  };

  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  // Search feature state with 300ms debounce (F-M5)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notification feature state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);

  // User profile menu state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuContainerRef = useRef<HTMLDivElement>(null);

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

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      if (userMenuContainerRef.current && !userMenuContainerRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
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

  // Filter search results against dynamic items (menggunakan debouncedSearchQuery)
  const filteredSearchResults = useMemo(() => {
    if (debouncedSearchQuery.trim() === '') return dynamicSearchItems.slice(0, 6);
    const q = debouncedSearchQuery.toLowerCase();
    return dynamicSearchItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.keywords && item.keywords.toLowerCase().includes(q))
    );
  }, [debouncedSearchQuery, dynamicSearchItems]);

  const handleSelectSearchResult = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const isAdmin = !!user?.is_admin;

  // Regular user navigation (hidden entirely for admins)
  const menuNavItems = [
    { path: '/dashboard', label: 'Dasbor', iconName: 'grid' },
    { path: '/profile', label: 'Profil', iconName: 'user' },
    { path: '/templates', label: 'Grup Layanan', iconName: 'folder' },
    { path: '/activity', label: 'Riwayat Aktivitas', iconName: 'clock' },
    { path: '/public-services', label: 'Layanan Publik', iconName: 'building-columns' },
    { path: '/complaints', label: 'Pengaduan', iconName: 'comments' },
    { path: '/notifications', label: 'Notifikasi', iconName: 'bell' },
  ];

  const generalNavItems = [
    { path: '/settings', label: 'Pengaturan', iconName: 'gear' },
  ];

  // Admin-only navigation (replaces the entire menu when admin)
  const adminNavItems = isAdmin
    ? [
        { path: '/admin', label: 'Ringkasan', iconName: 'grid', end: true },
        { path: '/admin/complaints', label: 'Pengaduan', iconName: 'comments' },
        { path: '/admin/users', label: 'Pengguna', iconName: 'users' },
        { path: '/admin/audit', label: 'Audit Log', iconName: 'shield-check' },
        { path: '/admin/announcements', label: 'Pengumuman', iconName: 'bullhorn' },
      ]
    : [];

  const userInitial = (user?.email?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#001D39] text-slate-800 dark:text-[#BDD8E9] font-sans selection:bg-[#7BBDE8] selection:text-[#001D39]">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs transition-opacity duration-150"
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR: TailAdmin Dark Architecture with GovConnect Color Hierarchy     */}
      {/* ========================================================================= */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 h-screen flex flex-col justify-between shrink-0 bg-white dark:bg-[#101828] border-r border-slate-200 dark:border-[#1E293B] shadow-sm dark:shadow-none transition-all duration-300 md:translate-x-0 ${
          sidebarCollapsed ? 'w-[88px]' : 'w-[270px]'
        } ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full justify-between">
          <div>
            {/* Sidebar Header: Brand Logo & Title (Unwrapped Logo & Enlarged Text) */}
            <div className={`flex items-center h-20 transition-all duration-300 ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={theme === 'dark' ? logoDark : logoLight}
                  alt="GovConnect"
                  className="w-11 h-11 object-contain shrink-0 drop-shadow-sm"
                  title="GovConnect"
                />
                {!sidebarCollapsed && (
                  <span className="font-extrabold text-slate-900 dark:text-white text-[25px] tracking-tight leading-tight truncate">
                    GovConnect
                  </span>
                )}
              </div>
              {!sidebarCollapsed && (
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Tutup navigasi seluler"
                  className="md:hidden text-slate-400 dark:text-[#6EA2B3] hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer transition-colors"
                >
                  <FontAwesome name="xmark" className="text-base" />
                </button>
              )}
            </div>

            {/* Navigation Groups (TailAdmin MENU / OTHERS Hierarchy) */}
            <div className={`py-5 space-y-6 overflow-y-auto no-scrollbar max-h-[calc(100vh-100px)] ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
              {isAdmin ? (
                /* ===== ADMIN SECTION ===== */
                <div>
                  {!sidebarCollapsed ? (
                    <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-[#6EA2B3] uppercase truncate">
                      ADMINISTRATION
                    </p>
                  ) : (
                    <div className="h-0.5 w-6 bg-[#0A4174]/60 mx-auto my-3 rounded-full" title="ADMINISTRATION" />
                  )}
                  <nav className="space-y-1">
                    {adminNavItems.map((item) => (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={({ isActive }) =>
                          `group relative flex items-center text-[14px] transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                            sidebarCollapsed
                              ? 'justify-center h-11 w-11 mx-auto rounded-xl'
                              : 'gap-3 px-3.5 h-11 rounded-lg'
                          } ${
                            isActive
                              ? 'bg-blue-50 dark:bg-[#171F2F] text-blue-700 dark:text-white font-semibold shadow-xs border border-blue-200 dark:border-[#243048]'
                              : 'text-slate-600 dark:text-[#BDD8E9]/80 hover:bg-slate-100 dark:hover:bg-[#171F2F]/60 hover:text-slate-900 dark:hover:text-white font-medium'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <FontAwesome
                              name={item.iconName}
                              className={`text-[17px] text-center shrink-0 transition-colors ${
                                sidebarCollapsed ? 'w-full' : 'w-5'
                              } ${
                                isActive ? 'text-blue-600 dark:text-[#7BBDE8]' : 'text-slate-400 dark:text-[#6EA2B3] group-hover:text-slate-700 dark:group-hover:text-white'
                              }`}
                            />
                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </nav>
                </div>
              ) : (
                /* ===== REGULAR USER SECTIONS ===== */
                <>
                  <div>
                    {!sidebarCollapsed ? (
                      <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-[#6EA2B3] uppercase truncate">
                        MENU
                      </p>
                    ) : (
                      <div className="h-0.5 w-6 bg-slate-200 dark:bg-[#243048] mx-auto my-3 rounded-full" title="MENU" />
                    )}
                    <nav className="space-y-1">
                      {menuNavItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={({ isActive }) =>
                            `group relative flex items-center text-[14px] transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              sidebarCollapsed
                                ? 'justify-center h-11 w-11 mx-auto rounded-xl'
                                : 'gap-3 px-3.5 h-11 rounded-lg'
                            } ${
                              isActive
                                ? 'bg-blue-50 dark:bg-[#171F2F] text-blue-700 dark:text-white font-semibold shadow-xs border border-blue-200 dark:border-[#243048]'
                                : 'text-slate-600 dark:text-[#BDD8E9]/80 hover:bg-slate-100 dark:hover:bg-[#171F2F]/60 hover:text-slate-900 dark:hover:text-white font-medium'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <FontAwesome
                                name={item.iconName}
                                className={`text-[17px] text-center shrink-0 transition-colors ${
                                  sidebarCollapsed ? 'w-full' : 'w-5'
                                } ${
                                  isActive ? 'text-blue-600 dark:text-[#7BBDE8]' : 'text-slate-400 dark:text-[#6EA2B3] group-hover:text-slate-700 dark:group-hover:text-white'
                                }`}
                              />
                              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                              {item.path === '/notifications' && unreadCount > 0 && (
                                !sidebarCollapsed ? (
                                  <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-bold rounded-full bg-blue-100 dark:bg-[#7BBDE8]/25 text-blue-700 dark:text-[#7BBDE8] border border-blue-200 dark:border-[#7BBDE8]/40 px-1.5">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                  </span>
                                ) : (
                                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#7BBDE8]" />
                                )
                              )}
                            </>
                          )}
                        </NavLink>
                      ))}
                    </nav>
                  </div>

                  <div>
                    {!sidebarCollapsed ? (
                      <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-[#6EA2B3] uppercase truncate">
                        OTHERS
                      </p>
                    ) : (
                      <div className="h-0.5 w-6 bg-slate-200 dark:bg-[#243048] mx-auto my-3 rounded-full" title="OTHERS" />
                    )}
                    <nav className="space-y-1">
                      {generalNavItems.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={({ isActive }) =>
                            `group relative flex items-center text-[14px] transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                              sidebarCollapsed
                                ? 'justify-center h-11 w-11 mx-auto rounded-xl'
                                : 'gap-3 px-3.5 h-11 rounded-lg'
                            } ${
                              isActive
                                ? 'bg-blue-50 dark:bg-[#171F2F] text-blue-700 dark:text-white font-semibold shadow-xs border border-blue-200 dark:border-[#243048]'
                                : 'text-slate-600 dark:text-[#BDD8E9]/80 hover:bg-slate-100 dark:hover:bg-[#171F2F]/60 hover:text-slate-900 dark:hover:text-white font-medium'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <FontAwesome
                                name={item.iconName}
                                className={`text-[17px] text-center shrink-0 transition-colors ${
                                  sidebarCollapsed ? 'w-full' : 'w-5'
                                } ${
                                  isActive ? 'text-blue-600 dark:text-[#7BBDE8]' : 'text-slate-400 dark:text-[#6EA2B3] group-hover:text-slate-700 dark:group-hover:text-white'
                                }`}
                              />
                              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
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
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA: TailAdmin Dark Navbar + Crisp Surface Canvas           */}
      {/* ========================================================================= */}
      <div className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50 dark:bg-[#101828] transition-all duration-300 ${
        sidebarCollapsed ? 'md:ml-[88px]' : 'md:ml-[270px]'
      }`}>
        {/* Top Navbar: TailAdmin Dark Style with Crisp Bottom Divider */}
        <header className="shrink-0 z-30 h-20 bg-white dark:bg-[#101828] border-b border-slate-200 dark:border-[#1E293B] px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Left: Sidebar Toggle Button (Minimize / Maximize) + TailAdmin Search bar */}
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            {/* Sidebar Toggle Button (Minimize / Maximize di kiri search bar) */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#171F2F] text-slate-600 dark:text-[#BDD8E9] hover:bg-slate-100 dark:hover:bg-[#243048] hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shrink-0 shadow-xs"
              title={sidebarCollapsed ? "Perbesar sidebar (Maximize)" : "Perkecil sidebar (Minimize)"}
              aria-label="Toggle navigasi sidebar"
            >
              <FontAwesome name="bars" className="text-sm" />
            </button>

            {/* Search Input with TailAdmin ⌘ K badge - Extended width to the right */}
            <div className="relative flex-1 max-w-2xl lg:max-w-3xl" ref={searchContainerRef}>
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#6EA2B3]">
                <FontAwesome name="magnifying-glass" className="text-sm" />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Cari fitur, layanan, data profil..."
                className="h-11 w-full rounded-xl border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#171F2F] pl-10 pr-16 text-[14px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#6EA2B3] focus:border-blue-500 dark:focus:border-[#7BBDE8] focus:ring-2 focus:ring-blue-500/15 dark:focus:ring-[#7BBDE8]/20 focus:bg-white dark:focus:bg-[#171F2F] outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  searchInputRef.current?.focus();
                  setIsSearchOpen(true);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded-md border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#101828] px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-[#BDD8E9] hover:bg-slate-100 dark:hover:bg-[#243048] cursor-pointer transition-colors"
                title="Pintasan keyboard (⌘K / Ctrl+K)"
              >
                <span>⌘</span>
                <span>K</span>
              </button>

              {/* Quick Search Dropdown Panel (TailAdmin Dark Style) */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#171F2F] rounded-2xl border border-slate-200 dark:border-[#243048] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#101828]/50 flex items-center justify-between text-[11px] text-slate-500 dark:text-[#BDD8E9] font-medium">
                    <span>Hasil Pencarian Cepat</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-[#243048]">
                    {filteredSearchResults.length > 0 ? (
                      filteredSearchResults.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectSearchResult(item.path)}
                          className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-[#0A4174]/40 transition-colors flex items-start justify-between gap-3 group cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="text-[13px] font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#7BBDE8] transition-colors">
                              {item.title}
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-[#6EA2B3] truncate mt-0.5">{item.desc}</p>
                          </div>
                          <FontAwesome name="arrow-right" className="text-xs text-[#6EA2B3] group-hover:text-[#7BBDE8] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-[#6EA2B3]">
                        Tidak ditemukan hasil untuk &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Circular Notification Bell + User Profile Dropdown (TailAdmin Dark Style) */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Theme Toggle Button (Dark / Light Mode) — di sebelah kiri tombol notifikasi */}
            <button
              type="button"
              onClick={toggleTheme}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#171F2F] text-slate-600 dark:text-[#BDD8E9] hover:bg-slate-100 dark:hover:bg-[#243048] hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs group"
              title={theme === 'dark' ? 'Beralih ke mode terang (Light mode)' : 'Beralih ke mode gelap (Dark mode)'}
              aria-label="Toggle mode gelap atau terang"
            >
              {theme === 'dark' ? (
                <FontAwesome
                  name="sun"
                  className="text-base text-amber-400 group-hover:rotate-45 transition-transform duration-300"
                />
              ) : (
                <FontAwesome
                  name="moon"
                  className="text-base text-[#0A4174] group-hover:-rotate-12 transition-transform duration-300"
                />
              )}
            </button>

            {/* Circular Notification Bell */}
            <div className="relative" ref={notifContainerRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsUserMenuOpen(false);
                }}
                className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#171F2F] text-slate-600 dark:text-[#BDD8E9] hover:bg-slate-100 dark:hover:bg-[#243048] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Buka Notifikasi"
              >
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7BBDE8] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7BBDE8]" />
                  </span>
                )}
                <FontAwesome name="bell" className="text-base" />
              </button>

              {/* Notification Dropdown Panel (TailAdmin Dark Style - Simple & Proper) */}
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-[#171F2F] rounded-2xl border border-slate-200 dark:border-[#243048] shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3.5 border-b border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#101828]/50 flex items-center justify-between">
                    <span className="text-[13px] font-bold text-slate-900 dark:text-white">Notifikasi</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllRead()}
                        className="text-[12px] font-semibold text-blue-600 dark:text-[#7BBDE8] hover:text-blue-800 dark:hover:text-white cursor-pointer transition-colors"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#243048]/60">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (!n.read) markRead(n.id);
                          }}
                          className={`px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#101828]/60 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            !n.read ? 'bg-blue-50/60 dark:bg-[#0A4174]/15' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                !n.read ? 'bg-[#7BBDE8]' : 'bg-transparent'
                              }`}
                            />
                            <span className={`text-[13px] truncate ${!n.read ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-600 dark:text-[#BDD8E9]/80'}`}>
                              {n.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] text-slate-400 dark:text-[#6EA2B3] font-medium tabular-nums">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                remove(n.id);
                              }}
                              className="text-slate-400 dark:text-[#6EA2B3] hover:text-rose-500 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                              title="Hapus"
                            >
                              <FontAwesome name="trash" className="text-xs" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-[13px] text-slate-400 dark:text-[#6EA2B3]">
                        {notifsLoading ? 'Memuat notifikasi...' : 'Tidak ada notifikasi saat ini'}
                      </div>
                    )}
                  </div>

                  <div className="p-3 border-t border-slate-200 dark:border-[#0A4174]/60 bg-slate-50 dark:bg-[#0A4174]/20 text-center">
                    <NavLink
                      to="/notifications"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-xs font-bold text-blue-600 dark:text-[#7BBDE8] hover:text-blue-800 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
                    >
                      <span>Lihat Semua Notifikasi</span>
                      <FontAwesome name="arrow-right" className="text-[10px]" />
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Area (TailAdmin signature style) */}
            <div className="relative" ref={userMenuContainerRef}>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-[#0A4174]/30 transition-colors cursor-pointer text-left"
                aria-label="Menu Akun Pengguna"
              >
                <div className="h-10 w-10 rounded-full border border-[#7BBDE8]/40 bg-[#0A4174] text-[#7BBDE8] font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {userInitial}
                </div>
                <div className="hidden sm:block">
                  <p className="text-[14px] font-medium text-slate-900 dark:text-white leading-tight truncate max-w-[130px]">
                    {userProfile?.full_name || user?.email?.split('@')[0] || 'andharu'}
                  </p>
                  {isAdmin && (
                    <p className="text-[12px] text-slate-500 dark:text-[#6EA2B3] leading-tight mt-0.5 font-normal">
                      Administrator
                    </p>
                  )}
                </div>
                <FontAwesome
                  name="chevron-down"
                  className={`text-xs text-slate-400 dark:text-[#6EA2B3] hidden sm:block transition-transform duration-200 ${
                    isUserMenuOpen ? 'rotate-180 text-slate-900 dark:text-white' : ''
                  }`}
                />
              </button>

              {/* User Dropdown Menu (TailAdmin Dark) */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#171F2F] shadow-2xl p-2 z-50 text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 border-b border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#101828]/50 rounded-xl mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{userProfile?.full_name || user?.email?.split('@')[0] || 'andharu'}</p>
                    <p className="text-xs text-slate-500 dark:text-[#6EA2B3] truncate mt-0.5">{user?.email}</p>
                    {isAdmin && (
                      <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-[#7BBDE8]/20 text-[#7BBDE8] border border-[#7BBDE8]/30">
                        Administrator
                      </span>
                    )}
                  </div>

                  <div className="py-1">
                    <NavLink
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-600 dark:text-[#BDD8E9] hover:bg-slate-100 dark:hover:bg-[#243048] hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                    >
                      <FontAwesome name="user" className="text-xs text-blue-600 dark:text-[#7BBDE8]" />
                      <span>Profil Saya</span>
                    </NavLink>
                    <NavLink
                      to="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-600 dark:text-[#BDD8E9] hover:bg-slate-100 dark:hover:bg-[#243048] hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                    >
                      <FontAwesome name="shield-halved" className="text-xs text-blue-600 dark:text-[#7BBDE8]" />
                      <span>Pengaturan &amp; Keamanan</span>
                    </NavLink>
                    <NavLink
                      to="/activity"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-slate-600 dark:text-[#BDD8E9] hover:bg-slate-100 dark:hover:bg-[#243048] hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors"
                    >
                      <FontAwesome name="clock" className="text-xs text-blue-600 dark:text-[#7BBDE8]" />
                      <span>Riwayat Aktivitas</span>
                    </NavLink>
                  </div>

                  <div className="pt-1 border-t border-slate-200 dark:border-[#243048]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:text-rose-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <FontAwesome name="right-from-bracket" className="text-xs" />
                      <span>Keluar Akun</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main
          ref={mainRef}
          className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden page-enter w-full bg-slate-50 dark:bg-[#101828]"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}