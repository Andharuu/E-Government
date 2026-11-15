import { useState, useCallback, useMemo } from 'react';
import {
  complaintsApi, type Complaint, type ReportType,
  type SecurityKind, type SecuritySource, type SecuritySeverity,
} from '../services/api';
import { usePolling } from '../hooks/usePolling';
import {
  PRIORITY_META, STATUS_META, CATEGORY_LABEL,
  REPORT_TYPE_META, SEVERITY_META, SECURITY_KIND_LABEL, SECURITY_SOURCE_LABEL,
  formatDateTime,
} from '../components/admin/adminUi';
import {
  FontAwesome, CustomSelect, Badge, Button, Card, CardHeader, CardTitle, CardDescription,
  CardContent, EmptyState, FormField, Input, Textarea, Tabs, type BadgeVariant,
} from '../components/ui';

const SERVICE_CATEGORY_OPTIONS = [
  { value: 'pelayanan', label: 'Pelayanan' },
  { value: 'teknis', label: 'Teknis' },
  { value: 'administrasi', label: 'Administrasi' },
  { value: 'lainnya', label: 'Lainnya' },
];

const SERVICE_PRIORITY_OPTIONS = [
  { value: 'rendah', label: 'Rendah (Pertanyaan umum)' },
  { value: 'sedang', label: 'Sedang (Kendala proses berkas)' },
  { value: 'tinggi', label: 'Tinggi (Mendesak / batas waktu)' },
];

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  diterima: 'info',
  diproses: 'warn',
  proses: 'warn',
  selesai: 'ok',
  ditolak: 'danger',
};

const PRIORITY_VARIANT: Record<string, BadgeVariant> = {
  tinggi: 'danger',
  sedang: 'warn',
  rendah: 'neutral',
};

const SEVERITY_VARIANT: Record<string, BadgeVariant> = {
  kritis: 'danger',
  tinggi: 'danger',
  sedang: 'warn',
  rendah: 'neutral',
};

