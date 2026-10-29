import { useState } from 'react';
import { adminApi } from '../../services/api';
import { Button, FontAwesome } from '../../components/ui';
import { AdminCard, SectionTitle } from '../../components/admin/adminUi';

const TYPES = [
  {
    key: 'info',
    label: 'Informasi',
    desc: 'Pemberitahuan umum',
    icon: 'circle-info',
    toneActive: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20'
  },
  {
    key: 'success',
    label: 'Sukses',
    desc: 'Kabar baik / pemeliharaan selesai',
    icon: 'circle-check',
    toneActive: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20'
  },
  {
    key: 'warning',
    label: 'Peringatan',
    desc: 'Perlu perhatian segera',
    icon: 'triangle-exclamation',
    toneActive: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20'
  },
  {
    key: 'system',
    label: 'Sistem',
    desc: 'Pemeliharaan / gangguan teknis',
    icon: 'gear',
    toneActive: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
  },
];

export function AdminAnnouncements() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('info');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const selectedType = TYPES.find(t => t.key === type) || TYPES[0];

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
      setResult({ ok: false, msg: 'Gagal mengirim pengumuman. Coba lagi.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full space-y-5 pb-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pengumuman Massal</h1>
        <p className="text-sm text-slate-500 dark:text-[#6EA2B3] mt-1.5 font-medium">
          Kirim pemberitahuan sistem ke seluruh pengguna aktif
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
        <AdminCard>
          <SectionTitle icon="bullhorn" title="Buat Pengumuman" subtitle="Notifikasi akan masuk ke kotak notifikasi semua warga" />
          <div className="p-5 space-y-5">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] font-bold mb-1.5 block">Judul</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Pemeliharaan sistem 25 Desember 2026"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#101828] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6EA2B3]/50 focus:border-blue-500 dark:focus:border-[#7BBDE8] focus:ring-4 focus:ring-blue-100/60 dark:focus:ring-blue-900/30 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] font-bold mb-1.5 block">Tipe Pemberitahuan</label>
              <div className="grid grid-cols-2 gap-2.5">
                {TYPES.map(t => {
                  const isActive = type === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setType(t.key)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? t.toneActive
                          : 'bg-white dark:bg-[#101828] border-slate-200 dark:border-[#243048] hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-[#6EA2B3]'
                      }`}
                    >
                      <span className="mt-0.5 shrink-0">
                        <FontAwesome name={t.icon} className="text-sm" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">{t.label}</span>
                        <span className="block text-[10px] text-slate-500 dark:text-[#6EA2B3] mt-0.5 leading-snug">{t.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] font-bold mb-1.5 block">Pesan</label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={4}
                placeholder="Tuliskan isi pesan pengumuman untuk seluruh warga..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#101828] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6EA2B3]/50 focus:border-blue-500 dark:focus:border-[#7BBDE8] focus:ring-4 focus:ring-blue-100/60 dark:focus:ring-blue-900/30 outline-none text-sm resize-none"
              />
            </div>

            {result && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                result.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
              }`}>
                <FontAwesome name={result.ok ? 'circle-check' : 'circle-xmark'} className="text-sm" />
                <span>{result.msg}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                onClick={send}
                loading={sending}
                disabled={!title.trim()}
                icon={<FontAwesome name="paper-plane" className="text-xs" />}
              >
                Kirim ke Semua Pengguna
              </Button>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="h-fit">
          <SectionTitle icon="eye" title="Pratinjau Langsung" subtitle="Simulasi tampilan notifikasi warga" />
          <div className="p-5">
            <div className="border border-slate-200 dark:border-[#243048] rounded-xl p-4 bg-slate-50/80 dark:bg-[#101828]/80 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                  type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                  : type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
                  : type === 'system' ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                }`}>
                  <FontAwesome name={selectedType.icon} className="text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{title || 'Judul pengumuman Anda'}</p>
                  <p className="text-xs text-slate-600 dark:text-[#6EA2B3] mt-1.5 leading-relaxed whitespace-pre-wrap">
                    {desc || 'Isi pesan akan tampil di sini saat warga membuka notifikasi...'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-[#6EA2B3]/70 mt-2 font-medium">baru saja</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#6EA2B3]">
              <FontAwesome name="lock" className="text-xs" />
              <span>Pengumuman bersifat massal dan aman tanpa eksposur PII warga.</span>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}
