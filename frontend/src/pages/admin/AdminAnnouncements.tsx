import { useState } from 'react';
import { adminApi } from '../../services/api';
import {
  Button, FontAwesome, Card, CardHeader, CardTitle, CardDescription,
  CardContent, Input, Textarea,
} from '../../components/ui';

const TYPES = [
  {
    key: 'info',
    label: 'Informasi',
    desc: 'Pemberitahuan umum',
    icon: 'circle-info',
  },
  {
    key: 'success',
    label: 'Sukses',
    desc: 'Kabar baik / pemeliharaan selesai',
    icon: 'circle-check',
  },
  {
    key: 'warning',
    label: 'Peringatan',
    desc: 'Perlu perhatian segera',
    icon: 'triangle-exclamation',
  },
  {
    key: 'system',
    label: 'Sistem',
    desc: 'Pemeliharaan / gangguan teknis',
    icon: 'gear',
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
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Komunikasi</p>
          <h1 className="page-title">Pengumuman Massal</h1>
          <p className="page-sub">Kirim pemberitahuan sistem ke seluruh pengguna aktif</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Buat Pengumuman</CardTitle>
              <CardDescription>Notifikasi akan masuk ke kotak notifikasi semua warga</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div>
              <label className="label" htmlFor="ann-title">Judul</label>
              <Input
                id="ann-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Contoh: Pemeliharaan sistem 25 Desember 2026"
              />
            </div>

            <div>
              <span className="label">Tipe Pemberitahuan</span>
              <div className="grid grid-cols-2 gap-2.5">
                {TYPES.map(t => {
                  const isActive = type === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setType(t.key)}
                      aria-pressed={isActive}
                      className={`flex items-start gap-2.5 p-3 rounded-md border text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'border-accent bg-accent-soft'
                          : 'border-line bg-surface hover:bg-surface-2'
                      }`}
                    >
                      <span className={`mt-0.5 shrink-0 text-[13px] ${isActive ? 'text-accent-text' : 'text-ink-3'}`}>
                        <FontAwesome name={t.icon} />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[12.5px] font-semibold ${isActive ? 'text-accent-text' : 'text-ink'}`}>
                          {t.label}
                        </span>
                        <span className="block text-[11px] text-ink-3 mt-0.5 leading-snug">{t.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="ann-desc">Pesan</label>
              <Textarea
                id="ann-desc"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                rows={4}
                placeholder="Tuliskan isi pesan pengumuman untuk seluruh warga..."
              />
            </div>

            {result && (
              <div
                className={`flex items-center gap-2 px-3 py-2.5 rounded-md border text-[12.5px] font-medium ${
                  result.ok
                    ? 'border-ok-line bg-ok-soft text-ok'
                    : 'border-danger-line bg-danger-soft text-danger'
                }`}
              >
                <FontAwesome name={result.ok ? 'circle-check' : 'circle-xmark'} className="text-[13px] shrink-0" />
                <span>{result.msg}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Button
                variant="primary"
                onClick={send}
                loading={sending}
                disabled={!title.trim()}
                icon={<FontAwesome name="paper-plane" className="text-[12px]" />}
              >
                Kirim ke Semua Pengguna
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <div>
              <CardTitle>Pratinjau Langsung</CardTitle>
              <CardDescription>Simulasi tampilan notifikasi warga</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <div className="rounded-md border border-line bg-surface-2 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md border border-line bg-surface text-ink-2 flex items-center justify-center shrink-0">
                  <FontAwesome name={selectedType.icon} className="text-[13px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink leading-snug">
                    {title || 'Judul pengumuman Anda'}
                  </p>
                  <p className="text-[12px] text-ink-2 mt-1.5 leading-relaxed whitespace-pre-wrap">
                    {desc || 'Isi pesan akan tampil di sini saat warga membuka notifikasi...'}
                  </p>
                  <p className="text-[11px] text-ink-3 mt-2">baru saja</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 text-[11.5px] text-ink-3 leading-relaxed">
              <FontAwesome name="lock" className="text-[11px] mt-0.5 shrink-0" />
              <span>Pengumuman bersifat massal dan aman tanpa eksposur PII warga.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
