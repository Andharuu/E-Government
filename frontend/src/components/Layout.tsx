import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTour } from '../tour';
import logoDark from '../assets/logo dark.png';
import logoLight from '../assets/logo light.png';
import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesome } from './ui';
import { profileApi, activityApi, type Profile } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { SEARCH_ITEMS, type SearchResultItem } from './layoutSearchIndex';

/* -------------------------------------------------------------------------
   Navigasi
   ------------------------------------------------------------------------- */

<<<<<<< HEAD
type SearchCategory = 'Halaman' | 'Data Profil' | 'Layanan E-Gov' | 'Aktivitas' | 'Pengaturan & Fitur';

const SEARCH_ITEMS: SearchResultItem[] = [
  // â”€â”€ PAGES / HALAMAN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'p1', title: 'Dasbor / Ringkasan', category: 'Halaman', path: '/dashboard', desc: 'Ringkasan analitik, KPI & efisiensi autofill', keywords: 'dashboard ringkasan analitik statistik' },
  { id: 'p2', title: 'Profil Saya', category: 'Halaman', path: '/profile', desc: 'Kelola data identitas, kontak, pekerjaan & dokumen', keywords: 'profil data diri atur ubah' },
  { id: 'p3', title: 'Grup Layanan & Template', category: 'Halaman', path: '/templates', desc: 'Template form Dukcapil, Kepolisian, Pajak, SSCASN & kustom', keywords: 'template grup layanan form template' },
  { id: 'p4', title: 'Riwayat Aktivitas', category: 'Halaman', path: '/activity', desc: 'Catatan formulir yang pernah diisi otomatis', keywords: 'riwayat aktivitas log catatan' },
  { id: 'p5', title: 'Notifikasi', category: 'Halaman', path: '/notifications', desc: 'Semua notifikasi dan peringatan sistem', keywords: 'notifikasi notif pesan alert' },
  { id: 'p6', title: 'Layanan Publik', category: 'Halaman', path: '/public-services', desc: 'Jadwal & agenda layanan pemerintah per kategori', keywords: 'layanan publik jadwal agenda pemerintah pendidikan ekonomi' },
  { id: 'p7', title: 'Pengaturan & Keamanan', category: 'Halaman', path: '/settings', desc: 'Ganti kata sandi, keamanan, enkripsi & kontrol privasi', keywords: 'pengaturan settings keamanan privasi' },

  // â”€â”€ PROFILE DATA / DATA PROFIL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'd1', title: 'Identitas Kependudukan', category: 'Data Profil', path: '/profile#section-identity', desc: 'NIK, Nama Lengkap, Tempat/Tgl Lahir, Jenis Kelamin, Agama', keywords: 'nik ktp identitas nama lahir gender agama' },
  { id: 'd2', title: 'Alamat & Domisili', category: 'Data Profil', path: '/profile#section-address', desc: 'Provinsi, Kota/Kab, Kecamatan, Kelurahan, Kode Pos', keywords: 'alamat domisili provinsi kota kabupaten kecamatan' },
  { id: 'd3', title: 'Kontak & Telepon', category: 'Data Profil', path: '/profile#section-contact', desc: 'Nomor HP, WhatsApp, Email', keywords: 'telepon hp whatsapp email kontak' },
  { id: 'd4', title: 'Dokumen & Foto', category: 'Data Profil', path: '/profile#section-documents', desc: 'Foto KTP, KK, Pasfoto untuk unggah form instan', keywords: 'ktp kk foto dokumen upload scan' },
  { id: 'd5', title: 'Pekerjaan & Pendidikan', category: 'Data Profil', path: '/profile#section-occupation', desc: 'Pekerjaan, Institusi, NISN, Pendidikan Terakhir', keywords: 'pekerjaan jabatan institusi pendidikan' },
  { id: 'd6', title: 'Kartu & Nomor Penting', category: 'Data Profil', path: '/profile', desc: 'NPWP, BPJS, SIM, Surat Izin', keywords: 'npwp bpjs sim surat izin nomor penting' },
  { id: 'd7', title: 'Data Keluarga', category: 'Data Profil', path: '/profile', desc: 'Nama Ayah, Ibu, Kontak Darurat', keywords: 'keluarga ayah ibu orang tua darurat' },

  // â”€â”€ SERVICE TEMPLATES & E-GOV â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'e1', title: 'Dukcapil â€” KTP & Akta', category: 'Layanan E-Gov', path: '/templates', desc: 'Form isian otomatis untuk layanan Kemendagri / Dukcapil', keywords: 'dukcapil ktp akta kelahiran kematian nik' },
  { id: 'e2', title: 'Polri â€” SKCK & Layanan Kepolisian', category: 'Layanan E-Gov', path: '/templates', desc: 'Pengajuan SKCK dan layanan kepolisian online', keywords: 'polri skck kepolisian polisi' },
  { id: 'e3', title: 'BKN / SSCASN â€” Pendaftaran CASN', category: 'Layanan E-Gov', path: '/templates', desc: 'Pendaftaran seleksi CASN & PPPK terintegrasi BKN', keywords: 'bkn sscasn casn cpns p3k pppkcpns' },
  { id: 'e4', title: 'DJP CoreTax â€” Pajak Online', category: 'Layanan E-Gov', path: '/templates', desc: 'Pelaporan SPT Tahunan & validasi NPWP DJP', keywords: 'pajak spt npwp djp coretax online' },
  { id: 'e5', title: 'BPJS Kesehatan & Ketenagakerjaan', category: 'Layanan E-Gov', path: '/templates', desc: 'Klaim jaminan, verifikasi kepesertaan & iuran BPJS', keywords: 'bpjs kesehatan ketenagakerjaan jaminan' },
  { id: 'e6', title: 'Imigrasi â€” Paspor & M-Paspor', category: 'Layanan E-Gov', path: '/templates', desc: 'Permohonan paspor baru, perpanjangan & M-Paspor Imigrasi', keywords: 'imigrasi paspor mpaspor passport' },
  { id: 'e7', title: 'Template Kustom / Baru', category: 'Layanan E-Gov', path: '/templates', desc: 'Buat template isian baru untuk layanan apa pun', keywords: 'kustom custom baru template baru layanan' },

  // â”€â”€ ACTIVITIES / AKTIVITAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  { id: 'a1', title: 'Isi Form Otomatis (Autofill)', category: 'Aktivitas', path: '/activity', desc: 'Proses pengisian otomatis dari profil ke formulir government', keywords: 'autofill otomatis isi form' },
  { id: 'a2', title: 'Statistik & Laporan', category: 'Aktivitas', path: '/activity', desc: 'Grafik tren autofill, tingkat keberhasilan & waktu hemat per hari', keywords: 'statistik grafik laporan analisis' },
  { id: 'a3', title: 'Hapus Riwayat', category: 'Aktivitas', path: '/activity', desc: 'Hapus satu atau semua catatan aktivitas', keywords: 'hapus riwayat delete log clear' },
  { id: 'a4', title: 'Filter & Sortir Aktivitas', category: 'Aktivitas', path: '/activity', desc: 'Filter berdasarkan domain, status sukses/gagal', keywords: 'filter sortir search cari' },

  // â”€â”€ SETTINGS / PENGATURAN & FITUR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  { id: 's_tour', title: 'Panduan & Tur Tutorial Akun', category: 'Pengaturan & Fitur', path: '#start-tour', desc: 'Mulai panduan interaktif penggunaan GovConnect langkah demi langkah', keywords: 'tur tutorial panduan onboarding walkthrough guide bantuan langkah' },
=======
const USER_NAV = [
  { path: '/dashboard', label: 'Dasbor', icon: 'grid' },
  { path: '/profile', label: 'Profil', icon: 'user' },
  { path: '/templates', label: 'Grup Layanan', icon: 'folder' },
  { path: '/activity', label: 'Riwayat Aktivitas', icon: 'clock' },
  { path: '/public-services', label: 'Layanan Publik', icon: 'building-columns' },
  { path: '/complaints', label: 'Pengaduan', icon: 'comments' },
  { path: '/notifications', label: 'Notifikasi', icon: 'bell' },
>>>>>>> 63dbf8b6c6dd2c4a9ee44c29a0be10be43331194
];

const USER_NAV_SECONDARY = [{ path: '/settings', label: 'Pengaturan', icon: 'gear' }];

const ADMIN_NAV = [
  { path: '/admin', label: 'Ringkasan', icon: 'grid', end: true },
  { path: '/admin/complaints', label: 'Pengaduan', icon: 'comments' },
  { path: '/admin/users', label: 'Pengguna', icon: 'users' },
  { path: '/admin/audit', label: 'Audit Log', icon: 'shield-check' },
  { path: '/admin/announcements', label: 'Pengumuman', icon: 'bullhorn' },
];

/* -------------------------------------------------------------------------
   Sub-komponen
   ------------------------------------------------------------------------- */

function NavItem({
  path,
  label,
  icon,
  end,
  collapsed,
  badge,
}: {
  path: string;
  label: string;
  icon: string;
  end?: boolean;
  collapsed: boolean;
  badge?: number;
}) {
  return (
    <NavLink
      to={path}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          'group relative flex items-center h-9 rounded-md text-[13px] transition-colors duration-150',
          collapsed ? 'justify-center w-9 mx-auto' : 'gap-2.5 px-2.5',
          isActive
            ? 'bg-accent-soft text-accent-text font-semibold'
            : 'text-ink-2 font-medium hover:bg-surface-3 hover:text-ink',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <FontAwesome
            name={icon}
            className={`text-[14px] shrink-0 ${isActive ? 'text-accent-text' : 'text-ink-3'}`}
          />
          {!collapsed && <span className="truncate flex-1">{label}</span>}
          {badge !== undefined && badge > 0 && !collapsed && (
            <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-fg text-[10px] font-semibold tabular-nums">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {badge !== undefined && badge > 0 && collapsed && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
          )}
        </>
      )}
    </NavLink>
  );
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="h-px w-5 bg-line mx-auto my-3" />;
  return (
    <p className="px-2.5 pt-4 pb-1.5 text-[10.5px] font-semibold tracking-[0.09em] uppercase text-ink-3 truncate">
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------
   Layout
   ------------------------------------------------------------------------- */

export function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, token, logout } = useAuth();
<<<<<<< HEAD
  const { startTour } = useTour();
