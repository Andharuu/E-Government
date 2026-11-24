import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Check,
  CheckCircle2,
  Shield,
  ShieldCheck,
  ArrowRight,
  Download,
  Lock,
  Terminal,
  Zap,
  Clock,
  Sparkles,
  ChevronDown,
  X,
  Laptop,
  SlidersHorizontal,
  Menu,
  Sun,
  Moon,
  Workflow,
  KeyRound,
  Play,
  RotateCcw,
  Building2,
  CheckCheck,
  Mail,
  GraduationCap,
  Briefcase,
  HeartHandshake,
  Activity,
  Landmark,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoDark from '../assets/logo dark.png';
import logoLight from '../assets/logo light.png';

/* =========================================================================
   Animation & Scroll Reveal Component (Respects prefers-reduced-motion)
   ========================================================================= */

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

function RevealOnScroll({ children, className = '', delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Respect user's reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const el = ref.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* =========================================================================
   Animated Counter (Count-up on enter viewport)
   ========================================================================= */

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
  prefix?: string;
}

function AnimatedCounter({ end, duration = 1400, prefix = '', suffix = '', decimals = 0 }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          let startTimestamp: number | null = null;
          const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(easeOut * end);
            if (progress < 1) window.requestAnimationFrame(step);
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
    <span ref={ref} className="font-mono tabular-nums">
      {prefix}
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString('id-ID')}
      {suffix}
    </span>
  );
}

/* =========================================================================
   Dummy Form Mockup Data (Semua data kependudukan dummy/jelas palsu)
   ========================================================================= */

interface MockField {
  id: string;
  label: string;
  semanticKey: string;
  dummyValue: string;
  category: string;
}

const HERO_MOCK_FIELDS: MockField[] = [
  {
    id: 'nik',
    label: 'Nomor Induk Kependudukan (NIK)',
    semanticKey: 'nik_pemohon',
    dummyValue: '3500000000000000',
    category: 'Identitas',
  },
  {
    id: 'nama',
    label: 'Nama Lengkap Sesuai KTP',
    semanticKey: 'nama_lengkap',
    dummyValue: 'Budi Contoh',
    category: 'Identitas',
  },
  {
    id: 'no_kk',
    label: 'Nomor Kartu Keluarga (KK)',
    semanticKey: 'nomor_kk',
    dummyValue: '3500000000000001',
    category: 'Keluarga',
  },
  {
    id: 'ttl',
    label: 'Tempat & Tanggal Lahir',
    semanticKey: 'tempat_tgl_lahir',
    dummyValue: 'Surabaya, 01-01-1990',
    category: 'Kelahiran',
  },
  {
    id: 'alamat',
    label: 'Alamat Domisili KTP',
    semanticKey: 'alamat_ktp',
    dummyValue: 'Jl. Merdeka No. 10, RT 01/02',
    category: 'Domisili',
  },
  {
    id: 'telepon',
    label: 'Nomor WhatsApp / HP',
    semanticKey: 'no_telepon',
    dummyValue: '081200000000',
    category: 'Kontak',
  },
];

/* =========================================================================
   FAQ Data
   ========================================================================= */

const FAQ_ITEMS = [
  {
    question: 'Bagaimana GovConnect mengenali kolom formulir di website instansi yang berbeda?',
    answer:
      'GovConnect menggunakan algoritma pencocokan semantik leksikal berjenjang. Ekstensi membaca atribut kolom seperti name, id, placeholder, label terkait, hingga struktur HTML halaman, lalu memetakannya secara lokal ke profil Anda tanpa bergantung pada nama variabel instansi tertentu.',
  },
  {
    question: 'Apakah data NIK dan berkas pribadi saya aman dari kebocoran?',
    answer:
      'Sangat aman. Seluruh data kependudukan Anda disimpan di penyimpanan lokal browser Anda sendiri dan dilindungi enkripsi kata sandi. Ekstensi tidak pernah mengirimkan data Anda ke server pihak ketiga mana pun tanpa persetujuan eksplisit Anda.',
  },
  {
    question: 'Apakah ekstensi bisa mengisi kolom formulir tanpa persetujuan saya?',
    answer:
      'Tidak pernah. Setiap pengisian membutuhkan tindakan sadar Anda. Panel samping GovConnect selalu menampilkan pratinjau kolom yang cocok terlebih dahulu, dan pengisian baru dieksekusi setelah Anda menekan tombol konfirmasi persetujuan.',
  },
  {
    question: 'Browser apa saja yang kompatibel dengan ekstensi GovConnect?',
    answer:
      'GovConnect kompatibel penuh dengan seluruh browser berbasis Chromium modern, termasuk Google Chrome, Microsoft Edge, Brave Browser, Opera, dan Vivaldi, dengan standar Manifest V3.',
  },
  {
    question: 'Berapa biaya untuk mengunduh dan memakai ekstensi GovConnect?',
    answer:
      'GovConnect 100% gratis untuk seluruh masyarakat Indonesia. Inisiatif ini dikembangkan untuk memudahkan warga mengakses pelayanan publik digital secara efisien tanpa kendala birokrasi pengetikan ulang berkas.',
  },
  {
    question: 'Bagaimana jika terdapat kolom khusus instansi yang belum dikenali?',
    answer:
      'Anda dapat memetakan kolom tersebut secara manual dalam 1 klik melalui panel asisten samping. Ekstensi akan mengingat preferensi pemetaan tersebut untuk pengisian otomatis pada formulir serupa berikutnya.',
  },
];

/* =========================================================================
   MAIN COMPONENT: LANDING PAGE
   ========================================================================= */

