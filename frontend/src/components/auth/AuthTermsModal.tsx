import { createPortal } from 'react-dom';
import { FontAwesome } from '../ui';

interface AuthTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function AuthTermsModal({ isOpen, onClose, onAccept }: AuthTermsModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 dark:bg-[#030d18]/65 backdrop-blur-[3px] p-4 animate-fadeIn">
      <div className="card page-enter relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn btn-ghost btn-icon btn-sm absolute right-3 top-3 z-10 text-ink-3"
          aria-label="Tutup"
        >
          <FontAwesome name="cross-small" className="text-[12px]" />
        </button>

        {/* Modal Header */}
        <div className="card-head shrink-0 pr-12">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-accent-text">
              <FontAwesome name="file-lines" className="text-[13px]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-ink">
                Syarat, Ketentuan & Kebijakan Privasi
              </h3>
              <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-3">
                Landasan Regulasi & Panduan Pemrosesan Data Kependudukan Digital
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Rich Legal Content */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 text-[12.5px] leading-relaxed text-ink-2">
          {/* Section 1: Landasan Hukum */}
          <div className="rounded-md border border-line bg-surface-2 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
              <FontAwesome name="landmark" className="text-[11px] text-accent-text" />
              <span>1. Landasan Hukum & Kepatuhan Regulasi Nasional</span>
            </h4>
            <p className="mb-2 text-[12.5px] leading-relaxed text-ink-2">
              Sistem GovConnect beroperasi tunduk pada ketentuan peraturan perundang-undangan Republik Indonesia:
            </p>
            <ul className="list-inside list-disc space-y-1.5 text-[12.5px] text-ink-2">
              <li>
                <strong className="font-semibold text-ink">Undang-Undang No. 27 Tahun 2022</strong> tentang Pelindungan Data Pribadi (UU PDP) pasal 20 s.d. pasal 28 terkait kewajiban pengendali data pribadi.
              </li>
              <li>
                <strong className="font-semibold text-ink">Undang-Undang No. 24 Tahun 2013 jo. UU No. 23 Tahun 2006</strong> tentang Administrasi Kependudukan (UU Adminduk) mengenai validitas NIK dan identitas resmi pengguna.
              </li>
              <li>
                <strong className="font-semibold text-ink">Undang-Undang No. 1 Tahun 2024</strong> tentang Perubahan Kedua UU ITE No. 11 Tahun 2008 mengenai keamanan sistem elektronik dan otentikasi data.
              </li>
              <li>
                <strong className="font-semibold text-ink">Peraturan Pemerintah No. 71 Tahun 2019</strong> tentang Penyelenggaraan Sistem dan Transaksi Elektronik (PP PSTE).
              </li>
            </ul>
          </div>

          {/* Section 2: Kebutuhan Sistem akan Data Pengguna */}
          <div className="rounded-md border border-line bg-surface-2 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
              <FontAwesome name="id-card" className="text-[11px] text-accent-text" />
              <span>2. Klasifikasi & Alasan Kebutuhan Data Pengguna</span>
            </h4>
            <p className="mb-2 text-[12.5px] leading-relaxed text-ink-2">
              Untuk mengotomatisasi pengisian formulir instansi pemerintah secara akurat, sistem memetakan atribut kependudukan berikut:
            </p>
            <div className="space-y-2 text-[12px]">
              <div className="rounded-md border border-line bg-surface p-2.5">
                <span className="block font-semibold text-ink">A. Data Kependudukan Utama (KTP & KK)</span>
                <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink-3">
                  Nomor Induk Kependudukan (NIK 16 digit), Nomor Kartu Keluarga (KK), Nama Lengkap sesuai KTP, Tempat dan Tanggal Lahir, Jenis Kelamin, serta Alamat Domisili KTP lengkap (Jalan, RT/RW, Kelurahan, Kecamatan, Kabupaten/Kota, Provinsi, Kode Pos).
                </span>
              </div>
              <div className="rounded-md border border-line bg-surface p-2.5">
                <span className="block font-semibold text-ink">B. Data Kontak & Administrasi Pelengkap</span>
                <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink-3">
                  Nomor WhatsApp/Telepon aktif dan Alamat Email resmi pemohon untuk notifikasi dan verifikasi instansi. Nomor BPJS Kesehatan/Ketenagakerjaan dan Nomor Mahasiswa (NIM) untuk formulir beasiswa/bansos.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Mekanisme Enkripsi & Zero Third-Party Tracker */}
          <div className="rounded-md border border-line bg-surface-2 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
              <FontAwesome name="shield-halved" className="text-[11px] text-accent-text" />
              <span>3. Keamanan, Enkripsi Lokal & Privasi Pengguna</span>
            </h4>
            <ul className="list-inside list-disc space-y-1.5 text-[12.5px] text-ink-2">
              <li>
                <strong className="font-semibold text-ink">Enkripsi Tingkat Tinggi:</strong> Seluruh data kependudukan diproteksi enkripsi berbasis peramban lokal dan token JWT bersandi kuat.
              </li>
              <li>
                <strong className="font-semibold text-ink">Otorisasi Eksplisit 1-Klik:</strong> Ekstensi GovConnect tidak pernah mengisi atau mengirim data secara diam-diam. Eksekusi pengisian hanya terjadi saat pengguna menekan tombol konfirmasi.
              </li>
              <li>
                <strong className="font-semibold text-ink">Nir-Pihak Ketiga (Zero Third-Party):</strong> Kami tidak menjual, menyewakan, atau membagikan data identitas pengguna kepada pihak ketiga, analitik periklanan, atau pengiklan komersial mana pun.
              </li>
            </ul>
          </div>

          {/* Section 4: Hak Subjek Data */}
          <div className="rounded-md border border-line bg-surface-2 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink">
              <FontAwesome name="user-check" className="text-[11px] text-accent-text" />
              <span>4. Hak Subjek Data (Pengguna) & Penghapusan Akun</span>
            </h4>
            <p className="text-[12.5px] leading-relaxed text-ink-2">
              Sesuai UU PDP No. 27/2022 Pasal 5 s.d. 12, pengguna memiliki hak penuh untuk mengakses riwayat data, memperbarui data profil, mencabut persetujuan, serta mengajukan penghapusan akun beserta seluruh data kependudukan terkait secara permanen dari basis data GovConnect kapan saja melalui menu Pengaturan.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="card-foot shrink-0">
          <span className="hidden text-[11px] text-ink-3 sm:inline-block">
            Terakhir diperbarui: 2026 • Hak Cipta GovConnect Indonesia
          </span>
          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Tutup
            </button>
            <button
              onClick={onAccept}
              className="btn btn-primary"
            >
              Saya Mengerti & Menyetujui
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
