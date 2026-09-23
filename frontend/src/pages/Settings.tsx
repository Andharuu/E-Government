import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { Loader2, Save, Key, CheckCircle, AlertCircle, Wifi, WifiOff, Zap, Sliders, Check, Trash2 } from 'lucide-react';
import { authApi, activityApi } from '../services/api';

export function SettingsPage() {
  const { user, logout, isExtensionConnected } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [oneClickMode, setOneClickMode] = useState(() => {
    return localStorage.getItem('govconnect_one_click_mode') !== 'false';
  });
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === 'object') {
        if (event.data.type === 'GOVCONNECT_EXTENSION_READY' || event.data.type === 'GOVCONNECT_EXTENSION_PONG') {
          if (typeof event.data.oneClickMode === 'boolean') {
            setOneClickMode(event.data.oneClickMode);
            localStorage.setItem('govconnect_one_click_mode', String(event.data.oneClickMode));
          }
        }
        if (event.data.type === 'GOVCONNECT_ONE_CLICK_MODE_UPDATED') {
          if (typeof event.data.oneClickMode === 'boolean') {
            setOneClickMode(event.data.oneClickMode);
            localStorage.setItem('govconnect_one_click_mode', String(event.data.oneClickMode));
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.postMessage({ type: 'GOVCONNECT_PING_EXTENSION' }, '*');
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleToggleOneClickMode = (enabled: boolean) => {
    setOneClickMode(enabled);
    localStorage.setItem('govconnect_one_click_mode', String(enabled));
    window.postMessage({
      type: 'GOVCONNECT_SET_ONE_CLICK_MODE',
      enabled: enabled
    }, '*');
    setSyncStatusMsg(enabled ? 'Mode 1-Klik Instan aktif! Menekan tombol ekstensi di toolbar akan langsung mengisi form.' : 'Mode Panel Samping aktif! Menekan tombol ekstensi akan membuka panel.');
    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const [clearingActivity, setClearingActivity] = useState(false);
  const [clearActivityMsg, setClearActivityMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleClearActivities = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus SELURUH riwayat aktivitas autofill? Tindakan ini tidak dapat dibatalkan.')) {
      return;
    }
    setClearingActivity(true);
    setClearActivityMsg(null);
    try {
      const res = await activityApi.clearAll();
      setClearActivityMsg({
        type: 'success',
        text: res.data.detail || 'Seluruh riwayat aktivitas berhasil dibersihkan.'
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
      setMessage({ type: 'error', text: 'Password baru tidak cocok' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password minimal 8 karakter' });
      return;
    }
    setSaving(true);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: res.data.detail || 'Password berhasil diperbarui!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Gagal mengubah password';
      setMessage({ type: 'error', text: detail });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-content-primary">Settings</h1>
        <p className="text-content-tertiary mt-1 text-sm">Kelola akun dan pengaturan ekstensi</p>
      </div>

      {/* Account Section */}
      <div className="bg-surface-elevated rounded-lg border border-border-default p-6">
        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-content-tertiary" />
          Account
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-content-secondary mb-1.5">Email</label>
            <div className="bg-surface-sunken border border-border-default rounded-md px-3 py-2.5 text-sm text-content-primary tabular-nums">
              {user?.email}
            </div>
          </div>

          <div className="pt-4 border-t border-border-default">
            <h3 className="text-sm font-medium text-content-secondary mb-3">Change Password</h3>
            {message && (
              <div className={`mb-4 p-3 rounded-md flex items-center gap-2 text-sm ${
                message.type === 'success' ? 'bg-success-light text-success-dark border border-success/30'
                : 'bg-error-light text-error-dark border border-error/30'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-content-secondary mb-1.5">Current Password</label>
                <input
                  id="currentPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border-default rounded-md bg-surface-elevated text-content-primary placeholder:text-content-disabled focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-colors-fast"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-content-secondary mb-1.5">New Password</label>
                <input
                  id="newPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border-default rounded-md bg-surface-elevated text-content-primary placeholder:text-content-disabled focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-colors-fast"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-content-secondary mb-1.5">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border-default rounded-md bg-surface-elevated text-content-primary placeholder:text-content-disabled focus:outline-none focus:ring-2 focus:ring-border-focus focus:border-transparent transition-colors-fast"
                  placeholder="••••••••"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-content-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={e => setShowPasswords(e.target.checked)}
                  className="w-4 h-4 text-brand-600 border-border-default rounded focus:ring-border-focus"
                />
                Show passwords
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-brand-600 text-white font-medium rounded-md hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors-fast active-scale"
              >
                <Save className="w-4 h-4" />
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Extension Autofill Mode Settings */}
      <div className="bg-surface-elevated rounded-lg border border-border-default p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-accent-light text-brand-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-content-primary">Mode Pengisian Ekstensi (Autofill)</h2>
              <p className="text-xs text-content-tertiary">Tentukan perilaku saat Anda menekan tombol ekstensi di browser toolbar</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
            oneClickMode
              ? 'bg-accent-light text-brand-600 border-brand-500/30'
              : 'bg-surface-sunken text-content-secondary border-border-default'
          }`}>
            {oneClickMode ? 'Mode 1-Klik Aktif' : 'Mode Panel Aktif'}
          </span>
        </div>

        {syncStatusMsg && (
          <div className="p-3 bg-success-light border border-success/30 rounded-md text-success-dark text-xs font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
            {syncStatusMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opsi 1: Mode 1-Klik Instan */}
          <button
            type="button"
            onClick={() => handleToggleOneClickMode(true)}
            className={`p-4 rounded-lg border-2 text-left transition-colors-fast relative flex flex-col justify-between ${
              oneClickMode
                ? 'border-brand-600 bg-accent-light/50'
                : 'border-border-default bg-surface-elevated hover:border-border-strong'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                    oneClickMode ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-content-tertiary'
                  }`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-content-primary">Mode 1-Klik Instan</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-success-light text-success-dark">
                  Rekomendasi
                </span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed prose-measure">
                Cukup klik 1 kali pada tombol ekstensi di toolbar browser, form pada tab aktif <b>langsung terisi otomatis seketika</b> tanpa perlu membuka panel atau konfirmasi lagi.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border-default flex items-center justify-between text-xs">
              <span className="text-content-tertiary font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-brand-600" /> Cepat & Seketika
              </span>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                oneClickMode ? 'border-brand-600 bg-brand-600' : 'border-border-strong'
              }`}>
                {oneClickMode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </button>

          {/* Opsi 2: Mode Panel Samping (Manual) */}
          <button
            type="button"
            onClick={() => handleToggleOneClickMode(false)}
            className={`p-4 rounded-lg border-2 text-left transition-colors-fast relative flex flex-col justify-between ${
              !oneClickMode
                ? 'border-brand-600 bg-accent-light/50'
                : 'border-border-default bg-surface-elevated hover:border-border-strong'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                    !oneClickMode ? 'bg-brand-600 text-white' : 'bg-surface-sunken text-content-tertiary'
                  }`}>
                    <Sliders className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-content-primary">Mode Panel Samping</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-sunken text-content-tertiary">
                  Manual
                </span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed prose-measure">
                Menekan tombol ekstensi di toolbar akan membuka <b>Side Panel</b> untuk meninjau formulir terdeteksi dan memilih kolom secara manual sebelum diisi.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border-default flex items-center justify-between text-xs">
              <span className="text-content-tertiary font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-content-tertiary" /> Pratinjau Manual
              </span>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                !oneClickMode ? 'border-brand-600 bg-brand-600' : 'border-border-strong'
              }`}>
                {!oneClickMode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Extension Section */}
      <div className="bg-surface-elevated rounded-lg border border-border-default p-6">
        <h2 className="text-lg font-semibold text-content-primary mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-content-tertiary" />
          Status Koneksi Ekstensi
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-surface-sunken rounded-md">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isExtensionConnected ? 'bg-success animate-pulse' : 'bg-brand-500'}`} />
              <div>
                <p className="font-medium text-content-primary">Status Koneksi Ekstensi</p>
                <p className="text-sm text-content-tertiary">
                  {isExtensionConnected
                    ? 'Ekstensi Chrome aktif dan tersinkronisasi'
                    : 'Ekstensi siap digunakan'}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                isExtensionConnected
                  ? 'bg-success-light text-success-dark'
                  : 'bg-accent-light text-brand-600'
              }`}
            >
              {isExtensionConnected ? 'Tersinkron' : 'Siap'}
            </span>
          </div>
          <p className="text-sm text-content-tertiary prose-measure">
            Ekstensi GovConnect mendeteksi sesi login Anda secara otomatis melalui content script. Saat Anda mengisi formulir publik dengan ekstensi, hasil dan log aktivitas akan langsung tercatat pada dashboard ini.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-surface-elevated rounded-lg border border-error/30 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-content-primary flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-error" />
          Danger Zone
        </h2>

        {clearActivityMsg && (
          <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${
            clearActivityMsg.type === 'success'
              ? 'bg-success-light text-success-dark border border-success/30'
              : 'bg-error-light text-error-dark border border-error/30'
          }`}>
            {clearActivityMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{clearActivityMsg.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-md bg-error-light/50 border border-error/20">
          <div>
            <p className="text-sm font-semibold text-content-primary">Bersihkan Riwayat Aktivitas</p>
            <p className="text-xs text-content-tertiary mt-0.5">
              Hapus seluruh riwayat aktivitas autofill untuk perlindungan privasi data pribadi (PRD §23).
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearActivities}
            disabled={clearingActivity}
            className="shrink-0 px-4 py-2 bg-error hover:bg-error-dark disabled:opacity-50 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors-fast"
          >
            {clearingActivity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {clearingActivity ? 'Membersihkan...' : 'Hapus Semua Riwayat'}
          </button>
        </div>

        <div className="pt-2 border-t border-border-default">
          <button
            onClick={logout}
            className="w-full py-2.5 bg-surface-sunken text-content-secondary hover:bg-surface-base border border-border-default font-medium rounded-md flex items-center justify-center gap-2 transition-colors-fast"
          >
            <WifiOff className="w-4 h-4 text-content-tertiary" />
            Keluar dari Akun (Logout)
          </button>
        </div>
      </div>
    </div>
  );
}
