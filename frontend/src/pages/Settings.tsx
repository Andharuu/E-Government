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
    setSyncStatusMsg(enabled ? '⚡ Mode 1-Klik Instan aktif! Menekan tombol ekstensi di toolbar akan langsung mengisi form.' : '📋 Mode Panel Samping aktif! Menekan tombol ekstensi akan membuka panel.');
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
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Kelola akun dan pengaturan ekstensi</p>
      </div>

      {/* Account Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-slate-500" />
          Account
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900">
              {user?.email}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Change Password</h3>
            {message && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                <input
                  id="currentPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input
                  id="newPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={e => setShowPasswords(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                />
                Show passwords
              </label>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Extension Autofill Mode Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Mode Pengisian Ekstensi (Autofill)</h2>
              <p className="text-xs text-slate-500">Tentukan perilaku saat Anda menekan tombol ekstensi di browser toolbar</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
            oneClickMode
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            {oneClickMode ? '⚡ Mode 1-Klik Aktif' : '📋 Mode Panel Aktif'}
          </span>
        </div>

        {syncStatusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            {syncStatusMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Opsi 1: Mode 1-Klik Instan */}
          <button
            type="button"
            onClick={() => handleToggleOneClickMode(true)}
            className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
              oneClickMode
                ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    oneClickMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Zap className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Mode 1-Klik Instan</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Rekomendasi
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cukup klik 1 kali pada tombol ekstensi di toolbar browser, form pada tab aktif <b>langsung terisi otomatis seketika</b> tanpa perlu membuka panel atau konfirmasi lagi.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-blue-600" /> Cepat & Seketika
              </span>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                oneClickMode ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
              }`}>
                {oneClickMode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </button>

          {/* Opsi 2: Mode Panel Samping (Manual) */}
          <button
            type="button"
            onClick={() => handleToggleOneClickMode(false)}
            className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
              !oneClickMode
                ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    !oneClickMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <Sliders className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-900">Mode Panel Samping</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  Manual
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Menekan tombol ekstensi di toolbar akan membuka <b>Side Panel</b> untuk meninjau formulir terdeteksi dan memilih kolom secara manual sebelum diisi.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-slate-600" /> Pratinjau Manual
              </span>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                !oneClickMode ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
              }`}>
                {!oneClickMode && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Extension Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-slate-500" />
          Status Koneksi Ekstensi
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${isExtensionConnected ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`} />
              <div>
                <p className="font-medium text-slate-900">Status Koneksi Ekstensi</p>
                <p className="text-sm text-slate-500">
                  {isExtensionConnected
                    ? 'Ekstensi Chrome aktif dan tersinkronisasi'
                    : 'Ekstensi siap digunakan'}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                isExtensionConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {isExtensionConnected ? 'Tersinkron' : 'Siap'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Ekstensi GovConnect mendeteksi sesi login Anda secara otomatis melalui content script. Saat Anda mengisi formulir publik dengan ekstensi, hasil dan log aktivitas akan langsung tercatat pada dashboard ini.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Danger Zone
        </h2>

        {clearActivityMsg && (
          <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
            clearActivityMsg.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {clearActivityMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{clearActivityMsg.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-red-50/50 border border-red-100">
          <div>
            <p className="text-sm font-semibold text-slate-900">Bersihkan Riwayat Aktivitas</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Hapus seluruh riwayat aktivitas autofill untuk perlindungan privasi data pribadi (PRD §23).
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearActivities}
            disabled={clearingActivity}
            className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {clearingActivity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            {clearingActivity ? 'Membersihkan...' : 'Hapus Semua Riwayat'}
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full py-2.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <WifiOff className="w-4 h-4 text-slate-500" />
            Keluar dari Akun (Logout)
          </button>
        </div>
      </div>
    </div>
  );
}