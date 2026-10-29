import { useState, useCallback, useMemo } from 'react';
import {
  complaintsApi, type Complaint, type ReportType,
  type SecurityKind, type SecuritySource, type SecuritySeverity,
} from '../services/api';
import { usePolling } from '../hooks/usePolling';
import {
  StatusBadge, PriorityBadge, CATEGORY_LABEL,
  ReportTypeBadge, SeverityBadge, SECURITY_KIND_LABEL, SECURITY_SOURCE_LABEL,
  SEVERITY_META, EmptyState, LoadingBlock, formatDateTime,
} from '../components/admin/adminUi';
import { FontAwesome, CustomSelect } from '../components/ui';

const FIELD_CLS =
  'w-full h-11 px-4 text-sm bg-white dark:bg-[#101828] border border-slate-200 dark:border-[#243048] hover:border-slate-300 dark:hover:border-[#7BBDE8]/60 focus:border-blue-600 dark:focus:border-[#7BBDE8] focus:ring-4 focus:ring-blue-500/15 dark:focus:ring-[#7BBDE8]/15 rounded-xl outline-none transition-colors text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#6EA2B3]';
const LABEL_CLS = 'block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#6EA2B3] mb-2';

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
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="pb-2 border-b border-[#243048]">
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Pengaduan &amp; Laporan Keamanan
        </h1>
        <p className="text-sm text-[#6EA2B3] mt-1">
          Sampaikan kendala layanan publik atau laporkan celah keamanan secara terenkripsi dan terpantau.
        </p>
      </div>

      {/* ── Focused Single-Column Navigation (Tab Switcher) ── */}
      <div className="flex items-center gap-2 p-1 bg-[#171F2F] border border-[#243048] rounded-xl w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('form')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'form'
              ? 'bg-[#7BBDE8] text-[#101828] shadow-xs'
              : 'text-[#6EA2B3] hover:text-white'
          }`}
        >
          <FontAwesome name="file-lines" className="text-xs" />
          <span>Buat Laporan Baru</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#7BBDE8] text-[#101828] shadow-xs'
              : 'text-[#6EA2B3] hover:text-white'
          }`}
        >
          <FontAwesome name="clock" className="text-xs" />
          <span>Riwayat Laporan ({complaints.length})</span>
        </button>
      </div>

      {/* ── TAB 1: FORMULIR PENGADUAN (Focused Single-Column Layout) ── */}
      {activeTab === 'form' && (
        <div className="bg-[#171F2F] rounded-2xl border border-[#243048] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#243048]">
            <h2 className="text-lg font-bold text-white">Formulir Pelaporan Warga</h2>
            <p className="text-xs text-[#6EA2B3] mt-1">
              Pilih klasifikasi laporan, isi detail kendala secara objektif, lalu kirim ke sistem pelayanan.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Klasifikasi Laporan */}
            <div>
              <label className={LABEL_CLS}>Pilih Klasifikasi Laporan</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setReportType('layanan')}
                  className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                    reportType === 'layanan'
                      ? 'border-[#7BBDE8] bg-[#7BBDE8]/15 ring-2 ring-[#7BBDE8]/20'
                      : 'border-[#243048] hover:border-[#7BBDE8]/50 bg-[#101828]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      reportType === 'layanan' ? 'bg-[#7BBDE8] text-[#101828]' : 'bg-[#171F2F] text-[#6EA2B3]'
                    }`}>
                      <FontAwesome name="comment-dots" className="text-xs" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">Pengaduan Layanan Publik</p>
                      <p className="text-xs text-[#6EA2B3] mt-0.5">Keluhan pelayanan kependudukan, administrasi, dan teknis form</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setReportType('keamanan')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    reportType === 'keamanan'
                      ? 'border-[#7BBDE8] bg-[#7BBDE8]/15 ring-2 ring-[#7BBDE8]/20'
                      : 'border-[#243048] hover:border-[#7BBDE8]/50 bg-[#101828]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      reportType === 'keamanan' ? 'bg-[#7BBDE8] text-[#101828]' : 'bg-[#171F2F] text-[#6EA2B3]'
                    }`}>
                      <FontAwesome name="shield-check" variant="solid" className="text-sm" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white">Keamanan &amp; Laporan Bug</p>
                      <p className="text-xs text-[#6EA2B3] mt-0.5">Dugaan kebocoran data, kerentanan sistem, atau anomali privasi</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Notice untuk laporan keamanan */}
            {reportType === 'keamanan' && (
              <div className="p-4 rounded-xl bg-[#7BBDE8]/10 border border-[#7BBDE8]/30 text-xs text-[#a5cbde] flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-[#7BBDE8]/20 flex items-center justify-center text-[#7BBDE8] shrink-0 mt-0.5">
                  <FontAwesome name="shield-check" variant="solid" className="text-xs" />
                </div>
                <div className="leading-relaxed">
                  <span className="font-bold block mb-0.5 text-white">Jalur Kepatuhan Terenkripsi:</span>
                  Identitas data pribadi (NIK, telepon, domisili) disamarkan secara otomatis. Laporan Anda ditangani langsung oleh tim audit teknis GovConnect.
                </div>
              </div>
            )}

            {/* Judul Laporan */}
            <div>
              <label className={LABEL_CLS}>
                Judul Laporan <span className="text-rose-400">*</span>
              </label>
              <input
                className={FIELD_CLS}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder={
                  reportType === 'keamanan'
                    ? 'Contoh: Indikasi kebocoran riwayat form pada domain pihak ketiga'
                    : 'Contoh: Kendala verifikasi berkas formulir kependudukan'
                }
                required
              />
            </div>

            {/* Kategori Spesifik */}
            {reportType === 'keamanan' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Jenis Kerentanan</label>
                  <CustomSelect
                    value={securityKind}
                    onChange={v => setSecurityKind(v as SecurityKind)}
                    options={securityKindOptions}
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>Sumber Temuan</label>
                  <CustomSelect
                    value={securitySource}
                    onChange={v => setSecuritySource(v as SecuritySource)}
                    options={securitySourceOptions}
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>Tingkat Keparahan</label>
                  <CustomSelect
                    value={severity}
                    onChange={v => setSeverity(v as SecuritySeverity)}
                    options={severityOptions}
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>
                    URL / Domain Terkait <span className="text-[#6EA2B3] font-normal normal-case">(opsional)</span>
                  </label>
                  <input
                    className={FIELD_CLS}
                    value={affectedUrl}
                    onChange={e => setAffectedUrl(e.target.value)}
                    placeholder="https://layanan.go.id/form/..."
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Kategori Bidang</label>
                  <CustomSelect
                    value={category}
                    onChange={setCategory}
                    options={SERVICE_CATEGORY_OPTIONS}
                  />
                </div>

                <div>
                  <label className={LABEL_CLS}>Prioritas Urgensi</label>
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
              <label className={LABEL_CLS}>
                Deskripsi &amp; Kronologi Lengkap <span className="text-rose-400">*</span>
              </label>
              <textarea
                className="w-full p-4 rounded-xl border border-[#243048] hover:border-[#7BBDE8]/60 focus:border-[#7BBDE8] focus:ring-4 focus:ring-[#7BBDE8]/15 bg-[#101828] text-sm outline-none transition-colors text-white placeholder:text-[#6EA2B3] resize-none"
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
              <div className="flex justify-between items-center mt-1.5 px-1 text-xs">
                <span className="text-[#6EA2B3]">
                  {description.trim().length < 10 ? 'Minimal 10 karakter' : 'Panjang deskripsi memadai'}
                </span>
                <span className={`tabular-nums ${description.length >= 2000 ? 'text-rose-400 font-bold' : 'text-[#6EA2B3]'}`}>
                  {description.length} / 2000 karakter
                </span>
              </div>
            </div>

            {/* Status Feedback */}
            {submitMessage && (
              <div className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-3 border ${
                submitMessage.type === 'success'
                  ? 'bg-emerald-950/30 text-emerald-300 border-emerald-800/40'
                  : 'bg-rose-950/30 text-rose-300 border-rose-800/40'
              }`}>
                <FontAwesome
                  name={submitMessage.type === 'success' ? 'circle-check' : 'circle-exclamation'}
                  className={`text-sm shrink-0 ${submitMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}
                />
                <span>{submitMessage.text}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#243048]">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#6EA2B3] hover:text-white hover:bg-[#101828] rounded-xl transition-colors cursor-pointer"
              >
                <FontAwesome name="eraser" variant="solid" className="text-xs" />
                <span>Bersihkan Isian</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-[#101828] bg-[#7BBDE8] hover:bg-[#92cbef] active:bg-[#92cbef] transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FontAwesome
                  name={isSubmitting ? 'spinner' : reportType === 'keamanan' ? 'shield-halved' : 'paper-plane'}
                  spin={isSubmitting}
                  className="text-xs"
                />
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

      {/* ── TAB 2: RIWAYAT & PELACAKAN STATUS (Focused Single-Column Layout) ── */}
      {activeTab === 'history' && (
        <div className="bg-[#171F2F] rounded-2xl border border-[#243048] shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#243048]">
            <div>
              <h2 className="text-lg font-bold text-white">Daftar Riwayat Laporan</h2>
              <p className="text-xs text-[#6EA2B3] mt-1">
                Menampilkan {filteredComplaints.length} dari total {complaints.length} laporan yang pernah Anda sampaikan.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-[#101828] border border-[#243048] rounded-xl self-start sm:self-auto">
              {(
                [
                  { key: 'all', label: 'Semua' },
                  { key: 'layanan', label: 'Layanan' },
                  { key: 'keamanan', label: 'Keamanan' },
                ] as const
              ).map(t => (
                <button
                  key={t.key}
                  onClick={() => setHistoryFilter(t.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    historyFilter === t.key
                      ? 'bg-[#7BBDE8] text-[#101828] font-bold shadow-xs'
                      : 'text-[#6EA2B3] hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul, nomor tiket referensi, atau isi keluhan..."
              className="w-full h-11 pl-10 pr-10 bg-[#101828] border border-[#243048] focus:border-[#7BBDE8] focus:ring-4 focus:ring-[#7BBDE8]/15 rounded-xl text-sm text-white placeholder-[#6EA2B3] outline-none transition-colors"
            />
            <FontAwesome name="magnifying-glass" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6EA2B3]" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6EA2B3] hover:text-white p-1"
                title="Hapus pencarian"
              >
                <FontAwesome name="xmark" />
              </button>
            )}
          </div>

          {/* List Content */}
          {isLoading ? (
            <div className="py-12">
              <LoadingBlock />
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon="inbox"
                title={complaints.length === 0 ? 'Belum Ada Laporan Terkirim' : 'Tidak Ditemukan Laporan'}
                desc={
                  complaints.length === 0
                    ? 'Anda belum pernah mengirimkan pengaduan. Beralih ke tab Buat Laporan Baru untuk memulai.'
                    : 'Tidak ada laporan yang sesuai dengan filter atau kata kunci pencarian Anda.'
                }
              />
            </div>
          ) : (
            <div className="space-y-4 divide-y divide-[#243048]/50">
              {filteredComplaints.map(c => {
                const isSec = c.report_type === 'keamanan';
                return (
                  <div
                    key={c.id}
                    className={`pt-4 first:pt-0 rounded-xl p-5 border transition-colors ${
                      isSec
                        ? 'border-violet-800/40 bg-violet-950/20'
                        : 'border-[#243048] bg-[#101828]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <ReportTypeBadge type={c.report_type} />
                          <h3 className="font-bold text-sm text-white leading-snug">{c.title}</h3>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <button
                            type="button"
                            onClick={() => handleCopyRef(c.reference_number)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#171F2F] text-[#7BBDE8] border border-[#243048] hover:bg-[#243048] transition-colors cursor-pointer"
                            title="Salin nomor tiket"
                          >
                            <span>{c.reference_number}</span>
                            <FontAwesome name={copiedRef === c.reference_number ? 'check' : 'copy'} className="text-[10px]" />
                            <span className="text-[10px] font-sans font-medium text-[#6EA2B3]">
                              {copiedRef === c.reference_number ? 'Tersalin' : 'Salin'}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSec ? <SeverityBadge severity={c.severity} /> : <PriorityBadge priority={c.priority} />}
                        <StatusBadge status={c.status} />
                      </div>
                    </div>

                    {isSec && (
                      <div className="flex items-center gap-2 flex-wrap mt-3 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-[#171F2F] border border-violet-800/40 text-violet-300 font-semibold">
                          {SECURITY_KIND_LABEL[c.security_kind || ''] || 'Keamanan'}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#171F2F] border border-[#243048] text-[#6EA2B3]">
                          Sumber: {SECURITY_SOURCE_LABEL[c.security_source || ''] || '-'}
                        </span>
                        {c.affected_url && (
                          <span className="text-[#6EA2B3] flex items-center gap-1 truncate max-w-sm" title={c.affected_url}>
                            <FontAwesome name="link" className="text-[10px] text-[#6EA2B3]" />
                            <span className="truncate">{c.affected_url}</span>
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-[#6EA2B3] mt-3 whitespace-pre-line leading-relaxed">
                      {c.description}
                    </p>

                    {c.resolution && (
                      <div className="mt-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                          <FontAwesome name="comment-dots" className="text-xs" />
                          Tanggapan &amp; Resolusi Resmi Petugas
                        </span>
                        <p className="text-xs text-emerald-200 leading-relaxed font-medium">
                          {c.resolution}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-[#6EA2B3] mt-4 pt-3 border-t border-[#243048] flex-wrap gap-2">
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
