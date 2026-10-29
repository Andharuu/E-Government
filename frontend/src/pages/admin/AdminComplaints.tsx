import { useEffect, useState, useCallback, useRef } from 'react';
import { adminApi, type Complaint, type ReportType } from '../../services/api';
import { Button, FontAwesome } from '../../components/ui';
import { usePolling } from '../../hooks/usePolling';
import {
  AdminCard, SectionTitle, StatusBadge, PriorityBadge, CATEGORY_LABEL,
  ReportTypeBadge, SeverityBadge, SECURITY_KIND_LABEL, SECURITY_SOURCE_LABEL,
  EmptyState, LoadingBlock, formatDateTime, LiveSyncBar,
} from '../../components/admin/adminUi';

const STATUS_FILTERS = [
  { key: '', label: 'Semua' },
  { key: 'diterima', label: 'Diterima' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'selesai', label: 'Selesai' },
  { key: 'ditolak', label: 'Ditolak' },
];

const TYPE_FILTERS: { key: '' | ReportType; label: string; icon: string }[] = [
  { key: '', label: 'Semua Laporan', icon: 'list' },
  { key: 'layanan', label: 'Layanan', icon: 'inbox' },
  { key: 'keamanan', label: 'Keamanan & Bug', icon: 'shield-halved' },
];

const ALL_STATUSES = ['diterima', 'diproses', 'selesai', 'ditolak'];
const PAGE_SIZE = 10;