export function Landing() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [activeMenu, setActiveMenu] = useState<'fitur' | 'keamanan' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0); // First item open by default
  const [browserTab, setBrowserTab] = useState<'chrome' | 'edge' | 'brave'>('chrome');
  const headerRef = useRef<HTMLElement>(null);

  // Selalu buka halaman dari paling atas saat mount/refresh & bersihkan hash yang menempel
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // Fungsi presisi untuk menggulir halaman agar section tepat berada di tengah layar (viewport)
  const scrollToElementCenter = useCallback((targetId: string) => {
    setActiveMenu(null);
    setMobileMenuOpen(false);

    const element = document.getElementById(targetId);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const absoluteElementTop = rect.top + window.pageYOffset;
    const elementHeight = rect.height;
    const viewportHeight = window.innerHeight;
    const navbarHeight = showAnnouncement ? 112 : 76; // Floating navbar height + top margin (dinamis terhadap banner pengumuman)

    // Ruang vertikal yang terlihat di bawah navbar
    const visibleSpace = viewportHeight - navbarHeight;

    let targetY: number;

    if (elementHeight <= visibleSpace) {
      // Jika seksi muat seutuhnya di layar: posisikan persis di tengah area yang terlihat
      const halfRemaining = (visibleSpace - elementHeight) / 2;
      targetY = absoluteElementTop - navbarHeight - halfRemaining;
    } else {
      // Jika seksi lebih panjang dari viewport: pusatkan titik tengah seksi ke titik tengah area terlihat,
      // dengan penjagaan agar bagian atas seksi tidak pernah tertutup di balik navbar
      const sectionCenter = absoluteElementTop + (elementHeight / 2);
      const visibleCenter = navbarHeight + (visibleSpace / 2);
      const idealTargetY = sectionCenter - visibleCenter;

      // Batas maksimum scroll agar bagian atas seksi tetap terlihat nyaman minimal 16px di bawah navbar
      const maxScrollYToKeepTopVisible = absoluteElementTop - navbarHeight - 16;
      targetY = Math.min(idealTargetY, maxScrollYToKeepTopVisible);
    }

    window.scrollTo({
      top: Math.max(0, Math.round(targetY)),
      behavior: 'smooth',
    });

    // Bersihkan hash dari address bar agar saat refresh (F5) browser selalu kembali ke paling atas
    window.history.replaceState(null, '', window.location.pathname);
  }, [showAnnouncement]);

  // Event listener global: Escape, Click Outside, dan Smooth Scroll untuk semua anchor link (#...)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
        setMobileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };

    // Intersep semua klik anchor link (#...) agar smooth scroll tepat di tengah section dan URL hash bersih
    const handleAnchorDelegate = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        const targetId = href.slice(1);
        scrollToElementCenter(targetId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('click', handleAnchorDelegate);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleAnchorDelegate);
    };
  }, [scrollToElementCenter]);

  // Interactive Hero Form State
  const [filledFields, setFilledFields] = useState<number>(3);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Bento Interactive Playground State
  const [bentoSimStep, setBentoSimStep] = useState<number>(0);
  const [bentoPlaying, setBentoPlaying] = useState<boolean>(false);

  // Automated Hero Autofill Loop
  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setFilledFields((prev) => (prev >= HERO_MOCK_FIELDS.length ? 0 : prev + 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Bento visual simulation loop
  useEffect(() => {
    if (!bentoPlaying) return;
    const interval = setInterval(() => {
      setBentoSimStep((prev) => {
        if (prev >= 4) {
          setBentoPlaying(false);
          return 4;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [bentoPlaying]);

  const handleDownloadExtension = () => {
    const link = document.createElement('a');
    link.href = '/govconnect-extension.zip';
    link.download = 'govconnect-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startBentoSimulation = () => {
    setBentoSimStep(0);
    setBentoPlaying(true);
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 selection:bg-blue-600 selection:text-white ${
        theme === 'dark' ? 'bg-[#050F1E] text-[#F2F6FB]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: marqueeScroll 32s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none !important;
          }
        }
      `}</style>
      {/* ===================================================================
          1. ANNOUNCEMENT BAR TIPIS DENGAN TOMBOL TUTUP (FIXED AT TOP)
          =================================================================== */}
      {showAnnouncement && (
        <div
          role="region"
          aria-label="Pengumuman rilis"
          className={`fixed top-0 inset-x-0 z-50 text-xs py-2 px-4 border-b flex items-center transition-colors duration-200 backdrop-blur-md ${
            theme === 'dark'
              ? 'bg-[#061427]/90 border-white/[0.08] text-[#9DB0C8]'
              : 'bg-blue-50/90 border-blue-200/80 text-blue-900'
          }`}
        >
          <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between gap-3">
            <div className="flex-1 text-center flex items-center justify-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                  theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
                }`}
              >
                <Sparkles className="w-3 h-3" strokeWidth={1.5} />
                GovConnect v1.4.0
              </span>
              <span className="text-xs">
                Asisten formulir kependudukan dengan pencocokan semantik leksikal kini rilis publik.
              </span>
              <Link
                to="/demo"
                className="font-semibold underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5 focus-visible:outline-2 focus-visible:outline-blue-500"
              >
                Coba simulator interaktif
                <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowAnnouncement(false)}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-blue-500"
              aria-label="Tutup bar pengumuman"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================
          2. FLOATING EXPANDING GLASSMORPHISM NAVBAR (DOCKER-STYLE)
          =================================================================== */}
      <div
        className={`fixed inset-x-0 z-40 px-3 sm:px-4 pointer-events-none transition-all duration-300 ${
          showAnnouncement ? 'top-12 sm:top-13' : 'top-3 sm:top-4'
        }`}
      >
        <header
          ref={headerRef}
          onMouseLeave={() => setActiveMenu(null)}
          className={`pointer-events-auto mx-auto max-w-6xl rounded-xl border transition-all duration-300 ${
            theme === 'dark'
              ? 'bg-[#0B1221]/80 border-white/10 shadow-2xl shadow-black/50 text-[#F2F6FB]'
              : 'bg-white/85 border-slate-200 shadow-xl shadow-slate-900/10 text-slate-900'
          } backdrop-blur-xl overflow-hidden`}
        >
          {/* Top Navigation Row (~56px) */}
          <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
            {/* Sisi Kiri: Logo & Nama Brand */}
            <Link
              to="/"
              onClick={() => {
                setActiveMenu(null);
                setMobileMenuOpen(false);
                if (window.location.hash) {
                  window.history.replaceState(null, '', window.location.pathname);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 shrink-0 group focus-visible:outline-2 focus-visible:outline-blue-500 rounded-lg p-0.5"
            >
              <img
                src={theme === 'dark' ? logoDark : logoLight}
                alt="Logo GovConnect"
                className="w-7 h-7 object-contain transition-transform duration-300 ease-out group-hover:scale-105 transform-gpu select-none"
                width={28}
                height={28}
              />
              <span className="font-bold text-[16px] tracking-tight leading-none text-ink">
                GovConnect
              </span>
            </Link>

            {/* Sisi Kanan: Menu Navigasi + Toggle + Tombol Aksi */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Menu Navigasi Desktop */}
              <nav className="hidden lg:flex items-center gap-1 text-[13.5px] font-medium mr-2" aria-label="Menu Utama">
                {/* Menu Fitur (Hover buka mega-menu, Klik scroll pas ke tengah) */}
                <button
                  type="button"
                  aria-expanded={activeMenu === 'fitur'}
                  aria-haspopup="true"
                  onClick={() => scrollToElementCenter('fitur')}
                  onMouseEnter={() => setActiveMenu('fitur')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    activeMenu === 'fitur'
                      ? 'text-blue-400 font-semibold bg-blue-500/10'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>Fitur</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeMenu === 'fitur' ? 'rotate-180 text-blue-400' : 'text-slate-400'
                    }`}
                    strokeWidth={1.5}
                  />
                </button>

                {/* Menu Keamanan (Hover buka mega-menu, Klik scroll pas ke tengah) */}
                <button
                  type="button"
                  aria-expanded={activeMenu === 'keamanan'}
                  aria-haspopup="true"
                  onClick={() => scrollToElementCenter('keamanan')}
                  onMouseEnter={() => setActiveMenu('keamanan')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    activeMenu === 'keamanan'
                      ? 'text-blue-400 font-semibold bg-blue-500/10'
                      : theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>Keamanan</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeMenu === 'keamanan' ? 'rotate-180 text-blue-400' : 'text-slate-400'
                    }`}
                    strokeWidth={1.5}
                  />
                </button>

                {/* Menu Cara Kerja (Menutup Mega-Menu Saat Hover, Klik scroll pas ke tengah) */}
                <a
                  href="#cara-kerja"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElementCenter('cara-kerja');
                  }}
                  onMouseEnter={() => setActiveMenu(null)}
                  className={`px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Cara Kerja
                </a>

                {/* Menu FAQ (Menutup Mega-Menu Saat Hover, Klik scroll pas ke tengah) */}
                <a
                  href="#faq"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElementCenter('faq');
                  }}
                  onMouseEnter={() => setActiveMenu(null)}
                  className={`px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    theme === 'dark'
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  FAQ
                </a>
              </nav>

              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                onMouseEnter={() => setActiveMenu(null)}
                className={`p-1.5 rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${
                  theme === 'dark'
                    ? 'border-white/10 text-slate-300 hover:text-white hover:bg-white/5'
                    : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                aria-label="Ganti mode tema"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-300" strokeWidth={1.5} />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700" strokeWidth={1.5} />
                )}
              </button>

              {/* Tombol Sekunder "Masuk" (Outline Gelap) */}
              {user ? (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  onMouseEnter={() => setActiveMenu(null)}
                  className={`hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    theme === 'dark'
                      ? 'border-white/15 text-slate-200 hover:text-white hover:bg-white/5'
                      : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Dasbor
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  onMouseEnter={() => setActiveMenu(null)}
                  className={`hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    theme === 'dark'
                      ? 'border-white/15 text-slate-200 hover:text-white hover:bg-white/5'
                      : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  Masuk
                </button>
              )}

              {/* Tombol Utama "Pasang Ekstensi" (Biru Solid) */}
              <button
                type="button"
                onClick={handleDownloadExtension}
                onMouseEnter={() => setActiveMenu(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">Pasang Ekstensi</span>
                <span className="sm:hidden">Pasang</span>
              </button>

              {/* Mobile Menu Hamburger Toggle */}
              <button
                type="button"
                onClick={() => {
                  setActiveMenu(null);
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
                aria-label="Menu navigasi"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* ===================================================================
              3. EKSPANSI MEGA-MENU MENYATU (DESKTOP)
              (Animasi CSS Grid rows-[0fr] -> rows-[1fr] dengan opacity)
              =================================================================== */}
          <div
            className={`hidden lg:grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
              activeMenu
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden">
              <div className="border-t border-white/10 dark:border-white/10 border-slate-200/80 px-6 sm:px-8 py-5">
                {activeMenu === 'fitur' && (
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3.5 block">
                      Fitur Utama &amp; Otomasi
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          title: 'Ekstensi Browser',
                          desc: 'Deteksi kolom otomatis dan pengisian form instansi publik dalam 1 klik.',
                          icon: Laptop,
                          badge: 'BARU',
                          href: '#unduh',
                        },
                        {
                          title: 'Pencocokan Semantik Cerdas',
                          desc: 'Pemetaan adaptif atribut formulir tanpa bergantung pada ID kolom tetap.',
                          icon: Workflow,
                          badge: 'AI LEKSIKAL',
                          href: '#cara-kerja',
                        },
                        {
                          title: 'Format Otomatis Instansi',
                          desc: 'Menyesuaikan format tanggal, pemisah tempat lahir, dan nomor telepon.',
                          icon: SlidersHorizontal,
                          badge: null,
                          href: '#efisiensi',
                        },
                        {
                          title: 'Simulator Interaktif',
                          desc: 'Uji alur autofill form instansi secara langsung di peramban dummy.',
                          icon: Play,
                          badge: 'DEMO',
                          href: '/demo',
                          isRoute: true,
                        },
                      ].map((item) =>
                        item.isRoute ? (
                          <Link
                            key={item.title}
                            to={item.href}
                            onClick={() => setActiveMenu(null)}
                            className={`p-3 rounded-xl flex items-start gap-3 transition-colors ${
                              theme === 'dark' ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                              }`}
                            >
                              <item.icon className="w-4 h-4" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-ink group-hover:text-blue-400">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-1">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        ) : (
                          <a
                            key={item.title}
                            href={item.href}
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveMenu(null);
                              if (item.href.startsWith('#')) {
                                scrollToElementCenter(item.href.slice(1));
                              }
                            }}
                            className={`p-3 rounded-xl flex items-start gap-3 transition-colors ${
                              theme === 'dark' ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg shrink-0 ${
                                theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                              }`}
                            >
                              <item.icon className="w-4 h-4" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-ink group-hover:text-blue-400">
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-1">
                                {item.desc}
                              </p>
                            </div>
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}

                {activeMenu === 'keamanan' && (
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3.5 block">
                      Arsitektur Privasi &amp; Keamanan
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          title: 'Brankas Klien Terenkripsi',
                          desc: 'Data identitas kependudukan tersimpan di penyimpanan lokal browser Anda.',
                          icon: KeyRound,
                          badge: 'AES-256',
                          href: '#keamanan',
                        },
                        {
                          title: 'Persetujuan Eksplisit Pengguna',
                          desc: 'Tidak ada data terkirim atau diisi tanpa persetujuan manual di panel samping.',
                          icon: CheckCircle2,
                          badge: 'KONTROL',
                          href: '#keamanan',
                        },
                        {
                          title: 'Nir-Pelacak Pihak Ketiga',
                          desc: 'Zero data leakage ke server luar, bebas skrip telemetri dan iklan.',
                          icon: ShieldCheck,
                          badge: 'PRIVASI',
                          href: '#keamanan',
                        },
                        {
                          title: 'Kepatuhan UU PDP No. 27/2022',
                          desc: 'Prinsip pemrosesan data terbatas dan terdaftar dalam sistem PSE Kominfo.',
                          icon: Shield,
                          badge: 'REGULASI',
                          href: '#keamanan',
                        },
                      ].map((item) => (
                        <a
                          key={item.title}
                          href={item.href}
                          onClick={(e) => {
                            e.preventDefault();
                            setActiveMenu(null);
                            if (item.href.startsWith('#')) {
                              scrollToElementCenter(item.href.slice(1));
                            }
                          }}
                          className={`p-3 rounded-xl flex items-start gap-3 transition-colors ${
                            theme === 'dark' ? 'hover:bg-white/[0.06]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            <item.icon className="w-4 h-4" strokeWidth={1.5} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-ink group-hover:text-blue-400">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className="text-[9.5px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 leading-snug line-clamp-1">
                              {item.desc}
                            </p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Highlight Bar (Docker Style) */}
                <div className="mt-4 pt-3.5 border-t border-white/10 dark:border-white/10 border-slate-200/80 flex items-center text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    GovConnect Engine v1.4.0 — Manifest V3 Ready
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================
              4. DRAWER NAVIGASI MOBILE (MENYATU DALAM WADAH KACA YANG SAMA)
              =================================================================== */}
          <div
            className={`lg:hidden grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
              mobileMenuOpen
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0 pointer-events-none'
            }`}
          >
            <div className="overflow-hidden">
              <div className="border-t border-white/10 dark:border-white/10 border-slate-200 p-4 space-y-2">
                <a
                  href="#unduh"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElementCenter('unduh');
                  }}
                  className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5"
                >
                  Ekstensi Browser
                </a>
                <a
                  href="#cara-kerja"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElementCenter('cara-kerja');
                  }}
                  className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5"
                >
                  Cara Kerja
                </a>
                <a
                  href="#efisiensi"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElementCenter('efisiensi');
                  }}
                  className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5"
                >
                  Efisiensi Waktu
                </a>
                <a
                  href="#keamanan"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElementCenter('keamanan');
                  }}
                  className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5"
                >
                  Keamanan &amp; Privasi
                </a>
                <a
                  href="#faq"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToElementCenter('faq');
                  }}
                  className="block px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5"
                >
                  Tanya Jawab (FAQ)
                </a>
                <Link
                  to="/demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-400 hover:bg-white/5"
                >
                  Simulator Interaktif
                </Link>
                <div className="pt-3 border-t border-white/10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate(user ? '/dashboard' : '/login');
                    }}
                    className="flex-1 py-2 text-center text-sm font-semibold rounded-lg border border-white/20"
                  >
                    {user ? 'Dasbor' : 'Masuk'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleDownloadExtension();
                    }}
                    className="flex-1 py-2 text-center text-sm font-semibold rounded-lg bg-blue-600 text-white"
                  >
                    Unduh .ZIP
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* ===================================================================
          3. HERO SECTION (PRODUCT-LED DENGAN MOCKUP BESAR LANGSUNG)
          (pt-28 sm:pt-36 memberi jeda vertikal nyaman di bawah floating navbar)
          =================================================================== */}
      <section className="relative pt-28 sm:pt-36 pb-12 sm:pb-16 overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none opacity-40 blur-[130px] -z-10"
          style={{
            background:
              theme === 'dark'
                ? 'radial-gradient(circle, rgba(37,99,235,0.45) 0%, rgba(14,165,233,0.15) 50%, transparent 80%)'
                : 'radial-gradient(circle, rgba(147,197,253,0.5) 0%, rgba(191,219,254,0.2) 60%, transparent 80%)',
          }}
        />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* Header Copy (Max 2 baris subteks, 1 CTA utama) */}
          <div className="text-center max-w-[1020px] mx-auto mb-12 sm:mb-16">
            <RevealOnScroll>
              {/* Pill Kecil */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border mb-6 text-xs font-semibold backdrop-blur-sm transition-colors border-blue-500/30 bg-blue-500/10 text-blue-400 dark:text-blue-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Pencocokan Semantik Leksikal · Deteksi Kolom Otomatis</span>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={100}>
              {/* Headline 2 Baris Presisi: Baris 1: "Isi formulir kependudukan,", Baris 2: "tanpa ketik ulang." */}
              <h1 className="text-[32px] sm:text-[46px] md:text-[54px] lg:text-[64px] font-bold tracking-[-0.03em] leading-[1.12] mb-6">
                <span className="block sm:whitespace-nowrap">
                  Isi formulir kependudukan,
                </span>
                <span className="block">
                  tanpa{' '}
                  <span className="bg-gradient-to-r from-blue-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                    ketik ulang
                  </span>
                  .
                </span>
              </h1>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
              {/* Subteks Maks 2 Baris */}
              <p className="text-[17px] sm:text-[18px] leading-[1.6] text-[#9DB0C8] dark:text-[#9DB0C8] max-w-[680px] mx-auto mb-8 font-normal">
                GovConnect mengenali kolom formulir dinas dan mencocokkannya dengan profil Anda secara lokal.
                Pengisian instan, aman, dan selalu dalam kendali Anda.
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={300}>
              {/* 2 CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={handleDownloadExtension}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_-5px_rgba(37,99,235,0.5)] hover:shadow-[0_0_35px_-2px_rgba(37,99,235,0.7)] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-blue-400 group"
                >
                  <Download className="w-5 h-5 transition-transform duration-200 group-hover:-translate-y-0.5" strokeWidth={1.5} />
                  <span>Unduh Ekstensi Browser</span>
                  <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/20">
                    Gratis
                  </span>
                </button>
                <Link
                  to="/demo"
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold border transition-all duration-200 focus-visible:outline-2 focus-visible:outline-blue-500 ${
                    theme === 'dark'
                      ? 'border-white/[0.12] text-white hover:bg-white/[0.06]'
                      : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>Coba Simulator</span>
                  <ArrowRight className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                </Link>
              </div>

              {/* Baris Kepercayaan Kecil di Bawah CTA */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#9DB0C8]">
                <span className="inline-flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                  Kompatibel Chromium (Chrome, Edge, Brave)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                  100% Data di penyimpanan lokal browser
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                  Tanpa pelacak pihak ketiga
                </span>
              </div>
            </RevealOnScroll>
          </div>

          {/* MOCKUP BROWSER BESAR LANGSUNG DI HERO */}
          <RevealOnScroll delay={350}>
            <div className="relative group">
              {/* Soft Ambient Glow di Belakang Visual Utama */}
              <div className="absolute -inset-1 rounded-[24px] bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-sky-600/30 blur-2xl opacity-60 group-hover:opacity-80 transition duration-1000 -z-10" />

              <div
                className={`rounded-[20px] border overflow-hidden backdrop-blur-xl transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-[#091C36]/90 border-white/[0.1] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]'
                    : 'bg-white border-slate-200/90 shadow-2xl'
                }`}
              >
                {/* Browser Top Chrome Header */}
                <div
                  className={`h-11 px-4 flex items-center justify-between border-b ${
                    theme === 'dark' ? 'bg-[#061528] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  {/* Traffic Light Dots */}
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                  </div>

                  {/* Browser URL Bar Monospace */}
                  <div
                    className={`flex-1 max-w-[560px] mx-4 h-7 px-3 rounded-lg flex items-center gap-2 text-xs font-mono truncate border ${
                      theme === 'dark'
                        ? 'bg-[#0B1E38] border-white/[0.08] text-slate-300'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0" strokeWidth={1.5} />
                    <span className="text-emerald-400 font-semibold shrink-0">https://</span>
                    <span className="truncate">layanan.kependudukan.go.id/permohonan-layanan</span>
                    <span className="text-emerald-400/90 text-[10px] ml-auto shrink-0 font-sans flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Sertifikat Resmi
                    </span>
                  </div>

                  {/* Simulator Control / Status Pill */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSimulating(!isSimulating)}
                      className="text-[11px] font-medium px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] flex items-center gap-1.5 transition-colors"
                      title={isSimulating ? 'Jeda otomatisasi' : 'Jalankan otomatisasi'}
                    >
                      {isSimulating ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span className="text-emerald-400">Autofill Aktif</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
                          <span className="text-slate-400">Putar Ulang</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Main Product UI Split Layout (Formulir Asli di Kiri + Panel Asisten di Kanan) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
                  {/* Left: Formulir Pelayanan Publik Asli (8 cols) */}
                  <div
                    className={`lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between ${
                      theme === 'dark' ? 'bg-[#07172D]/60' : 'bg-slate-50/70'
                    }`}
                  >
                    <div>
                      {/* Form Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-6 border-b border-white/[0.08] dark:border-white/[0.08] border-slate-200">
                        <div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                            <span className="text-[11px] font-mono uppercase tracking-wider text-blue-400 font-semibold">
                              Portal Pelayanan Kependudukan Terpadu (SIAK)
                            </span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-ink mt-1">
                            Formulir Permohonan Kependudukan & Catatan Sipil
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" strokeWidth={1.5} />
                            {filledFields} dari {HERO_MOCK_FIELDS.length} Kolom Terisi
                          </span>
                        </div>
                      </div>

                      {/* Form Fields Grid: Kolom form berubah hijau satu per satu dengan animasi */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {HERO_MOCK_FIELDS.map((field, idx) => {
                          const isFilled = idx < filledFields;
                          return (
                            <div
                              key={field.id}
                              className={`transition-all duration-500 ${
                                field.id === 'alamat' ? 'sm:col-span-2' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs mb-1.5">
                                <label className="font-medium text-slate-300 dark:text-slate-300">
                                  {field.label}
                                </label>
                                {isFilled ? (
                                  <span className="text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1 animate-fadeIn">
                                    <Check className="w-2.5 h-2.5" strokeWidth={2} />
                                    Cocok (0,3 dtk)
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-slate-500">
                                    Mendeteksi...
                                  </span>
                                )}
                              </div>
                              <div
                                className={`px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-all duration-500 flex items-center justify-between ${
                                  isFilled
                                    ? 'bg-emerald-500/[0.08] border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]'
                                    : theme === 'dark'
                                    ? 'bg-[#0B1E38]/80 border-white/[0.08] text-slate-500'
                                    : 'bg-white border-slate-200 text-slate-400'
                                }`}
                              >
                                <span className="truncate">
                                  {isFilled ? field.dummyValue : `[${field.semanticKey}]`}
                                </span>
                                {isFilled && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-2" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Form Footer Note */}
                    <div className="mt-6 pt-4 border-t border-white/[0.08] dark:border-white/[0.08] border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-[#9DB0C8]">
                      <span>Seluruh data pada demonstrasi ini adalah data dummy palsu.</span>
                      <span className="font-mono text-[11px] text-blue-400">Pencocokan: Multi-level Leksikal</span>
                    </div>
                  </div>

                  {/* Right: Floating GovConnect Assistant Panel (4 cols) */}
                  <div
                    className={`lg:col-span-4 p-5 sm:p-6 border-t lg:border-t-0 lg:border-l flex flex-col justify-between ${
                      theme === 'dark'
                        ? 'bg-[#0B203F] border-white/[0.08]'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Assistant Panel Header */}
                      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/[0.08] dark:border-white/[0.08] border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            GC
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-ink leading-tight">Panel Asisten</h4>
                            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Halaman Terdeteksi
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-300">
                          v1.4.0
                        </span>
                      </div>

                      {/* User Profile Card Dummy */}
                      <div
                        className={`p-3 rounded-xl mb-4 border text-xs ${
                          theme === 'dark'
                            ? 'bg-[#07162C] border-white/[0.08]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400">Profil Aktif:</span>
                          <span className="font-semibold text-emerald-400">Tersinkron Lokal</span>
                        </div>
                        <p className="font-bold text-sm text-ink truncate">Budi Contoh (Dummy)</p>
                        <p className="font-mono text-[11px] text-slate-400 mt-0.5">NIK: 350000******0000</p>
                      </div>

                      {/* Matching List */}
                      <div className="space-y-1.5 mb-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                          Kolom Ditemukan ({HERO_MOCK_FIELDS.length})
                        </p>
                        {HERO_MOCK_FIELDS.map((f, i) => (
                          <div
                            key={f.id}
                            className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                              i < filledFields
                                ? 'bg-emerald-500/10 text-emerald-300'
                                : 'bg-white/[0.03] text-slate-400'
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              {i < filledFields ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.5} />
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-500 shrink-0 inline-block" />
                              )}
                              <span className="truncate">{f.label}</span>
                            </span>
                            <span className="font-mono text-[10px] text-emerald-400 shrink-0 ml-1">
                              Cocok
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button & Disclaimer */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setFilledFields(HERO_MOCK_FIELDS.length)}
                        className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-3px_rgba(37,99,235,0.45)] transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <CheckCheck className="w-4 h-4" strokeWidth={1.5} />
                        <span>Isi Semua Kolom (0,3 dtk)</span>
                      </button>
                      <p className="text-[10px] text-center text-slate-400 mt-2 leading-tight">
                        Tidak ada data yang dikirim tanpa persetujuan eksplisit Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===================================================================
          4. "MENGAPA GOVCONNECT" (3 PILAR: CEPAT · AKURAT · AMAN)
          =================================================================== */}
      <section id="fitur" className="py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* Section Header: Satu pesan per section */}
          <div className="max-w-[680px] mb-8 sm:mb-10">
            <RevealOnScroll>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 mb-2 block">
                Prinsip Inti
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4">
                Tiga pilar otomasi formulir kependudukan.
              </h2>
              <p className="text-base sm:text-[17px] text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed">
                Dirancang khusus untuk memangkas birokrasi pengisian dokumen publik tanpa mengorbankan privasi data Anda.
              </p>
            </RevealOnScroll>
          </div>

          {/* 3 Pilar Berdampingan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Pilar 1: CEPAT */}
            <RevealOnScroll delay={100} className="h-full">
              <div
                className={`rounded-[20px] p-6 sm:p-7 border flex flex-col justify-between h-full transition-all duration-300 hover:-translate-y-1 ${
                  theme === 'dark'
                    ? 'bg-[#0B1E38] border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.3)]'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div>
                  {/* Mini UI Produk Asli: Autofill Kolom */}
                  <div
                    className={`p-4 rounded-xl border mb-6 ${
                      theme === 'dark' ? 'bg-[#07162C] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.5} />
                        Kecepatan Eksekusi
                      </span>
                      <span className="text-emerald-400 font-bold">0,3 Detik</span>
                    </div>
                    <div className="space-y-1.5 font-mono text-xs">
                      <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex justify-between items-center">
                        <span className="truncate">NIK: 3500000000000000</span>
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex justify-between items-center">
                        <span className="truncate">Nama: Budi Contoh</span>
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-ink mb-2">Cepat</h3>
                  <p className="text-sm text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed mb-6">
                    Seluruh kolom formulir terisi dalam hitungan milidetik setelah Anda memberikan persetujuan.
                  </p>
                </div>

                <a
                  href="#efisiensi"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  <span>Pelajari efisiensi</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </a>
              </div>
            </RevealOnScroll>

            {/* Pilar 2: AKURAT */}
            <RevealOnScroll delay={200} className="h-full">
              <div
                className={`rounded-[20px] p-6 sm:p-7 border flex flex-col justify-between h-full transition-all duration-300 hover:-translate-y-1 ${
                  theme === 'dark'
                    ? 'bg-[#0B1E38] border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.3)]'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div>
                  {/* Mini UI Produk Asli: Panel Pencocokan Semantik */}
                  <div
                    className={`p-4 rounded-xl border mb-6 ${
                      theme === 'dark' ? 'bg-[#07162C] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                      <span className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" strokeWidth={1.5} />
                        Pencocokan Semantik
                      </span>
                      <span className="text-emerald-400 font-bold">Cocok</span>
                    </div>
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="p-2 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] truncate">id="no_ktp_pemohon"</span>
                        <span className="text-blue-400 font-semibold text-[11px]">→ nik</span>
                      </div>
                      <div className="p-2 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] truncate">name="full_name"</span>
                        <span className="text-blue-400 font-semibold text-[11px]">→ nama</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-ink mb-2">Akurat</h3>
                  <p className="text-sm text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed mb-6">
                    Mengenali ragam nama kolom dan format data instansi yang berbeda secara otomatis.
                  </p>
                </div>

                <a
                  href="#cara-kerja"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  <span>Pelajari cara kerja</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </a>
              </div>
            </RevealOnScroll>

            {/* Pilar 3: AMAN */}
            <RevealOnScroll delay={300} className="h-full">
              <div
                className={`rounded-[20px] p-6 sm:p-7 border flex flex-col justify-between h-full transition-all duration-300 hover:-translate-y-1 ${
                  theme === 'dark'
                    ? 'bg-[#0B1E38] border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.3)]'
                    : 'bg-white border-slate-200 shadow-sm'
                }`}
              >
                <div>
                  {/* Mini UI Produk Asli: Kartu Data Tersimpan di Browser */}
                  <div
                    className={`p-4 rounded-xl border mb-6 ${
                      theme === 'dark' ? 'bg-[#07162C] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                        Brankas Klien
                      </span>
                      <span className="text-emerald-400 font-bold">Terenkripsi</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Penyimpanan:</span>
                        <span className="font-mono text-emerald-400">Browser Lokal</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Keluaran Eksternal:</span>
                        <span className="font-mono text-emerald-400">0 Byte</span>
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-ink mb-2">Aman</h3>
                  <p className="text-sm text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed mb-6">
                    Data kependudukan Anda disimpan secara lokal di browser dan tidak pernah dikirim ke server luar.
                  </p>
                </div>

                <a
                  href="#keamanan"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  <span>Pelajari keamanan</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
                </a>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===================================================================
          6. BENTO GRID FITUR (3 KOLOM, UKURAN KARTU BERVARIASI)
          =================================================================== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-[680px] mb-8 sm:mb-10">
            <RevealOnScroll>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 mb-2 block">
                Kemampuan Produk
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4">
                Fitur lengkap dengan kendali penuh.
              </h2>
              <p className="text-base sm:text-[17px] text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed">
                Tiap fungsi dirancang untuk menyederhanakan interaksi formulir instansi tanpa memindahkan data ke server perantara.
              </p>
            </RevealOnScroll>
          </div>

          {/* Bento Grid: 3 Kartu Teks + 3 Kartu Visual */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Kartu Teks: Persetujuan Eksplisit */}
            <RevealOnScroll delay={50}>
              <div
                className={`p-6 sm:p-8 rounded-[20px] border h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                  theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-5">
                    <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-2">Persetujuan Eksplisit Anda</h3>
                  <p className="text-sm text-[#9DB0C8] leading-relaxed">
                    Tidak ada data yang terkirim atau diisi tanpa persetujuan Anda. Ekstensi hanya meninjau dan mengisi
                    setelah tombol ditekan.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-emerald-400">
                  Status: Menunggu Konfirmasi
                </div>
              </div>
            </RevealOnScroll>

            {/* 2. Kartu Visual (Col-Span 2 di desktop): Animasi Kolom Terisi */}
            <RevealOnScroll delay={100} className="md:col-span-2">
              <div
                className={`p-6 sm:p-8 rounded-[20px] border h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                  theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <span className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wide block">
                      Visual Interaktif
                    </span>
                    <h3 className="text-lg font-bold text-ink mt-0.5">Animasi Alur Pengisian Kolom</h3>
                  </div>
                  <button
                    type="button"
                    onClick={startBentoSimulation}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white self-start sm:self-auto transition-colors"
                  >
                    <Play className="w-3 h-3" />
                    Simulasikan Autofill
                  </button>
                </div>

                {/* Animated Column Preview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 font-mono text-xs">
                  {[
                    { label: 'NIK Pemohon', val: '3500000000000000' },
                    { label: 'Nama Lengkap', val: 'Budi Contoh' },
                    { label: 'Nomor Kartu Keluarga', val: '3500000000000001' },
                    { label: 'Tanggal Lahir', val: '01-01-1990' },
                  ].map((field, i) => {
                    const isDone = bentoSimStep > i;
                    return (
                      <div
                        key={field.label}
                        className={`p-3 rounded-xl border transition-all duration-300 ${
                          isDone
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                            : 'bg-white/[0.03] border-white/[0.06] text-slate-400'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] mb-1">
                          <span className="text-slate-400">{field.label}</span>
                          {isDone ? (
                            <span className="text-emerald-400 font-bold">Cocok</span>
                          ) : (
                            <span>Siap</span>
                          )}
                        </div>
                        <div className="font-semibold truncate">
                          {isDone ? field.val : 'Menunggu input...'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-[#9DB0C8]">
                  Setiap kolom diisi secara berurutan sesuai aturan validasi form instansi (DOM event disimulasikan secara presisi).
                </p>
              </div>
            </RevealOnScroll>

            {/* 3. Kartu Visual: Grafik Batang 4m30s -> 0,3 dtk */}
            <RevealOnScroll delay={150}>
              <div
                className={`p-6 sm:p-8 rounded-[20px] border h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                  theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-5">
                    <Clock className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-1">Komparasi Waktu Pengisian</h3>
                  <p className="text-xs text-[#9DB0C8] mb-6">
                    Pengetikan manual 16 digit NIK & KK vs Otomasi GovConnect.
                  </p>

                  {/* High Contrast Bar Chart */}
                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <div className="flex justify-between mb-1 text-slate-400">
                        <span>Ketik Manual</span>
                        <span className="font-bold text-rose-400">4m 30s</span>
                      </div>
                      <div className="h-4 rounded-md bg-white/[0.05] overflow-hidden">
                        <div className="h-full bg-rose-500/60 rounded-md w-full" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1 text-slate-400">
                        <span>GovConnect</span>
                        <span className="font-bold text-emerald-400">0,3 dtk</span>
                      </div>
                      <div className="h-4 rounded-md bg-white/[0.05] overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-md w-[8%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-[#9DB0C8] flex justify-between">
                  <span>Efisiensi Waktu:</span>
                  <span className="font-mono font-bold text-emerald-400">98,8% Lebih Cepat</span>
                </div>
              </div>
            </RevealOnScroll>

            {/* 4. Kartu Teks: Format Otomatis Menyesuaikan Tiap Instansi */}
            <RevealOnScroll delay={200}>
              <div
                className={`p-6 sm:p-8 rounded-[20px] border h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                  theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5">
                    <SlidersHorizontal className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-2">Format Otomatis Tiap Instansi</h3>
                  <p className="text-sm text-[#9DB0C8] leading-relaxed">
                    Format otomatis menyesuaikan tiap instansi: konversi tanggal DD/MM/YYYY vs YYYY-MM-DD, pemisahan
                    tempat lahir, serta penataan strip nomor telepon.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-purple-400">
                  Normalisasi: Aktif
                </div>
              </div>
            </RevealOnScroll>

            {/* 5. Kartu Teks: Data Tetap di Perangkat (Menutup Lubang Kolom 3) */}
            <RevealOnScroll delay={220}>
              <div
                className={`p-6 sm:p-8 rounded-[20px] border h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                  theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5">
                    <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-lg font-bold text-ink mb-2">Data Tetap di Perangkat</h3>
                  <p className="text-sm text-[#9DB0C8] leading-relaxed">
                    Brankas kependudukan Anda tersimpan di penyimpanan lokal browser. Tidak ada enkripsi kunci atau data NIK yang dikirimkan ke server perantara.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-mono text-emerald-400">
                  Penyimpanan: Klien Lokal (Sandbox)
                </div>
              </div>
            </RevealOnScroll>

            {/* 6. Kartu Visual: Log Bergaya Terminal Monospace (Penuh 3 Kolom) */}
            <RevealOnScroll delay={250} className="md:col-span-3">
              <div
                className={`p-6 sm:p-8 rounded-[20px] border h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                  theme === 'dark' ? 'bg-[#061528] border-white/[0.08]' : 'bg-slate-900 text-slate-100 border-slate-800'
                }`}
              >
                {/* Terminal Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
                    <span className="font-mono text-xs font-semibold text-emerald-400">
                      GovConnect Core Engine — Execution Log
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">STDIN / EVENT STREAM</span>
                </div>

                {/* Monospace Log Lines */}
                <div className="space-y-2 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto py-2">
                  <p className="text-slate-400">
                    <span className="text-blue-400">[00:00.012]</span> DETECT -&gt; Memindai pohon DOM halaman (6 elemen input terdeteksi)
                  </p>
                  <p className="text-slate-400">
                    <span className="text-blue-400">[00:00.045]</span> MATCH  -&gt; Pencocokan leksikal selesai: 6/6 atribut profil kependudukan cocok
                  </p>
                  <p className="text-amber-400">
                    <span className="text-blue-400">[00:00.120]</span> WAIT   -&gt; Menunggu persetujuan pengguna via panel samping...
                  </p>
                  <p className="text-sky-300">
                    <span className="text-blue-400">[00:00.280]</span> CONFIRM-&gt; Tindakan disetujui oleh pengguna (Token: Local_OK)
                  </p>
                  <p className="text-emerald-400 font-semibold">
                    <span className="text-blue-400">[00:00.300]</span> FILLED -&gt; 6 kolom berhasil diisi tanpa galat. Event onChange &amp; onInput dipicu.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Log Tersimpan di Memori Lokal</span>
                  <span className="text-emerald-400">Status 200 OK</span>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* Sub-Seksi: Kompatibilitas Portal Publik Digital (Tanpa Background Tambahan) */}
          <div className="mt-12 sm:mt-16">
            <RevealOnScroll delay={200}>
              <div className="text-center mb-6">
                <span className="text-xs font-mono uppercase tracking-widest text-blue-400 font-semibold block mb-1">
                  Kompatibel Dengan Portal Pelayanan Publik Digital Se-Indonesia
                </span>
                <p className="text-xs text-[#9DB0C8]">
                  Mendukung otomatisasi pengisian formulir di berbagai portal layanan publik nasional
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 items-stretch">
                {[
                  {
                    name: 'Dukcapil Online',
                    category: 'Kependudukan & Identitas',
                    domain: 'dukcapil.kemendagri.go.id',
                    icon: Landmark,
                    badge: 'TERVERIFIKASI',
                  },
                  {
                    name: 'OSS Indonesia',
                    category: 'Perizinan Usaha (BKPM)',
                    domain: 'oss.go.id',
                    icon: Briefcase,
                    badge: 'TERVERIFIKASI',
                  },
                  {
                    name: 'Portal Beasiswa RI',
                    category: 'Pendidikan & Beasiswa LPDP',
                    domain: 'beasiswa.kemdikbud.go.id',
                    icon: GraduationCap,
                    badge: 'TERVERIFIKASI',
                  },
                  {
                    name: 'Kemensos DTKS',
                    category: 'Bantuan Sosial & Bansos',
                    domain: 'cekbansos.kemensos.go.id',
                    icon: HeartHandshake,
                    badge: 'TERVERIFIKASI',
                  },
                  {
                    name: 'BPJS Kesehatan',
                    category: 'Jaminan Kesehatan Nasional',
                    domain: 'bpjs-kesehatan.go.id',
                    icon: Activity,
                    badge: 'TERVERIFIKASI',
                  },
                ].map((portal) => (
                  <div
                    key={portal.name}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 group ${
                      theme === 'dark'
                        ? 'bg-[#0B1E38] border-white/[0.08] hover:border-blue-500/40 hover:bg-[#0B2344] hover:shadow-[0_8px_24px_-6px_rgba(37,99,235,0.25)]'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            theme === 'dark'
                              ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300'
                              : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                          }`}
                        >
                          <portal.icon className="w-4 h-4" strokeWidth={1.75} />
                        </div>
                        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {portal.badge}
                        </span>
                      </div>

                      <h3 className="text-[13.5px] font-bold text-ink group-hover:text-blue-400 transition-colors leading-tight">
                        {portal.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-[#9DB0C8] mt-1 leading-snug">
                        {portal.category}
                      </p>
                    </div>

                    <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] dark:border-white/[0.06] border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="truncate">{portal.domain}</span>
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===================================================================
          7. CARA KERJA (STEPPER 3 LANGKAH DENGAN POTONGAN UI)
          =================================================================== */}
      <section id="cara-kerja" className="py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-[680px] mb-8 sm:mb-10">
            <RevealOnScroll>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 mb-2 block">
                Alur Transparan
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-4">
                Tiga langkah mudah pengisian otomatis.
              </h2>
              <p className="text-base sm:text-[17px] text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed">
                Anda selalu memegang kendali penuh. Setiap data ditinjau sebelum diisikan ke formulir publik.
              </p>
            </RevealOnScroll>
          </div>

          {/* Stepper 3 Langkah */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Langkah 1: Deteksi Kolom */}
            <RevealOnScroll delay={100}>
              <div
                className={`rounded-[20px] p-6 sm:p-7 border h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                  theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                      1
                    </span>
                    <span className="text-xs font-mono text-blue-400 font-semibold">Langkah 1</span>
                  </div>

                  <h3 className="text-lg font-bold text-ink mb-2">Deteksi Kolom</h3>
                  <p className="text-sm text-[#9DB0C8] leading-relaxed mb-6">
                    Ekstensi memindai struktur DOM formulir publik saat halaman terbuka secara pasif.
                  </p>

                  {/* UI Snippet: DOM Inspector */}
                  <div
                    className={`p-3.5 rounded-xl border font-mono text-xs ${
                      theme === 'dark' ? 'bg-[#07162C] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="text-slate-400 text-[11px] mb-1.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      &lt;input name="nik_pemohon"&gt;
                    </div>
                    <div className="text-emerald-400 text-[11px] font-semibold">
                      [Terdeteksi: 6 Kolom Kependudukan]
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Langkah 2: Cocokkan dengan Profil */}
            <RevealOnScroll delay={200}>
              <div
                className={`rounded-[20px] p-6 sm:p-7 border h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                  theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                      2
                    </span>
                    <span className="text-xs font-mono text-blue-400 font-semibold">Langkah 2</span>
                  </div>

                  <h3 className="text-lg font-bold text-ink mb-2">Cocokkan dengan Profil</h3>
                  <p className="text-sm text-[#9DB0C8] leading-relaxed mb-6">
                    Algoritma semantik memetakan label form dengan brankas profil kependudukan Anda.
                  </p>

                  {/* UI Snippet: Matching Preview */}
                  <div
                    className={`p-3.5 rounded-xl border font-mono text-xs ${
                      theme === 'dark' ? 'bg-[#07162C] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                      <span>Label: "NIK KTP"</span>
                      <span className="text-emerald-400 font-bold">Cocok 99%</span>
                    </div>
                    <div className="text-slate-400 text-[10px] truncate">
                      Nilai: 3500000000000000 (Dummy)
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Langkah 3: Isi Setelah Anda Setuju */}
            <RevealOnScroll delay={300}>
              <div
                className={`rounded-[20px] p-6 sm:p-7 border h-full flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 ${
                  theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center">
                      3
                    </span>
                    <span className="text-xs font-mono text-blue-400 font-semibold">Langkah 3</span>
                  </div>

                  <h3 className="text-lg font-bold text-ink mb-2">Isi Setelah Anda Setuju</h3>
                  <p className="text-sm text-[#9DB0C8] leading-relaxed mb-6">
                    Anda memeriksa pratinjau data dan menekan tombol konfirmasi untuk mengisi formulir.
                  </p>

                  {/* UI Snippet: Execution Dialog */}
                  <div
                    className={`p-3.5 rounded-xl border font-mono text-xs ${
                      theme === 'dark' ? 'bg-[#07162C] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-300 text-[11px]">Dialog Konfirmasi:</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        Setujui &amp; Isi
                      </span>
                    </div>
                    <div className="text-emerald-400 text-[10px] mt-1">
                      Waktu eksekusi: 0,3 detik
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===================================================================
          8. ANGKA BESAR (4 METRIK) RATA TENGAH + MARQUEE TEKS LEMBUT
          =================================================================== */}
      <section className="py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* 4 Metrik Besar Rata Tengah */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center mb-10 sm:mb-12">
            <RevealOnScroll delay={100}>
              <div>
                <div className="text-[48px] sm:text-[64px] font-bold tracking-tight text-ink leading-none mb-3">
                  <AnimatedCounter end={0.3} decimals={1} suffix=" dtk" />
                </div>
                <p className="text-sm sm:text-base text-[#9DB0C8]">Waktu pengisian rata-rata per formulir</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
              <div>
                <div className="text-[48px] sm:text-[64px] font-bold tracking-tight text-ink leading-none mb-3">
                  <AnimatedCounter end={25000} suffix="+" />
                </div>
                <p className="text-sm sm:text-base text-[#9DB0C8]">Formulir publik sukses terfasilitasi</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={300}>
              <div>
                <div className="text-[48px] sm:text-[64px] font-bold tracking-tight text-ink leading-none mb-3">
                  <AnimatedCounter end={98.8} decimals={1} suffix="%" />
                </div>
                <p className="text-sm sm:text-base text-[#9DB0C8]">Efisiensi waktu pengisian dibanding manual</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={400}>
              <div>
                <div className="text-[48px] sm:text-[64px] font-bold tracking-tight text-ink leading-none mb-3">
                  <AnimatedCounter end={0} suffix=" Byte" />
                </div>
                <p className="text-sm sm:text-base text-[#9DB0C8]">Data kependudukan keluar tanpa izin Anda</p>
              </div>
            </RevealOnScroll>
          </div>

          {/* Marquee Teks Lembut */}
          <div className="overflow-hidden py-4 select-none">
            <div className="flex whitespace-nowrap animate-marquee gap-8 text-sm font-medium text-slate-400">
              <span>Isi sekali. Pakai di mana saja.</span>
              <span className="text-blue-500">•</span>
              <span>Bebas ketik ulang NIK dan KK.</span>
              <span className="text-blue-500">•</span>
              <span>Privasi data tetap di browser lokal Anda.</span>
              <span className="text-blue-500">•</span>
              <span>Selalu dalam kendali penuh Anda.</span>
              <span className="text-blue-500">•</span>
              <span>Kompatibel dengan portal layanan publik se-Indonesia.</span>
              <span className="text-blue-500">•</span>
              <span>Isi sekali. Pakai di mana saja.</span>
              <span className="text-blue-500">•</span>
              <span>Bebas ketik ulang NIK dan KK.</span>
              <span className="text-blue-500">•</span>
              <span>Privasi data tetap di browser lokal Anda.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          9. MANUAL VS GOVCONNECT (DUA KARTU SEJAJAR)
          =================================================================== */}
      <section id="efisiensi" className="py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-[680px] mb-8 sm:mb-10">
            <RevealOnScroll>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 mb-2 block">
                Perbandingan Nyata
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3 sm:mb-4">
                Manual vs Asisten GovConnect.
              </h2>
              <p className="text-base sm:text-[17px] text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed">
                Bandingkan proses mengetik dokumen fisik satu per satu dengan otomasi cerdas ekstensi.
              </p>
            </RevealOnScroll>
          </div>

          {/* 2 Kartu Sejajar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            {/* Kartu Kiri: Manual */}
            <RevealOnScroll delay={100} className="h-full">
              <div
                className={`rounded-[20px] p-5 sm:p-6 border h-full flex flex-col justify-between ${
                  theme === 'dark' ? 'bg-[#08172D] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
                    <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold">
                      Pengisian Manual
                    </span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-rose-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      4:30 menit
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-ink mb-3">Melelahkan &amp; Rawan Salah Ketik</h3>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#9DB0C8] mb-5">
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3" />
                      </span>
                      <span>Mengetik ulang 16 digit NIK dan nomor KK di setiap portal yang berbeda.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3" />
                      </span>
                      <span>Risiko penolakan formulir akibat salah satu digit angka identitas.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3" />
                      </span>
                      <span>Perbedaan format tanggal lahir sering menyebabkan formulir gagal dikirim.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <X className="w-3 h-3" />
                      </span>
                      <span>Waktu terbuang rata-rata 4 hingga 5 menit untuk setiap kali pengajuan.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] text-xs font-mono text-slate-400 flex justify-between">
                  <span>Garis Waktu Manual:</span>
                  <span className="text-rose-400">04:30.00</span>
                </div>
              </div>
            </RevealOnScroll>

            {/* Kartu Kanan: GovConnect (Disorot: Border biru + glow) */}
            <RevealOnScroll delay={200} className="h-full">
              <div
                className={`relative rounded-[20px] p-5 sm:p-6 border h-full flex flex-col justify-between transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-[#0B203F] border-blue-500/50 shadow-[0_0_40px_-5px_rgba(37,99,235,0.3)]'
                    : 'bg-white border-blue-400 shadow-xl'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
                        Asisten GovConnect
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        Direkomendasikan
                      </span>
                    </div>
                    <span className="font-mono text-xs sm:text-sm font-bold text-emerald-400 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      0:00,3 detik
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-ink mb-3">Satu Klik, Presisi &amp; Instan</h3>

                  <ul className="space-y-2.5 text-xs sm:text-sm text-[#9DB0C8] mb-5">
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                      <span>Mendeteksi seluruh struktur kolom formulir instansi secara otomatis.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                      <span>Setiap kolom Anda tinjau sebelum disetujui untuk dikirim.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                      <span>Format tanggal, strip NIK, dan nama disesuaikan dengan aturan portal.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                      <span>Data kependudukan tetap berada di browser Anda tanpa transit ke pihak ketiga.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs font-mono text-blue-300 flex justify-between items-center">
                  <span>Garis Waktu GovConnect:</span>
                  <span className="text-emerald-400 font-bold">00:00.30</span>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===================================================================
          10. STANDAR PRIVASI & ARSITEKTUR KEAMANAN (FULL SECTION)
          =================================================================== */}
      <section id="keamanan" className="py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-[720px] mb-8 sm:mb-10">
            <RevealOnScroll>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 mb-2 block">
                Arsitektur Keamanan &amp; Kepatuhan
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3 sm:mb-4">
                Standar Privasi Data &amp; Keamanan Klien.
              </h2>
              <p className="text-base sm:text-[17px] text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed">
                GovConnect dirancang dengan filosofi Zero-Knowledge: seluruh data kependudukan diproses dan diamankan
                di peramban Anda sesuai standar regulasi dan kriptografi nasional.
              </p>
            </RevealOnScroll>
          </div>

          {/* 4 Pilar Kepatuhan Privasi (2x2 Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch mb-5 sm:mb-6">
            {[
              {
                icon: Shield,
                title: 'Kepatuhan Regulasi UU PDP',
                regulasi: 'UU RI No. 27 Tahun 2022',
                code: 'Pasal 20 & 35 PDP',
                desc: 'Memenuhi prinsip minimisasi data, pemrosesan terbatas, dan persetujuan eksplisit pemilik data (explicit consent). Hak subjek data dihormati penuh tanpa retensi data sekunder.',
                status: 'Kepatuhan Hukum Terverifikasi',
              },
              {
                icon: KeyRound,
                title: 'Kriptografi Klien AES-GCM 256-bit',
                regulasi: 'Web Crypto API Standards',
                code: 'FIPS 197 / PBKDF2',
                desc: 'Seluruh identitas (NIK, KK, nama, dll.) dienkripsi di penyimpanan lokal browser dengan kunci turunan PBKDF2 (SHA-256). Kunci enkripsi hanya berada di memori lokal peramban Anda.',
                status: 'Nir-Akses Server (Zero Knowledge)',
              },
              {
                icon: Building2,
                title: 'Tata Kelola PSE Sektor Publik',
                regulasi: 'PP PSTE No. 71 Tahun 2019',
                code: 'Standar PSE Kominfo RI',
                desc: 'Mengacu pada regulasi Penyelenggara Sistem Elektronik untuk layanan publik, memastikan integritas tata kelola teknologi informasi dan keabsahan pertukaran data formulir.',
                status: 'Standar Keamanan Terpenuhi',
              },
              {
                icon: ShieldCheck,
                title: 'Nir-Pelacak & Eksekusi Offline',
                regulasi: 'Manifest V3 Isolated Sandbox',
                code: '100% Client-Side Engine',
                desc: 'Bebas dari skrip pelacak iklan pihak ketiga, Google Analytics, dan telemetri data luar. Ekstensi bekerja mandiri di browser tanpa server perantara (middleman server).',
                status: 'Zero Third-Party Trackers',
              },
            ].map((item, idx) => (
              <RevealOnScroll key={item.title} delay={idx * 75} className="h-full">
                <div
                  className={`p-5 sm:p-6 rounded-[20px] border h-full flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 ${
                    theme === 'dark'
                      ? 'bg-[#0B1E38] border-white/[0.08] hover:border-blue-500/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
                      : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        {item.code}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-ink mb-1">{item.title}</h3>
                    <p className="text-[11px] font-mono text-slate-400 dark:text-slate-400 mb-2.5">
                      {item.regulasi}
                    </p>
                    <p className="text-xs sm:text-[13px] text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] dark:border-white/[0.06] border-slate-100 flex items-center justify-between text-xs font-mono text-emerald-400">
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      {item.status}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* Strip Ringkasan Verifikasi Keamanan Bawah */}
          <RevealOnScroll delay={350}>
            <div
              className={`p-3.5 sm:p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono ${
                theme === 'dark' ? 'bg-[#07162C] border-white/[0.07] text-[#9DB0C8]' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Audit Keamanan Mandiri: LULUS (Standar OWASP ASVS)</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                <span>SHA-256 Checksum Verified</span>
                <span>•</span>
                <span>Chrome Manifest V3 Sandbox</span>
                <span>•</span>
                <span>Zero Remote Execution</span>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===================================================================
          11. UNDUH (TAB CHROME / EDGE / BRAVE DENGAN VERSI & TANGGAL)
          =================================================================== */}
      <section id="unduh" className="py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-[680px] mb-8 sm:mb-10">
            <RevealOnScroll>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 mb-2 block">
                Distribusi Ekstensi
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3 sm:mb-4">
                Pasang di browser pilihan Anda.
              </h2>
              <p className="text-base sm:text-[17px] text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed">
                Kompatibel penuh dengan seluruh browser berbasis Chromium. Pasang sekali, gunakan di semua portal.
              </p>
            </RevealOnScroll>
          </div>

          <RevealOnScroll delay={100}>
            <div
              className={`max-w-[820px] mx-auto rounded-[20px] border overflow-hidden ${
                theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200 shadow-md'
              }`}
            >
              {/* Browser Tabs */}
              <div
                className={`flex border-b ${
                  theme === 'dark' ? 'border-white/[0.08] bg-[#07162C]' : 'border-slate-200 bg-slate-50'
                }`}
                role="tablist"
                aria-label="Pilihan browser"
              >
                {[
                  { id: 'chrome', label: 'Google Chrome' },
                  { id: 'edge', label: 'Microsoft Edge' },
                  { id: 'brave', label: 'Brave Browser' },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    role="tab"
                    aria-selected={browserTab === b.id}
                    onClick={() => setBrowserTab(b.id as 'chrome' | 'edge' | 'brave')}
                    className={`flex-1 py-3 px-3 text-xs sm:text-sm font-semibold flex items-center justify-center border-b-2 transition-all ${
                      browserTab === b.id
                        ? 'border-blue-500 text-blue-400 bg-blue-500/[0.06]'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span>{b.label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Panel Content */}
              <div className="p-6 sm:p-7 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 border border-blue-500/30 text-blue-300 mb-3.5">
                  <span>Versi: v1.4.0 (Manifest V3)</span>
                  <span>•</span>
                  <span>Diperbarui: 18 November 2026</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-ink mb-2">
                  Unduh GovConnect untuk{' '}
                  {browserTab === 'chrome' ? 'Google Chrome' : browserTab === 'edge' ? 'Microsoft Edge' : 'Brave Browser'}
                </h3>
                <p className="text-xs sm:text-sm text-[#9DB0C8] max-w-[520px] mx-auto mb-5 leading-relaxed">
                  Ekstensi didistribusikan dalam format arsip terverifikasi (.zip). Ekstrak berkas dan muat melalui menu
                  Developer Mode (Muat yang Belum Dikemas) di browser Anda.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-4">
                  <button
                    type="button"
                    onClick={handleDownloadExtension}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm sm:text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_25px_-3px_rgba(37,99,235,0.45)] transition-all duration-200"
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                    <span>Unduh Paket Ekstensi (.zip)</span>
                  </button>
                  <Link
                    to="/demo"
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm sm:text-base font-semibold border transition-all ${
                      theme === 'dark'
                        ? 'border-white/[0.12] text-white hover:bg-white/[0.05]'
                        : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>Uji Tanpa Pasang (Simulator)</span>
                    <ArrowRight className="w-4 h-4 text-blue-400" strokeWidth={1.5} />
                  </Link>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-500 font-mono">
                  Ukuran Berkas: ~29 MB • Lisensi: Gratis untuk Penggunaan Publik
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===================================================================
          12. FAQ (2 KOLOM, ACCORDION HALUS, ITEM 1 TERBUKA)
          =================================================================== */}
      <section id="faq" className="py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-[680px] mb-8 sm:mb-10">
            <RevealOnScroll>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400 mb-2 block">
                Tanya Jawab
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3 sm:mb-4">
                Pertanyaan yang sering diajukan.
              </h2>
              <p className="text-base sm:text-[17px] text-[#9DB0C8] dark:text-[#9DB0C8] leading-relaxed">
                Jawaban lengkap seputar keamanan, kompatibilitas, dan tata cara penggunaan ekstensi GovConnect.
              </p>
            </RevealOnScroll>
          </div>

          {/* FAQ 2 Kolom Independen (Mencegah Celah Kosong saat Item Terbuka) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-3.5 items-start">
            {/* Kolom Kiri: Indeks Genap */}
            <div className="flex flex-col gap-3 sm:gap-3.5">
              {FAQ_ITEMS.filter((_, idx) => idx % 2 === 0).map((item, colIdx) => {
                const realIndex = colIdx * 2;
                const isOpen = openFaq === realIndex;
                return (
                  <RevealOnScroll key={realIndex} delay={colIdx * 50}>
                    <div
                      className={`rounded-[18px] border transition-all duration-200 overflow-hidden ${
                        isOpen
                          ? theme === 'dark'
                            ? 'bg-[#0B1E38] border-blue-500/40 shadow-md'
                            : 'bg-white border-blue-300 shadow-sm'
                          : theme === 'dark'
                          ? 'bg-[#07172D] border-white/[0.06] hover:border-white/[0.12]'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : realIndex)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${realIndex}`}
                        id={`faq-question-${realIndex}`}
                        className="w-full p-4 sm:p-4.5 text-left flex items-start justify-between gap-3 focus-visible:outline-2 focus-visible:outline-blue-500"
                      >
                        <span className="font-semibold text-sm sm:text-base text-ink leading-snug">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-blue-400 shrink-0 mt-0.5 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>

                      {isOpen && (
                        <div
                          id={`faq-answer-${realIndex}`}
                          role="region"
                          aria-labelledby={`faq-question-${realIndex}`}
                          className="px-4 sm:px-5 pb-4 text-xs sm:text-sm leading-relaxed text-[#9DB0C8] dark:text-[#9DB0C8] border-t border-white/[0.04] pt-2.5"
                        >
                          {item.answer}
                        </div>
                      )}
                    </div>
                  </RevealOnScroll>
                );
              })}
            </div>

            {/* Kolom Kanan: Indeks Ganjil */}
            <div className="flex flex-col gap-3 sm:gap-3.5">
              {FAQ_ITEMS.filter((_, idx) => idx % 2 !== 0).map((item, colIdx) => {
                const realIndex = colIdx * 2 + 1;
                const isOpen = openFaq === realIndex;
                return (
                  <RevealOnScroll key={realIndex} delay={colIdx * 50 + 25}>
                    <div
                      className={`rounded-[18px] border transition-all duration-200 overflow-hidden ${
                        isOpen
                          ? theme === 'dark'
                            ? 'bg-[#0B1E38] border-blue-500/40 shadow-md'
                            : 'bg-white border-blue-300 shadow-sm'
                          : theme === 'dark'
                          ? 'bg-[#07172D] border-white/[0.06] hover:border-white/[0.12]'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaq(isOpen ? null : realIndex)}
                        aria-expanded={isOpen}
                        aria-controls={`faq-answer-${realIndex}`}
                        id={`faq-question-${realIndex}`}
                        className="w-full p-4 sm:p-4.5 text-left flex items-start justify-between gap-3 focus-visible:outline-2 focus-visible:outline-blue-500"
                      >
                        <span className="font-semibold text-sm sm:text-base text-ink leading-snug">
                          {item.question}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-blue-400 shrink-0 mt-0.5 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>

                      {isOpen && (
                        <div
                          id={`faq-answer-${realIndex}`}
                          role="region"
                          aria-labelledby={`faq-question-${realIndex}`}
                          className="px-4 sm:px-5 pb-4 text-xs sm:text-sm leading-relaxed text-[#9DB0C8] dark:text-[#9DB0C8] border-t border-white/[0.04] pt-2.5"
                        >
                          {item.answer}
                        </div>
                      )}
                    </div>
                  </RevealOnScroll>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          13. FOOTER (5 KOLOM, LOGO + TAGLINE, SOSIAL, HUKUM, PEMILIH BAHASA)
          =================================================================== */}
      <footer
        className={`pt-16 pb-12 transition-colors duration-200 ${
          theme === 'dark' ? 'bg-[#040C18] text-[#9DB0C8]' : 'bg-slate-100 text-slate-600'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          {/* Main 5 Kolom Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            {/* Kolom 1: Brand & Tagline */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2.5 mb-4 group">
                <img
                  src={theme === 'dark' ? logoDark : logoLight}
                  alt="GovConnect"
                  className="w-7 h-7 object-contain"
                  width={28}
                  height={28}
                />
                <span className="font-bold text-base text-ink tracking-tight">GovConnect</span>
              </Link>
              <p className="text-xs leading-relaxed text-slate-400 mb-4">
                Asisten formulir kependudukan otomatis berbasis ekstensi browser. Presisi, aman, dan berfokus pada privasi warga.
              </p>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                  aria-label="GitHub Repository"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                  aria-label="X / Twitter Profile"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                  aria-label="LinkedIn Page"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
                <a
                  href="mailto:kontak@govconnect.id"
                  className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
                  aria-label="Email Pengembang"
                >
                  <Mail className="w-4 h-4" strokeWidth={1.5} />
                </a>
              </div>
            </div>

            {/* Kolom 2: Produk */}
            <div>
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink mb-4">
                Produk
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="#unduh" className="hover:text-ink transition-colors">
                    Ekstensi Browser
                  </a>
                </li>
                <li>
                  <Link to="/demo" className="hover:text-ink transition-colors">
                    Simulator Interaktif
                  </Link>
                </li>
                <li>
                  <a href="#cara-kerja" className="hover:text-ink transition-colors">
                    Pencocokan Semantik
                  </a>
                </li>
                <li>
                  <a href="#efisiensi" className="hover:text-ink transition-colors">
                    Matriks Efisiensi
                  </a>
                </li>
                <li>
                  <span className="text-slate-500">Catatan Rilis v1.4.0</span>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Layanan Publik */}
            <div>
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink mb-4">
                Layanan Publik
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/public-services" className="hover:text-ink transition-colors">
                    Kependudukan &amp; Dukcapil
                  </Link>
                </li>
                <li>
                  <Link to="/templates" className="hover:text-ink transition-colors">
                    Perizinan Usaha (SKU)
                  </Link>
                </li>
                <li>
                  <Link to="/templates" className="hover:text-ink transition-colors">
                    Pendaftaran Beasiswa
                  </Link>
                </li>
                <li>
                  <Link to="/public-services" className="hover:text-ink transition-colors">
                    Bantuan Sosial (DTKS)
                  </Link>
                </li>
                <li>
                  <Link to="/templates" className="hover:text-ink transition-colors">
                    Layanan Kelurahan
                  </Link>
                </li>
              </ul>
            </div>

            {/* Kolom 4: Keamanan & Legal */}
            <div>
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink mb-4">
                Keamanan &amp; Legal
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="#keamanan" className="hover:text-ink transition-colors">
                    Kepatuhan UU PDP
                  </a>
                </li>
                <li>
                  <a href="#keamanan" className="hover:text-ink transition-colors">
                    Kebijakan Privasi
                  </a>
                </li>
                <li>
                  <a href="#keamanan" className="hover:text-ink transition-colors">
                    Syarat &amp; Ketentuan
                  </a>
                </li>
                <li>
                  <a href="#keamanan" className="hover:text-ink transition-colors">
                    Enkripsi Klien AES-256
                  </a>
                </li>
                <li>
                  <a href="#keamanan" className="hover:text-ink transition-colors">
                    Laporan Audit Privasi
                  </a>
                </li>
              </ul>
            </div>

            {/* Kolom 5: Sumber Daya */}
            <div>
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-ink mb-4">
                Sumber Daya
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <a href="#faq" className="hover:text-ink transition-colors">
                    Tanya Jawab (FAQ)
                  </a>
                </li>
                <li>
                  <Link to="/complaints" className="hover:text-ink transition-colors">
                    Saluran Pengaduan
                  </Link>
                </li>
                <li>
                  <a href="#unduh" className="hover:text-ink transition-colors">
                    Panduan Pemasangan
                  </a>
                </li>
                <li>
                  <Link to="/login" className="hover:text-ink transition-colors">
                    Portal Masuk Dasbor
                  </Link>
                </li>
                <li>
                  <span className="text-slate-500">API Gateway Dokumentasi</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Baris Bawah: Copyright */}
          <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              © 2026 GovConnect Indonesia. Hak cipta dilindungi undang-undang.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
