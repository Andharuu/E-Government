import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button, FormField, Input, FontAwesome } from '../components/ui';
import { AuthHelpModal } from '../components/auth/AuthHelpModal';
import { AuthTermsModal } from '../components/auth/AuthTermsModal';
import logoDark from '../assets/logo dark.png';
import logoLight from '../assets/logo light.png';

interface AuthPageProps {
  defaultMode?: 'login' | 'register';
}

/* -------------------------------------------------------------------------
   Baris checkbox — presentasi saja, state tetap dipegang halaman
   ------------------------------------------------------------------------- */

function CheckRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex items-start gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={`mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150 ${
          checked
            ? 'border-accent bg-accent text-accent-fg'
            : 'border-line-2 bg-surface text-transparent group-hover:border-ink-3'
        }`}
      >
        <FontAwesome name="check-pure" className="text-[8px]" />
      </span>
      <span className="text-[12px] leading-relaxed text-ink-2">{children}</span>
    </label>
  );
}

export function AuthPage({ defaultMode }: AuthPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { login, register } = useAuth();

  // Determine current mode from path or prop
  const isRegister = defaultMode
    ? defaultMode === 'register'
    : location.pathname.startsWith('/register');

  // Clear errors when switching between login and register
  useEffect(() => {
    setError('');
  }, [isRegister]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('govconnect_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreedTerms) {
      setError('Harap setujui Syarat & Ketentuan serta Kebijakan Privasi GovConnect untuk melanjutkan.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);

      if (rememberMe) {
        localStorage.setItem('govconnect_remember_email', email);
      } else {
        localStorage.removeItem('govconnect_remember_email');
      }

      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal masuk ke akun';
      setError(errorMessage.includes('401') ? 'Alamat email atau kata sandi tidak sesuai' : errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok. Harap periksa kembali.');
      return;
    }

    if (password.length < 8) {
      setError('Kata sandi harus memiliki panjang minimal 8 karakter demi keamanan data Anda.');
      return;
    }

    if (!agreedTerms) {
      setError('Harap setujui Syarat & Ketentuan serta Kebijakan Privasi GovConnect untuk melanjutkan pendaftaran.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 400) {
        setError('Alamat email sudah terdaftar. Silakan masuk melalui halaman Masuk.');
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Registrasi akun gagal';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotSent(true);
    setTimeout(() => {
      setForgotSent(false);
      setShowForgotModal(false);
      setForgotEmail('');
    }, 2800);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas text-ink lg:flex-row">
      {/* ================= PANEL KIRI: EDITORIAL ================= */}
      <aside className="hidden shrink-0 flex-col justify-between border-r border-line bg-surface-2 p-10 lg:flex lg:w-[44%] xl:w-[46%] xl:p-12">
        <Link to="/" className="inline-flex w-fit items-center gap-2.5">
          <img
            src={theme === 'dark' ? logoDark : logoLight}
            alt=""
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span className="text-[15px] font-bold tracking-[-0.02em] text-ink">GovConnect</span>
        </Link>

        <div className="max-w-[420px]">
          <p className="eyebrow">Layanan publik terpadu</p>
          <h2 className="mt-3 text-[30px] font-bold leading-[1.15] tracking-[-0.03em] text-ink xl:text-[34px]">
            Satu identitas digital untuk seluruh layanan pemerintah.
          </h2>
          <p className="mt-4 text-[13.5px] leading-relaxed text-ink-2">
            Data kependudukan Anda tersimpan satu kali, lalu dipakai untuk mengisi formulir instansi mana pun
            tanpa mengetik ulang.
          </p>

          <ul className="mt-8 border-y border-line">
            {[
              {
                icon: 'id-card',
                title: 'Brankas profil kependudukan',
                desc: 'NIK, KK, dan kontak tersimpan pada satu profil terverifikasi.',
              },
              {
                icon: 'bolt',
                title: 'Pengisian formulir otomatis',
                desc: 'Satu tindakan untuk setiap kolom yang terdeteksi.',
              },
              {
                icon: 'clock',
                title: 'Riwayat pengisian',
                desc: 'Setiap eksekusi autofill tercatat dan dapat ditinjau.',
              },
            ].map((item, index) => (
              <li
                key={item.title}
                className={`flex items-start gap-3 py-3.5 ${index > 0 ? 'border-t border-line' : ''}`}
              >
                <FontAwesome name={item.icon} className="mt-0.5 shrink-0 text-[13px] text-accent-text" />
                <div>
                  <p className="text-[12.5px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-3">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[11px] text-ink-3">
          Akses terenkripsi — data tidak dibagikan tanpa persetujuan Anda.
        </p>
      </aside>

      {/* ================= PANEL KANAN: FORMULIR ================= */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Bar atas */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-10">
          <Link to="/" className="inline-flex items-center gap-2.5 lg:hidden">
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt=""
              className="h-8 w-8 shrink-0 object-contain"
            />
            <span className="text-[15px] font-bold tracking-[-0.02em] text-ink">GovConnect</span>
          </Link>
          <div className="hidden flex-1 lg:block" />
          <button
            type="button"
            onClick={toggleTheme}
            className="btn btn-ghost btn-icon btn-sm shrink-0 text-ink-2"
            title={theme === 'dark' ? 'Beralih ke mode terang (Light mode)' : 'Beralih ke mode gelap (Dark mode)'}
            aria-label="Toggle mode gelap atau terang"
          >
            <FontAwesome name={theme === 'dark' ? 'sun' : 'moon'} className="text-[13px]" />
          </button>
        </div>

        {/* Formulir */}
        <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-10">
          <div className="w-full max-w-[384px]">
            <div key={isRegister ? 'auth-register' : 'auth-login'} className="page-enter">
              <h1 className="text-[26px] font-bold leading-tight tracking-[-0.03em] text-ink">
                {isRegister ? 'Daftar Akun Baru' : 'Masuk ke Akun Anda'}
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
                {isRegister
                  ? 'Mulai isi formulir instansi pemerintah lebih cepat dan otomatis bersama GovConnect.'
                  : 'Akses brankas profil kependudukan digital dan asisten pengisian formulir instan Anda.'}
              </p>

              {/* Alert Error */}
              {error && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2.5 rounded-md border border-danger-line bg-danger-soft px-3 py-2.5"
                >
                  <FontAwesome name="circle-xmark" className="mt-[1px] shrink-0 text-[13px] text-danger" />
                  <span className="text-[12px] leading-relaxed text-danger">{error}</span>
                </div>
              )}

              {/* FORM LOGIN */}
              {!isRegister ? (
                <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
                  <FormField label="Alamat Email" htmlFor="login-email">
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      autoComplete="email"
                    />
                  </FormField>

                  <FormField label="Kata Sandi" htmlFor="login-password">
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pr-10"
                        placeholder="••••••••••••"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="btn btn-ghost btn-icon btn-sm absolute right-1 top-1/2 -translate-y-1/2 text-ink-3"
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      >
                        <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} className="text-[12px]" />
                      </button>
                    </div>
                  </FormField>

                  {/* Ingat Saya & Lupa Kata Sandi */}
                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    <CheckRow checked={rememberMe} onChange={setRememberMe}>
                      <span className="font-medium text-ink-2">Ingat Saya</span>
                    </CheckRow>

                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="link shrink-0 text-[12px]"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </div>

                  {/* Syarat & Ketentuan */}
                  <CheckRow checked={agreedTerms} onChange={setAgreedTerms}>
                    Saya telah membaca dan menyetujui{' '}
                    <button
                      type="button"
                      onClick={e => {
                        e.preventDefault();
                        setShowTermsModal(true);
                      }}
                      className="link font-semibold"
                    >
                      Syarat & Ketentuan serta Panduan Privasi
                    </button>{' '}
                    GovConnect.
                  </CheckRow>

                  <Button
                    type="submit"
                    size="lg"
                    loading={loading}
                    className="mt-1 w-full"
                    icon={!loading && <FontAwesome name="right-to-bracket" className="text-[12px]" />}
                  >
                    {loading ? 'Memproses Masuk...' : 'Masuk ke Akun'}
                  </Button>
                </form>
              ) : (
                /* FORM REGISTER */
                <form onSubmit={handleRegisterSubmit} className="mt-6 space-y-4">
                  <FormField label="Alamat Email" htmlFor="register-email">
                    <Input
                      id="register-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      autoComplete="email"
                    />
                  </FormField>

                  <FormField label="Kata Sandi (Minimal 8 Karakter)" htmlFor="register-password">
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="pr-10"
                        placeholder="Minimal 8 karakter..."
                        required
                        minLength={8}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="btn btn-ghost btn-icon btn-sm absolute right-1 top-1/2 -translate-y-1/2 text-ink-3"
                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      >
                        <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} className="text-[12px]" />
                      </button>
                    </div>
                  </FormField>

                  <FormField label="Konfirmasi Kata Sandi" htmlFor="register-confirm-password">
                    <Input
                      id="register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi Anda..."
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </FormField>

                  {/* Syarat & Ketentuan */}
                  <div className="pt-1">
                    <CheckRow checked={agreedTerms} onChange={setAgreedTerms}>
                      Saya telah membaca dan menyetujui{' '}
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }}
                        className="link font-semibold"
                      >
                        Syarat & Ketentuan serta Panduan Privasi
                      </button>{' '}
                      GovConnect.
                    </CheckRow>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    loading={loading}
                    className="mt-1 w-full"
                    icon={!loading && <FontAwesome name="user-plus" className="text-[12px]" />}
                  >
                    {loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Warga'}
                  </Button>
                </form>
              )}

              {/* Switcher Login <-> Register */}
              <div className="mt-6 text-[12.5px] text-ink-2">
                <span>{isRegister ? 'Sudah memiliki akun warga? ' : 'Belum memiliki akun warga? '}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigate(isRegister ? '/login' : '/register');
                  }}
                  className="link font-semibold"
                >
                  {isRegister ? 'Masuk Sekarang' : 'Daftar Sekarang'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: bantuan & copyright */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 sm:px-10">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="btn btn-ghost btn-sm -ml-2 text-ink-2"
            title="Buka Formulir Pusat Bantuan Terpadu"
          >
            <FontAwesome name="circle-info" className="text-[11px]" />
            <span>Pusat Bantuan</span>
          </button>

          <span className="text-[11px] font-medium text-ink-3">© 2026 GovConnect Indonesia</span>
        </div>
      </div>

      {/* ================= MODAL LUPA KATA SANDI ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card page-enter w-full max-w-[420px]">
            <div className="card-head">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-accent-text">
                  <FontAwesome name="key" className="text-[11px]" />
                </span>
                <div className="min-w-0">
                  <h3 className="card-title truncate">Pemulihan Kata Sandi</h3>
                  <p className="card-desc truncate">Tautan verifikasi dikirim ke email terdaftar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotSent(false);
                }}
                className="btn btn-ghost btn-icon btn-sm shrink-0 text-ink-3"
                aria-label="Tutup"
              >
                <FontAwesome name="cross-small" className="text-[12px]" />
              </button>
            </div>

            <div className="card-body">
              <p className="mb-4 text-[12px] leading-relaxed text-ink-2">
                Masukkan alamat email Anda yang terdaftar. Tautan verifikasi dan instruksi pemulihan akan
                dikirimkan ke kotak masuk Anda.
              </p>

              {forgotSent ? (
                <div className="flex items-center gap-2.5 rounded-md border border-ok-line bg-ok-soft px-3 py-2.5">
                  <FontAwesome name="circle-check" className="shrink-0 text-[13px] text-ok" />
                  <span className="text-[12px] leading-relaxed text-ink-2">
                    Instruksi pemulihan berhasil dikirimkan ke email Anda.
                  </span>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <FormField label="Alamat Email" htmlFor="forgot-email">
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                    />
                  </FormField>
                  <Button type="submit" className="w-full">
                    Kirim Tautan Pemulihan
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SYARAT & KETENTUAN ================= */}
      <AuthTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAgreedTerms(true);
          setShowTermsModal(false);
        }}
      />

      {/* ================= MODAL PUSAT BANTUAN ================= */}
      <AuthHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        defaultEmail={email}
      />
    </div>
  );
}
