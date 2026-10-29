import { useState } from 'react';
import { FontAwesome } from '../ui';

interface AuthHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
}

export function AuthHelpModal({ isOpen, onClose, defaultEmail = '' }: AuthHelpModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(defaultEmail);
  const [category, setCategory] = useState('login');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/complaints/public-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Gagal mengirim tiket bantuan');
      }

      const data = await res.json();
      setSuccessRef(data.reference_number || 'HLP-TERKIRIM');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessRef(null);
    setName('');
    setEmail(defaultEmail);
    setSubject('');
    setMessage('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#131C2E] rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={handleReset}
          className="absolute right-5 top-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <FontAwesome name="cross-small" className="text-base" />
        </button>

        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-[#0A4174] dark:text-sky-400 flex items-center justify-center text-xl shrink-0">
            <FontAwesome name="circle-info" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Pusat Bantuan & Layanan Warga
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pesan terhubung langsung ke database dan ditinjau oleh Admin GovConnect
            </p>
          </div>
        </div>

        {successRef ? (
          <div className="py-6 space-y-4 text-center my-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-xs">
              <FontAwesome name="circle-check" />
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                Tiket Bantuan Berhasil Dibuat!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                Laporan kendala Anda telah disimpan ke sistem pengaduan dan akan segera ditindaklanjuti oleh petugas administrator.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs inline-block">
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider font-bold">Nomor Tiket Pengaduan:</span>
              <strong className="text-blue-600 dark:text-sky-400 font-mono text-sm tracking-wider">{successRef}</strong>
            </div>
            <div className="pt-2">
              <button
                onClick={handleReset}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto space-y-3.5 pr-1 flex-1">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <FontAwesome name="circle-xmark" className="text-sm shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nama pemohon/warga..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email untuk tindak lanjut..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Kategori Bantuan
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="login">Kendala Login & Akses Akun</option>
                <option value="ekstensi">Masalah Ekstensi Autofill</option>
                <option value="pelayanan">Pertanyaan Layanan Kependudukan</option>
                <option value="keamanan">Laporan Bug / Keamanan Data</option>
                <option value="teknis">Kendala Teknis Lainnya</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Subjek / Judul Kendala
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Contoh: Tidak dapat menerima email verifikasi"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Uraian Kendala
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Jelaskan secara singkat kendala yang Anda alami..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400">
                Data akan tersimpan di sistem pengaduan resmi GovConnect.
              </span>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-[#0A4174] hover:bg-[#001D39] text-white font-bold text-xs transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2 cursor-pointer shrink-0"
              >
                {loading ? (
                  <>
                    <FontAwesome name="spinner" spin className="text-xs" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <FontAwesome name="paper-plane" className="text-xs" />
                    <span>Kirim Pesan Bantuan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

