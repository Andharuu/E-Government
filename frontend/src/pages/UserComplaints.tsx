import { useState, useCallback } from 'react';
import {
  complaintsApi, type Complaint, type ReportType,
  type SecurityKind, type SecuritySource, type SecuritySeverity,
} from '../services/api';
import { usePolling } from '../hooks/usePolling';
import {
  AdminCard, SectionTitle, StatusBadge, PriorityBadge, CATEGORY_LABEL,
  ReportTypeBadge, SeverityBadge, SECURITY_KIND_LABEL, SECURITY_SOURCE_LABEL,
  SEVERITY_META,
  EmptyState, LoadingBlock, formatDateTime, LiveSyncBar,
} from '../components/admin/adminUi';

const FIELD_CLS =
  'w-full h-11 px-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 outline-none text-sm transition-all bg-white';
const LABEL_CLS = 'text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-1.5 block';

export function UserComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [reportType, setReportType] = useState<ReportType>('layanan');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // Service complaint fields
  const [category, setCategory] = useState('pelayanan');
  const [priority, setPriority] = useState('sedang');
  // Security report fields
  const [securityKind, setSecurityKind] = useState<SecurityKind>('kebocoran_data');
  const [securitySource, setSecuritySource] = useState<SecuritySource>('web');
  const [affectedUrl, setAffectedUrl] = useState('');
  const [severity, setSeverity] = useState<SecuritySeverity>('tinggi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await complaintsApi.list();
      setComplaints(res.data);
    } catch {
      // Diamkan: live-sync berikutnya akan mencoba lagi.
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Live sync: see admin status/resolution updates without refreshing.
  const { refresh, lastUpdated } = usePolling(() => load(true), { interval: 15000 });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAffectedUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (reportType === 'keamanan') {
        // Priority untuk triage: 'kritis' dipetakan ke 'tinggi' (prioritas hanya
        // mendukung rendah/sedang/tinggi).
        const priorityForTriage = severity === 'kritis' ? 'tinggi' : severity;
        await complaintsApi.create({
          title,
          description,
          category: 'teknis',
          priority: priorityForTriage,
          report_type: 'keamanan',
          security_kind: securityKind,
          security_source: securitySource,
          affected_url: affectedUrl || undefined,
          severity,
        });
      } else {
        await complaintsApi.create({ title, description, category, priority, report_type: 'layanan' });
      }
      resetForm();
      await load(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const securityReports = complaints.filter(c => c.report_type === 'keamanan');
  const pending = complaints.filter(c => ['diterima', 'diproses'].includes(c.status)).length;
  const done = complaints.filter(c => ['selesai', 'ditolak'].includes(c.status)).length;
  const canSubmit = title.trim() && description.trim();

  return (
    <div className="w-full space-y-5 pb-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1121] tracking-tight">Pengaduan & Laporan Keamanan</h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">
            Laporkan keluhan layanan, bug, atau dugaan kebocoran data — pantau tindak lanjutnya langsung
          </p>
        </div>
        <LiveSyncBar lastUpdated={lastUpdated} onRefresh={refresh} />
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <AdminCard className="p-4">
          <p className="text-xs font-semibold text-slate-500">Total</p>
          <p className="text-2xl font-black text-[#0B1121] mt-1">{complaints.length}</p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-xs font-semibold text-slate-500">Laporan Keamanan</p>
          <p className="text-2xl font-black text-violet-600 mt-1">{securityReports.length}</p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-xs font-semibold text-slate-500">Dalam Proses</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{pending}</p>
        </AdminCard>
        <AdminCard className="p-4">
          <p className="text-xs font-semibold text-slate-500">Selesai</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{done}</p>
        </AdminCard>
      </div>

      {/* Submission form */}
      <AdminCard>
        <SectionTitle icon="comment-dots" title="Buat Laporan / Pengaduan" subtitle="Pilih jenis laporan lalu isi detailnya" />
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Report type selector */}
          <div>
            <label className={LABEL_CLS}>Jenis Laporan</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReportType('layanan')}
                className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  reportType === 'layanan'
                    ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-100/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] ${reportType === 'layanan' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    📋
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#0B1121]">Pengaduan Layanan</p>
                    <p className="text-[11px] text-slate-500">Keluhan layanan publik, fasilitas, pelayanan</p>
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setReportType('keamanan')}
                className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  reportType === 'keamanan'
                    ? 'border-violet-500 bg-violet-50/60 ring-4 ring-violet-100/60'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-[13px] ${reportType === 'keamanan' ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    🛡️
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#0B1121]">Keamanan & Bug</p>
                    <p className="text-[11px] text-slate-500">Kebocoran data, privasi, bug ekstensi/web</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {reportType === 'keamanan' && (
            <div className="rounded-xl bg-violet-50 border border-violet-100 p-3.5 text-[12px] text-violet-800 leading-relaxed">
              <strong className="font-bold">Mode laporan keamanan.</strong> Jelaskan sejelas mungkin: apa yang bocor/error,
              langkah yang memicu, dan dampaknya. Identitas Anda hanya terlihat sebagai email oleh petugas — data pribadi
              (NIK, telepon, alamat) tetap terenkripsi dan tidak ditampilkan.
            </div>
          )}

          <div>
            <label className={LABEL_CLS}>Judul</label>
            <input
              className={FIELD_CLS}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={reportType === 'keamanan' ? 'Contoh: Riwayat pencarian bocor ke situs lain' : 'Ringkas keluhan Anda...'}
              required
            />
          </div>

          {reportType === 'keamanan' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Jenis Masalah</label>
                  <select className={FIELD_CLS} value={securityKind} onChange={e => setSecurityKind(e.target.value as SecurityKind)}>
                    {Object.entries(SECURITY_KIND_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Sumber Masalah</label>
                  <select className={FIELD_CLS} value={securitySource} onChange={e => setSecuritySource(e.target.value as SecuritySource)}>
                    {Object.entries(SECURITY_SOURCE_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Tingkat Keparahan</label>
                  <select className={FIELD_CLS} value={severity} onChange={e => setSeverity(e.target.value as SecuritySeverity)}>
                    {Object.entries(SEVERITY_META).map(([v, m]) => (
                      <option key={v} value={v}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>URL / Halaman Terkait <span className="normal-case text-slate-300">(opsional)</span></label>
                  <input
                    className={FIELD_CLS}
                    value={affectedUrl}
                    onChange={e => setAffectedUrl(e.target.value)}
                    placeholder="https://... (halaman tempat masalah terjadi)"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>Kategori</label>
                <select className={FIELD_CLS} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="pelayanan">Pelayanan</option>
                  <option value="teknis">Teknis</option>
                  <option value="administrasi">Administrasi</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Prioritas</label>
                <select className={FIELD_CLS} value={priority} onChange={e => setPriority(e.target.value)}>
                  <option value="rendah">Rendah</option>
                  <option value="sedang">Sedang</option>
                  <option value="tinggi">Tinggi</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className={LABEL_CLS}>Deskripsi</label>
            <textarea
              className="w-full p-3.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/60 outline-none text-sm resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder={reportType === 'keamanan'
                ? 'Jelaskan: apa yang terjadi, langkah reproduksi, data/situs yang terdampak...'
                : 'Jelaskan detail keluhan Anda...'}
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className={`px-5 h-11 rounded-xl font-semibold text-sm text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                reportType === 'keamanan' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Mengirim...' : reportType === 'keamanan' ? 'Kirim Laporan Keamanan' : 'Kirim Pengaduan'}
            </button>
          </div>
        </form>
      </AdminCard>

      {/* History */}
      <AdminCard>
        <SectionTitle icon="inbox" title="Riwayat Laporan" subtitle={`${complaints.length} laporan`} />
        {isLoading ? (
          <LoadingBlock />
        ) : complaints.length === 0 ? (
          <EmptyState icon="inbox" title="Belum ada laporan" desc="Pengaduan/laporan yang Anda kirim akan tampil di sini." />
        ) : (
          <div className="p-5 space-y-3">
            {complaints.map(c => {
              const isSec = c.report_type === 'keamanan';
              return (
                <div
                  key={c.id}
                  className={`rounded-xl p-4 transition-colors border ${
                    isSec ? 'border-violet-200 bg-violet-50/30 hover:border-violet-300' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <ReportTypeBadge type={c.report_type} />
                        <p className="font-bold text-[#0B1121]">{c.title}</p>
                      </div>
                      <p className={`font-mono text-[11px] mt-1 ${isSec ? 'text-violet-600' : 'text-blue-600'}`}>{c.reference_number}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {isSec && <SeverityBadge severity={c.severity} />}
                      {!isSec && <PriorityBadge priority={c.priority} />}
                      <StatusBadge status={c.status} />
                    </div>
                  </div>

                  {isSec && (
                    <div className="flex items-center gap-2 flex-wrap mt-2.5">
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-violet-200 text-violet-700 font-semibold">
                        {SECURITY_KIND_LABEL[c.security_kind || ''] || 'Keamanan'}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-medium">
                        {SECURITY_SOURCE_LABEL[c.security_source || ''] || '-'}
                      </span>
                      {c.affected_url && (
                        <span className="text-[11px] text-slate-500 truncate max-w-[280px]" title={c.affected_url}>
                          🔗 {c.affected_url}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-sm text-slate-600 mt-2.5 whitespace-pre-line">{c.description}</p>

                  {c.resolution && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-[11px] uppercase tracking-wide text-emerald-600 font-bold mb-1">Tanggapan Petugas</p>
                      <p className="text-sm text-emerald-800">{c.resolution}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                    <span>Kategori: {CATEGORY_LABEL[c.category] || c.category}</span>
                    <span>Dibuat: {formatDateTime(c.created_at)}</span>
                    <span>Diperbarui: {formatDateTime(c.updated_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AdminCard>
    </div>
  );
}

export default UserComplaintsPage;
