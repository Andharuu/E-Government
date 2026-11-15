import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, FontAwesome } from '../components/ui';
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

  // Alur simulasi: dua langkah pertama selalu punya nilai awal, langkah ketiga mengikuti eksekusi
  const steps: { label: string; state: 'done' | 'active' }[] = [
    { label: 'Pilih layanan', state: 'done' },
    { label: 'Pilih profil warga', state: 'done' },
    { label: 'Isi otomatis', state: isFilled ? 'done' : 'active' },
  ];
  const completedSteps = steps.filter(step => step.state === 'done').length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {/* ================= 1. TOPBAR ================= */}
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt=""
              className="h-8 w-8 shrink-0 object-contain"
            />
            <span className="truncate text-[15px] font-bold tracking-[-0.02em] text-ink">GovConnect</span>
            <span className="badge badge-neutral hidden shrink-0 sm:inline-flex">Simulator Ekstensi</span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link to="/" className="btn btn-ghost btn-sm hidden md:inline-flex">
              <FontAwesome name="arrow-left" className="text-[11px]" />
              <span>Beranda</span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon btn-sm text-ink-2"
              title={theme === 'dark' ? 'Beralih ke mode terang (Light mode)' : 'Beralih ke mode gelap (Dark mode)'}
              aria-label="Toggle mode gelap atau terang"
            >
              <FontAwesome name={theme === 'dark' ? 'sun' : 'moon'} className="text-[13px]" />
            </button>

            {user ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/dashboard')}
                icon={<FontAwesome name="user" className="text-[11px]" />}
              >
                Dashboard
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
                icon={<FontAwesome name="right-to-bracket" className="text-[11px]" />}
              >
                Masuk
              </Button>
            )}

            <Button
              size="sm"
              onClick={handleDownloadExtension}
              icon={<FontAwesome name="download" className="text-[11px]" />}
              title="Unduh file ekstensi zip"
            >
              Pasang Ekstensi
            </Button>
          </div>
        </div>
      </header>

      {/* ================= 2. PEMILIH LAYANAN & PROFIL ================= */}
      <div className="border-b border-line bg-surface-2">
        <div className="mx-auto flex w-full max-w-[1500px] flex-col justify-between gap-2.5 px-4 py-2.5 sm:px-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
            <span className="eyebrow shrink-0">Layanan</span>
            <div className="segmented">
              {[
                { id: 'dukcapil', label: 'Dukcapil', icon: 'landmark' },
                { id: 'kelurahan', label: 'Kelurahan', icon: 'building' },
                { id: 'beasiswa', label: 'Beasiswa', icon: 'graduation-cap' },
                { id: 'bpjs', label: 'BPJS Kesehatan', icon: 'heart-pulse' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  data-active={selectedServiceId === tab.id}
                  onClick={() => {
                    setSelectedServiceId(tab.id);
                    handleReset();
                  }}
                  className="segmented-item"
                >
                  <FontAwesome
                    name={tab.icon}
                    className={`text-[11px] ${selectedServiceId === tab.id ? 'text-accent-text' : 'text-ink-3'}`}
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2.5 lg:justify-end">
            <span className="eyebrow shrink-0">Profil</span>
            <div className="segmented">
              {(['budi', 'siti', 'joko'] as const).map(pKey => (
                <button
                  key={pKey}
                  type="button"
                  data-active={selectedProfileId === pKey}
                  onClick={() => {
                    setSelectedProfileId(pKey);
                    handleReset();
                  }}
                  className="segmented-item"
                >
                  {pKey === 'budi' ? 'Ahmad (Pekerja)' : pKey === 'siti' ? 'Siti (Mahasiswi)' : 'H. Joko (Wiraswasta)'}
                </button>
              ))}
            </div>

            {isFilled && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                icon={<FontAwesome name="undo" className="text-[11px]" />}
                className="shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ================= 3. KONTEN ================= */}
      <main className="flex w-full flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-4 px-4 py-5 sm:px-6 lg:min-h-0">
          {/* Progres alur */}
          <section className="card card-flat flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <ol className="flex flex-wrap items-center gap-2 sm:gap-3">
              {steps.map((step, index) => (
                <li key={step.label} className="flex items-center gap-2">
                  <span
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold tabular-nums ${
                      step.state === 'done'
                        ? 'border-accent bg-accent text-accent-fg'
                        : 'border-accent bg-surface text-accent-text'
                    }`}
                  >
                    {step.state === 'done' ? <FontAwesome name="check-pure" className="text-[7px]" /> : index + 1}
                  </span>
                  <span
                    className={`text-[12px] ${
                      step.state === 'done' ? 'text-ink-2' : 'font-semibold text-ink'
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < steps.length - 1 && <span className="ml-1 h-px w-4 bg-line sm:w-6" />}
                </li>
              ))}
            </ol>

            <div className="flex w-full items-center gap-2.5 sm:w-[220px]">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-accent transition-[width] duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="shrink-0 text-[11px] font-medium tabular-nums text-ink-3">
                {completedSteps}/{steps.length}
              </span>
            </div>
          </section>

          {/* Split: formulir instansi + panel ekstensi */}
          <div className="card grid grid-cols-1 overflow-hidden lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)]">
            {/* ---------- KIRI: FORMULIR INSTANSI SIMULASI ---------- */}
            <div className="flex min-w-0 flex-col border-b border-line lg:col-span-7 lg:min-h-0 lg:border-b-0 xl:col-span-8">
              {/* Chrome bar */}
              <div className="flex h-10 items-center gap-3 border-b border-line bg-surface-2 px-3 select-none">
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
                  <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
                  <span className="h-2.5 w-2.5 rounded-full bg-line-2" />
                </div>
                <div className="mx-auto flex h-7 w-full max-w-[420px] items-center gap-2 rounded-md border border-line bg-surface px-2.5">
                  <FontAwesome name="lock" className="shrink-0 text-[9px] text-ok" />
                  <span className="mono truncate text-[11px] text-ink-3">{currentService.url}</span>
                </div>
                <FontAwesome name="rotate-right" className="shrink-0 text-[11px] text-ink-3" />
              </div>

              {/* Isi formulir */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-canvas p-5 sm:p-7">
                <div className="mb-6 flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="eyebrow">{currentService.agency}</p>
                    <h1 className="mt-1.5 text-[18px] font-bold leading-snug tracking-[-0.02em] text-ink sm:text-[20px]">
                      {currentService.name}
                    </h1>
                  </div>

                  {isFilled ? (
                    <span className="badge badge-ok shrink-0 self-start">
                      <FontAwesome name="circle-check" className="text-[10px]" />
                      Terisi otomatis dalam {fillTime}s
                    </span>
                  ) : (
                    <span className="badge badge-neutral shrink-0 self-start">
                      <span className="dot animate-pulse" />
                      Menunggu pengisian ekstensi
                    </span>
                  )}
                </div>

                {/* Kolom formulir */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {currentService.fields.map(field => {
                    const shouldFill = isFilled && selectedFieldKeys[field.valueKey] !== false;
                    const profileVal = (currentProfile as Record<string, string>)[field.valueKey] || '';
                    const isFullWidth = field.valueKey === 'alamat';

                    return (
                      <div key={field.id} className={isFullWidth ? 'sm:col-span-2' : ''}>
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <label htmlFor={field.id} className="text-[11.5px] font-semibold text-ink-2">
                            {field.label}
                          </label>
                          {shouldFill && (
                            <span className="flex shrink-0 items-center gap-1 text-[10.5px] font-semibold text-ok">
                              <FontAwesome name="check-pure" className="text-[8px]" />
                              Cocok
                            </span>
                          )}
                        </div>
                        <input
                          id={field.id}
                          type="text"
                          readOnly
                          value={shouldFill ? profileVal : ''}
                          placeholder={field.placeholder}
                          className={`input ${
                            shouldFill
                              ? 'border-ok-line bg-ok-soft font-medium text-ink'
                              : 'bg-surface-2 text-ink-3'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Hasil autofill */}
                {isFilled && (
                  <div className="mt-6 flex flex-col gap-3 rounded-lg border border-ok-line bg-ok-soft p-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5">
                      <FontAwesome name="circle-check" className="mt-[1px] shrink-0 text-[15px] text-ok" />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-ink">Autofill Berhasil Dieksekusi</p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-2">
                          {activeFieldsCount} kolom instansi telah diisi secara akurat dari data profil{' '}
                          {currentProfile.name}.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDownloadExtension}
                      icon={<FontAwesome name="arrow-right" className="text-[11px]" />}
                      className="shrink-0"
                    >
                      Pasang di Browser Anda
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* ---------- KANAN: PANEL EKSTENSI ---------- */}
            <aside className="flex min-w-0 flex-col border-line bg-surface lg:col-span-5 lg:min-h-0 lg:border-l xl:col-span-4">
              {/* Header panel */}
              <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface-2 px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <img
                    src={theme === 'dark' ? logoDark : logoLight}
                    alt=""
                    className="h-6 w-6 shrink-0 object-contain"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-semibold leading-tight text-ink">
                      GovConnect Assistant
                    </p>
                    <p className="mt-0.5 truncate text-[10.5px] leading-tight text-ink-3">
                      Ekstensi Pengisian Formulir
                    </p>
                  </div>
                </div>
                <span className="badge badge-ok shrink-0">
                  <span className="dot" />
                  Siaga Aktif
                </span>
              </div>

              {/* Host aktif */}
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-2">
                <span className="mono truncate text-[11px] text-ink-3">
                  {new URL(currentService.url).hostname}
                </span>
                <span className="shrink-0 text-[11px] font-semibold text-ok">100% Cocok</span>
              </div>

              {/* Ringkasan deteksi */}
              <div className="shrink-0 border-b border-line p-3.5">
                <div className="rounded-md border border-line bg-surface-2 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12.5px] font-semibold text-ink">
                      {currentService.fields.length} Kolom Terdeteksi
                    </p>
                    <FontAwesome name="bolt" className="shrink-0 text-[11px] text-accent-text" />
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
                    Cocok dengan data profil:{' '}
                    <span className="font-semibold text-ink-2">{currentProfile.name.split(' ')[0]}</span>
                  </p>
                </div>
              </div>

              {/* Checklist kolom */}
              <div className="min-h-0 flex-1 overflow-y-auto p-3">
                <div className="mb-2 flex items-center justify-between gap-2 px-1">
                  <span className="eyebrow">Kolom Siap Diisi</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-ink-3">
                    {activeFieldsCount} dari {currentService.fields.length} dipilih
                  </span>
                </div>

                <div className="space-y-1">
                  {currentService.fields.map(field => {
                    const isChecked = selectedFieldKeys[field.valueKey] !== false;
                    return (
                      <label
                        key={field.id}
                        onClick={() => toggleField(field.valueKey)}
                        className={`flex cursor-pointer select-none items-center justify-between gap-2 rounded-md border px-2.5 py-2 transition-colors ${
                          isChecked
                            ? 'border-line bg-surface-2 hover:border-line-2'
                            : 'border-transparent opacity-60'
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded accent-accent"
                          />
                          <span className="truncate text-[12px] font-medium text-ink-2">{field.label}</span>
                        </span>
                        <span
                          className={`shrink-0 text-[10.5px] font-semibold ${
                            isChecked ? 'text-ok' : 'text-ink-3'
                          }`}
                        >
                          {isChecked ? 'Cocok' : 'Lewati'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Aksi utama */}
              <div className="shrink-0 border-t border-line bg-surface-2 p-3">
                <Button
                  onClick={handleAutofill}
                  disabled={isFilling}
                  loading={isFilling}
                  className="w-full"
                  icon={!isFilling && <FontAwesome name="bolt" className="text-[11px]" />}
                >
                  {isFilling
                    ? 'Mengeksekusi Autofill...'
                    : `Isi ${activeFieldsCount} Kolom Formulir (1 Klik)`}
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