=======
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);

>>>>>>> 63dbf8b6c6dd2c4a9ee44c29a0be10be43331194
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

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  /* ---- Pencarian ---- */
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  /* ---- Popover lain ---- */
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuContainerRef = useRef<HTMLDivElement>(null);

  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [recentActivities, setRecentActivities] = useState<
    { id: number; title: string; domain: string; status: string; filled: number; created_at: string }[]
  >([]);

  const {
    notifications,
    unreadCount,
    isLoading: notifsLoading,
    markRead,
    markAllRead,
    remove,
  } = useNotifications(token, { pollInterval: 20000, useSSE: true });

  // Jaring pengaman: payload notifikasi yang tidak berbentuk array tidak boleh
  // menjatuhkan seluruh Layout (pernah memicu layar "Terjadi kesalahan aplikasi").
  const notifList = Array.isArray(notifications) ? notifications : [];

  useEffect(() => {
    profileApi
      .get()
      .then((res) => setUserProfile(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!token) return;
    activityApi
      .get(5)
      .then((res) => {
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
      })
      .catch(() => {});
  }, [token]);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* ---- Indeks pencarian dinamis ---- */
  const dynamicSearchItems = useMemo(() => {
    const items: SearchResultItem[] = [...SEARCH_ITEMS];

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
      if (userProfile.custom_fields && Array.isArray(userProfile.custom_fields)) {
        userProfile.custom_fields.forEach((cf: any, idx: number) => {
          if (cf.label || cf.value) {
            items.push({
              id: `u_cf_${idx}`,
              title: `${cf.label || 'Kustom'}: ${mask(String(cf.value ?? '-'), 4)}`,
              keywords: `${cf.label || ''} ${cf.value ?? ''} kustom profil`,
              category: 'Data Profil',
              path: '/profile',
              desc: 'Data profil kustom pengguna',
            });
          }
        });
      }
    }

    recentActivities.forEach((a) => {
      items.push({
        id: `act_${a.id}`,
        title: `${a.domain}`,
        category: 'Aktivitas',
        path: '/activity',
        desc: `${
          a.status === 'success' ? 'Autofill sukses' : a.status === 'partial' ? 'Autofill sebagian' : 'Autofill gagal'
        } · ${a.filled} field · ${new Date(a.created_at).toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
      });
    });

    notifList.slice(0, 10).forEach((n) => {
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

  const filteredSearchResults = useMemo(() => {
    if (debouncedSearchQuery.trim() === '') return dynamicSearchItems.slice(0, 6);
    const q = debouncedSearchQuery.toLowerCase();
    return dynamicSearchItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.keywords && item.keywords.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [debouncedSearchQuery, dynamicSearchItems]);

  const handleSelectSearchResult = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    if (path === '#start-tour') {
      startTour();
      return;
    }
    navigate(path);
  };

  const isAdmin = !!user?.is_admin;
  const userInitial = (userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();
  const displayName = userProfile?.full_name || user?.email?.split('@')[0] || 'Pengguna';

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink">
      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* ================= Sidebar ================= */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 h-screen flex flex-col bg-surface border-r border-line transition-[width,transform] duration-200 md:translate-x-0 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[248px]'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
<<<<<<< HEAD
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

                      {/* Tombol Buka Panduan Tur Tutorial */}
                      <button
                        type="button"
                        onClick={() => startTour()}
                        title={sidebarCollapsed ? 'Panduan Tur Tutorial' : undefined}
                        className={`group relative flex items-center text-[14px] transition-all duration-200 active:scale-[0.98] cursor-pointer text-slate-600 dark:text-[#BDD8E9]/80 hover:bg-slate-100 dark:hover:bg-[#171F2F]/60 hover:text-slate-900 dark:hover:text-white font-medium ${
                          sidebarCollapsed
                            ? 'justify-center h-11 w-11 mx-auto rounded-xl'
                            : 'gap-3 px-3.5 h-11 w-full rounded-lg text-left'
                        }`}
                      >
                        <FontAwesome
                          name="compass"
                          className={`text-[17px] text-center shrink-0 transition-colors text-slate-400 dark:text-[#7BBDE8] group-hover:text-slate-700 dark:group-hover:text-white ${
                            sidebarCollapsed ? 'w-full' : 'w-5'
                          }`}
                        />
                        {!sidebarCollapsed && <span className="truncate">Panduan Tur</span>}
                      </button>
                    </nav>
                  </div>
                </>
              )}
            </div>
=======
        {/* Brand */}
        <div
          className={`flex items-center h-14 shrink-0 border-b border-line ${
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt=""
              className="w-8 h-8 object-contain shrink-0"
            />
            {!sidebarCollapsed && (
              <span className="font-bold text-[15px] tracking-[-0.02em] text-ink truncate">
                GovConnect
              </span>
            )}
>>>>>>> 63dbf8b6c6dd2c4a9ee44c29a0be10be43331194
          </div>
          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup navigasi"
              className="md:hidden btn btn-ghost btn-icon btn-sm"
            >
              <FontAwesome name="xmark" className="text-[13px]" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav
          className={`flex-1 overflow-y-auto no-scrollbar py-2 ${sidebarCollapsed ? 'px-2' : 'px-2.5'}`}
        >
          {isAdmin ? (
            <>
              <SectionLabel collapsed={sidebarCollapsed}>Administrasi</SectionLabel>
              <div className="space-y-0.5">
                {ADMIN_NAV.map((item) => (
                  <NavItem key={item.path} {...item} collapsed={sidebarCollapsed} />
                ))}
              </div>
            </>
          ) : (
            <>
              <SectionLabel collapsed={sidebarCollapsed}>Menu</SectionLabel>
              <div className="space-y-0.5">
                {USER_NAV.map((item) => (
                  <NavItem
                    key={item.path}
                    {...item}
                    collapsed={sidebarCollapsed}
                    badge={item.path === '/notifications' ? unreadCount : undefined}
                  />
                ))}
              </div>

              <SectionLabel collapsed={sidebarCollapsed}>Lainnya</SectionLabel>
              <div className="space-y-0.5">
                {USER_NAV_SECONDARY.map((item) => (
                  <NavItem key={item.path} {...item} collapsed={sidebarCollapsed} />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Footer sidebar */}
        <div className={`shrink-0 border-t border-line p-2.5 ${sidebarCollapsed ? 'px-2' : ''}`}>
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={logout}
              title="Keluar"
              aria-label="Keluar"
              className="btn btn-ghost btn-icon btn-sm mx-auto text-ink-3 hover:text-danger"
            >
              <FontAwesome name="right-from-bracket" className="text-[13px]" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-accent-soft border border-accent-line text-accent-text text-[12px] font-semibold flex items-center justify-center shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-ink truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[11px] text-ink-3 truncate leading-tight mt-0.5">
                  {isAdmin ? 'Administrator' : 'Pengguna'}
                </p>
              </div>
              <button
                type="button"
                onClick={logout}
                title="Keluar"
                aria-label="Keluar"
                className="btn btn-ghost btn-icon btn-sm text-ink-3 hover:text-danger"
              >
                <FontAwesome name="right-from-bracket" className="text-[12px]" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ================= Main ================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden transition-[margin] duration-200 ${
          sidebarCollapsed ? 'md:ml-[72px]' : 'md:ml-[248px]'
        }`}
      >
        {/* Topbar */}
        <header className="shrink-0 z-30 h-14 bg-surface border-b border-line px-3 sm:px-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="btn btn-ghost btn-icon btn-sm shrink-0"
              title={sidebarCollapsed ? 'Perbesar sidebar' : 'Perkecil sidebar'}
              aria-label="Toggle navigasi sidebar"
            >
              <FontAwesome name="bars" className="text-[13px]" />
            </button>

            {/* Search */}
            <div className="relative flex-1 max-w-[420px]" ref={searchContainerRef}>
              <FontAwesome
                name="magnifying-glass"
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-ink-3"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Cari fitur, layanan, data…"
                className="input h-9 pl-8 pr-14 text-[12.5px] bg-surface-2"
                aria-label="Pencarian cepat"
              />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 h-5 px-1.5 rounded border border-line bg-surface text-[10px] font-medium text-ink-3">
                Ctrl K
              </kbd>

              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-line rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="px-3 py-2 border-b border-line flex items-center justify-between">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                      {debouncedSearchQuery ? 'Hasil pencarian' : 'Saran'}
                    </span>
                    <span className="text-[10.5px] text-ink-3">
                      {filteredSearchResults.length} hasil
                    </span>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {filteredSearchResults.length > 0 ? (
                      filteredSearchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectSearchResult(item.path)}
                          className="w-full px-3 py-2 text-left hover:bg-surface-3 transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-medium text-ink truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-ink-3 truncate mt-0.5">{item.desc}</p>
                          </div>
                          <span className="text-[10px] text-ink-3 shrink-0 hidden group-hover:block">
                            {item.category}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-3 py-6 text-center text-[12px] text-ink-3">
                        Tidak ada hasil untuk “{searchQuery}”
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon btn-sm text-ink-2"
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              aria-label="Ganti tema"
            >
              <FontAwesome name={theme === 'dark' ? 'sun' : 'moon'} className="text-[13px]" />
            </button>

            {/* Notifikasi */}
            <div className="relative" ref={notifContainerRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsUserMenuOpen(false);
                }}
                className="btn btn-ghost btn-icon btn-sm text-ink-2 relative"
                aria-label="Notifikasi"
              >
                <FontAwesome name="bell" className="text-[13px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-accent text-accent-fg text-[9px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[320px] sm:w-[360px] bg-surface border border-line rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="px-3 py-2.5 border-b border-line flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-ink">Notifikasi</span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllRead()}
                        className="text-[11.5px] font-medium text-accent-text hover:underline"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-[320px] overflow-y-auto">
                    {notifList.length > 0 ? (
                      notifList.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.read && markRead(n.id)}
                          className={`px-3 py-2.5 hover:bg-surface-3 transition-colors flex items-start gap-2.5 cursor-pointer border-b border-line last:border-b-0 ${
                            !n.read ? 'bg-accent-soft/40' : ''
                          }`}
                        >
                          <span
                            className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                              !n.read ? 'bg-accent' : 'bg-transparent'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-[12.5px] truncate ${
                                !n.read ? 'font-semibold text-ink' : 'font-medium text-ink-2'
                              }`}
                            >
                              {n.title}
                            </p>
                            <p className="text-[10.5px] text-ink-3 mt-0.5 tabular-nums">
                              {new Date(n.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(n.id);
                            }}
                            className="text-ink-3 hover:text-danger p-1"
                            title="Hapus"
                          >
                            <FontAwesome name="trash" className="text-[10px]" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="px-3 py-8 text-center text-[12px] text-ink-3">
                        {notifsLoading ? 'Memuat…' : 'Belum ada notifikasi'}
                      </p>
                    )}
                  </div>

                  <div className="px-3 py-2 border-t border-line text-center">
                    <NavLink
                      to="/notifications"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-[11.5px] font-semibold text-accent-text hover:underline"
                    >
                      Lihat semua
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative ml-1" ref={userMenuContainerRef}>
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-md hover:bg-surface-3 transition-colors"
                aria-label="Menu akun"
              >
                <div className="w-7 h-7 rounded-full bg-accent-soft border border-accent-line text-accent-text text-[11px] font-semibold flex items-center justify-center shrink-0">
                  {userInitial}
                </div>
                <span className="hidden sm:block text-[12.5px] font-medium text-ink max-w-[120px] truncate">
                  {displayName}
                </span>
                <FontAwesome
                  name="chevron-down"
                  className={`hidden sm:block text-[9px] text-ink-3 transition-transform ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[240px] bg-surface border border-line rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="px-3 py-2.5 border-b border-line">
                    <p className="text-[12.5px] font-semibold text-ink truncate">{displayName}</p>
                    <p className="text-[11px] text-ink-3 truncate mt-0.5">{user?.email}</p>
                    {isAdmin && <span className="badge badge-accent mt-2">Administrator</span>}
                  </div>

                  <div className="p-1">
                    {[
                      { to: '/profile', label: 'Profil Saya', icon: 'user' },
                      { to: '/welcome', label: 'Panduan GovConnect', icon: 'book' },
                      { to: '/settings', label: 'Pengaturan & Keamanan', icon: 'shield-halved' },
                      { to: '/activity', label: 'Riwayat Aktivitas', icon: 'clock' },
                    ].map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] font-medium text-ink-2 hover:bg-surface-3 hover:text-ink transition-colors"
                      >
                        <FontAwesome name={item.icon} className="text-[11px] text-ink-3" />
                        {item.label}
                      </NavLink>
                    ))}
                  </div>

                  <div className="p-1 border-t border-line">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] font-medium text-danger hover:bg-danger-soft transition-colors"
                    >
                      <FontAwesome name="right-from-bracket" className="text-[11px]" />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Konten */}
        <main ref={mainRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div key={location.pathname} className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-7 page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
