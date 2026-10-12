import { useState } from 'react';
import { adminApi } from '../../services/api';
import { Button } from '../../components/ui';
import { AdminCard, SectionTitle } from '../../components/admin/adminUi';

const TYPES = [
  { key: 'info', label: 'Informasi', desc: 'Pemberitahuan umum', icon: 'info', tone: 'bg-blue-50 text-blue-600 border-blue-200' },
  { key: 'success', label: 'Sukses', desc: 'Kabar baik / pemeliharaan selesai', icon: 'check', tone: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  { key: 'warning', label: 'Peringatan', desc: 'Perlu perhatian segera', icon: 'alert-circle', tone: 'bg-amber-50 text-amber-600 border-amber-200' },
  { key: 'system', label: 'Sistem', desc: 'Pemeliharaan / gangguan', icon: 'settings', tone: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
];

export function AdminAnnouncements() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const send = async () => {
    if (!title.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await adminApi.broadcastAnnouncement({ title, desc, type });
      setResult({ ok: true, msg: res.data.detail });
      setTitle('');
      setDesc('');
    } catch {
      setResult({ ok: false, msg: 'Gagal mengirim pengumuman.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full space-y-5 pb-6">
      <div>
        <h1 className="text-3xl font-extrabold text-[#0B1121] tracking-tight">Pengumuman Massal</h1>
        <p className="text-sm text-slate-500 mt-1.5 font-medium">
          Kirim pemberitahuan sistem ke seluruh pengguna aktif
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
        <AdminCard>
          <SectionTitle icon="paper-plane" title="Buat Pengumuman" subtitle="Notifikasi akan masuk ke kotak notifikasi semua warga" />
          <div className="p-5 space-y-5">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-1.5 block">Judul</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Pemeliharaan sistem 25 Desember 2026"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-1.5 block">Tipe</label>
              <div className="grid grid-cols-2 gap-2.5">
                {TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      type === t.key ? `${t.tone} ring-2 ring-offset-1` : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`text-xs mt-0.5 ${type === t.key ? '' : 'text-slate-400'}`}>
                      {t.key === 'info' ? 'ℹ️' : t.key === 'success' ? '✅' : t.key === 'warning' ? '⚠️' : '⚙️'}
                    </span>
                    <span>
                      <span className="block text-xs font-bold text-slate-700">{t.label}</span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{t.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-1.5 block">Pesan</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={4}
                placeholder="Tuliskan isi pengumuman..."
                className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 outline-none text-sm resize-none"
              />
            </div>

            {result && (
              <div className={`p-3 rounded-xl text-xs font-medium ${result.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                {result.msg}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="primary" onClick={send} loading={sending} disabled={!title.trim()}>
                Kirim ke Semua Pengguna
              </Button>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="h-fit">
          <SectionTitle icon="eye" title="Pratinjau" subtitle="Tampilan notifikasi warga" />
          <div className="p-5">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  type === 'success' ? 'bg-emerald-50 text-emerald-600'
                  : type === 'warning' ? 'bg-amber-50 text-amber-600'
                  : type === 'system' ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-blue-50 text-blue-600'
                }`}>
                  {type === 'info' ? 'ℹ️' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '⚙️'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0B1121]">{title || 'Judul pengumuman Anda'}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {desc || 'Isi pesan akan tampil di sini...'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-2">baru saja</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
              <span>🔒</span>
              <span>Pengumuman tidak mengandung data pribadi warga.</span>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
