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
  FileText,
  Clock,
  ShieldCheck,
  MessageSquare,
  Send,
  RotateCcw,
  Copy,
  Check,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Sparkles,
  Inbox,
} from 'lucide-react';

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

export function UserComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active view tab
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
      // Live-sync will retry
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

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
    <div className="page page-enter max-w-4xl mx-auto space-y-8 pb-16">
      {/* ── Page Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-line">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Layanan Pelanggan &amp; Keamanan</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Pengaduan &amp; Laporan Keamanan
          </h1>
          <p className="text-base text-ink-2 max-w-2xl leading-relaxed">
            Sampaikan kendala pengisian formulir layanan publik atau laporkan kerentanan sistem secara terenkripsi dan terpantau.
          </p>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-line bg-surface-2 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`flex-1 h-11 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'form'
              ? 'bg-surface text-ink font-bold shadow-xs'
              : 'text-ink-3 hover:text-ink'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Buat Laporan Baru</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 h-11 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-surface text-ink font-bold shadow-xs'
              : 'text-ink-3 hover:text-ink'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat Laporan</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-3 text-ink-3">
            {complaints.length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: FORMULIR PENGADUAN ── */}
      {activeTab === 'form' && (
        <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-ink">
              Formulir Pelaporan Pengguna
            </h2>
            <p className="text-xs text-ink-3 mt-1">
              Pilih klasifikasi laporan, isi detail kendala secara objektif, lalu kirim ke sistem pelayanan resmi.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Klasifikasi Laporan Segmented Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink">
                Pilih Klasifikasi Laporan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReportType('layanan')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                    reportType === 'layanan'
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-xs'
                      : 'border-line bg-surface hover:bg-surface-2'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    reportType === 'layanan' ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-ink-3 border border-line'
                  }`}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-ink">
                      Pengaduan Layanan Publik
                    </span>
                    <span className="block text-[11px] text-ink-3 mt-0.5 leading-relaxed">
                      Keluhan pengisian formulir kependudukan, administrasi, dan teknis form.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('keamanan')}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                    reportType === 'keamanan'
                      ? 'border-blue-500/50 bg-blue-500/10 shadow-xs'
                      : 'border-line bg-surface hover:bg-surface-2'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    reportType === 'keamanan' ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-ink-3 border border-line'
                  }`}>
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-ink">
                      Keamanan &amp; Laporan Bug
                    </span>
                    <span className="block text-[11px] text-ink-3 mt-0.5 leading-relaxed">
                      Dugaan kebocoran data, kerentanan sistem, atau anomali privasi formulir.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Notice untuk laporan keamanan */}
            {reportType === 'keamanan' && (
              <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-accent-text shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-ink-2">
                  <span className="block font-bold text-ink mb-0.5">Jalur Kepatuhan Terenkripsi:</span>
                  Identitas data pribadi (NIK, telepon, domisili) disamarkan secara otomatis. Laporan Anda ditangani langsung oleh tim audit teknis GovConnect.
                </div>
              </div>
            )}

            {/* Judul Laporan */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Judul Laporan <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={
                  reportType === 'keamanan'
                    ? 'Contoh: Indikasi kebocoran riwayat form pada domain pihak ketiga'
                    : 'Contoh: Kendala verifikasi berkas formulir kependudukan'
                }
                className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
              />
            </div>

            {/* Kategori Spesifik */}
            {reportType === 'keamanan' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Jenis Kerentanan</label>
                  <select
                    value={securityKind}
                    onChange={e => setSecurityKind(e.target.value as SecurityKind)}
                    className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  >
                    {securityKindOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Sumber Temuan</label>
                  <select
                    value={securitySource}
                    onChange={e => setSecuritySource(e.target.value as SecuritySource)}
                    className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  >
                    {securitySourceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Tingkat Keparahan</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as SecuritySeverity)}
                    className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  >
                    {severityOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    URL / Domain Terkait <span className="font-normal text-ink-3">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    value={affectedUrl}
                    onChange={e => setAffectedUrl(e.target.value)}
                    placeholder="https://layanan.go.id/form/..."
                    className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink font-mono placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Kategori Bidang</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  >
                    {SERVICE_CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Prioritas Urgensi</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-line bg-surface-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
                  >
                    {SERVICE_PRIORITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Deskripsi Kronologi */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Deskripsi &amp; Kronologi Lengkap <span className="text-danger">*</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder={
                  reportType === 'keamanan'
                    ? 'Jelaskan langkah reproduksi temuan, dampak risiko data, dan URL terkait jika ada...'
                    : 'Uraikan permasalahan secara jelas: instansi/layanan yang diakses, kendala yang dialami, dan bukti pendukung...'
                }
                required
                className="w-full p-4 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40 leading-relaxed"
              />
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className={description.trim().length < 10 ? 'text-ink-3' : 'text-emerald-500 font-medium'}>
                  {description.trim().length < 10 ? 'Minimal 10 karakter' : 'Panjang deskripsi memadai'}
                </span>
                <span className={`font-mono text-[11px] ${description.length >= 2000 ? 'text-danger font-bold' : 'text-ink-3'}`}>
                  {description.length} / 2000 karakter
                </span>
              </div>
            </div>

            {/* Submit Message */}
            {submitMessage && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                submitMessage.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-red-500/30 bg-red-500/10 text-danger'
              }`}>
                {submitMessage.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <span className="text-xs font-medium leading-relaxed">{submitMessage.text}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="h-12 px-4 rounded-xl border border-line bg-surface hover:bg-surface-2 text-xs font-semibold text-ink-2 transition-colors inline-flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
              >
                <RotateCcw className="w-4 h-4 text-ink-3" />
                <span>Bersihkan Isian</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="h-12 px-6 rounded-xl bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer w-full sm:w-auto justify-center shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Mengirim Laporan...'
                    : reportType === 'keamanan'
                      ? 'Kirim Laporan Keamanan'
                      : 'Kirim Pengaduan Layanan'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: RIWAYAT LAPORAN ── */}
      {activeTab === 'history' && (
        <div className="rounded-[24px] border border-line bg-surface p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
            <div>
              <h2 className="text-xl font-bold text-ink">
                Daftar Riwayat Laporan
              </h2>
              <p className="text-xs text-ink-3 mt-1">
                Menampilkan {filteredComplaints.length} dari total {complaints.length} laporan yang pernah Anda kirimkan.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl border border-line bg-surface-2 self-start sm:self-auto">
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
                  className={`h-8 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    historyFilter === t.key
                      ? 'bg-surface text-ink shadow-xs'
                      : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-ink-3 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul, nomor tiket referensi, atau deskripsi..."
              className="w-full h-12 pl-10 pr-10 rounded-xl border border-line bg-surface-2 text-xs text-ink placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List Content */}
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="h-32 rounded-2xl bg-surface-2 animate-pulse" />
              ))}
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-line-2 space-y-3">
              <Inbox className="w-10 h-10 text-ink-3 mx-auto opacity-50" strokeWidth={1.5} />
              <h3 className="text-sm font-bold text-ink">Belum Ada Laporan Terkirim</h3>
              <p className="text-xs text-ink-3 max-w-sm mx-auto">
                {complaints.length === 0
                  ? 'Anda belum pernah mengirimkan pengaduan. Beralih ke tab Buat Laporan Baru untuk memulai.'
                  : 'Tidak ditemukan laporan yang sesuai dengan kata kunci pencarian Anda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map(c => {
                const isSec = c.report_type === 'keamanan';
                const statusMeta = STATUS_META[c.status];
                const typeMeta = REPORT_TYPE_META[c.report_type || 'layanan'];
                const isCopied = copiedRef === c.reference_number;

                return (
                  <div
                    key={c.id}
                    className="p-5 rounded-2xl border border-line bg-surface-2 space-y-4 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider ${
                            isSec ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-accent-text border border-blue-500/20'
                          }`}>
                            {typeMeta?.label ?? 'Layanan'}
                          </span>
                          <h3 className="text-sm font-bold text-ink truncate">
                            {c.title}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyRef(c.reference_number)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-line bg-surface text-ink-2 font-mono text-xs hover:border-blue-500/40 transition-colors cursor-pointer"
                          title="Salin nomor tiket"
                        >
                          <span>{c.reference_number}</span>
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-ok" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-ink-3" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSec ? (
                          c.severity && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-danger border border-red-500/20">
                              {SEVERITY_META[c.severity]?.label ?? c.severity}
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface border border-line text-ink-3">
                            {PRIORITY_META[c.priority]?.label ?? c.priority}
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          c.status === 'selesai'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : c.status === 'diproses' || c.status === 'proses'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-blue-500/10 text-accent-text border border-blue-500/20'
                        }`}>
                          {statusMeta?.label ?? c.status}
                        </span>
                      </div>
                    </div>

                    {isSec && (
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface border border-line text-ink-3">
                          {SECURITY_KIND_LABEL[c.security_kind || ''] || 'Keamanan'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-surface border border-line text-ink-3">
                          Sumber: {SECURITY_SOURCE_LABEL[c.security_source || ''] || '-'}
                        </span>
                        {c.affected_url && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-3 truncate max-w-sm">
                            <LinkIcon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{c.affected_url}</span>
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-ink-2 leading-relaxed whitespace-pre-line">
                      {c.description}
                    </p>

                    {c.resolution && (
                      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tanggapan &amp; Resolusi Resmi Petugas</span>
                        </span>
                        <p className="text-xs text-ink-2 leading-relaxed">{c.resolution}</p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-3">
                      <span>Bidang: {CATEGORY_LABEL[c.category] || c.category}</span>
                      <div className="flex items-center gap-4">
                        <span>Dibuat: {formatDateTime(c.created_at)}</span>
                        <span>Diperbarui: {formatDateTime(c.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UserComplaintsPage;
