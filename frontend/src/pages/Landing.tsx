import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome } from '../components/ui';
import logoDark from '../assets/logo dark.png';
import logoLight from '../assets/logo light.png';

// ================= REUSABLE SCROLL REVEAL COMPONENT =================
interface RevealProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in';
  delay?: number;
  threshold?: number;
}

function RevealOnScroll({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  threshold = 0.15,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: '0px 0px -40px 0px' }
    );

    const el = ref.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [threshold]);

  const animationClasses = {
    'fade-up': isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12',
    'fade-down': isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-12',
    'fade-left': isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12',
    'fade-right': isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12',
    'zoom-in': isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-92',
  };

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${animationClasses[animation]} ${className}`}
    >
      {children}
    </div>
  );
}

// ================= ANIMATED NUMBER COUNTER ON SCROLL =================
interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

function AnimatedCounter({ end, duration = 1600, suffix = '', decimals = 0 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          let startTimestamp: number | null = null;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(easeOut * end);
            if (progress < 1) {
              window.requestAnimationFrame(step);
            }
          };
          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );

    const el = ref.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [end, duration, started]);

  return (
    <span ref={ref} className="tabular-nums">
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString('id-ID')}
      {suffix}
    </span>
  );
}

// Mock service tabs
interface MockServiceTab {
  id: string;
  name: string;
  category: string;
  agency: string;
  url: string;
  fields: { label: string; value: string; key: string }[];
}

export function Landing() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Scroll Progress & ScrollY State
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Announcement Banner dismissible
  const [showBanner, setShowBanner] = useState(true);

  // Tab State in Showcase Mockup
  const [activeTab, setActiveTab] = useState<string>('dukcapil');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Dynamic Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setScrollProgress((currentScrollY / docHeight) * 100);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to Top action
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Download Extension action
  const handleDownloadExtension = () => {
    const link = document.createElement('a');
    link.href = '/govconnect-extension.zip';
    link.download = 'govconnect-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dynamic 3D tilt values based on scroll position for hero showcase
  const showcaseTilt = Math.max(0, 6 - scrollY / 55);
  const showcaseScale = Math.min(1, 0.96 + scrollY / 2200);

  // Mock services for the central showcase
  const mockTabs: Record<string, MockServiceTab> = {
    dukcapil: {
      id: 'dukcapil',
      name: 'Permohonan Akta Kelahiran & KK Baru',
      category: 'Kependudukan',
      agency: 'Dinas Kependudukan & Pencatatan Sipil',
      url: 'https://layanan.dukcapil.go.id/permohonan-akta',
      fields: [
        { label: 'Nomor Induk Kependudukan (NIK)', value: '3525012809980003', key: 'nik' },
        { label: 'Nama Lengkap Sesuai KTP', value: 'Ahmad Pratama Putra, S.Kom', key: 'nama_lengkap' },
        { label: 'Nomor Kartu Keluarga (KK)', value: '3525011204050001', key: 'no_kk' },
        { label: 'Tempat, Tanggal Lahir', value: 'Surabaya, 28 September 1998', key: 'ttl' },
        { label: 'Alamat Domisili KTP', value: 'Jl. Pemuda No. 45, RT 02/03, Gresik', key: 'alamat' },
        { label: 'Nomor WhatsApp / HP', value: '081234567890', key: 'telepon' },
      ],
    },
    kelurahan: {
      id: 'kelurahan',
      name: 'Surat Keterangan Usaha (SKU) & Domisili',
      category: 'Perizinan',
      agency: 'Pelayanan Terpadu Kelurahan Sukomulyo',
      url: 'https://pelayanan.kelurahan.go.id/surat-keterangan',
      fields: [
        { label: 'NIK Pemohon', value: '3525012809980003', key: 'nik' },
        { label: 'Nama Pemohon', value: 'Ahmad Pratama Putra', key: 'nama_lengkap' },
        { label: 'Pekerjaan / Bidang Usaha', value: 'Jasa Konsultan Teknologi', key: 'pekerjaan' },
        { label: 'Alamat Usaha', value: 'Komp. Ruko Graha Niaga Blok B-12', key: 'alamat_usaha' },
        { label: 'Kontak Pemohon', value: '081234567890', key: 'telepon' },
        { label: 'Email Verifikasi', value: 'ahmad.pratama@email.com', key: 'email' },
      ],
    },
    beasiswa: {
      id: 'beasiswa',
      name: 'Pendaftaran Beasiswa Indonesia Maju',
      category: 'Pendidikan',
      agency: 'Pusat Layanan Pembiayaan Pendidikan',
      url: 'https://beasiswa.kemdikbud.go.id/registrasi-peserta',
      fields: [
        { label: 'NIK Mahasiswa', value: '3525012809980003', key: 'nik' },
        { label: 'Nama Lengkap Mahasiswa', value: 'Ahmad Pratama Putra', key: 'nama_lengkap' },
        { label: 'Nama Institusi / Universitas', value: 'Institut Teknologi Sepuluh Nopember', key: 'instansi' },
        { label: 'Nomor Induk Mahasiswa (NIM)', value: '5025201089', key: 'nim' },
        { label: 'Email Kampus / Pribadi', value: 'ahmad.pratama@email.com', key: 'email' },
        { label: 'Nomor Rekening Bank', value: '142001889210 (Bank Mandiri)', key: 'rekening' },
      ],
    },
    bansos: {
      id: 'bansos',
      name: 'Verifikasi Data Terpadu Kesejahteraan Sosial (DTKS)',
      category: 'Bantuan Sosial',
      agency: 'Kementerian Sosial Republik Indonesia',
      url: 'https://cekbansos.kemensos.go.id/registrasi-mandiri',
      fields: [
        { label: 'Nomor Kartu Keluarga (KK)', value: '3525011204050001', key: 'no_kk' },
        { label: 'NIK Kepala Keluarga', value: '3525012809980003', key: 'nik' },
        { label: 'Nama Kepala Keluarga', value: 'Ahmad Pratama Putra', key: 'nama_lengkap' },
        { label: 'Jumlah Anggota Keluarga', value: '4 Orang', key: 'anggota_keluarga' },
        { label: 'Alamat Penerima Manfaat', value: 'Jl. Pemuda No. 45, RT 02/03, Gresik', key: 'alamat' },
        { label: 'Nomor HP Aktif', value: '081234567890', key: 'telepon' },
      ],
    },
  };

  const currentTab = mockTabs[activeTab] || mockTabs.dukcapil;



  // FAQ Items
  const faqList = [
    {
      q: 'Bagaimana GovConnect mengenali kolom pada website instansi yang berbeda-beda?',
      a: 'GovConnect dilengkapi algoritma pencocokan semantik leksikal berteknologi tinggi. Ekstensi membaca atribut kolom (name, id, placeholder, label terkait, hingga Shadow DOM) secara cerdas dan memetakannya langsung dengan atribut profil kependudukan Anda (NIK, KK, nama, alamat, kontak, dll.).',
    },
    {
      q: 'Apakah data kependudukan pribadi saya aman dan terenkripsi?',
      a: 'Sangat aman. Seluruh data kependudukan diproteksi dengan enkripsi kata sandi dan JWT. Ekstensi bekerja secara lokal di browser Anda dan hanya mengisi kolom ketika Anda menekan tombol eksekusi. Kami tidak pernah menjual atau membagikan data Anda ke pengiklan atau pihak ketiga mana pun.',
    },
    {
      q: 'Website dan browser apa saja yang didukung oleh ekstensi ini?',
      a: 'Ekstensi GovConnect kompatibel dengan seluruh browser berbasis Chromium (Google Chrome, Microsoft Edge, Brave, Opera, Vivaldi). Ekstensi ini dapat berjalan di website pelayanan publik apa pun, portal dinas kelurahan, pendaftaran sekolah/universitas, beasiswa, hingga bansos.',
    },
    {
      q: 'Apakah saya bisa memilih kolom mana saja yang ingin diisi?',
      a: 'Tentu saja! Pada panel ekstensi, Anda dapat mencentang atau menghapus centang pada kolom tertentu sebelum mengklik tombol isi formulir. Anda memegang kendali penuh 100% atas data yang Anda bagikan.',
    },
    {
      q: 'Berapa biaya untuk menggunakan GovConnect?',
      a: 'GovConnect 100% gratis untuk seluruh warga negara Indonesia guna mempercepat transformasi digital pelayanan publik yang inklusif dan bebas birokrasi berbelit.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#080E1A] text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans selection:bg-blue-600 selection:text-white relative">
      {/* ================= 1. DYNAMIC TOP SCROLL PROGRESS BAR ================= */}
      <div
        className="fixed top-0 left-0 h-[3.5px] bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 z-[100] transition-all duration-75 ease-out shadow-xs pointer-events-none"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ================= 2. DYNAMIC TOP ANNOUNCEMENT RIBBON ================= */}
      {showBanner && (
        <div className="relative bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 dark:from-[#070D18] dark:via-[#0B1528] dark:to-[#070D18] border-b border-blue-200/80 dark:border-blue-900/40 text-slate-700 dark:text-slate-200 text-xs sm:text-sm py-2.5 px-4 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center justify-center gap-2 text-center flex-wrap">
              <span className="text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
                Asisten formulir kependudukan instan dengan teknologi pencocokan semantik kini resmi rilis se-Indonesia.
              </span>
              <Link
                to="/demo"
                className="font-bold text-[#0A4174] hover:text-blue-700 dark:text-[#7BBDE8] dark:hover:text-white underline underline-offset-4 flex items-center gap-1 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
              >
                <span>Coba Simulator</span>
                <FontAwesome name="arrow-right" className="text-[10px]" />
              </Link>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg transition-all duration-300 ease-out hover:scale-110 active:scale-90 cursor-pointer shrink-0"
              aria-label="Tutup Pengumuman"
            >
              <FontAwesome name="cross-small" className="text-sm" />
            </button>
          </div>
        </div>
      )}

      {/* ================= 3. FULL WIDTH EDGE-TO-EDGE NAVBAR ================= */}
      <header
        className={`sticky top-0 z-50 w-full backdrop-blur-xl bg-white/90 dark:bg-[#080E1A]/90 border-b border-slate-200/80 dark:border-slate-800/80 transition-all duration-200 ${
          scrollY > 20 ? 'shadow-sm dark:shadow-black/20' : ''
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Name with Ultra-Smooth Transition */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none shrink-0">
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt="GovConnect Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 shrink-0"
            />
            <span className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              GovConnect
            </span>
          </Link>

          {/* Right: Theme Toggle (Dashboard Style), Uji Coba (Caret Icon), Masuk/Dashboard, Pasang Ekstensi */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Theme Toggle Button (Dashboard Style) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-slate-200 dark:border-[#243048] bg-slate-50 dark:bg-[#171F2F] text-slate-600 dark:text-[#BDD8E9] hover:bg-slate-100 dark:hover:bg-[#243048] hover:text-slate-900 dark:hover:text-white transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer shadow-xs group"
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

            {/* Tombol Uji Coba with Gambar 1 Caret-Right Icon */}
            <Link
              to="/demo"
              className="group inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 dark:bg-blue-400/10 dark:hover:bg-blue-400/20 border border-blue-500/20 dark:border-blue-400/20 text-[#0A4174] dark:text-[#7BBDE8] text-xs sm:text-sm font-bold transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97] hover:shadow-xs cursor-pointer shrink-0"
              title="Coba simulasi autofill live"
            >
              <FontAwesome
                name="caret-right"
                className="text-xs text-blue-600 dark:text-sky-400 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:scale-110"
              />
              <span>Uji Coba</span>
            </Link>

            {/* Masuk / Dashboard */}
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-bold transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer"
              >
                <FontAwesome name="user" className="text-xs text-blue-600 dark:text-sky-400" />
                <span>Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer"
              >
                <FontAwesome name="right-to-bracket" className="text-xs text-slate-500 dark:text-slate-400" />
                <span>Masuk</span>
              </button>
            )}

            {/* Pasang Ekstensi */}
            <button
              type="button"
              onClick={handleDownloadExtension}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white text-xs sm:text-sm font-bold transition-all duration-300 ease-out shadow-md hover:shadow-xl hover:shadow-blue-900/25 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              title="Unduh file ekstensi zip"
            >
              <FontAwesome name="download" className="text-xs" />
              <span>Pasang Ekstensi</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= 4. HERO SECTION WITH CHRONOTASK FLOATING CARDS ================= */}
      <section className="relative overflow-hidden pt-12 pb-24 sm:pt-16 sm:pb-32">
        {/* Ambient Gradient Glows (Outcrowd Dynamic Atmosphere) */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[450px] bg-gradient-to-tr from-blue-600/15 via-[#0A4174]/20 to-sky-400/20 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">


          {/* Hero Headline */}
          <RevealOnScroll animation="fade-up" delay={100}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
              Layanan Publik Jadi{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-[#0A4174] to-sky-500 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-300">
                Lebih Cepat & Otomatis
              </span>
            </h1>
          </RevealOnScroll>

          {/* Hero Subtitle */}
          <RevealOnScroll animation="fade-up" delay={200}>
            <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed mb-10">
              Katakan selamat tinggal pada ketik ulang NIK, KK, dan data kependudukan berulang kali.
              GovConnect mendeteksi dan mengisi formulir dinas kependudukan, perizinan, beasiswa, hingga bansos dalam <strong>0.3 detik</strong>.
            </p>
          </RevealOnScroll>

          {/* CTA Buttons Cluster */}
          <RevealOnScroll animation="fade-up" delay={300}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleDownloadExtension}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#0A4174] hover:bg-[#001D39] text-white text-base sm:text-lg font-bold shadow-xl shadow-blue-900/20 hover:shadow-2xl hover:shadow-blue-900/30 transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex items-center justify-center gap-3 cursor-pointer group"
              >
                <FontAwesome name="download" className="text-base group-hover:-translate-y-1 transition-transform" />
                <span>Unduh Ekstensi Browser</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/20 text-white font-semibold">
                  Gratis
                </span>
              </button>

              <Link
                to="/demo"
                className="group w-full sm:w-auto px-7 py-4 rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 text-slate-800 dark:text-slate-200 text-base font-bold shadow-sm hover:shadow-md transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.97] flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <FontAwesome
                  name="caret-right"
                  className="text-sm text-blue-600 dark:text-sky-400 transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:scale-110"
                />
                <span>Coba Simulator (Live)</span>
              </Link>
            </div>

            {/* Trust Guarantees */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <FontAwesome name="check-circle" className="text-emerald-500" />
                Kompatibel Chrome, Edge, Brave
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <FontAwesome name="shield-check" className="text-emerald-500" />
                Enkripsi Data Kependudukan
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <FontAwesome name="bolt" className="text-emerald-500" />
                Akurasi 100% Bebas Typo
              </span>
            </div>
          </RevealOnScroll>
        </div>

        {/* ================= 5. CENTRAL PRODUCT SHOWCASE WITH 3D SCROLL PERSPECTIVE TILT ================= */}
        <div id="showcase" className="mt-16 sm:mt-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* FLOATING CARD 1: TOP LEFT (Speed Benchmark) */}
          <div className="hidden xl:flex absolute -left-12 top-10 z-20 animate-float-slow">
            <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#131C2E]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xl max-w-[210px] text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                  ⚡
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Kecepatan Isi
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                0.3 Detik
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                vs 4m 30s ketik manual di formulir dinas
              </p>
            </div>
          </div>

          {/* FLOATING CARD 2: TOP RIGHT (Security Verified) */}
          <div className="hidden xl:flex absolute -right-12 top-14 z-20 animate-float-delayed">
            <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#131C2E]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xl max-w-[220px] text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs">
                  <FontAwesome name="shield-check" />
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Data Terenkripsi
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Brankas Kependudukan
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                <FontAwesome name="circle-check" className="text-[10px]" />
                NIK & KK Terverifikasi
              </p>
            </div>
          </div>

          {/* FLOATING CARD 3: BOTTOM LEFT (Citizen Community & Social Proof) */}
          <div className="hidden xl:flex absolute -left-10 bottom-16 z-20 animate-float-reverse">
            <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#131C2E]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xl max-w-[220px] text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-amber-500 text-xs">★★★★★</span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">4.9 / 5</span>
              </div>
              <div className="text-base font-extrabold text-slate-900 dark:text-white">
                25.000+ Warga
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Mengisi formulir publik bebas kendala
              </p>
            </div>
          </div>

          {/* FLOATING CARD 4: BOTTOM RIGHT (Field Match Rate) */}
          <div className="hidden xl:flex absolute -right-10 bottom-20 z-20 animate-float-slow">
            <div className="p-4 rounded-2xl bg-white/95 dark:bg-[#131C2E]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xl max-w-[210px] text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Deteksi Kolom</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  100%
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Cocok Otomatis
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
              </div>
            </div>
          </div>

          {/* The Main Showcase Container with Dynamic Scroll-Driven 3D Perspective Tilt */}
          <div
            style={{
              transform: `perspective(1000px) rotateX(${showcaseTilt}deg) scale(${showcaseScale})`,
              transition: 'transform 0.15s ease-out',
            }}
            className="rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl bg-white dark:bg-[#111A2B] overflow-hidden transition-all will-change-transform"
          >
            {/* Top Browser Bar */}
            <div className="h-12 bg-slate-100/90 dark:bg-[#0B1220] border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block"></span>
              </div>

              {/* Active URL bar */}
              <div className="flex-1 max-w-lg mx-auto bg-white dark:bg-[#192438] border border-slate-200 dark:border-slate-700/70 rounded-xl px-3.5 py-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-300 truncate">
                <div className="flex items-center gap-2 truncate">
                  <FontAwesome name="lock" className="text-emerald-500 text-[11px]" />
                  <span className="truncate font-mono">{currentTab.url}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-extrabold text-blue-600 dark:text-sky-400">GovConnect Aktif</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <FontAwesome name="refresh" className="hover:text-slate-600 cursor-pointer" />
              </div>
            </div>

            {/* Interactive Category Tabs Header with Proper Icons */}
            <div className="px-6 py-3.5 bg-slate-50/80 dark:bg-[#0E1626] border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[
                { id: 'dukcapil', label: 'Kependudukan & Dukcapil', icon: 'landmark', iconColor: 'text-blue-500 dark:text-sky-400' },
                { id: 'kelurahan', label: 'Izin & Kelurahan', icon: 'building', iconColor: 'text-indigo-500 dark:text-indigo-400' },
                { id: 'beasiswa', label: 'Beasiswa & Pendidikan', icon: 'graduation-cap', iconColor: 'text-amber-500 dark:text-amber-400' },
                { id: 'bansos', label: 'Bansos & Bantuan Sosial', icon: 'handshake', iconColor: 'text-emerald-500 dark:text-emerald-400' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 ease-out hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-[#1E2C44] text-blue-600 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <FontAwesome
                    name={tab.icon}
                    className={`text-xs transition-transform duration-300 ease-out group-hover:scale-110 ${
                      activeTab === tab.id ? 'text-blue-600 dark:text-sky-300' : tab.iconColor
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Split View Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
              {/* Left Side: Target Government Web Form */}
              <div className="lg:col-span-7 xl:col-span-8 p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800 gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-blue-600 dark:text-sky-400 uppercase tracking-wider">
                      {currentTab.agency}
                    </span>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg">
                      {currentTab.name}
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                    <FontAwesome name="circle-check" className="text-xs" />
                    Semua Kolom Terisi Otomatis
                  </span>
                </div>

                {/* Form fields populated by GovConnect */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentTab.fields.map((field, idx) => (
                    <div
                      key={idx}
                      className={`space-y-1 ${
                        field.key === 'alamat' || field.key === 'alamat_usaha' ? 'sm:col-span-2' : ''
                      }`}
                    >
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>{field.label}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">✓ Cocok</span>
                      </label>
                      <div className="px-3.5 py-2.5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-700/60 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white shadow-xs">
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Docked GovConnect Autofill Assistant Panel */}
              <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-[#131C2E] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  {/* Sidepanel Header */}
                  <div className="h-14 px-4 bg-[#0A4174] dark:bg-[#001D39] text-white flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={theme === 'dark' ? logoDark : logoLight}
                        alt="GovConnect"
                        className="w-6 h-6 object-contain"
                      />
                      <div>
                        <div className="font-bold text-xs tracking-tight">GovConnect Assistant</div>
                        <div className="text-[10px] text-sky-200">Autofill Layanan Publik</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-sky-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[11px] font-bold">Siaga</span>
                    </div>
                  </div>

                  {/* Detection Card */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="p-3.5 bg-blue-50/90 dark:bg-blue-950/50 rounded-2xl border border-blue-200/80 dark:border-blue-800 flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {currentTab.fields.length} Kolom Terdeteksi
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          100% Cocok dengan profil kependudukan
                        </div>
                      </div>
                      <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                        ⚡
                      </span>
                    </div>
                  </div>

                  {/* Matched Field Pills */}
                  <div className="p-4 space-y-2 max-h-[220px] overflow-y-auto text-xs">
                    {currentTab.fields.map((f, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FontAwesome name="check-circle" className="text-emerald-500 text-xs shrink-0" />
                          <span className="truncate font-semibold text-slate-700 dark:text-slate-300">
                            {f.label}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                          Cocok
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidepanel Action Button */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30">
                  <button
                    onClick={handleDownloadExtension}
                    className="group w-full py-3.5 px-4 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white text-xs font-extrabold transition-all duration-300 ease-out shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FontAwesome
                      name="caret-right"
                      className="text-xs text-sky-300 transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:scale-110"
                    />
                    <span>Isi Semua Kolom ({currentTab.fields.length} Data)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 6. STATS & NUMBERS BAR (ANIMATED COUNTERS ON SCROLL) ================= */}
      <section className="py-14 bg-blue-50/40 dark:bg-[#0B1424] border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll animation="zoom-in" delay={0}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
              <div className="p-4">
                <div className="text-3xl sm:text-5xl font-black text-blue-600 dark:text-sky-400 tracking-tight">
                  <AnimatedCounter end={0.3} decimals={1} suffix="s" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">
                  Waktu Pengisian Rata-rata
                </div>
              </div>

              <div className="p-4">
                <div className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  <AnimatedCounter end={25000} suffix="+" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">
                  Formulir Warga Terlayani
                </div>
              </div>

              <div className="p-4">
                <div className="text-3xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  <AnimatedCounter end={98.8} decimals={1} suffix="%" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">
                  Efisiensi Waktu Terhemat
                </div>
              </div>

              <div className="p-4">
                <div className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  <AnimatedCounter end={100} suffix="%" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-2">
                  Akurasi Bebas Salah Ketik
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ================= 7. TIME EFFICIENCY COMPARISON (CLEAN MINIMALIST DESIGN) ================= */}
      <section id="comparison" className="py-20 sm:py-24 bg-white dark:bg-[#0A101D] border-b border-slate-200/80 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll animation="fade-up" delay={0}>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                Efisiensi Waktu
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1.5 mb-3">
                Hemat 98.8% Waktu Mengurus Formulir
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Transformasi proses pengisian data yang membosankan menjadi otomatisasi 1-klik yang instan dan presisi.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            {/* Minimalist Card 1: Cara Manual */}
            <RevealOnScroll animation="fade-left" delay={100} className="h-full">
              <div className="h-full p-7 sm:p-8 rounded-3xl bg-slate-50/70 dark:bg-[#0E1626] border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      Cara Manual Konvensional
                    </span>
                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                      <FontAwesome name="clock" className="text-[11px]" />
                      4.5 Menit
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                    Melelahkan & Rawan Typo
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                    Mencari kartu fisik, membaca 16 digit NIK/KK, dan mengetik ulang satu per satu kolom pada setiap instansi yang berbeda.
                  </p>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    <li className="flex items-start gap-2.5">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                      <span>Mengetik ulang belasan kolom dari awal</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                      <span>Risiko salah ketik angka NIK atau tanggal lahir</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                      <span>Format tanggal atau alamat sering ditolak sistem</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-[11px] text-slate-400">
                  Rata-rata waktu terbuang: <strong>4 menit 30 detik</strong>
                </div>
              </div>
            </RevealOnScroll>

            {/* Minimalist Card 2: GovConnect Assistant */}
            <RevealOnScroll animation="fade-right" delay={200} className="h-full">
              <div className="h-full p-7 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1626] border border-blue-500/30 dark:border-blue-400/30 shadow-sm hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md flex flex-col justify-between transition-all duration-300 group">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-blue-100 dark:border-slate-800/60">
                    <span className="text-xs font-bold text-blue-600 dark:text-sky-400">
                      Asisten GovConnect
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <FontAwesome name="check" className="text-[11px]" />
                      0.3 Detik Instan
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
                    1-Klik Selesai Tuntas
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
                    Ekstensi memetakan kolom secara semantik dan mengisi seluruh formulir secara instan dari brankas data Anda.
                  </p>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                    <li className="flex items-start gap-2.5 font-medium">
                      <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                      <span>Autofill seluruh kolom formulir dalam 1 klik</span>
                    </li>
                    <li className="flex items-start gap-2.5 font-medium">
                      <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                      <span>100% presisi bebas salah ketik</span>
                    </li>
                    <li className="flex items-start gap-2.5 font-medium">
                      <span className="text-emerald-500 font-bold shrink-0 mt-0.5">✓</span>
                      <span>Data aman tersimpan di browser Anda</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-blue-700 dark:text-sky-300 font-bold">
                    Efisiensi: <strong>98.8%</strong>
                  </span>
                  <Link
                    to="/demo"
                    className="group/btn inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white text-xs font-bold transition-all duration-300 ease-out hover:scale-105 active:scale-95 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <span>Coba Simulator</span>
                    <FontAwesome
                      name="caret-right"
                      className="text-xs transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5"
                    />
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ================= 8. FAQ ACCORDION SECTION (STAGGER SCROLL REVEAL) ================= */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <RevealOnScroll animation="fade-up" delay={0}>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-600 dark:text-sky-400">
              Tanya Jawab
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-2 mb-4">
              Pertanyaan yang Sering Diajukan
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
              Ketahui lebih lanjut mengenai cara kerja, privasi data, dan pemasangan ekstensi GovConnect.
            </p>
          </div>
        </RevealOnScroll>

        <div className="space-y-4">
          {faqList.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <RevealOnScroll key={index} animation="fade-up" delay={index * 80}>
                <div className="rounded-2xl bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-sky-400 transition-all duration-300 ease-out cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <span
                      className={`w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-sky-400' : ''
                      }`}
                    >
                      <FontAwesome name="chevron-down" />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80 pt-4 animate-in fade-in duration-200">
                      {item.a}
                    </div>
                  )}
                </div>
              </RevealOnScroll>
            );
          })}
        </div>
      </section>

      {/* ================= 9. FLOATING "BACK TO TOP" BUTTON WITH SCROLL RING ================= */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-300 ${
          scrollY > 400 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
        }`}
      >
        <button
          onClick={scrollToTop}
          className="relative w-12 h-12 rounded-full bg-white/90 dark:bg-[#131C2E]/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 hover:scale-110 active:scale-90 transition-all duration-300 ease-out cursor-pointer"
          title="Kembali ke atas"
          aria-label="Back to top"
        >
          {/* Circular SVG scroll progress indicator */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-blue-600 dark:text-sky-400 transition-all duration-75"
              strokeDasharray={`${scrollProgress}, 100`}
              strokeWidth="2.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <FontAwesome name="chevron-up" className="text-xs relative z-10" />
        </button>
      </div>

      {/* ================= 13. COMPREHENSIVE MINIMAL OUTCROWD FOOTER ================= */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080E1A] text-slate-600 dark:text-slate-400 text-xs py-14 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand Col with Smooth Logo Hover (No Siaga Badge) */}
            <div className="md:col-span-1">
              <Link to="/" className="flex items-center gap-3 mb-4 group focus:outline-none">
                <img
                  src={theme === 'dark' ? logoDark : logoLight}
                  alt="GovConnect Logo"
                  className="w-8 h-8 object-contain transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 shrink-0"
                />
                <span className="font-black text-slate-900 dark:text-white text-xl tracking-tight">
                  GovConnect
                </span>
              </Link>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Platform asisten formulir kependudukan & pelayanan publik otomatis terpadu Indonesia.
              </p>
            </div>

            {/* Col 2: Fitur Ekstensi */}
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-4">
                Fitur Ekstensi
              </h4>
              <ul className="space-y-2.5">
                <li><a href="#showcase" className="hover:text-blue-600 transition-colors">Pencocokan Semantik</a></li>
                <li><Link to="/demo" className="hover:text-blue-600 transition-colors">Simulator Demo</Link></li>
                <li><a href="#comparison" className="hover:text-blue-600 transition-colors">Efisiensi Waktu</a></li>
                <li><a href="#showcase" className="hover:text-blue-600 transition-colors">Integrasi Browser</a></li>
              </ul>
            </div>

            {/* Col 3: Layanan Publik */}
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-4">
                Layanan Warga
              </h4>
              <ul className="space-y-2.5">
                <li><Link to="/public-services" className="hover:text-blue-600 transition-colors">Direktori Layanan</Link></li>
                <li><Link to="/templates" className="hover:text-blue-600 transition-colors">Template Formulir</Link></li>
                <li><Link to="/complaints" className="hover:text-blue-600 transition-colors">Saluran Pengaduan</Link></li>
                <li><Link to="/profile" className="hover:text-blue-600 transition-colors">Profil Kependudukan</Link></li>
              </ul>
            </div>

            {/* Col 4: Keamanan & Bantuan */}
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-4">
                Keamanan & Akses
              </h4>
              <ul className="space-y-2.5">
                <li><a href="#faq" className="hover:text-blue-600 transition-colors">Pertanyaan Umum (FAQ)</a></li>
                <li><Link to="/login" className="hover:text-blue-600 transition-colors">Portal Masuk</Link></li>
                <li><Link to="/register" className="hover:text-blue-600 transition-colors">Pendaftaran Akun</Link></li>
                <li><a href="#faq" className="hover:text-blue-600 transition-colors">Standar Privasi</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div>
              © 2026 GovConnect Indonesia. Hak cipta dilindungi undang-undang.
            </div>
            <div className="flex items-center gap-4">
              <span>Dibangun dengan Cinta untuk Kemudahan Pelayanan Publik Warga</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
