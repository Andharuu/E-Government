import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome } from '../components/ui';
import logoDark from '../assets/logo dark.png';
import logoLight from '../assets/logo light.png';

/* =========================================================================
   Motion helpers — dipakai hemat, hanya untuk entrance
   ========================================================================= */

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
  threshold = 0.12,
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

  const hidden = {
    'fade-up': 'opacity-0 translate-y-3',
    'fade-down': 'opacity-0 -translate-y-3',
    'fade-left': 'opacity-0 -translate-x-3',
    'fade-right': 'opacity-0 translate-x-3',
    'zoom-in': 'opacity-0 scale-[0.985]',
  }[animation];

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : hidden} ${className}`}
    >
      {children}
    </div>
  );
}

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

function AnimatedCounter({ end, duration = 1200, suffix = '', decimals = 0 }: CounterProps) {
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
    <span ref={ref} className="tabular-nums">
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString('id-ID')}
      {suffix}
    </span>
  );
}

/* =========================================================================
   Data showcase
   ========================================================================= */

interface MockServiceTab {
  id: string;
  name: string;
  category: string;
  agency: string;
  url: string;
  fields: { label: string; value: string; key: string }[];
}

const MOCK_TABS: Record<string, MockServiceTab> = {
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

const FAQ_LIST = [
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
    a: 'GovConnect 100% gratis untuk seluruh pengguna layanan Indonesia guna mempercepat transformasi digital pelayanan publik yang inklusif dan bebas birokrasi berbelit.',
  },
];

/* =========================================================================
   Halaman
   ========================================================================= */

export function Landing() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('dukcapil');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) setScrollProgress((currentScrollY / docHeight) * 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleDownloadExtension = () => {
    const link = document.createElement('a');
    link.href = '/govconnect-extension.zip';
    link.download = 'govconnect-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentTab = MOCK_TABS[activeTab] || MOCK_TABS.dukcapil;

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col relative">
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 h-[2px] bg-accent z-[100] transition-[width] duration-75 pointer-events-none"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Announcement */}
      {showBanner && (
        <div className="bg-surface border-b border-line">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
            <p className="text-[12px] text-ink-2 text-center flex-1">
              Asisten formulir kependudukan dengan pencocokan semantik kini rilis se-Indonesia.{' '}
              <Link to="/demo" className="link font-semibold">
                Coba simulator
              </Link>
            </p>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="btn btn-ghost btn-icon btn-sm text-ink-3 shrink-0"
              aria-label="Tutup pengumuman"
            >
              <FontAwesome name="xmark" className="text-[11px]" />
            </button>
          </div>
        </div>
      )}

      {/* ================= NAVBAR ================= */}
      <header
        className={`sticky top-0 z-50 w-full bg-surface/85 backdrop-blur-md border-b border-line transition-shadow ${
          scrollY > 8 ? 'shadow-xs' : ''
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt="GovConnect"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-[15px] tracking-[-0.02em] text-ink">GovConnect</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '#showcase', label: 'Produk' },
              { href: '#comparison', label: 'Efisiensi' },
              { href: '#faq', label: 'FAQ' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-md text-[13px] font-medium text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon btn-sm text-ink-2"
              title={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
              aria-label="Ganti tema"
            >
              <FontAwesome name={theme === 'dark' ? 'sun' : 'moon'} className="text-[13px]" />
            </button>

            {user ? (
              <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-sm">
                <FontAwesome name="grid" className="text-[11px]" />
                Dasbor
              </button>
            ) : (
              <button type="button" onClick={() => navigate('/login')} className="btn btn-secondary btn-sm">
                Masuk
              </button>
            )}

            <button type="button" onClick={handleDownloadExtension} className="btn btn-primary btn-sm">
              <FontAwesome name="download" className="text-[11px]" />
              <span className="hidden sm:inline">Pasang Ekstensi</span>
              <span className="sm:hidden">Ekstensi</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= HERO ================= */}
      <section className="relative border-b border-line overflow-hidden">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16">
          <div className="mx-auto max-w-[820px] text-center">
            <RevealOnScroll animation="fade-up">
              <span className="inline-flex items-center gap-2 h-7 px-3 rounded-full border border-accent-line bg-accent-soft text-accent-text text-[11.5px] font-semibold mb-6">
                <span className="dot" />
                Rilis se-Indonesia · pencocokan semantik
              </span>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delay={60}>
              <h1 className="text-[34px] sm:text-[48px] lg:text-[56px] font-bold tracking-[-0.04em] leading-[1.05] text-ink">
                Layanan publik jadi lebih cepat
                <span className="block text-accent-text">&amp; otomatis</span>
              </h1>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delay={120}>
              <p className="mt-6 text-[15px] sm:text-[17px] text-ink-2 leading-relaxed max-w-[640px] mx-auto">
                Berhenti mengetik ulang NIK, KK, dan data kependudukan. GovConnect mendeteksi lalu
                mengisi formulir dinas, perizinan, beasiswa, hingga bansos dalam{' '}
                <strong className="font-semibold text-ink">0,3 detik</strong>.
              </p>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delay={180}>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button type="button" onClick={handleDownloadExtension} className="btn btn-primary btn-lg w-full sm:w-auto">
                  <FontAwesome name="download" className="text-[12px]" />
                  Unduh ekstensi browser
                  <span className="ml-1 text-[10.5px] font-semibold px-1.5 py-0.5 rounded bg-white/15">
                    Gratis
                  </span>
                </button>
                <Link to="/demo" className="btn btn-secondary btn-lg w-full sm:w-auto">
                  Coba simulator
                  <FontAwesome name="arrow-right" className="text-[11px]" />
                </Link>
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delay={240}>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-ink-3">
                <span className="flex items-center gap-1.5">
                  <FontAwesome name="check-circle" className="text-ok text-[11px]" />
                  Chrome, Edge, Brave
                </span>
                <span className="flex items-center gap-1.5">
                  <FontAwesome name="shield-check" className="text-ok text-[11px]" />
                  Data terenkripsi
                </span>
                <span className="flex items-center gap-1.5">
                  <FontAwesome name="bolt" className="text-ok text-[11px]" />
                  Akurasi 100%
                </span>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ================= SHOWCASE ================= */}
      <section id="showcase" className="py-12 sm:py-16 border-b border-line">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <RevealOnScroll animation="fade-up">
            <div className="mx-auto max-w-[640px] text-center mb-8">
              <p className="eyebrow mb-2">Cara kerjanya</p>
              <h2 className="text-[24px] sm:text-[30px] font-bold tracking-[-0.03em] text-ink">
                Formulir instansi, terisi otomatis
              </h2>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                Ekstensi membaca struktur kolom, mencocokkannya dengan profil Anda, lalu mengisi
                hanya setelah Anda menyetujui.
              </p>
            </div>
          </RevealOnScroll>

          <div className="relative">
            {/* Kartu melayang — hanya di layar lebar */}
            <RevealOnScroll animation="fade-right" delay={140}>
              <div className="hidden xl:block absolute -left-6 top-16 z-10 w-[190px] card p-3.5 shadow-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-md bg-ok-soft text-ok border border-ok-line flex items-center justify-center shrink-0">
                    <FontAwesome name="bolt" className="text-[9px]" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ok">
                    Kecepatan isi
                  </span>
                </div>
                <p className="text-[17px] font-bold text-ink tracking-[-0.02em] tabular-nums">0,3 detik</p>
                <p className="text-[10.5px] text-ink-3 mt-0.5">vs 4 m 30 s mengetik manual</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-left" delay={200}>
              <div className="hidden xl:block absolute -right-6 top-24 z-10 w-[200px] card p-3.5 shadow-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-6 h-6 rounded-md bg-accent-soft text-accent-text border border-accent-line flex items-center justify-center shrink-0">
                    <FontAwesome name="shield-check" className="text-[9px]" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-accent-text">
                    Data terenkripsi
                  </span>
                </div>
                <p className="text-[13px] font-semibold text-ink leading-tight">Brankas kependudukan</p>
                <p className="text-[10.5px] text-ok font-medium mt-1 flex items-center gap-1">
                  <FontAwesome name="check-circle" className="text-[8px]" />
                  NIK &amp; KK terverifikasi
                </p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll animation="fade-up" delay={80}>
              <div className="card overflow-hidden shadow-sm">
              {/* Browser chrome */}
              <div className="h-10 px-3 border-b border-line bg-surface-2 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-line-2" />
                  <span className="w-2.5 h-2.5 rounded-full bg-line-2" />
                  <span className="w-2.5 h-2.5 rounded-full bg-line-2" />
                </div>
                <div className="flex-1 max-w-[520px] mx-auto h-6 px-2.5 rounded-md bg-surface border border-line flex items-center gap-2 text-[11px] text-ink-3 truncate">
                  <FontAwesome name="lock" className="text-ok text-[9px] shrink-0" />
                  <span className="truncate mono">{currentTab.url}</span>
                </div>
                <span className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-medium text-ok shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-ok" />
                  Aktif
                </span>
              </div>

              {/* Tabs */}
              <div className="px-3 py-2 border-b border-line bg-surface flex items-center gap-1 overflow-x-auto no-scrollbar">
                {[
                  { id: 'dukcapil', label: 'Kependudukan', icon: 'landmark' },
                  { id: 'kelurahan', label: 'Izin & Kelurahan', icon: 'building' },
                  { id: 'beasiswa', label: 'Beasiswa', icon: 'graduation-cap' },
                  { id: 'bansos', label: 'Bansos', icon: 'handshake' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    data-active={activeTab === tab.id}
                    className="segmented-item"
                  >
                    <FontAwesome name={tab.icon} className="text-[11px]" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Split view */}
              <div className="grid grid-cols-1 lg:grid-cols-12">
                {/* Form instansi */}
                <div className="lg:col-span-8 p-5 sm:p-6 bg-surface-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 mb-5 border-b border-line">
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.07em] text-ink-3">
                        {currentTab.agency}
                      </p>
                      <h3 className="text-[14.5px] font-semibold text-ink mt-1">{currentTab.name}</h3>
                    </div>
                    <span className="badge badge-ok self-start sm:self-auto shrink-0">
                      <FontAwesome name="check-circle" className="text-[9px]" />
                      Terisi otomatis
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {currentTab.fields.map((field) => (
                      <div
                        key={field.key}
                        className={
                          field.key === 'alamat' || field.key === 'alamat_usaha' ? 'sm:col-span-2' : ''
                        }
                      >
                        <label className="flex items-center justify-between gap-2 text-[11px] font-medium text-ink-2 mb-1.5">
                          <span className="truncate">{field.label}</span>
                          <span className="text-[9.5px] font-semibold text-ok shrink-0">
                            cocok
                          </span>
                        </label>
                        <div className="px-3 py-2 bg-surface border border-ok-line rounded-md text-[12.5px] font-medium text-ink truncate">
                          {field.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Panel asisten */}
                <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-line bg-surface flex flex-col justify-between">
                  <div>
                    <div className="px-4 h-12 flex items-center justify-between border-b border-line">
                      <span className="text-[12px] font-semibold text-ink">Panel asisten</span>
                      <span className="badge badge-accent">{currentTab.fields.length} kolom</span>
                    </div>

                    <div className="p-2">
                      {currentTab.fields.map((f) => (
                        <div
                          key={f.key}
                          className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-md"
                        >
                          <span className="flex items-center gap-2 min-w-0">
                            <FontAwesome name="check-circle" className="text-ok text-[10px] shrink-0" />
                            <span className="text-[11.5px] text-ink-2 truncate">{f.label}</span>
                          </span>
                          <span className="badge badge-ok shrink-0">Cocok</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 border-t border-line bg-surface-2">
                    <button type="button" onClick={handleDownloadExtension} className="btn btn-primary w-full btn-sm">
                      Isi semua kolom
                    </button>
                    <p className="text-[10.5px] text-ink-3 text-center mt-2">
                      Tidak ada data yang dikirim tanpa persetujuan Anda
                    </p>
                  </div>
                </div>
              </div>
            </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ================= STATS ================= */}
      <section className="py-12 border-b border-line bg-surface">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <RevealOnScroll animation="zoom-in">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-line">
              {[
                { value: <AnimatedCounter end={0.3} decimals={1} suffix="s" />, label: 'Waktu pengisian rata-rata' },
                { value: <AnimatedCounter end={25000} suffix="+" />, label: 'Formulir pengguna terlayani' },
                { value: <AnimatedCounter end={98.8} decimals={1} suffix="%" />, label: 'Efisiensi waktu terhemat' },
                { value: <AnimatedCounter end={100} suffix="%" />, label: 'Akurasi bebas salah ketik' },
              ].map((stat, i) => (
                <div key={i} className="px-4 sm:px-6 py-2 first:pl-0 last:pr-0">
                  <div className="text-[26px] sm:text-[30px] font-bold tracking-[-0.03em] text-ink tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-[11.5px] text-ink-3 mt-1.5 leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ================= COMPARISON ================= */}
      <section id="comparison" className="py-14 sm:py-16 border-b border-line">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
          <RevealOnScroll animation="fade-up">
            <div className="max-w-[560px] mb-8">
              <p className="eyebrow mb-2">Efisiensi waktu</p>
              <h2 className="text-[24px] sm:text-[28px] font-bold tracking-[-0.03em] text-ink">
                Hemat 98.8% waktu mengurus formulir
              </h2>
              <p className="text-[13px] text-ink-2 mt-2 leading-relaxed">
                Transformasi proses pengisian data yang membosankan menjadi otomatisasi 1-klik yang
                instan dan presisi.
              </p>
            </div>
          </RevealOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manual */}
            <RevealOnScroll animation="fade-left" delay={60} className="h-full">
              <div className="card h-full p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
                    <span className="text-[11.5px] font-semibold text-danger">Cara manual</span>
                    <span className="text-[11.5px] text-ink-3 flex items-center gap-1">
                      <FontAwesome name="clock" className="text-[10px]" />
                      4,5 menit
                    </span>
                  </div>

                  <h3 className="text-[16px] font-semibold text-ink mb-1.5">Melelahkan & rawan typo</h3>
                  <p className="text-[12.5px] text-ink-2 leading-relaxed mb-5">
                    Mencari kartu fisik, membaca 16 digit NIK/KK, dan mengetik ulang satu per satu
                    kolom pada setiap instansi yang berbeda.
                  </p>

                  <ul className="space-y-2.5">
                    {[
                      'Mengetik ulang belasan kolom dari awal',
                      'Risiko salah ketik angka NIK atau tanggal lahir',
                      'Format tanggal atau alamat sering ditolak sistem',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[12.5px] text-ink-2">
                        <FontAwesome name="cross-small" className="text-danger text-[10px] mt-1 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="mt-6 pt-3 border-t border-line text-[11px] text-ink-3">
                  Rata-rata waktu terbuang: <strong className="font-semibold text-ink-2">4 menit 30 detik</strong>
                </p>
              </div>
            </RevealOnScroll>

            {/* GovConnect */}
            <RevealOnScroll animation="fade-right" delay={120} className="h-full">
              <div className="card h-full p-5 sm:p-6 flex flex-col justify-between border-accent-line">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
                    <span className="text-[11.5px] font-semibold text-accent-text">Asisten GovConnect</span>
                    <span className="badge badge-ok">0,3 detik</span>
                  </div>

                  <h3 className="text-[16px] font-semibold text-ink mb-1.5">Satu klik, selesai</h3>
                  <p className="text-[12.5px] text-ink-2 leading-relaxed mb-5">
                    Ekstensi memetakan kolom secara semantik dan mengisi seluruh formulir secara
                    instan dari brankas data Anda.
                  </p>

                  <ul className="space-y-2.5">
                    {[
                      'Autofill seluruh kolom formulir dalam 1 klik',
                      '100% presisi bebas salah ketik',
                      'Data aman tersimpan di browser Anda',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[12.5px] text-ink-2">
                        <FontAwesome name="check-circle" className="text-ok text-[10px] mt-1 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-3 border-t border-line flex items-center justify-between gap-3">
                  <span className="text-[11.5px] text-ink-2">
                    Efisiensi: <strong className="font-semibold text-ink">98,8%</strong>
                  </span>
                  <Link to="/demo" className="btn btn-primary btn-sm">
                    Coba simulator
                    <FontAwesome name="arrow-right" className="text-[10px]" />
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section id="faq" className="py-14 sm:py-16 border-b border-line">
        <div className="max-w-[820px] mx-auto px-4 sm:px-6">
          <RevealOnScroll animation="fade-up">
            <div className="mb-7">
              <p className="eyebrow mb-2">Tanya jawab</p>
              <h2 className="text-[24px] sm:text-[28px] font-bold tracking-[-0.03em] text-ink">
                Pertanyaan yang sering diajukan
              </h2>
              <p className="text-[13px] text-ink-2 mt-2">
                Cara kerja, privasi data, dan pemasangan ekstensi GovConnect.
              </p>
            </div>
          </RevealOnScroll>

          <div className="card divide-y divide-line overflow-hidden">
            {FAQ_LIST.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="w-full px-4 sm:px-5 py-3.5 text-left flex items-center justify-between gap-4 hover:bg-surface-2 transition-colors"
                  >
                    <span className="text-[13px] font-medium text-ink">{item.q}</span>
                    <FontAwesome
                      name="chevron-down"
                      className={`text-[10px] text-ink-3 shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-4 -mt-1">
                      <p className="text-[12.5px] text-ink-2 leading-relaxed max-w-[680px]">{item.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= BACK TO TOP ================= */}
      <div
        className={`fixed bottom-6 right-6 z-40 transition-all duration-200 ${
          scrollY > 400 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <button
          type="button"
          onClick={scrollToTop}
          className="relative w-10 h-10 rounded-full bg-surface border border-line shadow-md flex items-center justify-center text-ink-2 hover:text-ink transition-colors"
          title="Kembali ke atas"
          aria-label="Kembali ke atas"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-line"
              strokeWidth="2.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-accent transition-all duration-75"
              strokeDasharray={`${scrollProgress}, 100`}
              strokeWidth="2.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <FontAwesome name="chevron-up" className="text-[10px] relative z-10" />
        </button>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="mt-auto bg-surface">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <Link to="/" className="flex items-center gap-2.5 mb-3">
                <img
                  src={theme === 'dark' ? logoDark : logoLight}
                  alt="GovConnect"
                  className="w-7 h-7 object-contain"
                />
                <span className="font-bold text-[14px] text-ink tracking-[-0.02em]">GovConnect</span>
              </Link>
              <p className="text-[12px] text-ink-3 leading-relaxed max-w-[240px]">
                Platform asisten formulir kependudukan & pelayanan publik otomatis terpadu Indonesia.
              </p>
            </div>

            {[
              {
                title: 'Fitur ekstensi',
                links: [
                  { label: 'Pencocokan semantik', href: '#showcase' },
                  { label: 'Simulator demo', to: '/demo' },
                  { label: 'Efisiensi waktu', href: '#comparison' },
                  { label: 'Integrasi browser', href: '#showcase' },
                ],
              },
              {
                title: 'Layanan pengguna',
                links: [
                  { label: 'Direktori layanan', to: '/public-services' },
                  { label: 'Template formulir', to: '/templates' },
                  { label: 'Saluran pengaduan', to: '/complaints' },
                  { label: 'Profil kependudukan', to: '/profile' },
                ],
              },
              {
                title: 'Keamanan & akses',
                links: [
                  { label: 'Pertanyaan umum (FAQ)', href: '#faq' },
                  { label: 'Portal masuk', to: '/login' },
                  { label: 'Pendaftaran akun', to: '/register' },
                  { label: 'Standar privasi', href: '#faq' },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3 mb-3">
                  {col.title}
                </h4>
                <ul className="space-y-2">
                  {col.links.map((link) =>
                    'to' in link && link.to ? (
                      <li key={link.label}>
                        <Link to={link.to} className="text-[12.5px] text-ink-2 hover:text-ink transition-colors">
                          {link.label}
                        </Link>
                      </li>
                    ) : (
                      <li key={link.label}>
                        <a href={link.href} className="text-[12.5px] text-ink-2 hover:text-ink transition-colors">
                          {link.label}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11.5px] text-ink-3">
              © 2026 GovConnect Indonesia. Hak cipta dilindungi undang-undang.
            </p>
            <p className="text-[11.5px] text-ink-3">
              Dibangun untuk kemudahan pelayanan publik pengguna.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
