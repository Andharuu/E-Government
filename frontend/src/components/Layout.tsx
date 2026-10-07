import { useAuth } from '../context/AuthContext';
import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Flaticon } from './ui';
import { profileApi, type Profile } from '../services/api';

interface SearchResultItem {
  id: string;
  title: string;
  category: 'Halaman' | 'Data Profil' | 'Layanan E-Gov';
  path: string;
  desc: string;
}

const SEARCH_ITEMS: SearchResultItem[] = [
  { id: 'p1', title: 'Ringkasan Dasbor', category: 'Halaman', path: '/dashboard', desc: 'Ringkasan analitik, KPI & efisiensi autofill' },
  { id: 'p2', title: 'Profil Saya (Kelola Data)', category: 'Halaman', path: '/profile', desc: 'Identitas KTP, kontak, pekerjaan, dan berkas foto' },
  { id: 'p3', title: 'Grup Layanan & Template', category: 'Halaman', path: '/templates', desc: 'Kelompok form Dukcapil, Kepolisian, Pajak, SSCASN & kustom' },
  { id: 'p4', title: 'Riwayat Aktivitas', category: 'Halaman', path: '/activity', desc: 'Catatan formulir yang pernah diisi otomatis' },
  { id: 'p5', title: 'Pengaturan & Keamanan', category: 'Halaman', path: '/settings', desc: 'Ganti kata sandi & kontrol privasi' },
  { id: 'd1', title: 'Identitas Kependudukan (NIK)', category: 'Data Profil', path: '/profile#section-identity', desc: 'Nomor Induk Kependudukan & Nama Lengkap' },
  { id: 'd2', title: 'Alamat & Domisili', category: 'Data Profil', path: '/profile#section-address', desc: 'Provinsi, kota, kecamatan, kelurahan & kode pos' },
  { id: 'd3', title: 'Kontak & Telepon', category: 'Data Profil', path: '/profile#section-contact', desc: 'Nomor HP, WhatsApp, dan alamat email' },
  { id: 'd4', title: 'Foto Dokumen (KTP, KK, Pasfoto)', category: 'Data Profil', path: '/profile#section-documents', desc: 'Berkas digital untuk unggahan form instan' },
  { id: 'e1', title: 'Portal SSCASN / BKN (CPNS)', category: 'Layanan E-Gov', path: '/dashboard', desc: 'Pendaftaran seleksi CASN & PPPK terintegrasi' },
  { id: 'e2', title: 'CoreTax DJP Pajak Online', category: 'Layanan E-Gov', path: '/dashboard', desc: 'Pelaporan SPT Tahunan & validasi NPWP' },
  { id: 'e3', title: 'Portal Paspor M-Paspor Imigrasi', category: 'Layanan E-Gov', path: '/dashboard', desc: 'Permohonan paspor baru dan penggantian' },
  { id: 'e4', title: 'BPJS Kesehatan & Ketenagakerjaan', category: 'Layanan E-Gov', path: '/dashboard', desc: 'Klaim jaminan & verifikasi kepesertaan' },
];

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: 'success' | 'info' | 'system';
  read: boolean;
}

