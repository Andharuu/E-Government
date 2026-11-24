import { useAuth } from '../context/AuthContext';
import { useState, useId } from 'react';
import { authApi, activityApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Mail,
  ShieldCheck,
  Moon,
  Sun,
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  Trash2,
  LogOut,
  Sparkles,
} from 'lucide-react';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [clearingActivity, setClearingActivity] = useState(false);
  const [clearActivityMsg, setClearActivityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Dynamic password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Belum diisi', color: 'bg-surface-3', textCol: 'text-ink-3' };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score <= 25) return { score: 25, label: 'Sangat Lemah', color: 'bg-danger', textCol: 'text-danger' };
    if (score <= 50) return { score: 50, label: 'Cukup', color: 'bg-amber-500', textCol: 'text-amber-500' };
    if (score <= 75) return { score: 75, label: 'Kuat', color: 'bg-blue-500', textCol: 'text-accent-text' };
    return { score: 100, label: 'Sangat Kuat', color: 'bg-emerald-500', textCol: 'text-emerald-500' };
  };

  const pwdCriteria = {
    minLen: newPassword.length >= 8,
    hasUpperLower: /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
  };

  const strength = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword && newPassword !== confirmPassword;

  const handleClearActivities = async () => {
    setClearingActivity(true);
    setClearActivityMsg(null);
    setShowConfirmClear(false);
    try {
      const res = await activityApi.clearAll();
      setClearActivityMsg({
        type: 'success',
        text: res.data.detail || 'Seluruh catatan riwayat pengisian formulir berhasil dibersihkan.',
      });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Gagal membersihkan riwayat aktivitas';
      setClearActivityMsg({ type: 'error', text: detail });
    } finally {
      setClearingActivity(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Konfirmasi kata sandi baru tidak cocok.' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Kata sandi minimal harus terdiri dari 8 karakter.' });
      return;
    }
    setSaving(true);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: res.data.detail || 'Kata sandi akun Anda berhasil diperbarui.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Gagal mengubah kata sandi. Pastikan kata sandi saat ini sudah benar.';
      setMessage({ type: 'error', text: detail });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page page-enter max-w-4xl mx-auto space-y-8 pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-line">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preferensi &amp; Keamanan Akun</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Pengaturan
          </h1>
          <p className="text-base text-ink-2 max-w-2xl leading-relaxed">
            Kelola kredensial masuk akun, preferensi tema antarmuka, audit privasi formulir, dan keamanan enkripsi sesi.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold self-start lg:self-auto">
          <ShieldCheck className="w-4 h-4" />
          <span>Enkripsi Klien AES-256 Aktif</span>
        </div>
      </div>

      {/* ── CARD 1: INFORMASI IDENTITAS AKUN ── */}
      <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8 space-y-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-ink">
            Identitas &amp; Surel Terdaftar
          </h2>
          <p className="text-xs text-ink-3 mt-1">
            Alamat surel utama yang digunakan untuk masuk dan notifikasi resmi GovConnect.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">Alamat Surel</label>
            <div className="h-12 px-4 rounded-xl border border-line bg-surface-2 flex items-center justify-between text-xs text-ink">
              <span className="font-mono truncate">{user?.email || 'pengguna@govconnect.id'}</span>
              <Mail className="w-4 h-4 text-ink-3 shrink-0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">Standar Keamanan Sesi</label>
            <div className="h-12 px-4 rounded-xl border border-line bg-surface-2 flex items-center justify-between text-xs text-ink">
              <span className="font-semibold text-ink">AES-GCM 256-bit Lokal</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 2: PENGATURAN TEMA ── */}
      <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-ink">
            Mode Tampilan (Dark &amp; Light Mode)
          </h2>
          <p className="text-xs text-ink-3 max-w-lg leading-relaxed">
            Pilih preferensi tema antarmuka GovConnect. Tema tersimpan secara otomatis pada peramban Anda.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl border border-line bg-surface-2 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`h-11 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-surface text-ink font-bold shadow-xs'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Mode Gelap</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`h-11 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-surface text-ink font-bold shadow-xs'
                : 'text-ink-3 hover:text-ink'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Mode Terang</span>
          </button>
        </div>
      </div>

      {/* ── CARD 3: GANTI KATA SANDI ── */}
      <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div>
            <h2 className="text-lg font-bold text-ink">
              Perbarui Kata Sandi Akun
            </h2>
            <p className="text-xs text-ink-3 mt-1">
              Gunakan kombinasi minimal 8 karakter dengan huruf besar, angka, dan simbol khusus.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="h-10 px-3.5 rounded-xl border border-line bg-surface-2 hover:bg-surface-3 text-xs font-semibold text-ink-2 transition-colors inline-flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
          >
            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showPasswords ? 'Sembunyikan' : 'Tampilkan'} Sandi</span>
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-danger'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor={currentPasswordId} className="block text-xs font-semibold text-ink">
              Kata Sandi Saat Ini <span className="text-danger">*</span>
            </label>
            <input
              id={currentPasswordId}
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Masukkan kata sandi lama Anda"
              required
              className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor={newPasswordId} className="font-semibold text-ink">
                Kata Sandi Baru <span className="text-danger">*</span>
              </label>
              {newPassword && (
                <span className={`font-semibold ${strength.textCol}`}>
                  Kekuatan: {strength.label}
                </span>
              )}
            </div>

            <input
              id={newPasswordId}
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Minimal 8 karakter kombinasi huruf, angka, dan simbol"
              required
              className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />

            {newPassword && (
              <div className="space-y-3 pt-1">
                <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                  {(
                    [
                      [pwdCriteria.minLen, 'Minimal 8 karakter'],
                      [pwdCriteria.hasUpperLower, 'Huruf besar & kecil'],
                      [pwdCriteria.hasNumber, 'Mengandung angka (0-9)'],
                      [pwdCriteria.hasSpecial, 'Simbol khusus (@, #, $)'],
                    ] as const
                  ).map(([ok, label]) => (
                    <div
                      key={label}
                      className={`flex items-center gap-2 ${ok ? 'text-emerald-500 font-medium' : 'text-ink-3'}`}
                    >
                      <Check className={`w-3.5 h-3.5 ${ok ? 'text-emerald-500' : 'text-ink-3 opacity-40'}`} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor={confirmPasswordId} className="font-semibold text-ink">
                Konfirmasi Kata Sandi Baru <span className="text-danger">*</span>
              </label>
              {passwordsMatch && (
                <span className="flex items-center gap-1 font-semibold text-emerald-500">
                  <Check className="w-3.5 h-3.5" />
                  <span>Kata sandi cocok</span>
                </span>
              )}
              {passwordsMismatch && (
                <span className="flex items-center gap-1 font-semibold text-danger">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Belum cocok</span>
                </span>
              )}
            </div>

            <input
              id={confirmPasswordId}
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Ketik ulang kata sandi baru"
              required
              className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </div>

          <div className="pt-4 border-t border-line flex justify-end">
            <button
              type="submit"
              disabled={saving || (Boolean(confirmPassword) && !passwordsMatch)}
              className="h-12 px-6 rounded-xl bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Lock className="w-4 h-4" />
              <span>{saving ? 'Menyimpan Sandi...' : 'Perbarui Kata Sandi'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── CARD 4: PRIVASI & BERSIHKAN DATA ── */}
      <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-ink">
            Kendali Privasi &amp; Riwayat Formulir
          </h2>
          <p className="text-xs text-ink-3 mt-1">
            Kendali pembersihan jejak log pengisian formulir lokal dan sesi login akun pada peramban ini.
          </p>
        </div>

        {clearActivityMsg && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
            clearActivityMsg.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/30 bg-red-500/10 text-danger'
          }`}>
            {clearActivityMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            )}
            <span className="font-medium">{clearActivityMsg.text}</span>
          </div>
        )}

        <div className="p-5 rounded-2xl border border-line bg-surface-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-ink">
                Bersihkan Riwayat Pengisian Formulir
              </h3>
              <p className="text-xs text-ink-3 max-w-lg leading-relaxed">
                Menghapus jejak log domain formulir yang pernah diisi oleh ekstensi autofill untuk menjaga kerahasiaan riwayat browsing.
              </p>
            </div>

            {!showConfirmClear && (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                disabled={clearingActivity}
                className="h-10 px-4 rounded-xl border border-line bg-surface hover:bg-danger-soft text-danger text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Riwayat</span>
              </button>
            )}
          </div>

          {showConfirmClear && (
            <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 space-y-3 animate-in fade-in duration-200">
              <p className="text-xs text-danger font-medium leading-relaxed">
                Apakah Anda yakin ingin menghapus seluruh log riwayat aktivitas pengisian? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearActivities}
                  disabled={clearingActivity}
                  className="h-9 px-4 rounded-xl bg-danger text-white text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {clearingActivity ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="h-9 px-4 rounded-xl border border-line bg-surface text-xs font-semibold text-ink-2 hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout session */}
        <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-ink">
              Keluar dari Akun (Logout)
            </h3>
            <p className="text-xs text-ink-3">
              Mengakhiri sesi aman akun Anda pada peramban ini.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="h-11 px-5 rounded-xl border border-line bg-surface hover:bg-danger-soft text-danger text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
