import { FontAwesome } from '../ui';

/* Kolom formulir yang ditampilkan di mockup — presentasi saja */
const FORM_FIELDS: { label: string; value: string; mono?: boolean; full?: boolean }[] = [
  { label: 'NIK PEMOHON', value: '3525012809980003', mono: true },
  { label: 'NAMA LENGKAP KTP', value: 'Ahmad Pratama Putra, S.Kom' },
  { label: 'NOMOR KARTU KELUARGA', value: '3525011204050001', mono: true },
  { label: 'TEMPAT / TGL LAHIR', value: 'Surabaya, 28/09/1998' },
  { label: 'ALAMAT DOMISILI KTP', value: 'Jl. Pemuda No. 45, RT 02 / RW 03, Gresik', full: true },
  { label: 'NOMOR WHATSAPP / HP', value: '081234567890', mono: true, full: true },
];

const CHECKED_FIELDS = [
  'Nomor Induk Kependudukan (NIK)',
  'Nama Lengkap Sesuai KTP',
  'Nomor Kartu Keluarga (KK)',
  'Tempat, Tanggal Lahir',
  'Alamat Domisili KTP',
  'Nomor Telepon / HP',
];

export function AuthShowcasePreview() {
  return (
    <div className="hidden flex-1 select-none flex-col items-center justify-center overflow-hidden border-l border-line bg-canvas p-8 text-ink lg:flex xl:p-12">
      <div className="w-full max-w-[620px] xl:max-w-[660px]">
        {/* Ringkasan angka kunci */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {/* Kecepatan Isi */}
          <div className="card p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded border border-ok-line bg-ok-soft text-[10px] text-ok">
                <FontAwesome name="bolt" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ok">
                Kecepatan Isi
              </span>
            </div>
            <div className="text-[15px] font-semibold leading-tight text-ink">
              0.3 Detik
            </div>
            <p className="mt-0.5 text-[10px] leading-snug text-ink-3">
              vs 4m 30s ketik manual di formulir dinas
            </p>
          </div>

          {/* Data Terenkripsi */}
          <div className="card p-3.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <span className="flex h-6 w-6 items-center justify-center rounded border border-accent-line bg-accent-soft text-[10px] text-accent-text">
                <FontAwesome name="shield-check" />
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-accent-text">
                Data Terenkripsi
              </span>
            </div>
            <div className="text-[12px] font-semibold leading-tight text-ink">
              Brankas Kependudukan
            </div>
            <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-ok">
              <FontAwesome name="circle-check" className="text-[9px]" />
              NIK & KK Terverifikasi
            </p>
          </div>

          {/* Warga */}
          <div className="card p-3.5">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="flex items-center gap-0.5 text-[9px] text-warn">
                {[0, 1, 2, 3, 4].map(i => (
                  <FontAwesome key={i} name="star" />
                ))}
              </span>
              <span className="text-[10px] font-semibold text-ink-2">4.9 / 5</span>
            </div>
            <div className="text-[13px] font-semibold text-ink">
              25.000+ Warga
            </div>
            <p className="mt-0.5 text-[10px] leading-snug text-ink-3">
              Mengisi formulir publik bebas kendala
            </p>
          </div>

          {/* Deteksi Kolom */}
          <div className="card p-3.5">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold text-ink-2">Deteksi Kolom</span>
              <span className="badge badge-ok h-[18px] px-1.5 text-[9px]">
                100%
              </span>
            </div>
            <div className="text-[12px] font-semibold text-ink">
              Cocok Otomatis
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div className="h-1.5 w-full rounded-full bg-ok"></div>
            </div>
          </div>
        </div>

        {/* ================= THE CENTRAL BROWSER WINDOW MOCKUP ================= */}
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {/* Top Browser Bar */}
          <div className="flex h-10 select-none items-center justify-between gap-3 border-b border-line bg-surface-2 px-3.5">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-danger"></span>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-warn"></span>
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-ok"></span>
            </div>

            {/* URL bar */}
            <div className="mono mx-auto flex max-w-sm flex-1 items-center justify-between truncate rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] text-ink-2">
              <div className="flex items-center gap-1.5 truncate">
                <FontAwesome name="lock" className="text-[10px] text-ok" />
                <span className="truncate">https://layanan.dukcapil.go.id/permohonan-akta</span>
              </div>
              <div className="flex shrink-0 items-center gap-1 pl-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-ok"></span>
                <span className="text-[9px] font-semibold text-accent-text">GovConnect Aktif</span>
              </div>
            </div>

            <div className="flex items-center text-[11px] text-ink-3">
              <FontAwesome name="refresh" />
            </div>
          </div>

          {/* Sub Navigation Bar inside Mockup */}
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-line bg-surface-2 px-4 py-2 text-[11px]">
            <span className="badge badge-accent">
              <FontAwesome name="landmark" className="text-[9px]" />
              <span>Dukcapil</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-ink-3">
              <FontAwesome name="building" className="text-[10px]" />
              <span>Kelurahan</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-ink-3">
              <FontAwesome name="graduation-cap" className="text-[10px]" />
              <span>Beasiswa</span>
            </span>
            <span className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-ink-3">
              <FontAwesome name="heart-pulse" className="text-[10px]" />
              <span>Bansos</span>
            </span>
          </div>

          {/* Split View Content: Form on Left, Extension Dock on Right */}
          <div className="grid min-h-[380px] grid-cols-12">
            {/* Left 7 Cols: Government Form */}
            <div className="col-span-7 flex flex-col justify-between border-r border-line bg-surface p-4 sm:p-5">
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-line pb-3">
                  <div>
                    <span className="block text-[9px] font-semibold uppercase tracking-wider text-accent-text">
                      Dinas Kependudukan & Pencatatan Sipil
                    </span>
                    <h3 className="mt-0.5 text-[13px] font-semibold text-ink">
                      Permohonan Akta Kelahiran & KK Baru
                    </h3>
                  </div>
                  <span className="badge badge-ok h-[18px] shrink-0 px-1.5 text-[9px]">
                    <FontAwesome name="circle-check" className="text-[8px]" />
                    <span>Terisi Otomatis</span>
                  </span>
                </div>

                {/* Populated Fields */}
                <div className="grid grid-cols-2 gap-2.5 text-[10px]">
                  {FORM_FIELDS.map(field => (
                    <div key={field.label} className={`space-y-0.5 ${field.full ? 'col-span-2' : ''}`}>
                      <div className="flex items-center justify-between text-[9px] font-medium text-ink-3">
                        <span>{field.label}</span>
                        <span className="flex items-center gap-1 font-semibold text-ok">
                          <FontAwesome name="check" className="text-[8px]" />
                          Cocok
                        </span>
                      </div>
                      <div
                        className={`truncate rounded-md border border-ok-line bg-ok-soft px-2.5 py-1.5 text-ink ${
                          field.mono ? 'mono' : 'font-medium'
                        }`}
                      >
                        {field.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mono flex items-center justify-between pt-2 text-[9px] text-ink-3">
                <span>Status: Form Siap Submit</span>
                <span className="font-semibold text-ok">100% Akurasi Validasi</span>
              </div>
            </div>

            {/* Right 5 Cols: GovConnect Docked Extension Assistant */}
            <div className="col-span-5 flex flex-col justify-between border-l border-line bg-surface-2 p-3.5">
              <div>
                {/* Assistant Mini Header */}
                <div className="mb-2.5 flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-accent-line bg-accent text-[9px] font-semibold text-accent-fg">
                      G
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold leading-tight text-ink">GovConnect Assistant</div>
                      <div className="text-[9px] font-medium text-accent-text">Autofill Layanan Publik</div>
                    </div>
                  </div>
                  <span className="dot bg-ok"></span>
                </div>

                {/* Detected Count */}
                <div className="mb-2 flex items-center justify-between rounded-md border border-accent-line bg-accent-soft p-2 text-[9px]">
                  <div>
                    <span className="block font-semibold text-accent-text">6 Kolom Terdeteksi</span>
                    <span className="text-[8px] text-ink-3">100% Cocok profil warga</span>
                  </div>
                  <span className="flex h-5 w-5 items-center justify-center rounded border border-accent-line bg-accent text-[9px] text-accent-fg">
                    <FontAwesome name="bolt" />
                  </span>
                </div>

                {/* Checklist of 6 fields */}
                <div className="max-h-[145px] space-y-1.5 overflow-hidden text-[9px]">
                  {CHECKED_FIELDS.map((field, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded border border-line bg-surface p-1.5 text-[9px]"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FontAwesome name="check-circle" className="shrink-0 text-[9px] text-ok" />
                        <span className="truncate font-medium text-ink-2">{field}</span>
                      </div>
                      <span className="shrink-0 rounded border border-ok-line bg-ok-soft px-1 py-0.5 text-[8px] font-semibold text-ok">
                        Cocok
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button using Caret Right */}
              <div className="pt-2">
                <div className="flex w-full cursor-default items-center justify-center gap-1.5 rounded-md bg-accent px-3 py-2.5 text-[10px] font-semibold text-accent-fg">
                  <FontAwesome name="caret-right" className="text-[10px] text-accent-fg/80" />
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
