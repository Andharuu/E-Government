import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FontAwesome, Button } from '../components/ui';

interface Step {
  icon: string;
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  accent: 'accent' | 'ok' | 'warn';
}

const USER_STEPS: Step[] = [
  {
    icon: 'handshake',
    eyebrow: 'Selamat datang',
    title: 'Satu profil, semua formulir',
    body: 'GovConnect menyimpan data kependudukan Anda satu kali, lalu memakainya untuk mengisi formulir instansi mana pun — tanpa mengetik ulang.',
    points: [
      'Data disimpan terenkripsi di akun Anda',
      'NIK & KK tidak pernah dibagikan ke pihak ketiga',
      'Anda yang memutuskan kapan data diisi',
    ],
    accent: 'accent',
  },
  {
    icon: 'id-card',
    eyebrow: 'Langkah 1',
    title: 'Lengkapi profil kependudukan',
    body: 'Buka menu Profil dan isi identitas, alamat, kontak, serta dokumen. Semakin lengkap profil, semakin banyak kolom formulir yang bisa terisi otomatis.',
    points: [
      'Identitas: NIK, nama, tempat & tanggal lahir',
      'Alamat & kontak: domisili, HP, email',
      'Dokumen: foto KTP, KK, pasfoto',
      'Bisa ditambah kolom kustom sendiri',
    ],
    accent: 'accent',
  },
  {
    icon: 'chrome',
    eyebrow: 'Langkah 2',
    title: 'Pasang ekstensi & sambungkan',
    body: 'Unduh ekstensi dari halaman ini, pasang di Chrome/Edge/Brave, lalu masuk dengan akun yang sama. Status sambungan terlihat di dasbor.',
    points: [
      'Unduh → ekstrak → Load unpacked di chrome://extensions',
      'Login sekali, sesi tersinkron otomatis',
      'Panel asisten muncul di sisi kanan browser',
    ],
    accent: 'ok',
  },
  {
    icon: 'bolt',
    eyebrow: 'Langkah 3',
    title: 'Isi formulir dalam satu klik',
    body: 'Saat membuka situs instansi, ekstensi mendeteksi kolom lalu mencocokkannya dengan profil Anda. Tinjau hasilnya, baru tekan isi.',
    points: [
      'Deteksi kolom berjalan lokal di browser',
      'Anda bisa memilih kolom mana yang diisi',
      'Setiap pengisian tercatat di Riwayat Aktivitas',
    ],
    accent: 'accent',
  },
  {
    icon: 'circle-check',
    eyebrow: 'Siap',
    title: 'Semuanya tersambung',
    body: 'Profil di web, ekstensi di browser, dan riwayat aktivitas memakai akun yang sama. Mulai dari melengkapi profil, lalu coba simulator.',
    points: [
      'Coba simulator untuk melihat alurnya',
      'Pantau aktivitas autofill kapan saja',
      'Ubah atau hapus data dari menu Pengaturan',
    ],
    accent: 'ok',
  },
];

const ADMIN_STEPS: Step[] = [
  {
    icon: 'shield-halved',
    eyebrow: 'Panel admin',
    title: 'Anda masuk sebagai administrator',
    body: 'Akun admin tidak memakai dasbor pengguna. Semua pekerjaan operasional ada di panel ini: pengaduan, pengguna, audit, dan pengumuman.',
    points: [
      'Ringkasan: statistik & tren pengaduan',
      'Pengaduan: tinjau, ubah status, beri tanggapan',
      'Pengguna: kelola akun tanpa melihat data pribadi',
      'Audit Log: jejak setiap aksi admin',
    ],
    accent: 'accent',
  },
  {
    icon: 'comments',
    eyebrow: 'Alur kerja',
    title: 'Pengaduan masuk secara langsung',
    body: 'Pengaduan dari pengguna dan laporan keamanan ekstensi masuk ke antrean yang sama. Panel ringkasan memperbarui diri secara berkala.',
    points: [
      'Filter berdasarkan status, prioritas, dan jenis',
      'Tandai selesai dengan tanggapan tertulis',
      'Ekspor CSV untuk pelaporan',
    ],
    accent: 'warn',
  },
  {
    icon: 'users',
    eyebrow: 'Privasi',
    title: 'Data pribadi tidak pernah tampil',
    body: 'Panel admin sengaja hanya menampilkan email, status akun, jumlah pengaduan, dan persentase kelengkapan profil. NIK, alamat, dan dokumen tidak dapat diakses admin.',
    points: [
      'Akses PII tercatat di audit log',
      'Nonaktifkan akun tanpa menghapus data',
      'Semua aksi tercatat dengan waktu & IP',
    ],
    accent: 'ok',
  },
  {
    icon: 'bullhorn',
    eyebrow: 'Komunikasi',
    title: 'Umumkan ke semua pengguna',
    body: 'Gunakan menu Pengumuman untuk mengirim pemberitahuan sistem. Pengguna melihatnya di panel notifikasi dan dasbor.',
    points: [
      'Empat tipe: info, peringatan, pemeliharaan, fitur baru',
      'Pratinjau sebelum dikirim',
      'Tersimpan sebagai notifikasi pengguna',
    ],
    accent: 'accent',
  },
];

