import { FontAwesome } from '../ui';

export function AuthShowcasePreview() {
  return (
    <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-8 xl:p-12 relative bg-[#F1F6FA] dark:bg-[#070D18] text-slate-800 dark:text-white border-l border-slate-200/80 dark:border-slate-800/80 overflow-hidden select-none transition-colors duration-300">
      {/* Background Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 dark:opacity-25 pointer-events-none" />

      {/* Ambient Gradient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-200/60 via-sky-200/40 to-indigo-100/40 dark:from-blue-600/15 dark:via-[#0A4174]/20 dark:to-sky-400/20 rounded-full blur-3xl pointer-events-none -z-0 transition-all duration-300" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-200/40 dark:bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Main Showcase Window Container with Floating Cards */}
      <div className="relative z-10 w-full max-w-[620px] xl:max-w-[660px]">
        {/* FLOATING CARD 1: TOP LEFT (Kecepatan Isi) */}
        <div className="absolute -left-8 -top-6 z-20 animate-float-slow">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xl shadow-slate-300/40 dark:shadow-2xl max-w-[190px] text-left transition-colors duration-300">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-center text-xs font-bold shadow-2xs">
                ⚡
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Kecepatan Isi
              </span>
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              0.3 Detik
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              vs 4m 30s ketik manual di formulir dinas
            </p>
          </div>
        </div>

        {/* FLOATING CARD 2: TOP RIGHT (Data Terenkripsi) */}
        <div className="absolute -right-6 -top-4 z-20 animate-float-delayed">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xl shadow-slate-300/40 dark:shadow-2xl max-w-[200px] text-left transition-colors duration-300">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-[#0A4174] dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/50 flex items-center justify-center text-xs shadow-2xs">
                <FontAwesome name="shield-check" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0A4174] dark:text-blue-400">
                Data Terenkripsi
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              Brankas Kependudukan
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <FontAwesome name="circle-check" className="text-[9px]" />
              NIK & KK Terverifikasi
            </p>
          </div>
        </div>

        {/* FLOATING CARD 3: BOTTOM LEFT (25.000+ Warga) */}
        <div className="absolute -left-6 -bottom-6 z-20 animate-float-reverse">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xl shadow-slate-300/40 dark:shadow-2xl max-w-[190px] text-left transition-colors duration-300">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-amber-500 text-xs">★★★★★</span>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">4.9 / 5</span>
            </div>
            <div className="text-sm font-extrabold text-slate-900 dark:text-white">
              25.000+ Warga
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Mengisi formulir publik bebas kendala
            </p>
          </div>
        </div>

        {/* FLOATING CARD 4: BOTTOM RIGHT (Deteksi Kolom 100%) */}
        <div className="absolute -right-4 -bottom-4 z-20 animate-float-slow">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xl shadow-slate-300/40 dark:shadow-2xl max-w-[185px] text-left transition-colors duration-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Deteksi Kolom</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-transparent">
                100%
              </span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Cocok Otomatis
            </div>
            <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        {/* ================= THE CENTRAL BROWSER WINDOW MOCKUP ================= */}
        <div className="rounded-2xl xl:rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl shadow-blue-950/10 dark:shadow-2xl bg-white dark:bg-[#0B1322] overflow-hidden transition-colors duration-300">
          {/* Top Browser Bar */}
          <div className="h-10 bg-slate-100/90 dark:bg-[#09101C] border-b border-slate-200/90 dark:border-slate-800 px-3.5 flex items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block"></span>
            </div>

            {/* URL bar */}
            <div className="flex-1 max-w-sm mx-auto bg-white dark:bg-[#131C2E] border border-slate-200/90 dark:border-slate-700/70 rounded-lg px-2.5 py-1 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 font-mono truncate shadow-2xs">
              <div className="flex items-center gap-1.5 truncate">
                <FontAwesome name="lock" className="text-emerald-600 dark:text-emerald-400 text-[10px]" />
                <span className="truncate">https://layanan.dukcapil.go.id/permohonan-akta</span>
              </div>
              <div className="flex items-center gap-1 shrink-0 pl-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                <span className="text-[9px] font-bold text-[#0A4174] dark:text-sky-400">GovConnect Aktif</span>
              </div>
            </div>

            <div className="flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs transition-colors">
              <FontAwesome name="refresh" className="text-[11px]" />
            </div>
          </div>

          {/* Sub Navigation Bar inside Mockup */}
          <div className="px-4 py-2 bg-slate-50/90 dark:bg-[#0E1728] border-b border-slate-200/90 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-600/20 text-[#0A4174] dark:text-sky-300 font-bold border border-blue-200/80 dark:border-blue-500/30 flex items-center gap-1.5 text-[11px] shadow-2xs">
              <FontAwesome name="landmark" className="text-[10px]" />
              <span>Dukcapil</span>
            </span>
            <span className="px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] flex items-center gap-1.5 transition-colors">
              <FontAwesome name="building" className="text-[10px]" />
              <span>Kelurahan</span>
            </span>
            <span className="px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] flex items-center gap-1.5 transition-colors">
              <FontAwesome name="graduation-cap" className="text-[10px]" />
              <span>Beasiswa</span>
            </span>
            <span className="px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] flex items-center gap-1.5 transition-colors">
              <FontAwesome name="heart-pulse" className="text-[10px]" />
              <span>Bansos</span>
            </span>
          </div>

          {/* Split View Content: Form on Left, Extension Dock on Right */}
          <div className="grid grid-cols-12 min-h-[380px]">
            {/* Left 7 Cols: Government Form */}
            <div className="col-span-7 p-4 sm:p-5 bg-white dark:bg-[#091120]/80 border-r border-slate-200/90 dark:border-slate-800/80 flex flex-col justify-between transition-colors duration-300">
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/80 dark:border-slate-800/70">
                  <div>
                    <span className="text-[9px] font-bold text-[#0A4174] dark:text-sky-400 uppercase tracking-wider block">
                      Dinas Kependudukan & Pencatatan Sipil
                    </span>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">
                      Permohonan Akta Kelahiran & KK Baru
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 flex items-center gap-1 shrink-0">
                    <FontAwesome name="circle-check" className="text-[9px]" />
                    <span>Terisi Otomatis</span>
                  </span>
                </div>

                {/* Populated Fields */}
                <div className="grid grid-cols-2 gap-2.5 text-[10px]">
                  <div className="space-y-0.5">
                    <div className="text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between text-[9px]">
                      <span>NIK PEMOHON</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Cocok</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 text-slate-800 dark:text-white font-mono font-medium truncate shadow-2xs">
                      3525012809980003
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between text-[9px]">
                      <span>NAMA LENGKAP KTP</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Cocok</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 text-slate-800 dark:text-white font-medium truncate shadow-2xs">
                      Ahmad Pratama Putra, S.Kom
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between text-[9px]">
                      <span>NOMOR KARTU KELUARGA</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Cocok</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 text-slate-800 dark:text-white font-mono font-medium truncate shadow-2xs">
                      3525011204050001
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div className="text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between text-[9px]">
                      <span>TEMPAT / TGL LAHIR</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Cocok</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 text-slate-800 dark:text-white font-medium truncate shadow-2xs">
                      Surabaya, 28/09/1998
                    </div>
                  </div>

                  <div className="col-span-2 space-y-0.5">
                    <div className="text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between text-[9px]">
                      <span>ALAMAT DOMISILI KTP</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Cocok</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 text-slate-800 dark:text-white font-medium truncate shadow-2xs">
                      Jl. Pemuda No. 45, RT 02 / RW 03, Gresik
                    </div>
                  </div>

                  <div className="col-span-2 space-y-0.5">
                    <div className="text-slate-500 dark:text-slate-400 font-semibold flex items-center justify-between text-[9px]">
                      <span>NOMOR WHATSAPP / HP</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Cocok</span>
                    </div>
                    <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/60 text-slate-800 dark:text-white font-mono font-medium truncate shadow-2xs">
                      081234567890
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-[9px] text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
                <span>Status: Form Siap Submit</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Akurasi Validasi</span>
              </div>
            </div>

            {/* Right 5 Cols: GovConnect Docked Extension Assistant */}
            <div className="col-span-5 bg-slate-50/90 dark:bg-[#0C1526] p-3.5 flex flex-col justify-between border-l border-slate-200/60 dark:border-none transition-colors duration-300">
              <div>
                {/* Assistant Mini Header */}
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200/90 dark:border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md bg-[#0A4174] dark:bg-blue-600/30 border border-blue-600/20 dark:border-blue-400/40 flex items-center justify-center text-[10px] text-white dark:text-sky-300 font-black shadow-2xs">
                      G
                    </div>
                    <div>
                      <div className="text-[10px] font-black leading-tight text-slate-900 dark:text-white">GovConnect Assistant</div>
                      <div className="text-[8px] text-[#0A4174] dark:text-sky-300 font-semibold">Autofill Layanan Publik</div>
                    </div>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
                </div>

                {/* Detected Count */}
                <div className="p-2 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/50 mb-2 flex items-center justify-between text-[9px] shadow-2xs">
                  <div>
                    <span className="font-extrabold text-[#0A4174] dark:text-white block">6 Kolom Terdeteksi</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[8px]">100% Cocok profil warga</span>
                  </div>
                  <span className="w-5 h-5 rounded-lg bg-[#0A4174] dark:bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold shadow-2xs">
                    ⚡
                  </span>
                </div>

                {/* Checklist of 6 fields */}
                <div className="space-y-1.5 max-h-[145px] overflow-hidden text-[9px]">
                  {[
                    'Nomor Induk Kependudukan (NIK)',
                    'Nama Lengkap Sesuai KTP',
                    'Nomor Kartu Keluarga (KK)',
                    'Tempat, Tanggal Lahir',
                    'Alamat Domisili KTP',
                    'Nomor Telepon / HP',
                  ].map((field, i) => (
                    <div
                      key={i}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800/60 flex items-center justify-between text-[9px] shadow-2xs"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FontAwesome name="check-circle" className="text-emerald-500 dark:text-emerald-400 text-[9px] shrink-0" />
                        <span className="truncate font-medium text-slate-700 dark:text-slate-300">{field}</span>
                      </div>
                      <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-transparent shrink-0">
                        Cocok
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button using Caret Right */}
              <div className="pt-2">
                <div className="w-full py-2.5 px-3 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white text-[10px] font-extrabold shadow-md shadow-blue-900/20 flex items-center justify-center gap-1.5 cursor-default transition-all duration-300">
                  <FontAwesome name="caret-right" className="text-xs text-sky-300" />
                  <span>Isi Semua Kolom (6 Data)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
