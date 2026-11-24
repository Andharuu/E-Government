import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Download,
  Sun,
  Moon,
  Lock,
  RotateCcw,
  Check,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Terminal,
  ChevronDown,
  ChevronUp,
  Zap,
  Building2,
  Landmark,
  GraduationCap,
  HeartPulse,
  CheckCheck,
  Search,
  SlidersHorizontal,
  Send,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoDark from '../assets/logo dark.png';
import logoLight from '../assets/logo light.png';

/* =========================================================================
   Types & Models
   ========================================================================= */

interface DemoField {
  id: string;
  label: string;
  placeholder: string;
  valueKey: string;
  isSensitive?: boolean;
}

interface DemoService {
  id: string;
  name: string;
  agency: string;
  url: string;
  icon: typeof Landmark;
  fields: DemoField[];
}

interface ProfileData {
  id: 'budi' | 'siti' | 'joko';
  name: string;
  role: string;
  avatar: string;
  values: Record<string, string>;
  needsReviewKey?: string; // Kolom yang butuh tinjauan khusus
  reviewReason?: string;
}

/* =========================================================================
   Mock Services & Profiles
   ========================================================================= */

const SERVICES: Record<string, DemoService> = {
  dukcapil: {
    id: 'dukcapil',
    name: 'Permohonan Akta Kelahiran & KK Baru',
    agency: 'Dinas Kependudukan & Pencatatan Sipil',
    url: 'https://layanan.dukcapil.go.id/permohonan-akta-online',
    icon: Landmark,
    fields: [
      { id: 'f_nik', label: 'Nomor Induk Kependudukan (NIK)', placeholder: '16 digit NIK pemohon...', valueKey: 'nik', isSensitive: true },
      { id: 'f_nama', label: 'Nama Lengkap Sesuai KTP', placeholder: 'Nama pemohon sesuai dokumen...', valueKey: 'nama' },
      { id: 'f_kk', label: 'Nomor Kartu Keluarga (KK)', placeholder: '16 digit nomor KK...', valueKey: 'kk', isSensitive: true },
      { id: 'f_ttl', label: 'Tempat & Tanggal Lahir', placeholder: 'Kota, DD/MM/YYYY...', valueKey: 'ttl' },
      { id: 'f_alamat', label: 'Alamat Domisili KTP', placeholder: 'Jalan, RT/RW, Kelurahan, Kota...', valueKey: 'alamat' },
      { id: 'f_telp', label: 'Nomor WhatsApp / HP Aktif', placeholder: '08xxxxxxxxxx...', valueKey: 'telepon' },
      { id: 'f_email', label: 'Alamat Email Notifikasi', placeholder: 'nama@example.com...', valueKey: 'email' },
    ],
  },
  kelurahan: {
    id: 'kelurahan',
    name: 'Surat Keterangan Usaha (SKU) & Domisili',
    agency: 'Pelayanan Terpadu Kelurahan Sukomulyo',
    url: 'https://pelayanan.kelurahan.go.id/surat-keterangan',
    icon: Building2,
    fields: [
      { id: 'f_nik', label: 'NIK Pemohon', placeholder: '16 digit NIK...', valueKey: 'nik', isSensitive: true },
      { id: 'f_nama', label: 'Nama Pemohon Sesuai KTP', placeholder: 'Nama pemohon...', valueKey: 'nama' },
      { id: 'f_pekerjaan', label: 'Profesi / Bidang Usaha', placeholder: 'Bidang usaha pemohon...', valueKey: 'pekerjaan' },
      { id: 'f_alamat', label: 'Alamat Tempat Usaha', placeholder: 'Alamat lengkap domisili usaha...', valueKey: 'alamat' },
      { id: 'f_telp', label: 'Nomor Kontak Pemohon', placeholder: '08xxxxxxxxxx...', valueKey: 'telepon' },
      { id: 'f_email', label: 'Email Verifikasi', placeholder: 'email@example.com...', valueKey: 'email' },
    ],
  },
  beasiswa: {
    id: 'beasiswa',
    name: 'Pendaftaran Beasiswa Pendidikan Tinggi',
    agency: 'Pusat Layanan Pembiayaan Pendidikan (Puslapdik)',
    url: 'https://beasiswa.kemdikbud.go.id/registrasi-peserta',
    icon: GraduationCap,
    fields: [
      { id: 'f_nik', label: 'NIK Mahasiswa', placeholder: '16 digit NIK...', valueKey: 'nik', isSensitive: true },
      { id: 'f_nama', label: 'Nama Lengkap Mahasiswa', placeholder: 'Nama mahasiswa...', valueKey: 'nama' },
      { id: 'f_nim', label: 'Nomor Induk Mahasiswa (NIM)', placeholder: 'Nomor induk mahasiswa...', valueKey: 'nim' },
      { id: 'f_ttl', label: 'Tanggal Lahir', placeholder: 'Tempat, DD/MM/YYYY...', valueKey: 'ttl' },
      { id: 'f_email', label: 'Email Kampus / Pribadi', placeholder: 'email@student.ac.id...', valueKey: 'email' },
      { id: 'f_telp', label: 'No. WhatsApp Mahasiswa', placeholder: '08xxxxxxxxxx...', valueKey: 'telepon' },
    ],
  },
  bpjs: {
    id: 'bpjs',
    name: 'Registrasi Mandiri Peserta JKN-KIS',
    agency: 'Badan Penyelenggara Jaminan Sosial (BPJS) Kesehatan',
    url: 'https://daftar.bpjs-kesehatan.go.id/registrasi-mandiri',
    icon: HeartPulse,
    fields: [
      { id: 'f_nik', label: 'Nomor Induk Kependudukan (NIK)', placeholder: '16 digit NIK...', valueKey: 'nik', isSensitive: true },
      { id: 'f_kk', label: 'Nomor Kartu Keluarga (KK)', placeholder: 'Nomor KK...', valueKey: 'kk', isSensitive: true },
      { id: 'f_nama', label: 'Nama Lengkap Calon Peserta', placeholder: 'Nama peserta...', valueKey: 'nama' },
      { id: 'f_bpjs', label: 'Nomor Rujukan / BPJS Sebelumnya', placeholder: '13 digit BPJS jika ada...', valueKey: 'bpjs' },
      { id: 'f_alamat', label: 'Alamat Domisili KTP', placeholder: 'Alamat tempat tinggal...', valueKey: 'alamat' },
      { id: 'f_telp', label: 'Nomor Handphone Terdaftar', placeholder: '08xxxxxxxxxx...', valueKey: 'telepon' },
    ],
  },
};

