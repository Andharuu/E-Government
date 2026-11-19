import { useAuth } from '../context/AuthContext';
import { useState, useId } from 'react';
import { authApi, activityApi } from '../services/api';
import {
  FontAwesome,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  FormField,
} from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { useTour } from '../tour';

const LABEL_CLS = 'label';
const READONLY_CLS =
  'flex h-9 items-center justify-between gap-2 rounded-md border border-line bg-surface-2 px-3';

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { resetTour, clearTourData } = useTour();
  const [tourMsg, setTourMsg] = useState<string | null>(null);
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
    if (!pwd) return { score: 0, label: 'Belum diisi', color: 'bg-surface-3', textCol: 'text-ink-3' };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score <= 25) return { score: 25, label: 'Sangat Lemah', color: 'bg-danger', textCol: 'text-danger' };
    if (score <= 50) return { score: 50, label: 'Cukup', color: 'bg-warn', textCol: 'text-warn' };
    if (score <= 75) return { score: 75, label: 'Kuat', color: 'bg-accent', textCol: 'text-accent-text' };
    return { score: 100, label: 'Sangat Kuat', color: 'bg-ok', textCol: 'text-ok' };
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
    <div className="page page-enter mx-auto w-full max-w-3xl pb-12">
      {/* ── Page Header ── */}
      <div className="page-head">
        <div className="min-w-0">
          <p className="eyebrow">Akun</p>
          <h1 className="page-title">Pengaturan &amp; Keamanan Akun</h1>
          <p className="page-sub">
            Kelola kata sandi masuk, otentikasi akun, dan kendali privasi data kependudukan Anda.
          </p>
        </div>

        <Badge variant="ok" dot className="self-start sm:self-auto">
          Status: Terverifikasi &amp; Terlindungi
        </Badge>
      </div>

      {/* ── CARD 1: INFORMASI IDENTITAS AKUN ── */}
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Identitas &amp; Surel Terdaftar</CardTitle>
            <CardDescription>
              Alamat surel utama yang digunakan untuk masuk dan notifikasi resmi
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={LABEL_CLS}>Alamat Surel</label>
            <div className={READONLY_CLS}>
              <span className="truncate text-[13px] font-medium text-ink">{user?.email}</span>
              <FontAwesome name="envelope" className="shrink-0 text-[11px] text-ink-3" />
            </div>
          </div>

          <div>
            <label className={LABEL_CLS}>Standar Keamanan Sesi</label>
            <div className={READONLY_CLS}>
              <span className="text-[13px] text-ink">Enkripsi Klien AES-256</span>
              <FontAwesome name="shield-halved" className="shrink-0 text-[11px] text-ok" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 1.5: PENGATURAN TEMA GELAP / TERANG ── */}
<<<<<<< HEAD
      <div data-tour="settings-theme" className="bg-[#171F2F] rounded-2xl shadow-sm p-6 sm:p-8 space-y-4 border border-[#243048]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Mode Tampilan (Dark &amp; Light Mode)</h2>
            <p className="text-xs text-[#6EA2B3] mt-0.5">
=======
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle>Mode Tampilan (Dark &amp; Light Mode)</CardTitle>
            <CardDescription>
