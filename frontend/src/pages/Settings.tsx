import { useAuth } from '../context/AuthContext';
import { useState, useId } from 'react';
import { authApi, activityApi } from '../services/api';
import { FontAwesome } from '../components/ui';

const INPUT_CLS =
  'w-full h-11 px-4 text-sm bg-[#101828] border border-[#243048] hover:border-[#7BBDE8]/60 focus:border-[#7BBDE8] focus:ring-4 focus:ring-[#7BBDE8]/15 rounded-xl outline-none transition-colors text-white placeholder:text-[#6EA2B3]';
const LABEL_CLS = 'block text-xs font-semibold uppercase tracking-wider text-[#6EA2B3] mb-2';

export function SettingsPage() {
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

  // Kalkulasi kekuatan password dinamis
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: 'Belum diisi', color: 'bg-[#243048]', textCol: 'text-[#6EA2B3]' };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score <= 25) return { score: 25, label: 'Sangat Lemah', color: 'bg-rose-500', textCol: 'text-rose-400' };
    if (score <= 50) return { score: 50, label: 'Cukup', color: 'bg-amber-500', textCol: 'text-amber-400' };
    if (score <= 75) return { score: 75, label: 'Kuat', color: 'bg-[#7BBDE8]', textCol: 'text-[#7BBDE8]' };
    return { score: 100, label: 'Sangat Kuat', color: 'bg-emerald-500', textCol: 'text-emerald-400' };
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
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Gagal membersihkan riwayat aktivitas';
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
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Gagal mengubah kata sandi. Pastikan kata sandi saat ini sudah benar.';
      setMessage({ type: 'error', text: detail });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12">
      <style>{`
        @keyframes drawCheckmark {
          0% {
            stroke-dasharray: 24;
            stroke-dashoffset: 24;
            opacity: 0;
            transform: scale(0.6);
          }
          50% {
            opacity: 1;
            stroke-dashoffset: 6;
          }
          100% {
            stroke-dasharray: 24;
            stroke-dashoffset: 0;
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes pulseCheckGlow {
          0%, 100% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.2;
          }
        }
        .verified-check-path {
          animation: drawCheckmark 0.65s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .verified-pulse-glow {
          animation: pulseCheckGlow 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Pengaturan &amp; Keamanan Akun
          </h1>
          <p className="text-sm text-[#6EA2B3] mt-1">
            Kelola kata sandi masuk, otentikasi akun, dan kendali privasi data kependudukan Anda.
          </p>
        </div>

        {/* Badge Status Terverifikasi dengan animasi centang di sebelah kiri */}
        <div className="flex items-center gap-2.5 bg-[#171F2F] border border-[#243048] hover:border-emerald-500/50 rounded-xl px-3.5 py-2 self-start sm:self-auto shadow-xs transition-colors">
          <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
            <span className="absolute inset-0 rounded-full bg-emerald-500/20 verified-pulse-glow" />
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-emerald-400 relative z-10">
              <circle cx="12" cy="12" r="9.5" stroke="#10B981" strokeWidth="1.8" className="opacity-40" />
              <path
                d="M7.5 12.5L10.5 15.5L16.5 8.5"
                stroke="#10B981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="verified-check-path"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold text-white whitespace-nowrap">
            Status: Terverifikasi &amp; Terlindungi
          </span>
        </div>
      </div>

      {/* ── CARD 1: INFORMASI IDENTITAS AKUN ── */}
      <div className="bg-[#171F2F] rounded-2xl shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex items-start justify-between gap-4 pb-1">
          <div>
            <h2 className="text-base font-bold text-white">Identitas &amp; Surel Terdaftar</h2>
            <p className="text-xs text-[#6EA2B3] mt-0.5">Alamat surel utama yang digunakan untuk masuk dan notifikasi resmi</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLS}>Alamat Surel</label>
            <div className="h-11 px-4 bg-[#101828] border border-[#243048] rounded-xl flex items-center justify-between">
              <span className="text-sm font-semibold text-white truncate">{user?.email}</span>
              <FontAwesome name="envelope" className="text-xs text-[#6EA2B3] shrink-0" />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Standar Keamanan Sesi</label>
            <div className="h-11 px-4 bg-[#101828] border border-[#243048] rounded-xl flex items-center justify-between">
              <span className="text-sm font-medium text-white">Enkripsi Klien AES-256</span>
              <FontAwesome name="shield-halved" className="text-xs text-emerald-400 shrink-0" />
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 2: GANTI KATA SANDI ── */}
      <div className="bg-[#171F2F] rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base font-bold text-white">Perbarui Kata Sandi Akun</h2>
            <p className="text-xs text-[#6EA2B3] mt-0.5">
              Gunakan kombinasi minimal 8 karakter dengan huruf besar, angka, dan simbol.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords(!showPasswords)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#7BBDE8] hover:text-white px-3 py-1.5 rounded-lg border border-[#243048] bg-[#101828] hover:bg-[#101828]/80 transition-colors cursor-pointer"
          >
            <FontAwesome name={showPasswords ? 'eye-slash' : 'eye'} className="text-xs" />
            <span>{showPasswords ? 'Sembunyikan Sandi' : 'Tampilkan Sandi'}</span>
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold border ${
              message.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
            }`}
          >
            <FontAwesome
              name={message.type === 'success' ? 'circle-check' : 'circle-exclamation'}
              className={`text-sm shrink-0 ${message.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}
            />
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div>
            <label htmlFor={currentPasswordId} className={LABEL_CLS}>
              Kata Sandi Saat Ini <span className="text-rose-400">*</span>
            </label>
            <input
              id={currentPasswordId}
              type={showPasswords ? 'text' : 'password'}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className={INPUT_CLS}
              placeholder="Masukkan kata sandi lama Anda"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={newPasswordId} className="block text-xs font-semibold uppercase tracking-wider text-[#6EA2B3]">
                Kata Sandi Baru <span className="text-rose-400">*</span>
              </label>
              {newPassword && (
                <span className={`text-xs font-bold ${strength.textCol}`}>
                  Kekuatan: {strength.label}
                </span>
              )}
            </div>
            <input
              id={newPasswordId}
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className={INPUT_CLS}
              placeholder="Minimal 8 karakter kombinasi huruf, angka, dan simbol"
              required
            />

            {newPassword && (
              <div className="mt-3 space-y-2">
                <div className="w-full bg-[#101828] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
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
                      className={`flex items-center gap-2 ${
                        ok ? 'text-emerald-400 font-semibold' : 'text-[#6EA2B3]'
                      }`}
                    >
                      <FontAwesome name={ok ? 'circle-check' : 'circle'} className="text-[10px]" />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor={confirmPasswordId} className="block text-xs font-semibold uppercase tracking-wider text-[#6EA2B3]">
                Konfirmasi Kata Sandi Baru <span className="text-rose-400">*</span>
              </label>
              {passwordsMatch && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <FontAwesome name="circle-check" className="text-xs" />
                  <span>Kata sandi cocok</span>
                </span>
              )}
              {passwordsMismatch && (
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <FontAwesome name="circle-xmark" className="text-xs" />
                  <span>Belum cocok</span>
                </span>
              )}
            </div>
            <input
              id={confirmPasswordId}
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className={`${INPUT_CLS} ${
                passwordsMismatch ? 'border-rose-500 focus:border-rose-400 focus:ring-rose-500/20' : ''
              }`}
              placeholder="Ketik ulang kata sandi baru"
              required
            />
          </div>

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving || (!!confirmPassword && !passwordsMatch)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] active:bg-[#7BBDE8] transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FontAwesome name={saving ? 'spinner' : 'lock'} spin={saving} className="text-xs" />
              <span>{saving ? 'Menyimpan Sandi...' : 'Perbarui Kata Sandi'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ── CARD 3: KENDALI PRIVASI & RIWAYAT AKTIVITAS ── */}
      <div className="bg-[#171F2F] rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="pb-1">
          <h2 className="text-base font-bold text-white">Privasi &amp; Riwayat Formulir</h2>
          <p className="text-xs text-[#6EA2B3] mt-0.5">
            Kendali pembersihan data lokal dan sesi login akun pada perangkat ini.
          </p>
        </div>

        {clearActivityMsg && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold border ${
              clearActivityMsg.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/60'
            }`}
          >
            <FontAwesome
              name={clearActivityMsg.type === 'success' ? 'circle-check' : 'circle-exclamation'}
              className={`text-sm shrink-0 ${clearActivityMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}
            />
            <span>{clearActivityMsg.text}</span>
          </div>
        )}

        {/* Clear Activities Block */}
        <div className="p-5 rounded-xl bg-[#101828] border border-[#243048] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white">Bersihkan Riwayat Pengisian Formulir</h3>
              <p className="text-xs text-[#6EA2B3] mt-1">
                Menghapus jejak log domain formulir yang pernah diisi oleh ekstensi autofill untuk kerahasiaan.
              </p>
            </div>

            {!showConfirmClear ? (
              <button
                type="button"
                onClick={() => setShowConfirmClear(true)}
                disabled={clearingActivity}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-300 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <FontAwesome name="trash" className="text-xs" />
                <span>Hapus Riwayat</span>
              </button>
            ) : null}
          </div>

          {showConfirmClear && (
            <div className="p-4 rounded-xl bg-[#171F2F] border border-rose-500/40 space-y-3">
              <p className="text-xs font-bold text-rose-300">
                Apakah Anda yakin ingin menghapus seluruh log riwayat aktivitas? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClearActivities}
                  disabled={clearingActivity}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  {clearingActivity ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmClear(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6EA2B3] hover:text-white hover:bg-[#101828] rounded-lg transition-colors cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Logout Session Action */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h3 className="text-sm font-bold text-white">Keluar dari Akun (Logout)</h3>
            <p className="text-xs text-[#6EA2B3] mt-0.5">Mengakhiri sesi aman Anda pada peramban ini</p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-600 bg-rose-500/15 border border-rose-500/30 rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            <FontAwesome name="right-from-bracket" className="text-xs" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
