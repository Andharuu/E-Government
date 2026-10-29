import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { FontAwesome } from '../components/ui';
import { AuthShowcasePreview } from '../components/auth/AuthShowcasePreview';
import { AuthHelpModal } from '../components/auth/AuthHelpModal';
import { AuthTermsModal } from '../components/auth/AuthTermsModal';
import logoDark from '../assets/logo dark.png';
import logoLight from '../assets/logo light.png';

interface AuthPageProps {
  defaultMode?: 'login' | 'register';
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC] dark:bg-[#070D18] text-slate-900 dark:text-slate-100 transition-colors duration-200 overflow-x-hidden selection:bg-blue-600 selection:text-white font-sans">
      {/* ================= SISI KIRI: FORM CONTAINER RESMI GOVCONNECT ================= */}
      <div className="w-full lg:w-[48%] xl:w-[45%] flex flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16 relative bg-white dark:bg-[#0A101D] border-r border-slate-200/80 dark:border-slate-800/80 z-10">
        {/* Header Bar: Logo di Kiri, Toggle Tema di Kanan Pojok */}
        <div className="flex items-center justify-between w-full mb-6 sm:mb-8 shrink-0">
          {/* Logo GovConnect Unwrapped */}
          <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
            <img
              src={theme === 'dark' ? logoDark : logoLight}
              alt="GovConnect Logo"
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-sm transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-3 shrink-0"
            />
            <span className="font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              GovConnect
            </span>
          </Link>

          {/* Toggle Dark / Light Mode (Gaya Dashboard) */}
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
        </div>

        {/* ================= KONTEN FORMULIR (MUNCUL LANGSUNG TANPA GESER) ================= */}
        <div className="w-full max-w-md mx-auto my-auto py-2">
          <div
            key={isRegister ? 'auth-register' : 'auth-login'}
            className="animate-in fade-in duration-200"
          >
            {/* Judul Formulir */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                {isRegister ? 'Daftar Akun Baru' : 'Masuk ke Akun Anda'}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {isRegister
                  ? 'Mulai isi formulir instansi pemerintah lebih cepat dan otomatis bersama GovConnect.'
                  : 'Akses brankas profil kependudukan digital dan asisten pengisian formulir instan Anda.'}
              </p>
            </div>

            {/* Alert Error */}
            {error && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in duration-200 shadow-xs">
                <FontAwesome name="circle-xmark" className="text-base text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* FORM LOGIN */}
            {!isRegister ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Alamat Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-[#121A2B] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-sky-400 transition-all text-sm font-semibold"
                    placeholder="nama@email.com"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-[#121A2B] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-sky-400 transition-all text-sm font-semibold"
                      placeholder="••••••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Ingat Saya & Lupa Kata Sandi */}
                <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                          rememberMe
                            ? 'bg-[#0A4174] border-[#0A4174] text-white shadow-xs'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-blue-500'
                        }`}
                      >
                        {rememberMe && <FontAwesome name="check-pure" className="text-[10px]" />}
                      </div>
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-semibold group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                      Ingat Saya
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-[#0A4174] dark:text-sky-400 hover:underline transition-colors cursor-pointer"
                  >
                    Lupa Kata Sandi?
                  </button>
                </div>

                {/* Checkbox Syarat & Ketentuan */}
                <div className="pt-1 pb-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                    <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={e => setAgreedTerms(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                          agreedTerms
                            ? 'bg-[#0A4174] border-[#0A4174] text-white shadow-xs'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-blue-500'
                        }`}
                      >
                        {agreedTerms && <FontAwesome name="check-pure" className="text-[10px]" />}
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Saya telah membaca dan menyetujui{' '}
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }}
                        className="font-bold text-[#0A4174] dark:text-sky-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-sky-300"
                      >
                        Syarat & Ketentuan serta Panduan Privasi
                      </button>{' '}
                      GovConnect.
                    </span>
                  </label>
                </div>

                {/* Tombol Masuk */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-[#0A4174] hover:bg-[#001D39] text-white font-black text-sm sm:text-base shadow-lg shadow-blue-900/25 hover:shadow-xl hover:shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                >
                  {loading ? (
                    <>
                      <FontAwesome name="spinner" spin className="text-sm" />
                      <span>Memproses Masuk...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesome
                        name="right-to-bracket"
                        className="text-sm transition-transform duration-300 ease-out group-hover:translate-x-1"
                      />
                      <span>Masuk ke Akun</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* FORM REGISTER */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5 sm:space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="register-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Alamat Email
                  </label>
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-[#121A2B] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-sky-400 transition-all text-sm font-semibold"
                    placeholder="nama@email.com"
                    required
                    autoComplete="email"
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="register-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Kata Sandi (Minimal 8 Karakter)
                  </label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-[#121A2B] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-sky-400 transition-all text-sm font-semibold"
                      placeholder="Minimal 8 karakter..."
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    >
                      <FontAwesome name={showPassword ? 'eye-slash' : 'eye'} className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="register-confirm-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300"
                  >
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-[#121A2B] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-sky-400 transition-all text-sm font-semibold"
                      placeholder="Ulangi kata sandi Anda..."
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                {/* Checkbox Syarat & Ketentuan */}
                <div className="pt-1 pb-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                    <div className="relative flex items-center justify-center mt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={e => setAgreedTerms(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                          agreedTerms
                            ? 'bg-[#0A4174] border-[#0A4174] text-white shadow-xs'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 group-hover:border-blue-500'
                        }`}
                      >
                        {agreedTerms && <FontAwesome name="check-pure" className="text-[10px]" />}
                      </div>
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      Saya telah membaca dan menyetujui{' '}
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }}
                        className="font-bold text-[#0A4174] dark:text-sky-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-sky-300"
                      >
                        Syarat & Ketentuan serta Panduan Privasi
                      </button>{' '}
                      GovConnect.
                    </span>
                  </label>
                </div>

                {/* Tombol Daftar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-6 rounded-2xl bg-[#0A4174] hover:bg-[#001D39] text-white font-black text-sm sm:text-base shadow-lg shadow-blue-900/25 hover:shadow-xl hover:shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                >
                  {loading ? (
                    <>
                      <FontAwesome name="spinner" spin className="text-sm" />
                      <span>Mendaftarkan Akun...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesome
                        name="user-plus"
                        className="text-sm transition-transform duration-300 ease-out group-hover:scale-110"
                      />
                      <span>Daftar Akun Warga</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Link Switcher Login <-> Register dengan Animasi Navigasi Halus */}
            <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              <span>{isRegister ? 'Sudah memiliki akun warga? ' : 'Belum memiliki akun warga? '}</span>
              <button
                type="button"
                onClick={() => {
                  navigate(isRegister ? '/login' : '/register');
                }}
                className="font-bold text-[#0A4174] dark:text-sky-400 underline underline-offset-4 hover:text-blue-700 dark:hover:text-sky-300 transition-colors cursor-pointer"
              >
                {isRegister ? 'Masuk Sekarang' : 'Daftar Sekarang'}
              </button>
            </div>
          </div>
        </div>

        {/* Section Bawah: Bantuan & Copyright */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="group inline-flex items-center gap-2 py-2 px-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer font-bold shadow-2xs"
            title="Buka Formulir Pusat Bantuan Terpadu"
          >
            <FontAwesome
              name="circle-info"
              className="text-sm text-blue-600 dark:text-sky-400 group-hover:rotate-12 transition-transform duration-300"
            />
            <span>Pusat Bantuan</span>
          </button>

          <span className="text-[11px] text-slate-400 font-medium">
            © 2026 GovConnect Indonesia
          </span>
        </div>
      </div>

      {/* ================= SISI KANAN: PRATINJAU GOVCONNECT (ADAPTIF LIGHT & DARK MODE) ================= */}
      <AuthShowcasePreview />

      {/* ================= MODAL LUPA KATA SANDI ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-[#131C2E] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotSent(false);
              }}
              className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <FontAwesome name="cross-small" className="text-base" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-sky-400 flex items-center justify-center text-xl mb-4">
              <FontAwesome name="lock-keyhole" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-1.5">
              Pemulihan Kata Sandi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Masukkan alamat email Anda yang terdaftar. Tautan verifikasi dan instruksi pemulihan akan dikirimkan ke kotak masuk Anda.
            </p>

            {forgotSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center gap-3">
                <FontAwesome name="circle-check" className="text-lg text-emerald-500 shrink-0" />
                <span>Instruksi pemulihan berhasil dikirimkan ke email Anda.</span>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white font-bold text-sm transition-all shadow-md cursor-pointer"
                >
                  Kirim Tautan Pemulihan
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL SYARAT & KETENTUAN SANGAT DETAIL ================= */}
      <AuthTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAgreedTerms(true);
          setShowTermsModal(false);
        }}
      />

      {/* ================= MODAL PUSAT BANTUAN TERHUBUNG DATABASE ADMIN ================= */}
      <AuthHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        defaultEmail={email}
      />
    </div>
  );
}