const PROFILES: Record<string, ProfileData> = {
  budi: {
    id: 'budi',
    name: 'Ahmad Pratama',
    role: 'Pekerja Swasta',
    avatar: 'AP',
    values: {
      nik: '3500000000000003',
      nama: 'Ahmad Pratama Putra, S.Kom',
      kk: '3500000000000001',
      ttl: 'Surabaya, 28 September 1998',
      alamat: 'Jl. Pemuda No. 45, RT 02/RW 03, Gresik',
      telepon: '081200000001',
      email: 'ahmad.pratama@example.com',
      pekerjaan: 'Software Engineer',
      nim: '5025201089',
      bpjs: '0001892837461',
    },
  },
  siti: {
    id: 'siti',
    name: 'Siti Rahmawati',
    role: 'Mahasiswi',
    avatar: 'SR',
    needsReviewKey: 'bpjs', // Pada BPJS / Kelurahan kolom ini perlu ditinjau
    reviewReason: 'Nomor BPJS belum dikonfirmasi di profil',
    values: {
      nik: '3200000000000005',
      nama: 'Siti Rahmawati Putri',
      kk: '3200000000000008',
      ttl: 'Bandung, 16 Juli 2002',
      alamat: 'Jl. Margonda Raya No. 102, Beji, Depok',
      telepon: '085700000002',
      email: 'siti.rahma@student.ac.id',
      pekerjaan: 'Pelajar / Mahasiswi',
      nim: '1202204190',
      bpjs: '', // Kosong di profil untuk mendemokan state "Perlu ditinjau"
    },
  },
  joko: {
    id: 'joko',
    name: 'H. Joko Santoso',
    role: 'Wiraswasta',
    avatar: 'JS',
    values: {
      nik: '3300000000000004',
      nama: 'H. Joko Widodo Santoso',
      kk: '3300000000000002',
      ttl: 'Surakarta, 15 April 1982',
      alamat: 'Jl. Slamet Riyadi No. 78, Surakarta',
      telepon: '081300000003',
      email: 'joko.santoso@example.com',
      pekerjaan: 'Pedagang / Wiraswasta',
      nim: '9901827461',
      bpjs: '0003847261948',
    },
  },
};