>>>>>>> 63dbf8b6c6dd2c4a9ee44c29a0be10be43331194
              Pilih preferensi tema antarmuka GovConnect. Tema tersimpan secara otomatis pada peramban Anda.
            </CardDescription>
          </div>

          <div className="segmented self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              data-active={theme === 'dark'}
              className="segmented-item"
            >
              <FontAwesome name="moon" className="text-[11px]" />
              <span>Mode Gelap</span>
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              data-active={theme === 'light'}
              className="segmented-item"
            >
              <FontAwesome name="sun" className="text-[11px]" />
              <span>Mode Terang</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 1.8: PANDUAN TUR ONBOARDING INTERAKTIF ── */}
      <div data-tour="settings-tour" className="bg-[#171F2F] rounded-2xl shadow-sm p-6 sm:p-8 space-y-4 border border-[#243048]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FontAwesome name="compass" className="text-sm text-[#7BBDE8]" />
              <span>Panduan Interaktif &amp; Tur Pengguna</span>
            </h2>
            <p className="text-xs text-[#6EA2B3] mt-0.5">
              Pelajari kembali fitur dan alur kerja GovConnect, atau reset preferensi tur pada peramban ini.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                resetTour();
                setTourMsg('Tur tutorial berhasil di-reset. Panduan akan muncul secara kontekstual di Dasbor, Profil, dan Grup Layanan.');
                setTimeout(() => setTourMsg(null), 4000);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] transition-colors cursor-pointer shadow-xs"
            >
              <FontAwesome name="play" className="text-xs" />
              <span>Ulangi Tur Tutorial</span>
            </button>

            <button
              type="button"
              onClick={() => {
                clearTourData();
                setTourMsg('Data riwayat tur berhasil dibersihkan dari peramban.');
                setTimeout(() => setTourMsg(null), 3500);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#6EA2B3] hover:text-white bg-[#101828] hover:bg-[#243048] border border-[#243048] transition-colors cursor-pointer"
            >
              <FontAwesome name="trash" className="text-xs" />
              <span>Hapus Riwayat Tur</span>
            </button>
          </div>
        </div>

        {tourMsg && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
            <FontAwesome name="circle-check" className="text-emerald-400 text-xs" />
            <span>{tourMsg}</span>
          </div>
        )}
      </div>

      {/* ── CARD 2: GANTI KATA SANDI ── */}
<<<<<<< HEAD
      <div data-tour="settings-security" className="bg-[#171F2F] rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-base font-bold text-white">Perbarui Kata Sandi Akun</h2>
            <p className="text-xs text-[#6EA2B3] mt-0.5">
=======
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Perbarui Kata Sandi Akun</CardTitle>
            <CardDescription>
>>>>>>> 63dbf8b6c6dd2c4a9ee44c29a0be10be43331194
              Gunakan kombinasi minimal 8 karakter dengan huruf besar, angka, dan simbol.
            </CardDescription>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowPasswords(!showPasswords)}
            icon={<FontAwesome name={showPasswords ? 'eye-slash' : 'eye'} className="text-[11px]" />}
          >
            {showPasswords ? 'Sembunyikan Sandi' : 'Tampilkan Sandi'}
          </Button>
        </CardHeader>

        <CardContent className="space-y-5">
          {message && (
            <div
              className={`flex items-start gap-2.5 rounded-md border p-3 text-[12.5px] ${
                message.type === 'success'
                  ? 'border-ok-line bg-ok-soft text-ok'
                  : 'border-danger-line bg-danger-soft text-danger'
              }`}
            >
              <FontAwesome
                name={message.type === 'success' ? 'circle-check' : 'circle-exclamation'}
                className="mt-0.5 shrink-0 text-[12px]"
              />
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-5">
            <FormField label="Kata Sandi Saat Ini" required htmlFor={currentPasswordId}>
              <Input
                id={currentPasswordId}
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Masukkan kata sandi lama Anda"
                required
              />
            </FormField>

            <div>
              <div className="flex items-end justify-between gap-3">
                <label htmlFor={newPasswordId} className={`${LABEL_CLS} mb-0`}>
                  Kata Sandi Baru <span className="text-danger">*</span>
                </label>
                {newPassword && (
                  <span className={`text-[11.5px] font-semibold ${strength.textCol}`}>
                    Kekuatan: {strength.label}
                  </span>
                )}
              </div>

              <Input
                id={newPasswordId}
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimal 8 karakter kombinasi huruf, angka, dan simbol"
                required
                className="mt-1.5"
              />

              {newPassword && (
                <div className="mt-3 space-y-2">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full rounded-full ${strength.color} transition-all duration-300`}
                      style={{ width: `${strength.score}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-x-4 gap-y-1.5 pt-1 text-[11.5px] sm:grid-cols-2">
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
                        className={`flex items-center gap-1.5 ${ok ? 'font-medium text-ok' : 'text-ink-3'}`}
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
              <div className="flex items-end justify-between gap-3">
                <label htmlFor={confirmPasswordId} className={`${LABEL_CLS} mb-0`}>
                  Konfirmasi Kata Sandi Baru <span className="text-danger">*</span>
                </label>
                {passwordsMatch && (
                  <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ok">
                    <FontAwesome name="circle-check" className="text-[10px]" />
                    <span>Kata sandi cocok</span>
                  </span>
                )}
                {passwordsMismatch && (
                  <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-danger">
                    <FontAwesome name="circle-xmark" className="text-[10px]" />
                    <span>Belum cocok</span>
                  </span>
                )}
              </div>
              <Input
                id={confirmPasswordId}
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang kata sandi baru"
                required
                className="mt-1.5"
                error={Boolean(passwordsMismatch)}
              />
            </div>

            {/* Action Button */}
            <div className="flex justify-end border-t border-line pt-4">
              <Button
                type="submit"
                variant="primary"
                disabled={saving || (!!confirmPassword && !passwordsMatch)}
                loading={saving}
                icon={<FontAwesome name="lock" className="text-[11px]" />}
              >
                {saving ? 'Menyimpan Sandi...' : 'Perbarui Kata Sandi'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── CARD 3: KENDALI PRIVASI & RIWAYAT AKTIVITAS ── */}
      <Card>
        <CardHeader>
          <div className="min-w-0">
            <CardTitle>Privasi &amp; Riwayat Formulir</CardTitle>
            <CardDescription>
              Kendali pembersihan data lokal dan sesi login akun pada perangkat ini.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {clearActivityMsg && (
            <div
              className={`flex items-start gap-2.5 rounded-md border p-3 text-[12.5px] ${
                clearActivityMsg.type === 'success'
                  ? 'border-ok-line bg-ok-soft text-ok'
                  : 'border-danger-line bg-danger-soft text-danger'
              }`}
            >
              <FontAwesome
                name={clearActivityMsg.type === 'success' ? 'circle-check' : 'circle-exclamation'}
                className="mt-0.5 shrink-0 text-[12px]"
              />
              <span>{clearActivityMsg.text}</span>
            </div>
          )}

          {/* Clear Activities Block */}
          <div className="rounded-lg border border-line bg-surface-2 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-[13px] font-semibold text-ink">Bersihkan Riwayat Pengisian Formulir</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-3">
                  Menghapus jejak log domain formulir yang pernah diisi oleh ekstensi autofill untuk kerahasiaan.
                </p>
              </div>

              {!showConfirmClear ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowConfirmClear(true)}
                  disabled={clearingActivity}
                  className="shrink-0 text-danger"
                  icon={<FontAwesome name="trash" className="text-[11px]" />}
                >
                  Hapus Riwayat
                </Button>
              ) : null}
            </div>

            {showConfirmClear && (
              <div className="mt-3 space-y-3 rounded-md border border-danger-line bg-danger-soft p-3">
                <p className="text-[12.5px] font-medium text-danger">
                  Apakah Anda yakin ingin menghapus seluruh log riwayat aktivitas? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleClearActivities}
                    disabled={clearingActivity}
                  >
                    {clearingActivity ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmClear(false)}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Logout Session Action */}
          <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-[13px] font-semibold text-ink">Keluar dari Akun (Logout)</h3>
              <p className="mt-0.5 text-[12px] text-ink-3">Mengakhiri sesi aman Anda pada peramban ini</p>
            </div>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={logout}
              className="shrink-0 self-start text-danger sm:self-auto"
              icon={<FontAwesome name="right-from-bracket" className="text-[11px]" />}
            >
              Keluar Akun
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SettingsPage;