export function UserComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view tab for focused single-column layout
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

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
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter & search state
  const [historyFilter, setHistoryFilter] = useState<'all' | 'layanan' | 'keamanan'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

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
  usePolling(() => load(true), { interval: 15000 });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setAffectedUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);
    try {
      if (reportType === 'keamanan') {
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
      setSubmitMessage({
        type: 'success',
        text: reportType === 'keamanan'
          ? 'Laporan keamanan berhasil dikirim. Petugas akan menindaklanjuti secara tertutup.'
          : 'Pengaduan layanan berhasil dikirim. Anda dapat memantau status tindak lanjut pada tab Riwayat.',
      });
      await load(true);
      // Switch to history tab after 1.5s
      setTimeout(() => setActiveTab('history'), 1500);
    } catch {
      setSubmitMessage({ type: 'error', text: 'Gagal mengirim laporan. Pastikan koneksi internet stabil lalu coba kembali.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = (refNum: string) => {
    navigator.clipboard.writeText(refNum);
    setCopiedRef(refNum);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const canSubmit = Boolean(title.trim().length >= 3 && description.trim().length >= 10 && description.length <= 2000);

  const securityKindOptions = useMemo(
    () => Object.entries(SECURITY_KIND_LABEL).map(([v, l]) => ({ value: v, label: l })),
    []
  );

  const securitySourceOptions = useMemo(
    () => Object.entries(SECURITY_SOURCE_LABEL).map(([v, l]) => ({ value: v, label: l })),
    []
  );

  const severityOptions = useMemo(
    () => Object.entries(SEVERITY_META).map(([v, m]) => ({ value: v, label: m.label })),
    []
  );

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchType = historyFilter === 'all' || (c.report_type || 'layanan') === historyFilter;
      if (!matchType) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.reference_number.toLowerCase().includes(q)
      );
    });
  }, [complaints, historyFilter, searchQuery]);

  return (
    <div className="page page-enter mx-auto w-full max-w-4xl pb-12">
      {/* ── Page Header ── */}
      <div className="page-head">
        <div className="min-w-0">
          <p className="eyebrow">Layanan Warga</p>
          <h1 className="page-title">Pengaduan &amp; Laporan Keamanan</h1>
          <p className="page-sub">
            Sampaikan kendala layanan publik atau laporkan celah keamanan secara terenkripsi dan terpantau.
          </p>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <Tabs
        items={[
          { id: 'form', label: 'Buat Laporan Baru', icon: <FontAwesome name="file-lines" /> },
          { id: 'history', label: 'Riwayat Laporan', badge: complaints.length, icon: <FontAwesome name="clock" /> },
        ]}
        activeTab={activeTab}
        onChange={id => setActiveTab(id as 'form' | 'history')}
      />

      {/* ── TAB 1: FORMULIR PENGADUAN ── */}
      {activeTab === 'form' && (
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>Formulir Pelaporan Warga</CardTitle>
              <CardDescription>
                Pilih klasifikasi laporan, isi detail kendala secara objektif, lalu kirim ke sistem pelayanan.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Klasifikasi Laporan */}
              <div>
                <label className="label">Pilih Klasifikasi Laporan</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setReportType('layanan')}
                    aria-pressed={reportType === 'layanan'}
                    className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                      reportType === 'layanan'
                        ? 'border-accent bg-accent-soft'
                        : 'border-line bg-surface hover:border-line-2 hover:bg-surface-2'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-[12px] ${
                        reportType === 'layanan'
                          ? 'border-accent bg-accent text-accent-fg'
                          : 'border-line bg-surface-3 text-ink-3'
                      }`}
                    >
                      <FontAwesome name="comment-dots" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ink">Pengaduan Layanan Publik</span>
                      <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink-3">
                        Keluhan pelayanan kependudukan, administrasi, dan teknis form
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportType('keamanan')}
                    aria-pressed={reportType === 'keamanan'}
                    className={`flex items-start gap-3 rounded-lg border p-3.5 text-left transition-colors ${
                      reportType === 'keamanan'
                        ? 'border-accent bg-accent-soft'
                        : 'border-line bg-surface hover:border-line-2 hover:bg-surface-2'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-[12px] ${
                        reportType === 'keamanan'
                          ? 'border-accent bg-accent text-accent-fg'
                          : 'border-line bg-surface-3 text-ink-3'
                      }`}
                    >
                      <FontAwesome name="shield-check" variant="solid" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-ink">Keamanan &amp; Laporan Bug</span>
                      <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink-3">
                        Dugaan kebocoran data, kerentanan sistem, atau anomali privasi
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Notice untuk laporan keamanan */}
              {reportType === 'keamanan' && (
                <div className="flex items-start gap-2.5 rounded-md border border-accent-line bg-accent-soft p-3">
                  <FontAwesome name="shield-check" variant="solid" className="mt-0.5 shrink-0 text-[12px] text-accent-text" />
                  <div className="text-[12px] leading-relaxed text-ink-2">
                    <span className="block font-semibold text-ink">Jalur Kepatuhan Terenkripsi:</span>
                    Identitas data pribadi (NIK, telepon, domisili) disamarkan secara otomatis. Laporan Anda ditangani langsung oleh tim audit teknis GovConnect.
                  </div>
                </div>
              )}

              {/* Judul Laporan */}
              <FormField label="Judul Laporan" required>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={
                    reportType === 'keamanan'
                      ? 'Contoh: Indikasi kebocoran riwayat form pada domain pihak ketiga'
                      : 'Contoh: Kendala verifikasi berkas formulir kependudukan'
                  }
                  required
                />
              </FormField>

              {/* Kategori Spesifik */}
              {reportType === 'keamanan' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Jenis Kerentanan</label>
                    <CustomSelect
                      value={securityKind}
                      onChange={v => setSecurityKind(v as SecurityKind)}
                      options={securityKindOptions}
                    />
                  </div>

                  <div>
                    <label className="label">Sumber Temuan</label>
                    <CustomSelect
                      value={securitySource}
                      onChange={v => setSecuritySource(v as SecuritySource)}
                      options={securitySourceOptions}
                    />
                  </div>

                  <div>
                    <label className="label">Tingkat Keparahan</label>
                    <CustomSelect
                      value={severity}
                      onChange={v => setSeverity(v as SecuritySeverity)}
                      options={severityOptions}
                    />
                  </div>

                  <div>
                    <label className="label">
                      URL / Domain Terkait <span className="font-normal text-ink-3">(opsional)</span>
                    </label>
                    <Input
                      value={affectedUrl}
                      onChange={e => setAffectedUrl(e.target.value)}
                      placeholder="https://layanan.go.id/form/..."
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Kategori Bidang</label>
                    <CustomSelect
                      value={category}
                      onChange={setCategory}
                      options={SERVICE_CATEGORY_OPTIONS}
                    />
                  </div>

                  <div>
                    <label className="label">Prioritas Urgensi</label>
                    <CustomSelect
                      value={priority}
                      onChange={setPriority}
                      options={SERVICE_PRIORITY_OPTIONS}
                    />
                  </div>
                </div>
              )}

              {/* Deskripsi */}
              <div>
                <label className="label">
                  Deskripsi &amp; Kronologi Lengkap <span className="text-danger">*</span>
                </label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={2000}
                  rows={5}
                  placeholder={
                    reportType === 'keamanan'
                      ? 'Jelaskan langkah reproduksi temuan, dampak risiko data, dan tangkapan layar jika ada...'
                      : 'Uraikan permasalahan secara jelas: instansi/layanan yang diakses, kendala yang dialami, dan bukti pendukung...'
                  }
                  required
                />
                {/* Character counter (F-H8) */}
                <div className="mt-1.5 flex items-center justify-between gap-3 text-[11.5px]">
                  <span className={description.trim().length < 10 ? 'text-ink-3' : 'text-ok'}>
                    {description.trim().length < 10 ? 'Minimal 10 karakter' : 'Panjang deskripsi memadai'}
                  </span>
                  <span
                    className={`tabular-nums ${
                      description.length >= 2000 ? 'font-semibold text-danger' : 'text-ink-3'
                    }`}
                  >
                    {description.length} / 2000 karakter
                  </span>
                </div>
              </div>

              {/* Status Feedback */}
              {submitMessage && (
                <div
                  className={`flex items-start gap-2.5 rounded-md border p-3 text-[12.5px] ${
                    submitMessage.type === 'success'
                      ? 'border-ok-line bg-ok-soft text-ok'
                      : 'border-danger-line bg-danger-soft text-danger'
                  }`}
                >
                  <FontAwesome
                    name={submitMessage.type === 'success' ? 'circle-check' : 'circle-exclamation'}
                    className="mt-0.5 shrink-0 text-[12px]"
                  />
                  <span>{submitMessage.text}</span>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex flex-col items-stretch gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetForm}
                  icon={<FontAwesome name="eraser" variant="solid" className="text-[11px]" />}
                >
                  Bersihkan Isian
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !canSubmit}
                  loading={isSubmitting}
                  icon={
                    <FontAwesome
                      name={reportType === 'keamanan' ? 'shield-halved' : 'paper-plane'}
                      className="text-[11px]"
                    />
                  }
                >
                  {isSubmitting
                    ? 'Mengirim Laporan...'
                    : reportType === 'keamanan'
                    ? 'Kirim Laporan Keamanan'
                    : 'Kirim Pengaduan Layanan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 2: RIWAYAT & PELACAKAN STATUS ── */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <CardTitle>Daftar Riwayat Laporan</CardTitle>
              <CardDescription>
                Menampilkan {filteredComplaints.length} dari total {complaints.length} laporan yang pernah Anda sampaikan.
              </CardDescription>
            </div>

            {/* Filter Pills */}
            <div className="segmented self-start sm:self-auto">
              {(
                [
                  { key: 'all', label: 'Semua' },
                  { key: 'layanan', label: 'Layanan' },
                  { key: 'keamanan', label: 'Keamanan' },
                ] as const
              ).map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setHistoryFilter(t.key)}
                  data-active={historyFilter === t.key}
                  className="segmented-item"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <FontAwesome
                name="magnifying-glass"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-3"
              />
              <Input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan judul, nomor tiket referensi, atau isi keluhan..."
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-3 transition-colors hover:text-ink"
                  title="Hapus pencarian"
                  aria-label="Hapus pencarian"
                >
                  <FontAwesome name="xmark" className="text-[11px]" />
                </button>
              )}
            </div>

            {/* List Content */}
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map(i => (
                  <div key={i} className="rounded-lg border border-line p-4">
                    <div className="skeleton h-3 w-32" />
                    <div className="skeleton mt-3 h-2.5 w-2/3" />
                    <div className="skeleton mt-2 h-2.5 w-full" />
                  </div>
                ))}
              </div>
            ) : filteredComplaints.length === 0 ? (
              <EmptyState
                icon={<FontAwesome name="inbox" className="text-[15px]" />}
                title={complaints.length === 0 ? 'Belum Ada Laporan Terkirim' : 'Tidak Ditemukan Laporan'}
                description={
                  complaints.length === 0
                    ? 'Anda belum pernah mengirimkan pengaduan. Beralih ke tab Buat Laporan Baru untuk memulai.'
                    : 'Tidak ada laporan yang sesuai dengan filter atau kata kunci pencarian Anda.'
                }
              />
            ) : (
              <div className="divide-y divide-line">
                {filteredComplaints.map(c => {
                  const isSec = c.report_type === 'keamanan';
                  const statusMeta = STATUS_META[c.status];
                  const typeMeta = REPORT_TYPE_META[c.report_type || 'layanan'];
                  return (
                    <div key={c.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <Badge variant={isSec ? 'warn' : 'info'} dot>
                              {typeMeta?.label ?? 'Layanan'}
                            </Badge>
                            <h3 className="text-[13px] font-semibold leading-snug text-ink">{c.title}</h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyRef(c.reference_number)}
                            className="mono inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-2 px-2 py-1 text-ink-2 transition-colors hover:border-line-2 hover:text-ink"
                            title="Salin nomor tiket"
                          >
                            <span>{c.reference_number}</span>
                            <FontAwesome
                              name={copiedRef === c.reference_number ? 'check-pure' : 'copy'}
                              className="text-[10px]"
                            />
                            <span className="font-sans text-[10px] font-medium text-ink-3">
                              {copiedRef === c.reference_number ? 'Tersalin' : 'Salin'}
                            </span>
                          </button>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {isSec ? (
                            c.severity ? (
                              <Badge variant={SEVERITY_VARIANT[c.severity] ?? 'neutral'} dot>
                                {SEVERITY_META[c.severity]?.label ?? c.severity}
                              </Badge>
                            ) : null
                          ) : (
                            <Badge variant={PRIORITY_VARIANT[c.priority] ?? 'neutral'}>
                              {PRIORITY_META[c.priority]?.label ?? c.priority}
                            </Badge>
                          )}
                          <Badge variant={STATUS_VARIANT[c.status] ?? 'neutral'} dot>
                            {statusMeta?.label ?? c.status}
                          </Badge>
                        </div>
                      </div>

                      {isSec && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <Badge variant="neutral">
                            {SECURITY_KIND_LABEL[c.security_kind || ''] || 'Keamanan'}
                          </Badge>
                          <Badge variant="neutral">
                            Sumber: {SECURITY_SOURCE_LABEL[c.security_source || ''] || '-'}
                          </Badge>
                          {c.affected_url && (
                            <span
                              className="flex max-w-sm items-center gap-1 truncate text-[11.5px] text-ink-3"
                              title={c.affected_url}
                            >
                              <FontAwesome name="link" className="shrink-0 text-[10px]" />
                              <span className="truncate">{c.affected_url}</span>
                            </span>
                          )}
                        </div>
                      )}

                      <p className="mt-2.5 whitespace-pre-line text-[12.5px] leading-relaxed text-ink-2">
                        {c.description}
                      </p>

                      {c.resolution && (
                        <div className="mt-3 rounded-md border border-ok-line bg-ok-soft p-3">
                          <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ok">
                            <FontAwesome name="comment-dots" className="text-[10px]" />
                            Tanggapan &amp; Resolusi Resmi Petugas
                          </span>
                          <p className="text-[12.5px] leading-relaxed text-ink-2">{c.resolution}</p>
                        </div>
                      )}

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-[11.5px] text-ink-3">
                        <span>Bidang: {CATEGORY_LABEL[c.category] || c.category}</span>
                        <div className="flex flex-wrap items-center gap-4">
                          <span>Dibuat: {formatDateTime(c.created_at)}</span>
                          <span>Diperbarui: {formatDateTime(c.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default UserComplaintsPage;