export function Layout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Search feature state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Notification feature state
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifContainerRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    profileApi.get().then(res => {
      setUserProfile(res.data);
    }).catch(() => {});
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'n1',
      title: 'Ekstensi Terhubung & Siap',
      desc: 'GovConnect Assistant aktif menyinkronkan data profil ke browser.',
      time: 'Baru saja',
      type: 'success',
      read: false
    },
    {
      id: 'n2',
      title: 'Keamanan Data Aktif',
      desc: 'Enkripsi data profil kependudukan Anda aktif secara lokal.',
      time: '5 menit lalu',
      type: 'info',
      read: false
    },
    {
      id: 'n3',
      title: 'Kamus Semantik Versi 2.0.0',
      desc: 'Pencocokan formulir CoreTax, SSCASN, dan formulir publik telah diperbarui.',
      time: '1 jam lalu',
      type: 'system',
      read: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllNotifsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

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
    if (userProfile) {
      if (userProfile.nik) {
        items.push({ id: 'u_nik', title: `NIK: ${userProfile.nik}`, category: 'Data Profil', path: '/profile#section-identity', desc: 'Nomor Induk Kependudukan KTP' });
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
        items.push({ id: 'u_phone', title: `Nomor HP: ${userProfile.phone}`, category: 'Data Profil', path: '/profile#section-contact', desc: 'Kontak telepon seluler terdaftar' });
      }
      if (userProfile.email) {
        items.push({ id: 'u_email', title: `Email: ${userProfile.email}`, category: 'Data Profil', path: '/profile#section-contact', desc: 'Alamat surel kontak resmi' });
      }
      if (userProfile.address) {
        items.push({ id: 'u_addr', title: `Alamat: ${userProfile.address}`, category: 'Data Profil', path: '/profile#section-address', desc: [userProfile.district, userProfile.city, userProfile.province].filter(Boolean).join(', ') || 'Alamat domisili' });
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
        items.push({ id: 'u_nisn', title: `NISN: ${userProfile.nisn}`, category: 'Data Profil', path: '/profile#section-occupation', desc: 'Nomor Induk Siswa Nasional' });
      }
      // Check custom fields
      if (userProfile.custom_fields && Array.isArray(userProfile.custom_fields)) {
        userProfile.custom_fields.forEach((cf: any, idx: number) => {
          if (cf.label || cf.value) {
            items.push({
              id: `u_cf_${idx}`,
              title: `${cf.label || 'Kustom'}: ${cf.value || '-'}`,
              category: 'Data Profil',
              path: '/profile',
              desc: 'Data profil kustom pengguna'
            });
          }
        });
      }
    }
    return items;
  }, [userProfile]);

  // Filter search results against dynamic items
  const filteredSearchResults = useMemo(() => {
    if (searchQuery.trim() === '') return dynamicSearchItems.slice(0, 6);
    const q = searchQuery.toLowerCase();
    return dynamicSearchItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [searchQuery, dynamicSearchItems]);

  const handleSelectSearchResult = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dasbor', iconName: 'apps' },
    { path: '/profile', label: 'Profil saya', iconName: 'user' },
    { path: '/templates', label: 'Grup layanan', iconName: 'folder' },
    { path: '/activity', label: 'Riwayat aktivitas', iconName: 'time-past' },
    { path: '/settings', label: 'Pengaturan & keamanan', iconName: 'settings' },
  ];

  const userInitial = (user?.email?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="min-h-screen bg-[#14225E] text-[#0F172A] font-sans flex flex-col md:flex-row overflow-x-hidden selection:bg-[#EFF4FF]">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-xs transition-opacity duration-150"
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR: Static compact width (200px), fixed to screen, no collapse      */}
      {/* ========================================================================= */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 h-screen w-[200px] flex flex-col justify-between shrink-0 bg-[#14225E] transition-transform duration-150 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="flex items-center h-[72px] px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-white flex items-center justify-center shrink-0 p-1 overflow-hidden">
                <img
                  src="/logo-white.png"
                  alt="GovConnect"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-white text-[18px] leading-[24px] tracking-tight block">
                  GovConnect
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 h-[44px] text-[14px] leading-[20px] font-medium rounded-[10px] transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#2563EB] shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
                      : 'text-white/70 hover:bg-white/[0.08] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Flaticon
                      name={item.iconName}
                      variant={isActive ? 'br' : 'rr'}
                      className={`text-[18px] shrink-0 ${
                        isActive ? 'text-[#2563EB]' : 'text-white/70'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Logout button at bottom */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 h-[44px] rounded-[10px] text-[#FDA4AF] hover:bg-white/[0.08] hover:text-[#FECDD3] transition-colors duration-150 text-[14px] leading-[20px] font-medium cursor-pointer"
            >
              <Flaticon name="sign-out-alt" className="text-[18px] shrink-0 text-[#FDA4AF]" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-[200px] md:my-3 md:mr-3 rounded-none md:rounded-[24px] bg-[#F6F8FB] min-h-[calc(100vh-24px)] overflow-hidden">
        {/* Topbar: Tinggi 64px, latar putih, border bawah 1px #E8ECF2, tanpa bayangan */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#E8ECF2] px-6 sm:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Extended Search Box */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-[10px] text-[#475569] hover:bg-[#F6F8FB] md:hidden cursor-pointer shrink-0"
              aria-label="Buka menu"
            >
              <Flaticon name="menu-burger" className="text-base" />
            </button>

            <div className="relative w-full" ref={searchContainerRef}>
              <div className="relative w-full">
                <Flaticon name="search" className="text-[16px] text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Cari halaman, data profil, atau layanan..."
                  className="w-full h-10 pl-10 pr-8 bg-[#F6F8FB] hover:bg-white focus:bg-white border border-[#E8ECF2] focus:border-[#2563EB] focus:ring-3 focus:ring-[rgba(37,99,235,0.15)] rounded-[10px] text-[14px] leading-[20px] text-[#0F172A] placeholder-[#64748B] transition-all duration-150 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0F172A]"
                  >
                    <Flaticon name="cross" className="text-[10px]" />
                  </button>
                )}
              </div>

            {/* Quick Search Dropdown Panel */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Hasil Pencarian Cepat</span>
                  <span className="text-[10px] text-slate-400">{filteredSearchResults.length} item</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {filteredSearchResults.length > 0 ? (
                    filteredSearchResults.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectSearchResult(item.path)}
                        className="w-full p-3 text-left hover:bg-blue-50/60 transition-colors flex items-start justify-between gap-3 group"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                              {item.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F6F8FB] text-[#475569] font-normal border border-[#E8ECF2]">
                              {item.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748B] truncate mt-0.5">{item.desc}</p>
                        </div>
                        <Flaticon name="arrow-right" className="text-xs text-[#64748B] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                      </button>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-[#64748B]">
                      Tidak ditemukan hasil untuk &quot;{searchQuery}&quot;
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Right: Notification Bell & Profile Chip */}
          <div className="flex items-center gap-3">
            {/* Notification Bell with Dropdown Panel */}
            <div className="relative" ref={notifContainerRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 rounded-[10px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F6F8FB] transition-colors cursor-pointer"
                aria-label="Notifikasi"
              >
                <Flaticon name="bell" className="text-[20px]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#2563EB] text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-[16px] border border-[#E8ECF2] shadow-[0_4px_16px_rgba(15,23,42,0.08)] overflow-hidden z-50">
                  <div className="p-3.5 border-b border-[#F1F4F8] bg-[#F6F8FB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#0F172A]">Notifikasi</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] bg-[#EFF4FF] text-[#2563EB] font-medium px-2 py-0.5 rounded-full">
                          {unreadCount} baru
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotifsRead}
                        className="text-[12px] font-medium text-[#2563EB] hover:text-[#1D4ED8] cursor-pointer"
                      >
                        Tandai sudah dibaca
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#F1F4F8]">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 hover:bg-[#F8FAFC] transition-colors flex items-start gap-3 ${
                            !n.read ? 'bg-[#EFF4FF]/50' : ''
                          }`}
                        >
                          <div
                            className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5 ${
                              n.type === 'success'
                                ? 'bg-emerald-50 text-emerald-600'
                                : n.type === 'info'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            {n.type === 'success' ? (
                              <Flaticon name="check" className="text-xs" />
                            ) : (
                              <Flaticon name="sparkles" className="text-xs" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[13px] font-medium text-[#0F172A] truncate">
                                {n.title}
                              </span>
                              <span className="text-[11px] text-[#64748B] shrink-0">{n.time}</span>
                            </div>
                            <p className="text-[12px] text-[#475569] mt-0.5 leading-relaxed">
                              {n.desc}
                            </p>
                          </div>
                          <button
                            onClick={() => removeNotif(n.id)}
                            className="text-[#64748B] hover:text-[#0F172A] p-0.5 cursor-pointer"
                            title="Hapus"
                          >
                            <Flaticon name="cross" className="text-[9px]" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-[13px] text-[#64748B]">
                        Tidak ada notifikasi saat ini
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 border-t border-[#F1F4F8] bg-[#F6F8FB] text-center">
                    <span className="text-[11px] text-[#64748B] font-normal">
                      Notifikasi sistem otomatis GovConnect
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill Chip */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#E8ECF2]">
              <div className="w-9 h-9 rounded-full bg-[#EFF4FF] text-[#2563EB] font-semibold text-[14px] flex items-center justify-center">
                {userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-[14px] leading-[20px] font-medium text-[#0F172A] block leading-tight truncate max-w-[130px]">
                  {user?.email?.split('@')[0]}
                </span>
                <span className="text-[12px] leading-[16px] text-[#64748B] block leading-tight font-normal">
                  Warga terverifikasi
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body with subtle page transition */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto page-enter">
          <Outlet />
        </main>
      </div>
    </div>
  );
}