const ACCENT_CLASS: Record<Step['accent'], string> = {
  accent: 'bg-accent-soft text-accent-text border-accent-line',
  ok: 'bg-ok-soft text-ok border-ok-line',
  warn: 'bg-warn-soft text-warn border-warn-line',
};

export function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = !!user?.is_admin;
  const steps = useMemo(() => (isAdmin ? ADMIN_STEPS : USER_STEPS), [isAdmin]);
  const [index, setIndex] = useState(0);

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const target = isAdmin ? '/admin' : '/dashboard';

  const finish = () => {
    try {
      if (user?.email) {
        localStorage.setItem(`govconnect_onboarded:${user.email}`, '1');
      }
    } catch {}
    navigate(target, { replace: true });
  };

  const next = () => (isLast ? finish() : setIndex((i) => Math.min(i + 1, steps.length - 1)));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isLast]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[560px]">
        {/* Progres */}
        <div className="flex items-center gap-1.5 mb-5">
          {steps.map((s, i) => (
            <span
              key={s.title}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= index ? 'bg-accent' : 'bg-surface-3'
              }`}
            />
          ))}
        </div>

        <div className="card overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <span
                className={`w-11 h-11 rounded-lg border flex items-center justify-center shrink-0 text-[17px] ${ACCENT_CLASS[step.accent]}`}
                key={step.icon}
              >
                <FontAwesome name={step.icon} />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3 pt-1.5">
                {index + 1} / {steps.length}
              </span>
            </div>

            <div key={step.title} className="page-enter">
              <p className="eyebrow mb-1.5">{step.eyebrow}</p>
              <h1 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.03em] text-ink leading-tight">
                {step.title}
              </h1>
              <p className="text-[13px] text-ink-2 leading-relaxed mt-2.5">{step.body}</p>

              <ul className="mt-5 space-y-2.5">
                {step.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[12.5px] text-ink-2">
                    <FontAwesome name="check-circle" className="text-ok text-[10px] mt-1 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-4 border-t border-line bg-surface-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={finish}
              className="text-[12px] font-medium text-ink-3 hover:text-ink transition-colors"
            >
              Lewati tur
            </button>

            <div className="flex items-center gap-2">
              {index > 0 && (
                <Button variant="secondary" size="sm" onClick={back} icon={<FontAwesome name="arrow-left" className="text-[10px]" />}>
                  Kembali
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={next}
                icon={isLast ? <FontAwesome name="check-pure" className="text-[10px]" /> : undefined}
              >
                {isLast ? (isAdmin ? 'Buka panel admin' : 'Mulai pakai GovConnect') : 'Lanjut'}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-ink-3 mt-4">
          Tekan <kbd className="px-1 py-0.5 rounded border border-line bg-surface text-[10px]">→</kbd> untuk
          lanjut, <kbd className="px-1 py-0.5 rounded border border-line bg-surface text-[10px]">Esc</kbd> untuk
          menutup.
        </p>
      </div>
    </div>
  );
}

export default Onboarding;