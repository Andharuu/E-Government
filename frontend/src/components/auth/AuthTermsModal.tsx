import { FontAwesome } from '../ui';

interface AuthTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function AuthTermsModal({ isOpen, onClose, onAccept }: AuthTermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#131C2E] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[88vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <FontAwesome name="cross-small" className="text-base" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 shrink-0 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-[#0A4174] dark:text-sky-400 flex items-center justify-center text-xl shrink-0">
            <FontAwesome name="file-lines" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Syarat, Ketentuan & Kebijakan Privasi
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Landasan Regulasi & Panduan Pemrosesan Data Kependudukan Digital
            </span>
          </div>
        </div>

        {/* Scrollable Rich Legal Content */}
        <div className="overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pr-2 flex-1">
          {/* Section 1: Landasan Hukum */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mb-2 flex items-center gap-2">
              <FontAwesome name="landmark" className="text-blue-600 dark:text-sky-400 text-xs" />
              <span>1. Landasan Hukum & Kepatuhan Regulasi Nasional</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Sistem GovConnect beroperasi tunduk pada ketentuan peraturan perundang-undangan Republik Indonesia:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <strong>Undang-Undang No. 27 Tahun 2022</strong> tentang Pelindungan Data Pribadi (UU PDP) pasal 20 s.d. pasal 28 terkait kewajiban pengendali data pribadi.
              </li>
              <li>
                <strong>Undang-Undang No. 24 Tahun 2013 jo. UU No. 23 Tahun 2006</strong> tentang Administrasi Kependudukan (UU Adminduk) mengenai validitas NIK dan identitas resmi warga.
              </li>
              <li>
                <strong>Undang-Undang No. 1 Tahun 2024</strong> tentang Perubahan Kedua UU ITE No. 11 Tahun 2008 mengenai keamanan sistem elektronik dan otentikasi data.
              </li>
              <li>
                <strong>Peraturan Pemerintah No. 71 Tahun 2019</strong> tentang Penyelenggaraan Sistem dan Transaksi Elektronik (PP PSTE).
              </li>
            </ul>
          </div>

          {/* Section 2: Kebutuhan Sistem akan Data Pengguna */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mb-2 flex items-center gap-2">
              <FontAwesome name="id-card" className="text-blue-600 dark:text-sky-400 text-xs" />
              <span>2. Klasifikasi & Alasan Kebutuhan Data Pengguna</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
              Untuk mengotomatisasi pengisian formulir instansi pemerintah secara akurat, sistem memetakan atribut kependudukan berikut:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">A. Data Kependudukan Utama (KTP & KK)</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed block mt-0.5">
                  Nomor Induk Kependudukan (NIK 16 digit), Nomor Kartu Keluarga (KK), Nama Lengkap sesuai KTP, Tempat dan Tanggal Lahir, Jenis Kelamin, serta Alamat Domisili KTP lengkap (Jalan, RT/RW, Kelurahan, Kecamatan, Kabupaten/Kota, Provinsi, Kode Pos).
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-900 dark:text-white block">B. Data Kontak & Administrasi Pelengkap</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed block mt-0.5">
                  Nomor WhatsApp/Telepon aktif dan Alamat Email resmi pemohon untuk notifikasi dan verifikasi instansi. Nomor BPJS Kesehatan/Ketenagakerjaan dan Nomor Mahasiswa (NIM) untuk formulir beasiswa/bansos.
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Mekanisme Enkripsi & Zero Third-Party Tracker */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mb-2 flex items-center gap-2">
              <FontAwesome name="shield-halved" className="text-blue-600 dark:text-sky-400 text-xs" />
              <span>3. Keamanan, Enkripsi Lokal & Privasi Warga</span>
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <strong>Enkripsi Tingkat Tinggi:</strong> Seluruh data kependudukan diproteksi enkripsi berbasis peramban lokal dan token JWT bersandi kuat.
              </li>
              <li>
                <strong>Otorisasi Eksplisit 1-Klik:</strong> Ekstensi GovConnect tidak pernah mengisi atau mengirim data secara diam-diam. Eksekusi pengisian hanya terjadi saat warga menekan tombol konfirmasi.
              </li>
              <li>
                <strong>Nir-Pihak Ketiga (Zero Third-Party):</strong> Kami tidak menjual, menyewakan, atau membagikan data identitas warga kepada pihak ketiga, analitik periklanan, atau pengiklan komersial mana pun.
              </li>
            </ul>
          </div>

          {/* Section 4: Hak Subjek Data */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mb-2 flex items-center gap-2">
              <FontAwesome name="user-check" className="text-blue-600 dark:text-sky-400 text-xs" />
              <span>4. Hak Subjek Data (Warga) & Penghapusan Akun</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Sesuai UU PDP No. 27/2022 Pasal 5 s.d. 12, warga memiliki hak penuh untuk mengakses riwayat data, memperbarui data profil, mencabut persetujuan, serta mengajukan penghapusan akun beserta seluruh data kependudukan terkait secara permanen dari basis data GovConnect kapan saja melalui menu Pengaturan.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-400 hidden sm:inline-block">
            Terakhir diperbarui: 2026 • Hak Cipta GovConnect Indonesia
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={onAccept}
              className="px-5 py-2.5 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Saya Mengerti & Menyetujui
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