export function AdminComplaints() {
  const [items, setItems] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [reportType, setReportType] = useState<'' | ReportType>('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const firstLoad = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminApi.getComplaints({
        page, page_size: PAGE_SIZE, status: status || undefined,
        report_type: reportType || undefined,
        category: category || undefined, priority: priority || undefined,
        search: search || undefined, sort,
      });
      setItems(res.data.items);
      setTotal(res.data.total);
      setCounts(res.data.counts_by_status);
      setTypeCounts(res.data.counts_by_type || {});
    } catch {
      // Diamkan: polling/live-sync berikutnya akan mencoba lagi.
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, status, reportType, category, priority, sort, search]);

  useEffect(() => { load(firstLoad.current ? false : true); firstLoad.current = false; }, [load]);
  useEffect(() => { setPage(1); }, [status, reportType, category, priority, sort, search]);

  // Live sync: pull new warga reports every 15s (silent — no loading flash).
  const { refresh, lastUpdated } = usePolling(() => load(true), {
    interval: 15000,
    enabled: !selected,
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const totalTypes = (typeCounts.layanan || 0) + (typeCounts.keamanan || 0);

  const handleExport = async () => {
    setIsExporting(true);
    let url: string | null = null;
    try {
      const res = await adminApi.exportComplaintsCsv({
        status: status || undefined, category: category || undefined,
        report_type: reportType || undefined,
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `complaints_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      // Gagal ekspor
    } finally {
      if (url) {
        const objectUrl = url;
        setTimeout(() => window.URL.revokeObjectURL(objectUrl), 200);
      }
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full space-y-5 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Pengaduan & Laporan Keamanan</h1>
          <p className="text-sm text-slate-500 dark:text-[#6EA2B3] mt-1.5 font-medium">
            Kelola pengaduan layanan serta laporan bug/kebocoran data — identitas warga hanya email
          </p>
        </div>
        <Button
          variant="outline"
          icon={<FontAwesome name="download" className="text-xs" />}
          onClick={handleExport}
          loading={isExporting}
        >
          Export CSV
        </Button>
      </div>

      <LiveSyncBar lastUpdated={lastUpdated} onRefresh={refresh} />

      <AdminCard>
        <SectionTitle icon="filter" title="Filter & Pencarian" subtitle="Kombinasikan filter untuk menemukan laporan" />

        {/* Report type tabs */}
        <div className="px-5 pt-4 flex flex-wrap gap-2">
          {TYPE_FILTERS.map(f => {
            const count = f.key === '' ? totalTypes : (typeCounts[f.key] || 0);
            const active = reportType === f.key;
            const isSec = f.key === 'keamanan';
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => { setReportType(f.key); setStatus(''); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                  active
                    ? isSec
                      ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                      : 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-[#101828] text-slate-600 dark:text-[#6EA2B3] border-slate-200 dark:border-[#243048] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${active ? 'bg-white' : isSec ? 'bg-violet-500' : 'bg-blue-500'}`} />
                <span>{f.label}</span>
                <span className={`${active ? 'text-white/80' : 'text-slate-400 dark:text-[#6EA2B3]'}`}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Status chips */}
        <div className="px-5 pt-3 flex flex-wrap gap-2">
          {STATUS_FILTERS.map(f => {
            const count = f.key === '' ? counts['_all'] : counts[f.key];
            const active = status === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatus(f.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  active
                    ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600 shadow-sm'
                    : 'bg-white dark:bg-[#101828] text-slate-600 dark:text-[#6EA2B3] border-slate-200 dark:border-[#243048] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span>{f.label}</span>
                {count !== undefined && (
                  <span className={`ml-1.5 ${active ? 'text-slate-300 dark:text-slate-200' : 'text-slate-400 dark:text-[#6EA2B3]'}`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
              placeholder="Cari referensi / judul / deskripsi..."
              className="w-full h-10 pl-3.5 pr-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#101828] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6EA2B3]/50 focus:border-blue-500 dark:focus:border-[#7BBDE8] focus:ring-4 focus:ring-blue-100/60 dark:focus:ring-blue-900/30 outline-none text-sm transition-all"
            />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#101828] text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-[#7BBDE8] outline-none text-sm"
          >
            <option value="">Semua Kategori</option>
            <option value="pelayanan">Pelayanan</option>
            <option value="teknis">Teknis</option>
            <option value="administrasi">Administrasi</option>
            <option value="lainnya">Lainnya</option>
          </select>
          <div className="flex gap-2">
            <select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#101828] text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-[#7BBDE8] outline-none text-sm"
            >
              <option value="">Prioritas</option>
              <option value="tinggi">Tinggi</option>
              <option value="sedang">Sedang</option>
              <option value="rendah">Rendah</option>
            </select>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as any)}
              className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#101828] text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-[#7BBDE8] outline-none text-sm"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="priority">Prioritas</option>
            </select>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <SectionTitle
          icon={reportType === 'keamanan' ? 'shield-halved' : 'inbox'}
          title={reportType === 'keamanan' ? 'Laporan Keamanan & Bug' : 'Daftar Pengaduan'}
          subtitle={`${total} laporan ditemukan`}
        />
        {loading ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <EmptyState icon={reportType === 'keamanan' ? 'shield-halved' : 'inbox'} title="Tidak ada laporan" desc="Coba ubah filter atau kata kunci pencarian." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] border-b border-slate-200 dark:border-[#243048]">
                  <th className="px-5 py-3 font-bold">Referensi</th>
                  <th className="px-5 py-3 font-bold">Tipe</th>
                  <th className="px-5 py-3 font-bold">Judul</th>
                  <th className="px-5 py-3 font-bold">Pengirim</th>
                  <th className="px-5 py-3 font-bold">Kategori</th>
                  <th className="px-5 py-3 font-bold">Prioritas</th>
                  <th className="px-5 py-3 font-bold">Umur</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map(c => {
                  const isSec = c.report_type === 'keamanan';
                  return (
                    <tr
                      key={c.id}
                      className={`border-b border-slate-100 dark:border-[#1E293B] hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/50 transition-colors ${
                        isSec ? 'bg-violet-50/30 dark:bg-violet-950/20' : ''
                      }`}
                    >
                      <td className={`px-5 py-3 font-mono text-[11px] font-semibold whitespace-nowrap ${isSec ? 'text-violet-600 dark:text-violet-400' : 'text-blue-600 dark:text-[#7BBDE8]'}`}>
                        {c.reference_number}
                      </td>
                      <td className="px-5 py-3"><ReportTypeBadge type={c.report_type} /></td>
                      <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-medium max-w-[200px] truncate">{c.title}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-[#6EA2B3] whitespace-nowrap">{c.user_email}</td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{CATEGORY_LABEL[c.category] || c.category}</td>
                      <td className="px-5 py-3">
                        {isSec ? <SeverityBadge severity={c.severity} /> : <PriorityBadge priority={c.priority} />}
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-[#6EA2B3] whitespace-nowrap">{c.age_days ?? 0} hari</td>
                      <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(c)}>Detail</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-[#243048]">
            <span className="text-xs text-slate-500 dark:text-[#6EA2B3]">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
            </div>
          </div>
        )}
      </AdminCard>

      {selected && (
        <ComplaintDetailModal
          complaint={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { setSelected(null); load(false); }}
        />
      )}
    </div>
  );
}

function ComplaintDetailModal({ complaint, onClose, onUpdated }: {
  complaint: Complaint; onClose: () => void; onUpdated: () => void;
}) {
  const [status, setStatus] = useState(complaint.status);
  const [resolution, setResolution] = useState(complaint.resolution || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const isSec = complaint.report_type === 'keamanan';

  const save = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await adminApi.updateComplaintStatus(complaint.id, { status, resolution });
      onUpdated();
    } catch (err: any) {
      setSaveError(err?.response?.data?.detail || 'Gagal menyimpan perubahan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#171F2F] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#243048] text-slate-900 dark:text-white w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-100 dark:border-[#243048] sticky top-0 bg-white dark:bg-[#171F2F] rounded-t-2xl z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <ReportTypeBadge type={complaint.report_type} />
              <p className={`font-mono text-[11px] font-semibold ${isSec ? 'text-violet-600 dark:text-violet-400' : 'text-blue-600 dark:text-[#7BBDE8]'}`}>{complaint.reference_number}</p>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{complaint.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* privacy notice */}
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40">
            <FontAwesome name="lock" className="text-emerald-600 dark:text-emerald-400 text-sm shrink-0" />
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
              Data pribadi warga (NIK, telepon, alamat) tidak ditampilkan & tetap terenkripsi. Hanya email pelapor yang terlihat.
            </p>
          </div>

          {/* Security report details panel */}
          {isSec && (
            <div className="rounded-xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FontAwesome name="shield-halved" className="text-violet-600 dark:text-violet-400 text-sm" />
                <p className="text-[12px] font-bold text-violet-800 dark:text-violet-300 uppercase tracking-wide">Detail Laporan Keamanan</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-violet-600 dark:text-violet-400/80 font-bold mb-1">Jenis Masalah</p>
                  <p className="text-violet-900 dark:text-violet-200 font-medium">{SECURITY_KIND_LABEL[complaint.security_kind || ''] || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-violet-600 dark:text-violet-400/80 font-bold mb-1">Sumber</p>
                  <p className="text-violet-900 dark:text-violet-200 font-medium">{SECURITY_SOURCE_LABEL[complaint.security_source || ''] || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-violet-600 dark:text-violet-400/80 font-bold mb-1">Keparahan</p>
                  <SeverityBadge severity={complaint.severity} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-violet-600 dark:text-violet-400/80 font-bold mb-1">URL Terkait</p>
                  {complaint.affected_url ? (
                    <a href={complaint.affected_url} target="_blank" rel="noreferrer"
                       className="text-violet-700 dark:text-violet-300 underline decoration-dotted truncate block max-w-full font-mono text-xs" title={complaint.affected_url}>
                      {complaint.affected_url}
                    </a>
                  ) : <p className="text-slate-400 dark:text-[#6EA2B3]">-</p>}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] font-bold mb-1">Pelapor</p>
              <p className="text-slate-800 dark:text-slate-200 font-medium">{complaint.user_email}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] font-bold mb-1">Kategori</p>
              <p className="text-slate-800 dark:text-slate-200 font-medium">{CATEGORY_LABEL[complaint.category] || complaint.category}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] font-bold mb-1">Prioritas</p>
              <PriorityBadge priority={complaint.priority} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] font-bold mb-1">Dibuat</p>
              <p className="text-slate-800 dark:text-slate-200 font-medium">{formatDateTime(complaint.created_at)}</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] font-bold mb-1">Deskripsi</p>
            <p className="text-sm text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-[#101828] rounded-xl p-3.5 border border-slate-200 dark:border-[#243048] whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] font-bold mb-1 block">Ubah Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#101828] text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-[#7BBDE8] outline-none text-sm"
              >
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] font-bold mb-1 block">
              {isSec ? 'Resolusi / Tindak Lanjut Keamanan' : 'Resolusi / Tanggapan'}
            </label>
            <textarea
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              placeholder={isSec ? 'Tindakan mitigasi, hasil investigasi, atau status perbaikan...' : 'Tuliskan tindak lanjut atau tanggapan untuk warga...'}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-[#243048] bg-white dark:bg-[#101828] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6EA2B3]/50 focus:border-blue-500 dark:focus:border-[#7BBDE8] focus:ring-4 focus:ring-blue-100/60 dark:focus:ring-blue-900/30 outline-none text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-[#243048] sticky bottom-0 bg-white dark:bg-[#171F2F] rounded-b-2xl z-10">
          {saveError && (
            <p className="mr-auto text-[12px] font-medium text-rose-600 dark:text-rose-400">{saveError}</p>
          )}
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={save} loading={saving}>Simpan Perubahan</Button>
        </div>
      </div>
    </div>
  );
}
