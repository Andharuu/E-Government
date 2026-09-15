import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Loader2, Save, Key, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      // In a real app, call API to change password
      // For now just simulate
      await new Promise(r => setTimeout(r, 1000));
      setMessage({ type: 'success', text: 'Password berhasil diubah' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage({ type: 'error', text: 'Gagal mengubah password' });
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

      {/* Extension Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-slate-500" />
          Extension
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div>
                <p className="font-medium text-slate-900">Connection Status</p>
                <p className="text-sm text-slate-500">Connected to GovConnect</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>
          </div>
          <p className="text-sm text-slate-500">
            Extension Anda terhubung ke akun ini. Gunakan popup extension untuk membuka Side Panel autofill.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Danger Zone
        </h2>
        <button
          onClick={logout}
          className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 font-medium rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}