import { useEffect, useState, useCallback, useRef } from 'react';
import { adminApi, type Complaint, type ReportType } from '../../services/api';
import {
  Button, FontAwesome, Badge, Card, CardHeader, CardTitle, CardDescription,
  EmptyState, Input, Select, Tabs, Textarea,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui';
import type { BadgeVariant } from '../../components/ui';
import { usePolling } from '../../hooks/usePolling';
import {
  CATEGORY_LABEL, SECURITY_KIND_LABEL, SECURITY_SOURCE_LABEL, formatDateTime,
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

const STATUS_LABEL: Record<string, string> = {
  diterima: 'Diterima', diproses: 'Diproses', proses: 'Diproses', selesai: 'Selesai', ditolak: 'Ditolak',
};
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  diterima: 'info', diproses: 'warn', proses: 'warn', selesai: 'ok', ditolak: 'danger',
};
const PRIORITY_LABEL: Record<string, string> = { tinggi: 'Tinggi', sedang: 'Sedang', rendah: 'Rendah' };
const PRIORITY_VARIANT: Record<string, BadgeVariant> = { tinggi: 'danger', sedang: 'warn', rendah: 'neutral' };
const SEVERITY_LABEL: Record<string, string> = {
  kritis: 'Kritis', tinggi: 'Tinggi', sedang: 'Sedang', rendah: 'Rendah',
};
const SEVERITY_VARIANT: Record<string, BadgeVariant> = {
  kritis: 'danger', tinggi: 'danger', sedang: 'warn', rendah: 'neutral',
};
const REPORT_TYPE_LABEL: Record<string, string> = { layanan: 'Layanan', keamanan: 'Keamanan & Bug' };

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
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Operasional</p>
          <h1 className="page-title">Pengaduan &amp; Laporan Keamanan</h1>
          <p className="page-sub">
            Kelola pengaduan layanan serta laporan bug/kebocoran data — identitas warga hanya email
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<FontAwesome name="download" className="text-[12px]" />}
          onClick={handleExport}
          loading={isExporting}
        >
          Export CSV
        </Button>
      </div>

      <div className="flex items-center gap-2 text-[11.5px] text-ink-3">
        <span className="dot text-ok" />
        <span>{lastUpdated ? `Tersinkron ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Menghubungkan...'}</span>
        <Button
          size="sm"
          variant="ghost"
          iconOnly
          onClick={refresh}
          aria-label="Sinkronkan sekarang"
          title="Sinkronkan sekarang"
          icon={<FontAwesome name="rotate-right" className="text-[11px]" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Filter &amp; Pencarian</CardTitle>
            <CardDescription>Kombinasikan filter untuk menemukan laporan</CardDescription>
          </div>
        </CardHeader>

        <div className="p-4 space-y-3 border-b border-line">
          <Tabs
            items={TYPE_FILTERS.map(f => ({
              id: f.key,
              label: f.label,
              icon: <FontAwesome name={f.icon} className="text-[11px]" />,
              badge: f.key === '' ? totalTypes : (typeCounts[f.key] || 0),
            }))}
            activeTab={reportType}
            onChange={id => { setReportType(id as '' | ReportType); setStatus(''); }}
          />
          <Tabs
            items={STATUS_FILTERS.map(f => ({
              id: f.key,
              label: f.label,
              badge: f.key === '' ? counts['_all'] : counts[f.key],
            }))}
            activeTab={status}
            onChange={id => setStatus(id)}
          />
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') setSearch(searchInput); }}
              placeholder="Cari referensi / judul / deskripsi..."
              aria-label="Cari referensi, judul, atau deskripsi"
            />
          </div>
          <Select
            value={category}
            onChange={e => setCategory(e.target.value)}
            aria-label="Kategori"
          >
            <option value="">Semua Kategori</option>
            <option value="pelayanan">Pelayanan</option>
            <option value="teknis">Teknis</option>
            <option value="administrasi">Administrasi</option>
            <option value="lainnya">Lainnya</option>
          </Select>
          <div className="flex gap-2">
            <Select
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className="flex-1"
              aria-label="Prioritas"
            >
              <option value="">Prioritas</option>
              <option value="tinggi">Tinggi</option>
              <option value="sedang">Sedang</option>
              <option value="rendah">Rendah</option>
            </Select>
            <Select
              value={sort}
              onChange={e => setSort(e.target.value as 'newest' | 'oldest' | 'priority')}
              className="flex-1"
              aria-label="Urutan"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="priority">Prioritas</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>{reportType === 'keamanan' ? 'Laporan Keamanan & Bug' : 'Daftar Pengaduan'}</CardTitle>
            <CardDescription>{total} laporan ditemukan</CardDescription>
          </div>
        </CardHeader>

        {loading ? (
          <div className="empty">
            <FontAwesome name="spinner" spin className="text-[15px] text-ink-3 mb-3" />
            <p className="text-[12.5px] text-ink-3">Memuat data...</p>
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name={reportType === 'keamanan' ? 'shield-halved' : 'inbox'} />}
            title="Tidak ada laporan"
            description="Coba ubah filter atau kata kunci pencarian."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referensi</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Pengirim</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Prioritas</TableHead>
                <TableHead>Umur</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(c => {
                const isSec = c.report_type === 'keamanan';
                return (
                  <TableRow key={c.id}>
                    <TableCell className="cell-mono text-accent-text font-semibold">
                      {c.reference_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isSec ? 'warn' : 'info'} dot>
                        {REPORT_TYPE_LABEL[c.report_type || 'layanan'] || 'Layanan'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[220px] truncate cell-strong">{c.title}</span>
                    </TableCell>
                    <TableCell className="text-[12px] text-ink-3 whitespace-nowrap">{c.user_email}</TableCell>
                    <TableCell>{CATEGORY_LABEL[c.category] || c.category}</TableCell>
                    <TableCell>
                      {isSec
                        ? <Badge variant={SEVERITY_VARIANT[c.severity || ''] || 'neutral'}>
                            {SEVERITY_LABEL[c.severity || ''] || c.severity}
                          </Badge>
                        : <Badge variant={PRIORITY_VARIANT[c.priority] || 'neutral'}>
                            {PRIORITY_LABEL[c.priority] || c.priority}
                          </Badge>}
                    </TableCell>
                    <TableCell className="tabular-nums whitespace-nowrap">{c.age_days ?? 0} hari</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status] || 'neutral'} dot>
                        {STATUS_LABEL[c.status] || c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelected(c)}>Detail</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {!loading && items.length > 0 && (
          <div className="card-foot">
            <span className="text-[12px] text-ink-3">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Sebelumnya</Button>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya</Button>
            </div>
          </div>
        )}
      </Card>

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="card-head sticky top-0 z-10 bg-surface rounded-t-lg">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isSec ? 'warn' : 'info'} dot>
                {REPORT_TYPE_LABEL[complaint.report_type || 'layanan'] || 'Layanan'}
              </Badge>
              <span className="mono text-ink-3">{complaint.reference_number}</span>
            </div>
            <h3 className="text-[15px] font-semibold text-ink mt-1.5">{complaint.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="btn btn-ghost btn-icon btn-sm text-ink-3"
          >
            <FontAwesome name="xmark" className="text-[13px]" />
          </button>
        </div>

        <div className="card-body space-y-5">
          {/* privacy notice */}
          <div className="flex items-start gap-2.5 rounded-md border border-line bg-surface-2 px-3 py-2.5">
            <FontAwesome name="lock" className="text-[12px] text-ink-3 mt-0.5 shrink-0" />
            <p className="text-[11.5px] text-ink-2 leading-relaxed">
              Data pribadi warga (NIK, telepon, alamat) tidak ditampilkan &amp; tetap terenkripsi. Hanya email pelapor yang terlihat.
            </p>
          </div>

          {/* Security report details panel */}
          {isSec && (
            <div className="rounded-md border border-line bg-surface-2 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FontAwesome name="shield-halved" className="text-[12px] text-ink-3" />
                <p className="eyebrow">Detail Laporan Keamanan</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1">Jenis Masalah</p>
                  <p className="text-[13px] font-medium text-ink">{SECURITY_KIND_LABEL[complaint.security_kind || ''] || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1">Sumber</p>
                  <p className="text-[13px] font-medium text-ink">{SECURITY_SOURCE_LABEL[complaint.security_source || ''] || '-'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1">Keparahan</p>
                  {complaint.severity ? (
                    <Badge variant={SEVERITY_VARIANT[complaint.severity] || 'neutral'} dot>
                      {SEVERITY_LABEL[complaint.severity] || complaint.severity}
                    </Badge>
                  ) : <p className="text-[13px] text-ink-3">-</p>}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1">URL Terkait</p>
                  {complaint.affected_url ? (
                    <a
                      href={complaint.affected_url}
                      target="_blank"
                      rel="noreferrer"
                      className="link mono block truncate max-w-full"
                      title={complaint.affected_url}
                    >
                      {complaint.affected_url}
                    </a>
                  ) : <p className="text-[13px] text-ink-3">-</p>}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1">Pelapor</p>
              <p className="text-[13px] font-medium text-ink break-all">{complaint.user_email}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1">Kategori</p>
              <p className="text-[13px] font-medium text-ink">{CATEGORY_LABEL[complaint.category] || complaint.category}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1">Prioritas</p>
              <Badge variant={PRIORITY_VARIANT[complaint.priority] || 'neutral'}>
                {PRIORITY_LABEL[complaint.priority] || complaint.priority}
              </Badge>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1">Dibuat</p>
              <p className="text-[13px] font-medium text-ink">{formatDateTime(complaint.created_at)}</p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-3 mb-1">Deskripsi</p>
            <p className="text-[13px] text-ink-2 bg-surface-2 rounded-md px-3.5 py-3 border border-line whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="complaint-status">Ubah Status</label>
              <Select
                id="complaint-status"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </Select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="complaint-resolution">
              {isSec ? 'Resolusi / Tindak Lanjut Keamanan' : 'Resolusi / Tanggapan'}
            </label>
            <Textarea
              id="complaint-resolution"
              value={resolution}
              onChange={e => setResolution(e.target.value)}
              rows={3}
              placeholder={isSec ? 'Tindakan mitigasi, hasil investigasi, atau status perbaikan...' : 'Tuliskan tindak lanjut atau tanggapan untuk warga...'}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-line bg-surface-2 rounded-b-lg sticky bottom-0">
          {saveError && (
            <p className="mr-auto text-[12px] font-medium text-danger">{saveError}</p>
          )}
          <Button variant="ghost" onClick={onClose}>Batal</Button>
          <Button variant="primary" onClick={save} loading={saving}>Simpan Perubahan</Button>
        </div>
      </div>
    </div>
  );
}
