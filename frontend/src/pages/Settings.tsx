import { useAuth } from '../context/AuthContext';
import { useState, useId } from 'react';
import { authApi, activityApi } from '../services/api';
import { Card, Button, Flaticon, FontAwesome } from '../components/ui';

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
    if (!pwd) return { score: 0, label: 'Belum diisi', color: 'bg-slate-200', textCol: 'text-slate-400' };
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    if (score <= 25) return { score: 25, label: 'Sangat Lemah', color: 'bg-rose-500', textCol: 'text-rose-600' };
    if (score <= 50) return { score: 50, label: 'Cukup', color: 'bg-amber-500', textCol: 'text-amber-600' };
    if (score <= 75) return { score: 75, label: 'Kuat', color: 'bg-blue-500', textCol: 'text-blue-600' };
    return { score: 100, label: 'Sangat Kuat', color: 'bg-emerald-500', textCol: 'text-emerald-600' };
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
        text: res.data.detail || 'Seluruh riwayat aktivitas formulir berhasil dibersihkan.'
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
      setMessage({ type: 'error', text: 'Password konfirmasi tidak cocok.' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password minimal harus 8 karakter.' });
      return;
    }
    setSaving(true);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: res.data.detail || 'Kata sandi berhasil diperbarui!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Gagal mengubah kata sandi.';
      setMessage({ type: 'error', text: detail });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-10 px-3 text-[14px] leading-[20px] bg-white border border-[#E8ECF2] hover:border-slate-300 focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15 rounded-[10px] transition-all text-[#0F172A] placeholder:text-[#8A97A8] outline-none font-normal";

  return (
    <div className="w-full space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] leading-[36px] font-semibold text-[#0F172A] tracking-[-0.02em]">Pengaturan & keamanan</h1>
          <p className="text-[14px] leading-[22px] font-normal text-[#475569] mt-1">Kelola kredensial akun, perlindungan enkripsi data, dan preferensi privasi Anda.</p>
        </div>
      </div>

      {/* Banner Ringkasan Status Akun & Keamanan Dinamis */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] rounded-[16px] p-5 sm:p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white text-[20px] font-bold shadow-inner shrink-0">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[16px] leading-[22px] font-semibold text-white tracking-tight">{user?.email}</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Terverifikasi
              </span>
            </div>
            <p className="text-[13px] leading-[18px] text-slate-300 mt-0.5">
              Akun Warga GovConnect • Perlindungan Kriptografi Aktif
            </p>
          </div>
        </div>

        {/* 3 Status Chips Dinamis */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white/10 border border-white/15 backdrop-blur-xs">
            <FontAwesome name="shield-halved" variant="solid" className="text-emerald-400 text-xs" />
            <div className="text-left">
              <p className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Enkripsi</p>
              <p className="text-[12px] font-medium text-white leading-tight">AES-256 Aktif</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-white/10 border border-white/15 backdrop-blur-xs">
            <FontAwesome name="database" variant="solid" className="text-blue-400 text-xs" />
            <div className="text-left">
              <p className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Penyimpanan</p>
              <p className="text-[12px] font-medium text-white leading-tight">Zero-Cloud Leak</p>
            </div>
          </div>

        </div>
      </div>

      {/* Grid 2 Kolom Tertata */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Kredensial & Ganti Kata Sandi (7 Kolom) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="p-6 lg:p-7 space-y-5 shadow-xs border border-slate-200/80">
            {/* Header: Icon FontAwesome Tanpa Background, Deskripsi Sejajar */}
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
              <FontAwesome name="user-shield" variant="solid" className="text-[20px] text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-[16px] leading-[24px] font-semibold text-[#0F172A]">Akun & keamanan sandi</h2>
                <p className="text-[13px] leading-[20px] font-normal text-[#64748B] mt-0.5">Kelola identitas email terdaftar dan perbarui kata sandi akun</p>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[13px] leading-[20px] font-medium text-[#475569] mb-1.5">
                Alamat email terdaftar
              </label>
              <div className="flex items-center gap-2 max-w-xl">
                <div className="flex-1 bg-[#F8FAFC] border border-[#E8ECF2] rounded-[10px] h-10 px-3.5 flex items-center justify-between text-[14px] text-[#334155]">
                  <span className="font-medium text-[#0F172A]">{user?.email}</span>
                  <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-[6px]">
                    Akun Utama
                  </span>
                </div>
              </div>
            </div>

            {/* Form Ganti Password Dinamis */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] leading-[20px] font-semibold text-[#0F172A]">Ganti kata sandi</h3>
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Flaticon name={showPasswords ? "eye-crossed" : "eye"} className="text-xs" />
                  <span>{showPasswords ? 'Sembunyikan' : 'Tampilkan'} password</span>
                </button>
              </div>

              {message && (
                <div
                  className={`mb-4 p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold border shadow-2xs transition-all ${
                    message.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {message.type === 'success' ? (
                    <Flaticon name="check" className="text-xs text-emerald-600 shrink-0" />
                  ) : (
                    <Flaticon name="info" className="text-xs text-rose-600 shrink-0" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor={currentPasswordId} className="block text-[13px] leading-[20px] font-medium text-[#475569] mb-1.5">
                    Kata sandi saat ini <span className="text-[#E11D48]">*</span>
                  </label>
                  <input
                    id={currentPasswordId}
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Masukkan kata sandi lama"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor={newPasswordId} className="block text-[13px] leading-[20px] font-medium text-[#475569]">
                      Kata sandi baru <span className="text-[#E11D48]">*</span>
                    </label>
                    {newPassword && (
                      <span className={`text-[12px] font-semibold ${strength.textCol}`}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                  <input
                    id={newPasswordId}
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Minimal 8 karakter"
                    required
                  />

                  {/* Dynamic Password Strength Progress Bar */}
                  {newPassword && (
                    <div className="mt-2 space-y-2">
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                          style={{ width: `${strength.score}%` }}
                        />
                      </div>

                      {/* Interactive Checklist Criteria */}
                      <div className="grid grid-cols-2 gap-2 pt-1 text-[11.5px]">
                        <div className={`flex items-center gap-1.5 ${pwdCriteria.minLen ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          <FontAwesome name={pwdCriteria.minLen ? "circle-check" : "circle"} variant="solid" className="text-[10px]" />
                          <span>Minimal 8 karakter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${pwdCriteria.hasUpperLower ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          <FontAwesome name={pwdCriteria.hasUpperLower ? "circle-check" : "circle"} variant="solid" className="text-[10px]" />
                          <span>Huruf besar & kecil</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${pwdCriteria.hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          <FontAwesome name={pwdCriteria.hasNumber ? "circle-check" : "circle"} variant="solid" className="text-[10px]" />
                          <span>Mengandung angka (0-9)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${pwdCriteria.hasSpecial ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                          <FontAwesome name={pwdCriteria.hasSpecial ? "circle-check" : "circle"} variant="solid" className="text-[10px]" />
                          <span>Simbol khusus (@, #, $)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor={confirmPasswordId} className="block text-[13px] leading-[20px] font-medium text-[#475569]">
                      Konfirmasi kata sandi baru <span className="text-[#E11D48]">*</span>
                    </label>
                    {passwordsMatch && (
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <FontAwesome name="check" variant="solid" className="text-[10px]" />
                        Password cocok
                      </span>
                    )}
                    {passwordsMismatch && (
                      <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                        <FontAwesome name="xmark" variant="solid" className="text-[10px]" />
                        Belum sama
                      </span>
                    )}
                  </div>
                  <input
                    id={confirmPasswordId}
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`${inputClass} ${passwordsMismatch ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : ''}`}
                    placeholder="Ulangi kata sandi baru"
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving || (!!confirmPassword && !passwordsMatch)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-[14px] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed rounded-[10px] transition-colors cursor-pointer shadow-xs"
                  >
                    <FontAwesome
                      name={saving ? "spinner" : "lock"}
                      variant="solid"
                      className={`text-xs ${saving ? 'animate-spin' : ''}`}
                    />
                    <span>{saving ? 'Menyimpan perubahan...' : 'Perbarui kata sandi'}</span>
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        {/* Kolom Kanan: Manajemen Privasi & Sesi (5 Kolom) */}
        <div className="lg:col-span-5 space-y-6">

          {/* Card Manajemen Privasi & Sesi */}
          <Card className="p-6 lg:p-7 space-y-5 border-rose-100/80 shadow-xs border">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
              <FontAwesome name="shield-halved" variant="solid" className="text-[20px] text-[#E11D48] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-[16px] leading-[24px] font-semibold text-[#0F172A]">Manajemen privasi & sesi</h2>
                <p className="text-[13px] leading-[20px] font-normal text-[#64748B] mt-0.5">Pembersihan data riwayat pengisian dan sesi akun</p>
              </div>
            </div>

            {clearActivityMsg && (
              <div
                className={`p-3.5 rounded-xl flex items-center gap-2.5 text-xs font-semibold border shadow-2xs transition-all ${
                  clearActivityMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {clearActivityMsg.type === 'success' ? (
                  <Flaticon name="check" className="text-xs text-emerald-600 shrink-0" />
                ) : (
                  <Flaticon name="info" className="text-xs text-rose-600 shrink-0" />
                )}
                <span>{clearActivityMsg.text}</span>
              </div>
            )}

            {/* Clear History Box */}
            <div className="p-4 rounded-[12px] bg-[#FFF8F8] border border-[#FDE2E6] space-y-3">
              <div>
                <p className="text-[14px] leading-[20px] font-medium text-[#0F172A]">Bersihkan riwayat aktivitas</p>
                <p className="text-[12.5px] leading-[18px] font-normal text-[#64748B] mt-0.5">
                  Menghapus seluruh log formulir dan domain yang pernah diisi untuk privasi maksimal.
                </p>
              </div>

              {!showConfirmClear ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowConfirmClear(true)}
                  disabled={clearingActivity}
                  icon={<Flaticon name="trash" className="text-xs" />}
                  className="font-semibold text-[13px]"
                >
                  Hapus riwayat
                </Button>
              ) : (
                <div className="pt-1 space-y-2">
                  <p className="text-[12px] font-semibold text-rose-800">
                    Konfirmasi: Hapus SELURUH riwayat aktivitas? Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleClearActivities}
                      loading={clearingActivity}
                      className="font-semibold text-[12px]"
                    >
                      Ya, hapus sekarang
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmClear(false)}
                      className="px-3 py-1.5 text-[12px] font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-[8px] cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={logout}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[14px] font-medium text-[#475569] bg-white hover:border-[#2563EB] hover:text-[#2563EB] border border-[#E8ECF2] rounded-[10px] transition-colors cursor-pointer"
              >
                <Flaticon name="sign-out-alt" className="text-[16px] text-inherit" />
                <span>Keluar dari akun (logout)</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}