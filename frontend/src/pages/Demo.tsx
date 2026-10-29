import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome } from '../components/ui';
import logoDark from '../assets/logo dark.png';
import logoLight from '../assets/logo light.png';

interface DemoField {
  id: string;
  label: string;
  placeholder: string;
  valueKey: string;
}

interface DemoService {
  id: string;
  name: string;
  agency: string;
  url: string;
  fields: DemoField[];
}

export function Demo() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Selected Service & Citizen Profile
  const [selectedServiceId, setSelectedServiceId] = useState<string>('dukcapil');
  const [selectedProfileId, setSelectedProfileId] = useState<'budi' | 'siti' | 'joko'>('budi');

  // Autofill Execution State
  const [isFilled, setIsFilled] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [fillTime, setFillTime] = useState<number | null>(null);

  // Field selection toggles inside sidepanel
  const [selectedFieldKeys, setSelectedFieldKeys] = useState<Record<string, boolean>>({
    nik: true,
    nama: true,
    kk: true,
    ttl: true,
    alamat: true,
    telepon: true,
    email: true,
    pekerjaan: true,
    nim: true,
    bpjs: true,
  });

  // Sample Profiles
  const profiles = {
    budi: {
      name: 'Ahmad Pratama (Pekerja Swasta)',
      nik: '3525012809980003',
      nama: 'Ahmad Pratama Putra, S.Kom',
      kk: '3525011204050001',
      ttl: 'Surabaya, 28 September 1998',
      alamat: 'Jl. Pemuda No. 45, RT 02 / RW 03, Gresik, Jawa Timur',
      telepon: '081234567890',
      email: 'ahmad.pratama@email.com',
      pekerjaan: 'Software Engineer',
      nim: '5025201089',
      bpjs: '0001892837461',
    },
    siti: {
      name: 'Siti Rahmawati (Mahasiswi)',
      nik: '3201015607020005',
      nama: 'Siti Rahmawati Putri',
      kk: '3201012304990008',
      ttl: 'Bandung, 16 Juli 2002',
      alamat: 'Jl. Margonda Raya No. 102, RT 01 / RW 05, Beji, Depok',
      telepon: '085712345678',
      email: 'siti.rahma@student.ac.id',
      pekerjaan: 'Pelajar / Mahasiswa',
      nim: '1202204190',
      bpjs: '0002981746253',
    },
    joko: {
      name: 'H. Joko Widodo (Wiraswasta)',
      nik: '3374011504820004',
      nama: 'H. Joko Widodo Santoso',
      kk: '3374019908750002',
      ttl: 'Surakarta, 15 April 1982',
      alamat: 'Jl. Slamet Riyadi No. 78, RT 03 / RW 02, Surakarta',
      telepon: '081398765432',
      email: 'joko.santoso@bisnis.id',
      pekerjaan: 'Pedagang / Wiraswasta',
      nim: '9901827461',
      bpjs: '0003847261948',
    },
  };

  const currentProfile = profiles[selectedProfileId];

  // Available Simulated Services
  const services: Record<string, DemoService> = {
    dukcapil: {
      id: 'dukcapil',
      name: 'Formulir Permohonan Akta Kelahiran & KK Baru',
      agency: 'Dinas Kependudukan & Pencatatan Sipil',
      url: 'https://layanan.dukcapil.go.id/permohonan-akta-online',
      fields: [
        { id: 'f_nik', label: 'Nomor Induk Kependudukan (NIK)', placeholder: '16 digit NIK...', valueKey: 'nik' },
        { id: 'f_nama', label: 'Nama Lengkap Sesuai KTP', placeholder: 'Nama pemohon...', valueKey: 'nama' },
        { id: 'f_kk', label: 'Nomor Kartu Keluarga (KK)', placeholder: '16 digit nomor KK...', valueKey: 'kk' },
        { id: 'f_ttl', label: 'Tempat, Tanggal Lahir', placeholder: 'Kota, DD/MM/YYYY...', valueKey: 'ttl' },
        { id: 'f_alamat', label: 'Alamat Lengkap Domisili KTP', placeholder: 'Jalan, RT/RW, Kelurahan, Kecamatan, Kota...', valueKey: 'alamat' },
        { id: 'f_telp', label: 'Nomor Handphone / WhatsApp', placeholder: '08xxxxxxxxxx...', valueKey: 'telepon' },
        { id: 'f_email', label: 'Alamat Email Aktif', placeholder: 'email@example.com...', valueKey: 'email' },
      ],
    },
    kelurahan: {
      id: 'kelurahan',
      name: 'Surat Keterangan Usaha (SKU) & Domisili',
      agency: 'Pelayanan Terpadu Kelurahan Sukomulyo',
      url: 'https://pelayanan.kelurahan.go.id/surat-keterangan',
      fields: [
        { id: 'f_nik', label: 'NIK Pemohon', placeholder: 'NIK...', valueKey: 'nik' },
        { id: 'f_nama', label: 'Nama Lengkap Pemohon', placeholder: 'Nama pemohon...', valueKey: 'nama' },
        { id: 'f_pekerjaan', label: 'Profesi / Bidang Usaha', placeholder: 'Bidang usaha...', valueKey: 'pekerjaan' },
        { id: 'f_alamat', label: 'Alamat Domisili KTP', placeholder: 'Alamat...', valueKey: 'alamat' },
        { id: 'f_telp', label: 'Kontak WhatsApp', placeholder: '08xxxxxxxxxx...', valueKey: 'telepon' },
        { id: 'f_email', label: 'Email Konfirmasi', placeholder: 'email...', valueKey: 'email' },
      ],
    },
    beasiswa: {
      id: 'beasiswa',
      name: 'Pendaftaran Beasiswa Pendidikan Tinggi',
      agency: 'Pusat Pembiayaan Pendidikan Nasional',
      url: 'https://beasiswa.kemdikbud.go.id/registrasi-peserta',
      fields: [
        { id: 'f_nik', label: 'NIK Mahasiswa', placeholder: '16 digit NIK...', valueKey: 'nik' },
        { id: 'f_nama', label: 'Nama Mahasiswa', placeholder: 'Nama lengkap...', valueKey: 'nama' },
        { id: 'f_nim', label: 'Nomor Induk Mahasiswa (NIM)', placeholder: 'NIM...', valueKey: 'nim' },
        { id: 'f_ttl', label: 'Tanggal Lahir', placeholder: 'Tempat / Tgl Lahir...', valueKey: 'ttl' },
        { id: 'f_email', label: 'Email Mahasiswa', placeholder: 'email@student...', valueKey: 'email' },
        { id: 'f_telp', label: 'No. WhatsApp Aktif', placeholder: '08xxxxxxxxxx...', valueKey: 'telepon' },
      ],
    },
    bpjs: {
      id: 'bpjs',
      name: 'Registrasi Mandiri Peserta JKN-KIS',
      agency: 'Badan Penyelenggara Jaminan Sosial Kesehatan',
      url: 'https://daftar.bpjs-kesehatan.go.id/registrasi-mandiri',
      fields: [
        { id: 'f_nik', label: 'Nomor Induk Kependudukan (NIK)', placeholder: 'NIK...', valueKey: 'nik' },
        { id: 'f_kk', label: 'Nomor Kartu Keluarga (KK)', placeholder: 'Nomor KK...', valueKey: 'kk' },
        { id: 'f_nama', label: 'Nama Peserta', placeholder: 'Nama lengkap...', valueKey: 'nama' },
        { id: 'f_bpjs', label: 'Nomor Kartu BPJS (Jika Ada)', placeholder: 'Nomor BPJS...', valueKey: 'bpjs' },
        { id: 'f_alamat', label: 'Alamat Tempat Tinggal', placeholder: 'Alamat lengkap...', valueKey: 'alamat' },
        { id: 'f_telp', label: 'Nomor Ponsel', placeholder: 'No HP...', valueKey: 'telepon' },
      ],
    },
  };

  const currentService = services[selectedServiceId] || services.dukcapil;

  // Toggle field selection in sidepanel
  const toggleField = (key: string) => {
    setSelectedFieldKeys(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Execute Autofill
  const handleAutofill = () => {
    if (isFilling) return;
    setIsFilling(true);
    setIsFilled(false);

    setTimeout(() => {
      setIsFilled(true);
      setIsFilling(false);
      setFillTime(0.28);
    }, 380);
  };

  const handleReset = () => {
    setIsFilled(false);
    setFillTime(null);
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

  // Count active matched fields
  const activeFieldsCount = currentService.fields.filter(
    f => selectedFieldKeys[f.valueKey] !== false
  ).length;

  return (
    <div className="min-h-screen bg-[#F6F8FB] dark:bg-[#080E1A] text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ================= 1. FULL WIDTH EDGE-TO-EDGE NAVBAR ================= */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/90 dark:bg-[#080E1A]/90 border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Name with Smooth Transition */}
          <Link to="/" className="flex items-center gap-3 group focus:outline-none shrink-0">
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt="GovConnect Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 shrink-0"
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                GovConnect
              </span>
              <span className="hidden sm:inline-block text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-300 border border-blue-200 dark:border-blue-800">
                Simulator Ekstensi
              </span>
            </div>
          </Link>

          {/* Right: Controls & Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Back to Home Link */}
            <Link
              to="/"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <FontAwesome name="arrow-left" className="text-xs" />
              <span>Beranda</span>
            </Link>

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

            {/* Masuk / Dashboard */}
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
              >
                <FontAwesome name="user" className="text-xs text-blue-600 dark:text-sky-400" />
                <span>Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <FontAwesome name="right-to-bracket" className="text-xs text-slate-500 dark:text-slate-400" />
                <span>Masuk</span>
              </button>
            )}

            {/* Pasang Ekstensi */}
            <button
              type="button"
              onClick={handleDownloadExtension}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-xl hover:shadow-blue-900/20 active:scale-95 cursor-pointer shrink-0"
              title="Unduh file ekstensi zip"
            >
              <FontAwesome name="download" className="text-xs" />
              <span>Pasang Ekstensi</span>
            </button>
          </div>
        </div>
      </header>

      {/* ================= 2. CONTROLS SUB-HEADER ================= */}
      <div className="bg-white dark:bg-[#0D1526] border-b border-slate-200/90 dark:border-slate-800/90 px-4 sm:px-8 lg:px-12 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Service Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs font-bold text-slate-400 shrink-0 mr-1">Layanan:</span>
            {[
              { id: 'dukcapil', label: 'Dukcapil', icon: 'landmark', iconColor: 'text-blue-500 dark:text-sky-400' },
              { id: 'kelurahan', label: 'Kelurahan', icon: 'building', iconColor: 'text-indigo-500 dark:text-indigo-400' },
              { id: 'beasiswa', label: 'Beasiswa', icon: 'graduation-cap', iconColor: 'text-amber-500 dark:text-amber-400' },
              { id: 'bpjs', label: 'BPJS Kesehatan', icon: 'heart-pulse', iconColor: 'text-rose-500 dark:text-rose-400' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setSelectedServiceId(tab.id);
                  handleReset();
                }}
                className={`group px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out hover:scale-105 active:scale-95 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  selectedServiceId === tab.id
                    ? 'bg-[#0A4174] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FontAwesome
                  name={tab.icon}
                  className={`text-xs transition-transform duration-300 ease-out group-hover:scale-110 ${
                    selectedServiceId === tab.id ? 'text-white' : tab.iconColor
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Profile Selector Tabs & Reset */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
            <span className="text-xs font-bold text-slate-400 shrink-0 mr-1">Profil:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {(['budi', 'siti', 'joko'] as const).map(pKey => (
                <button
                  key={pKey}
                  onClick={() => {
                    setSelectedProfileId(pKey);
                    handleReset();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedProfileId === pKey
                      ? 'bg-white dark:bg-[#1E2C44] text-blue-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {pKey === 'budi' ? 'Ahmad (Pekerja)' : pKey === 'siti' ? 'Siti (Mahasiswi)' : 'H. Joko (Wiraswasta)'}
                </button>
              ))}
            </div>

            {isFilled && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= 3. MAIN INTERACTIVE SPLIT SCREEN ================= */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1600px] mx-auto rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden bg-white dark:bg-[#0D1526] grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          {/* ================= LEFT: SIMULATED GOVERNMENT WEB FORM (8 Cols) ================= */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-slate-50/60 dark:bg-slate-900/40">
            {/* Simulated Browser Chrome Bar */}
            <div className="h-11 bg-slate-100/90 dark:bg-[#0B1220] border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
                <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
                <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
              </div>
              <div className="flex-1 max-w-md mx-auto bg-white dark:bg-[#192438] border border-slate-200 dark:border-slate-700/70 rounded-lg px-3 py-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300 font-mono truncate">
                <FontAwesome name="lock" className="text-emerald-500 text-[10px]" />
                <span className="truncate">{currentService.url}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <FontAwesome name="refresh" className="hover:text-slate-600 cursor-pointer" />
              </div>
            </div>

            {/* Target Form Content */}
            <div className="p-6 sm:p-10 flex-1 overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-8 border-b border-slate-200 dark:border-slate-800 gap-3">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-sky-400">
                    {currentService.agency}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {currentService.name}
                  </h1>
                </div>

                {/* Status Indicator without box container & animated ellipsis dots */}
                {isFilled ? (
                  <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 self-start sm:self-auto shrink-0 animate-in fade-in duration-300">
                    <FontAwesome name="circle-check" className="text-sm" />
                    <span>Terisi otomatis dalam {fillTime}s</span>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 self-start sm:self-auto shrink-0 flex items-center gap-1 select-none">
                    <span>Menunggu pengisian ekstensi</span>
                    <span className="inline-flex tracking-wider font-extrabold text-[#0A4174] dark:text-[#7BBDE8]">
                      <span className="animate-pulse">.</span>
                      <span className="animate-pulse [animation-delay:200ms]">.</span>
                      <span className="animate-pulse [animation-delay:400ms]">.</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {currentService.fields.map(field => {
                  const shouldFill = isFilled && selectedFieldKeys[field.valueKey] !== false;
                  const profileVal = (currentProfile as Record<string, string>)[field.valueKey] || '';
                  const isFullWidth = field.valueKey === 'alamat';

                  return (
                    <div key={field.id} className={`space-y-1.5 ${isFullWidth ? 'sm:col-span-2' : ''}`}>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <span>{field.label}</span>
                        {shouldFill && (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold flex items-center gap-1">
                            <FontAwesome name="check-circle" className="text-[10px]" />
                            Cocok
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={shouldFill ? profileVal : ''}
                        placeholder={field.placeholder}
                        className={`w-full px-4 py-3 rounded-xl border text-xs sm:text-sm transition-all duration-300 font-medium ${
                          shouldFill
                            ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 text-slate-900 dark:text-white ring-2 ring-emerald-500/25 shadow-xs'
                            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Toast when filled */}
              {isFilled && (
                <div className="mt-8 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      ✓
                    </span>
                    <div>
                      <div className="font-extrabold text-sm text-emerald-900 dark:text-emerald-100">
                        Autofill Berhasil Dieksekusi!
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300">
                        {activeFieldsCount} kolom instansi telah diisi secara akurat dari data profil {currentProfile.name}.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadExtension}
                    className="px-4 py-2 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white font-bold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    Pasang di Browser Anda →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ================= RIGHT: DOCKED GOVCONNECT EXTENSION SIDEPANEL (4-5 Cols) ================= */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-[#131C2E] border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              {/* Sidepanel Header */}
              <div className="h-14 px-4 bg-[#0A4174] dark:bg-[#001D39] text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2.5">
                  <img
                    src={theme === 'dark' ? logoDark : logoLight}
                    alt="GovConnect"
                    className="w-6 h-6 object-contain shrink-0"
                  />
                  <div>
                    <div className="font-extrabold text-xs tracking-tight">GovConnect Assistant</div>
                    <div className="text-[10px] text-sky-200">Ekstensi Pengisian Formulir</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-sky-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[11px] font-bold">Siaga Aktif</span>
                </div>
              </div>

              {/* Status URL Bar */}
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span className="truncate font-mono">🌐 {new URL(currentService.url).hostname}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">100% Cocok</span>
              </div>

              {/* Summary Detection Banner */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-3.5 bg-blue-50/90 dark:bg-blue-950/50 rounded-2xl border border-blue-200/80 dark:border-blue-800 flex items-center justify-between">
                  <div>
                    <div className="font-black text-xs text-slate-900 dark:text-white">
                      {currentService.fields.length} Kolom Terdeteksi
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Cocok dengan data profil: <strong>{currentProfile.name.split(' ')[0]}</strong>
                    </div>
                  </div>
                  <span className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    ⚡
                  </span>
                </div>
              </div>

              {/* Interactive Field Checklist inside Extension */}
              <div className="p-4 space-y-2 max-h-[340px] overflow-y-auto text-xs">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Kolom Siap Diisi:</span>
                  <span>{activeFieldsCount} dari {currentService.fields.length} dipilih</span>
                </div>

                {currentService.fields.map(field => {
                  const isChecked = selectedFieldKeys[field.valueKey] !== false;
                  return (
                    <label
                      key={field.id}
                      onClick={() => toggleField(field.valueKey)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all select-none ${
                        isChecked
                          ? 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                          : 'bg-transparent border-slate-200/50 dark:border-slate-800 opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-200">
                          {field.label}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                        Cocok
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Sidepanel Bottom Sticky Action */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
              <button
                onClick={handleAutofill}
                disabled={isFilling}
                className="group w-full py-3.5 px-4 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white text-xs sm:text-sm font-bold transition-all duration-300 ease-out shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isFilling ? (
                  <>
                    <FontAwesome name="spinner" spin className="text-sm" />
                    <span>Mengeksekusi Autofill...</span>
                  </>
                ) : (
                  <>
                    <FontAwesome
                      name="caret-right"
                      className="text-sm text-sky-300 transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:scale-110"
                    />
                    <span>Isi {activeFieldsCount} Kolom Formulir (1 Klik)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