/* =========================================================================
   COMPONENT: DEMO / SIMULATOR
   ========================================================================= */

export function Demo() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State: Service & Profile
  const [selectedServiceId, setSelectedServiceId] = useState<string>('dukcapil');
  const [selectedProfileId, setSelectedProfileId] = useState<'budi' | 'siti' | 'joko'>('budi');

  // State: Detection & Autofill lifecycle
  // 'idle' | 'detecting' | 'ready' | 'filling' | 'filled'
  const [simulationState, setSimulationState] = useState<'idle' | 'detecting' | 'ready' | 'filling' | 'filled'>('ready');
  const [filledFieldIds, setFilledFieldIds] = useState<Set<string>>(new Set());
  const [fillTime, setFillTime] = useState<number | null>(null);

  // Field selection toggles inside panel
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<Record<string, boolean>>({});

  // Privacy mask toggle (NIK & KK)
  const [showSensitive, setShowSensitive] = useState<boolean>(false);

  // Terminal Log accordion toggle
  const [showTerminalLog, setShowTerminalLog] = useState<boolean>(false);

  // Stepper active step (1: Deteksi, 2: Tinjau, 3: Isi)
  const [stepperStep, setStepperStep] = useState<number>(2);

  // Form submission simulated notification
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  const currentService = SERVICES[selectedServiceId] || SERVICES.dukcapil;
  const currentProfile = PROFILES[selectedProfileId] || PROFILES.budi;

  // Initialize selected fields when service changes
  useEffect(() => {
    const initialMap: Record<string, boolean> = {};
    currentService.fields.forEach((f) => {
      initialMap[f.valueKey] = true;
    });
    setSelectedFieldKeys(initialMap);

    // Trigger brief 500ms detection shimmer
    setSimulationState('detecting');
    setFilledFieldIds(new Set());
    setFillTime(null);
    setFormSubmitted(false);
    setStepperStep(1);

    const timer = setTimeout(() => {
      setSimulationState('ready');
      setStepperStep(2);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedServiceId, selectedProfileId, currentService.fields]);

  // Handle Extension Download
  const handleDownloadExtension = () => {
    const link = document.createElement('a');
    link.href = '/govconnect-extension.zip';
    link.download = 'govconnect-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle single field in panel
  const toggleField = (key: string) => {
    setSelectedFieldKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Execute Autofill with Staggered 60-80ms delay per field
  const handleExecuteAutofill = () => {
    if (simulationState === 'filling') return;
    setSimulationState('filling');
    setFilledFieldIds(new Set());
    setStepperStep(3);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const activeFields = currentService.fields.filter((f) => selectedFieldKeys[f.valueKey] !== false);

    if (prefersReducedMotion) {
      // Instant execution
      const allIds = new Set(activeFields.map((f) => f.id));
      setFilledFieldIds(allIds);
      setFillTime(0.28);
      setSimulationState('filled');
      return;
    }

    // Staggered execution
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < activeFields.length) {
        const field = activeFields[currentIdx];
        setFilledFieldIds((prev) => new Set([...prev, field.id]));
        currentIdx++;
      } else {
        clearInterval(interval);
        setFillTime(0.28);
        setSimulationState('filled');
      }
    }, 70);
  };

  // Reset demo
  const handleReset = () => {
    setFilledFieldIds(new Set());
    setFillTime(null);
    setSimulationState('ready');
    setFormSubmitted(false);
    setStepperStep(2);
  };

  // Sensitive data mask helper: 3500••••••••0003
  const maskSensitive = (val: string) => {
    if (!val || val.length < 8) return val;
    return `${val.slice(0, 4)}••••••••${val.slice(-4)}`;
  };

  // Active fields count
  const activeFields = currentService.fields.filter((f) => selectedFieldKeys[f.valueKey] !== false);
  const matchedCount = activeFields.length;
  const isSitiReviewKey = (valKey: string) =>
    currentProfile.id === 'siti' && currentProfile.needsReviewKey === valKey;

  return (
    <div
      className={`min-h-screen font-sans flex flex-col transition-colors duration-200 selection:bg-blue-600 selection:text-white ${
        theme === 'dark' ? 'bg-[#050F1E] text-[#F2F6FB]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}
    >
      {/* ===================================================================
          1. HEADER KONSISTEN (64px, LOGO + SIMULATOR PILL + TEMA + AKSI)
          (Tombol "Beranda" yang redundan telah dihapus, logo tautan ke /)
          =================================================================== */}
      <header
        className={`sticky top-0 z-40 h-16 border-b backdrop-blur-md transition-colors duration-200 ${
          theme === 'dark'
            ? 'bg-[#050F1E]/90 border-white/[0.08] shadow-sm'
            : 'bg-white/90 border-slate-200 shadow-xs'
        }`}
      >
        <div className="max-w-[1500px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Logo & Simulator Badge */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0 focus-visible:outline-2 focus-visible:outline-blue-500 rounded-lg p-1 group"
            title="Kembali ke Beranda GovConnect"
          >
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt="GovConnect Logo"
              className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-105"
              width={32}
              height={32}
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-[17px] tracking-tight leading-none text-ink">
                GovConnect
              </span>
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                  theme === 'dark'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : 'bg-blue-50 border-blue-200 text-blue-700'
                }`}
              >
                Simulator
              </span>
            </div>
          </Link>

          {/* Right Action Bar: Tema + Masuk + Pasang Ekstensi */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${
                theme === 'dark'
                  ? 'border-white/[0.08] text-[#9DB0C8] hover:text-white hover:bg-white/[0.05]'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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

            {/* Auth Button */}
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all focus-visible:outline-2 focus-visible:outline-blue-500 ${
                  theme === 'dark'
                    ? 'border-white/[0.12] text-white hover:bg-white/[0.06]'
                    : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                Dasbor
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${
                  theme === 'dark'
                    ? 'text-[#9DB0C8] hover:text-white hover:bg-white/[0.05]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Masuk
              </button>
            )}

            {/* Primary Action Button: Pasang Ekstensi */}
            <button
              type="button"
              onClick={handleDownloadExtension}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-3px_rgba(37,99,235,0.45)] transition-all duration-200 focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              <Download className="w-4 h-4" strokeWidth={1.5} />
              <span className="hidden sm:inline">Pasang Ekstensi</span>
              <span className="sm:hidden">Pasang</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================
          2. SATU BAR KONTROL STICKY TERPADU
          (Menggantikan 2 baris tab + stepper terpisah)
          =================================================================== */}
      <section
        className={`sticky top-16 z-30 border-b transition-colors duration-200 ${
          theme === 'dark' ? 'bg-[#07162C]/95 border-white/[0.08]' : 'bg-slate-100/90 border-slate-200'
        } backdrop-blur-md`}
      >
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Bagian Kiri: Segmented Control Layanan Berikon */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#9DB0C8] shrink-0 font-semibold hidden sm:inline">
              Layanan:
            </span>
            <div
              className={`inline-flex p-1 rounded-xl border ${
                theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200'
              }`}
              role="tablist"
              aria-label="Pilih layanan publik"
            >
              {Object.values(SERVICES).map((srv) => {
                const IconComponent = srv.icon;
                const isSelected = selectedServiceId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedServiceId(srv.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap focus-visible:outline-2 focus-visible:outline-blue-500 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : theme === 'dark'
                        ? 'text-[#9DB0C8] hover:text-white hover:bg-white/[0.04]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{srv.id === 'dukcapil' ? 'Dukcapil' : srv.id === 'kelurahan' ? 'Kelurahan' : srv.id === 'beasiswa' ? 'Beasiswa' : 'BPJS'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bagian Tengah/Kanan: Chip Profil & Stepper Ringkas 3 Langkah */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3">
            {/* Profil Chips dengan Avatar Inisial & Peran */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar" role="tablist" aria-label="Pilih profil pengguna">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#9DB0C8] shrink-0 font-semibold hidden md:inline">
                Profil:
              </span>
              {Object.values(PROFILES).map((prof) => {
                const isSelected = selectedProfileId === prof.id;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedProfileId(prof.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-2 border transition-all focus-visible:outline-2 focus-visible:outline-blue-500 ${
                      isSelected
                        ? theme === 'dark'
                          ? 'border-blue-500/50 bg-blue-500/15 text-white font-semibold'
                          : 'border-blue-500 bg-blue-50 text-blue-900 font-semibold'
                        : theme === 'dark'
                        ? 'border-white/[0.08] text-[#9DB0C8] hover:text-white hover:bg-white/[0.04]'
                        : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : theme === 'dark'
                          ? 'bg-white/[0.08] text-slate-300'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {prof.avatar}
                    </span>
                    <span className="truncate">{prof.name.split(' ')[0]}</span>
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                      ({prof.role})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Stepper Ringkas 3 Langkah yang Bisa Diklik */}
            <div
              className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-mono ${
                theme === 'dark' ? 'bg-[#0B1E38] border-white/[0.08]' : 'bg-white border-slate-200'
              }`}
            >
              {[
                { step: 1, label: 'Deteksi', icon: Search },
                { step: 2, label: 'Tinjau', icon: SlidersHorizontal },
                { step: 3, label: 'Isi', icon: Zap },
              ].map((s) => {
                const isDone = stepperStep > s.step || simulationState === 'filled';
                const isCurrent = stepperStep === s.step && simulationState !== 'filled';
                const StepIcon = s.icon;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      if (s.step === 3 && simulationState !== 'filled') {
                        handleExecuteAutofill();
                      } else if (s.step === 2) {
                        handleReset();
                      }
                    }}
                    className={`px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors ${
                      isDone
                        ? 'text-emerald-400 font-semibold'
                        : isCurrent
                        ? 'text-blue-400 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    <StepIcon className="w-3 h-3" />
                    <span>{s.label}</span>
                    {isDone && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. PANGGUNG UTAMA 60/40
          (Kiri: Jendela Browser Realistis 60% · Kanan: Panel GovConnect Assistant 40%)
          =================================================================== */}
      <main className="max-w-[1500px] w-full mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col justify-start">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= KIRI (60% / 7 cols): JENDELA BROWSER REALISTIS ================= */}
          <div
            className={`lg:col-span-7 xl:col-span-8 rounded-[20px] border overflow-hidden transition-all duration-300 ${
              theme === 'dark'
                ? 'bg-[#08182F] border-white/[0.08] shadow-xl'
                : 'bg-white border-slate-200 shadow-lg'
            }`}
          >
            {/* Window Chrome Header Bar */}
            <div
              className={`h-11 px-4 flex items-center justify-between border-b select-none ${
                theme === 'dark' ? 'bg-[#061427] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {/* Traffic Light Dots */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>

              {/* URL Bar Monospace with Lock */}
              <div
                className={`flex-1 max-w-[520px] mx-4 h-7 px-3 rounded-lg flex items-center gap-2 text-xs font-mono truncate border ${
                  theme === 'dark'
                    ? 'bg-[#0B1E38] border-white/[0.08] text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" strokeWidth={1.5} />
                <span className="text-emerald-400 font-semibold shrink-0">https://</span>
                <span className="truncate">{new URL(currentService.url).hostname}</span>
                <span className="text-emerald-400/90 font-sans text-[10px] ml-auto shrink-0 hidden sm:inline flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Sertifikat SSL Aktif
                </span>
              </div>

              {/* Reset / Reload Button */}
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Muat ulang formulir simulasi"
                aria-label="Muat ulang formulir simulasi"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Form Agency Content Area */}
            <div className="p-6 sm:p-8">
              {/* Header Instansi Publik */}
              <div className="pb-5 mb-6 border-b border-white/[0.08] dark:border-white/[0.08] border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">
                    <Building2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>{currentService.agency}</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-ink mt-1">
                    {currentService.name}
                  </h1>
                </div>

                {/* State Badge di Header Form */}
                <div className="shrink-0 self-start sm:self-auto">
                  {simulationState === 'filled' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.5} />
                      Terisi otomatis ({fillTime}s simulasi)
                    </span>
                  ) : simulationState === 'detecting' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-blue-500/10 border border-blue-500/30 text-blue-400 animate-pulse">
                      <Search className="w-3.5 h-3.5" />
                      Mendeteksi kolom...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] border border-white/[0.08] text-[#9DB0C8]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Siaga aktif
                    </span>
                  )}
                </div>
              </div>

              {/* Banner Terisi: "7 kolom terisi. Tinjau sebelum mengirim." */}
              {simulationState === 'filled' && (
                <div className="mb-6 p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.08] flex items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <CheckCheck className="w-5 h-5 text-emerald-400 shrink-0" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-emerald-400">
                        {filledFieldIds.size} kolom terisi otomatis. Tinjau sebelum mengirim.
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        GovConnect hanya mengisi formulir; tombol pengiriman data tetap milik Anda secara penuh.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentService.fields.map((field) => {
                  const isCheckedInPanel = selectedFieldKeys[field.valueKey] !== false;
                  const isFieldFilled = filledFieldIds.has(field.id) && isCheckedInPanel;
                  const profileVal = currentProfile.values[field.valueKey] || '';
                  const isNeedsReview = isSitiReviewKey(field.valueKey);
                  const isFullWidth = field.valueKey === 'alamat';

                  return (
                    <div
                      key={field.id}
                      className={`transition-all duration-300 ${isFullWidth ? 'sm:col-span-2' : ''}`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <label
                          htmlFor={field.id}
                          className="font-semibold text-slate-300 dark:text-slate-300"
                        >
                          {field.label}
                        </label>

                        {/* Status Label di Samping Input */}
                        {isFieldFilled ? (
                          <span className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-400" strokeWidth={2} />
                            Terisi ✓
                          </span>
                        ) : isNeedsReview ? (
                          <span className="text-[11px] font-mono font-semibold text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" strokeWidth={2} />
                            Perlu ditinjau
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono text-slate-500">
                            {isCheckedInPanel ? 'Siap diisi' : 'Dilewati'}
                          </span>
                        )}
                      </div>

                      {/* Field Input (Tinggi 48px, Radius 12px) */}
                      <div
                        className={`h-12 px-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                          isFieldFilled
                            ? 'bg-emerald-500/[0.08] border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-mono text-sm'
                            : isNeedsReview
                            ? 'bg-amber-500/[0.08] border-amber-500/40 text-amber-300 font-mono text-sm'
                            : theme === 'dark'
                            ? 'bg-[#0B1E38] border-white/[0.08] text-slate-400 font-mono text-sm'
                            : 'bg-white border-slate-200 text-slate-700 font-mono text-sm'
                        }`}
                      >
                        <span className="truncate">
                          {isFieldFilled
                            ? field.isSensitive && !showSensitive
                              ? maskSensitive(profileVal)
                              : profileVal
                            : field.placeholder}
                        </span>

                        {isFieldFilled && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 ml-2" />
                        )}
                      </div>

                      {isNeedsReview && (
                        <p className="text-[11px] text-amber-400/90 mt-1 flex items-center gap-1 font-sans">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>{currentProfile.reviewReason}</span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Form Submission Action (Milik Pengguna) */}
              <div className="mt-8 pt-6 border-t border-white/[0.08] dark:border-white/[0.08] border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#9DB0C8]">
                  <span>Tombol kirim tetap milik Anda untuk verifikasi akhir berkas.</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (simulationState !== 'filled') {
                      alert('Silakan eksekusi pengisian kolom lewat panel GovConnect Assistant terlebih dahulu.');
                      return;
                    }
                    setFormSubmitted(true);
                  }}
                  className={`w-full sm:w-auto px-6 h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                    simulationState === 'filled'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                      : 'bg-white/[0.06] text-slate-400 cursor-not-allowed border border-white/[0.08]'
                  }`}
                >
                  <Send className="w-4 h-4" strokeWidth={1.5} />
                  <span>{formSubmitted ? 'Berkas Berhasil Terkirim (Simulasi)' : 'Kirim Berkas Permohonan'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= KANAN (40% / 5 cols): PANEL GOVCONNECT ASSISTANT ================= */}
          {/* Bobot visual lebih besar, kartu terangkat, border biru + glow lembut */}
          <aside
            className={`lg:col-span-5 xl:col-span-4 rounded-[20px] border transition-all duration-300 relative ${
              theme === 'dark'
                ? 'bg-[#0B203F] border-blue-500/40 shadow-[0_0_35px_-5px_rgba(37,99,235,0.28)]'
                : 'bg-white border-blue-400 shadow-2xl'
            }`}
          >
            {/* Header Panel */}
            <div className="p-5 border-b border-white/[0.08] dark:border-white/[0.08] border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    GC
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-ink leading-tight">GovConnect Assistant</h2>
                    <p className="text-[10px] text-[#9DB0C8]">Ekstensi Formulir Publik</p>
                  </div>
                </div>

                {/* Status Indicator */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Siaga Aktif
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-[#9DB0C8] pt-1">
                <span className="font-mono text-[11px] truncate">
                  {new URL(currentService.url).hostname}
                </span>
                <span className="font-semibold text-emerald-400 text-[11px]">
                  {matchedCount}/{currentService.fields.length} kolom cocok
                </span>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* CTA UTAMA: Ditempatkan menonjol di bagian atas panel */}
              <div>
                <button
                  type="button"
                  onClick={handleExecuteAutofill}
                  disabled={simulationState === 'filling'}
                  className={`w-full h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 shadow-[0_0_25px_-3px_rgba(37,99,235,0.5)] ${
                    simulationState === 'filling'
                      ? 'bg-blue-700 text-white cursor-wait opacity-80'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  <Zap className={`w-4 h-4 ${simulationState === 'filling' ? 'animate-bounce' : ''}`} strokeWidth={1.5} />
                  <span>
                    {simulationState === 'filling'
                      ? 'Mengisi kolom...'
                      : `Isi ${matchedCount} Kolom (1 Klik)`}
                  </span>
                  {fillTime && (
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/20">
                      {fillTime}s (simulasi)
                    </span>
                  )}
                </button>
                <p className="text-[11px] text-center text-[#9DB0C8] mt-2">
                  Data diproses secara lokal di browser Anda tanpa transit ke server luar.
                </p>
              </div>

              {/* Profil Kependudukan Card dengan Toggle Mata (Masking NIK/KK) */}
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  theme === 'dark' ? 'bg-[#07172D] border-white/[0.08]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-300">Profil Terpilih:</span>
                  <button
                    type="button"
                    onClick={() => setShowSensitive(!showSensitive)}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-mono"
                    title={showSensitive ? 'Samarkan NIK & KK' : 'Tampilkan NIK & KK'}
                  >
                    {showSensitive ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Samarkan</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Buka Sensor</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nama:</span>
                    <span className="font-semibold text-ink truncate ml-2">{currentProfile.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NIK:</span>
                    <span className="font-semibold text-ink">
                      {showSensitive ? currentProfile.values.nik : maskSensitive(currentProfile.values.nik)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nomor KK:</span>
                    <span className="font-semibold text-ink">
                      {showSensitive ? currentProfile.values.kk : maskSensitive(currentProfile.values.kk)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checklist Kolom dengan Checkbox per Kolom */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#9DB0C8]">
                    Daftar Kolom Terdeteksi
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {activeFields.length}/{currentService.fields.length} dipilih
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                  {currentService.fields.map((field) => {
                    const isChecked = selectedFieldKeys[field.valueKey] !== false;
                    const isFieldFilled = filledFieldIds.has(field.id) && isChecked;
                    const isNeedsReview = isSitiReviewKey(field.valueKey);

                    return (
                      <div
                        key={field.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-all ${
                          isFieldFilled
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : isNeedsReview
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : isChecked
                            ? theme === 'dark'
                              ? 'bg-white/[0.03] border-white/[0.06] text-slate-200'
                              : 'bg-white border-slate-200 text-slate-700'
                            : 'bg-transparent border-transparent opacity-40'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleField(field.valueKey)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                          />
                          <span className="truncate text-xs font-medium">{field.label}</span>
                        </label>

                        {/* Status Tag */}
                        <div className="shrink-0 flex items-center gap-1 font-mono text-[10.5px]">
                          {isFieldFilled ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              Terisi ✓
                            </span>
                          ) : isNeedsReview ? (
                            <span className="text-amber-400 font-semibold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                              Perlu ditinjau
                            </span>
                          ) : isChecked ? (
                            <span className="text-emerald-400 font-semibold">Cocok</span>
                          ) : (
                            <span className="text-slate-500">Lewati</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Log Aktivitas Bergaya Terminal Monospace (Collapsible) */}
              <div
                className={`rounded-xl border overflow-hidden ${
                  theme === 'dark' ? 'bg-[#061528] border-white/[0.08]' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowTerminalLog(!showTerminalLog)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-mono text-emerald-400 hover:bg-white/[0.02]"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Log Aktivitas Mesin Ekstensi</span>
                  </span>
                  {showTerminalLog ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {showTerminalLog && (
                  <div className="p-3 border-t border-white/[0.08] font-mono text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                    <p className="text-slate-400">
                      <span className="text-blue-400">[00:00.012]</span> DETECT -&gt; {currentService.fields.length} kolom terdeteksi di DOM pohon formulir
                    </p>
                    <p className="text-slate-400">
                      <span className="text-blue-400">[00:00.045]</span> MATCH  -&gt; {matchedCount} kolom cocok, {currentProfile.id === 'siti' ? '1 kolom perlu ditinjau' : '0 galat'}
                    </p>
                    <p className="text-amber-400">
                      <span className="text-blue-400">[00:00.120]</span> WAIT   -&gt; Menunggu konfirmasi persetujuan pengguna via panel samping...
                    </p>
                    {simulationState === 'filled' && (
                      <p className="text-emerald-400 font-semibold">
                        <span className="text-blue-400">[00:00.280]</span> FILLED -&gt; {filledFieldIds.size} kolom berhasil diisi dalam {fillTime}s (simulasi)
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* ===================================================================
            4. KARTU CTA KONVERSI SETELAH PENGISIAN
            (Muncul di bawah panggung setelah formulir terisi)
            =================================================================== */}
        {simulationState === 'filled' && (
          <div
            className={`mt-8 p-6 sm:p-8 rounded-[20px] border flex flex-col md:flex-row items-center justify-between gap-6 animate-fadeIn ${
              theme === 'dark'
                ? 'bg-[#0B1E38] border-blue-500/40 shadow-xl'
                : 'bg-white border-blue-300 shadow-md'
            }`}
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulasi Berhasil</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-ink">
                Suka hasilnya? Pasang ekstensi gratis sekarang.
              </h3>
              <p className="text-sm text-[#9DB0C8] mt-1 max-w-[600px] leading-relaxed">
                Nikmati kemudahan autofill kependudukan 0,3 detik ini langsung di browser Anda untuk seluruh portal
                pelayanan publik di Indonesia.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleDownloadExtension}
                className="px-5 py-3 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh untuk Chrome / Edge / Brave</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className={`px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                  theme === 'dark'
                    ? 'border-white/[0.12] text-white hover:bg-white/[0.05]'
                    : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                Coba Profil Lain / Reset
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
