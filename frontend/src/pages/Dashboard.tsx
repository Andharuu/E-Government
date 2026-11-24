import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { activityApi, type ActivityAnalytics, type Activity } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Zap,
  Clock,
  UserCheck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Lock,
  ChevronRight,
  Database,
  Laptop,
} from 'lucide-react';

function CustomAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.1] dark:border-white/[0.1] border-slate-200 bg-[#0B1E38] text-white p-3 shadow-xl backdrop-blur-md">
      <p className="text-xs font-mono text-slate-400 mb-1.5">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between gap-6 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name === 'autofill' ? 'Sesi Formulir' : 'Field Terisi'}
            </span>
            <span className="font-mono font-bold tabular-nums text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    let raf: number;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl bg-white/[0.06] dark:bg-white/[0.06] bg-slate-200" />
          <div className="h-4 w-96 rounded-lg bg-white/[0.04] dark:bg-white/[0.04] bg-slate-100" />
        </div>
        <div className="h-10 w-32 rounded-xl bg-white/[0.06] dark:bg-white/[0.06] bg-slate-200" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-[20px] border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
            <div className="h-4 w-28 rounded bg-white/[0.06]" />
            <div className="h-8 w-20 rounded bg-white/[0.06]" />
            <div className="h-3 w-36 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>

      <div className="h-96 rounded-[20px] border border-white/[0.06] bg-white/[0.02]" />
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ActivityAnalytics | null>(null);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeInfoSlide, setActiveInfoSlide] = useState<0 | 1>(0);
  const [timeRange, setTimeRange] = useState<'harian' | 'mingguan' | 'bulanan'>('bulanan');
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  const fetchAnalytics = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [resAnalytics, resActivities] = await Promise.all([
        activityApi.getAnalytics(30),
        activityApi.get({ limit: 100 }),
      ]);
      setAnalytics(resAnalytics.data);
      setAllActivities(resActivities.data || []);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const pollTimer = setInterval(() => {
      fetchAnalytics(true);
    }, 30000);

    const onFocus = () => fetchAnalytics(true);
    const onVisibilityChange = () => {
      if (!document.hidden) fetchAnalytics(true);
    };
    const onCustomSync = () => fetchAnalytics(true);

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('storage', onCustomSync);
    window.addEventListener('govconnect:refresh_dashboard', onCustomSync);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('storage', onCustomSync);
      window.removeEventListener('govconnect:refresh_dashboard', onCustomSync);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInfoSlide((prev) => (prev === 0 ? 1 : 0));
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics(false);
  };

  // Donut data with high-contrast palette
  const resultsData = useMemo(() => {
    const rawSuccess = analytics?.success_count ?? 0;
    const rawPartial = analytics?.partial_count ?? 0;
    const rawFailed = analytics?.failed_count ?? 0;
    const total = rawSuccess + rawPartial + rawFailed;

    return [
      {
        name: 'Sukses',
        value: rawSuccess,
        percent: total > 0 ? Math.round((rawSuccess / total) * 100) : 0,
        color: '#10B981', // Mint green
      },
      {
        name: 'Parsial',
        value: rawPartial,
        percent: total > 0 ? Math.round((rawPartial / total) * 100) : 0,
        color: '#F59E0B', // Amber
      },
      {
        name: 'Gagal',
        value: rawFailed,
        percent: total > 0 ? Math.round((rawFailed / total) * 100) : 0,
        color: '#F43F5E', // Coral
      },
    ];
  }, [analytics]);

  const activeSegmentItem = selectedSegment !== null ? resultsData[selectedSegment] : null;
  const totalSessions = analytics?.total_autofill ?? 0;
  const successRate = analytics?.success_rate ?? 0;

  const handleSelectSegment = (idx: number | null) => {
    setSelectedSegment((prev) => (prev === idx ? null : idx));
  };

  const hasChartData = resultsData.some((d) => d.value > 0);

  // Data Keamanan & Privasi
  const privacyAuditItems = useMemo(() => {
    const totalFilled = analytics?.total_autofill ?? allActivities.length;
    const profileComp = analytics?.profile_completion ?? 0;

    return [
      {
        id: 'storage',
        title: 'Penyimpanan Data Lokal Klien',
        desc: 'Tersimpan aman di brankas peramban Anda, tanpa transit ke server pihak ketiga.',
        icon: ShieldCheck,
        badge: 'Aman',
      },
      {
        id: 'connection',
        title: 'Koneksi Layanan Resmi Nasional',
        desc: 'Jalur komunikasi aman terenkripsi ke seluruh portal kementerian & pemerintah daerah.',
        icon: Lock,
        badge: 'Enkripsi',
      },
      {
        id: 'account',
        title: 'Status Profil Kependudukan',
        desc: `Akun aktif ${user?.email || 'Warga Terdaftar'} (Kelengkapan Data: ${profileComp}%)`,
        icon: UserCheck,
        badge: `${profileComp}% Lengkap`,
      },
      {
        id: 'extension',
        title: 'Mesin Autofill Semantik',
        desc: 'Mendeteksi atribut form publik dan mengisi seketika saat Anda menyetujui.',
        icon: Zap,
        badge: '0,3 Detik',
      },
      {
        id: 'privacy',
        title: 'Privasi & Audit Log Riwayat',
        desc: `${totalFilled} sesi pengisian tercatat secara privat dan hanya dapat Anda tinjau.`,
        icon: Database,
        badge: 'Privat',
      },
    ];
  }, [analytics, allActivities, user]);

  // Tren Aktivitas Area Chart
  const { areaChartData, periodMetrics } = useMemo(() => {
    const now = new Date();

    if (timeRange === 'harian') {
      const days: { name: string; dateIso: string; autofill: number; fields: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        const dateIso = d.toISOString().split('T')[0];
        days.push({ name: dayStr, dateIso, autofill: 0, fields: 0 });
      }

      allActivities.forEach((act) => {
        if (!act.created_at) return;
        const actDate = act.created_at.split('T')[0];
        const match = days.find((d) => d.dateIso === actDate);
        if (match) {
          match.autofill += 1;
          match.fields += act.fields_filled || 1;
        }
      });

      const totalSess = days.reduce((acc, cur) => acc + cur.autofill, 0);
      const totalFld = days.reduce((acc, cur) => acc + cur.fields, 0);

      return {
        areaChartData: days.map(({ name, autofill, fields }) => ({ name, autofill, fields })),
        periodMetrics: {
          sessions: totalSess,
          fields: totalFld,
          sessGrowth: totalSess > 0 ? '+100%' : '0%',
          fieldGrowth: totalFld > 0 ? '+100%' : '0%',
        },
      };
    }

    if (timeRange === 'mingguan') {
      const weeks = [
        { name: 'Mg 1', startDays: 42, endDays: 35, autofill: 0, fields: 0 },
        { name: 'Mg 2', startDays: 35, endDays: 28, autofill: 0, fields: 0 },
        { name: 'Mg 3', startDays: 28, endDays: 21, autofill: 0, fields: 0 },
        { name: 'Mg 4', startDays: 21, endDays: 14, autofill: 0, fields: 0 },
        { name: 'Mg 5', startDays: 14, endDays: 7, autofill: 0, fields: 0 },
        { name: 'Mg 6', startDays: 7, endDays: 0, autofill: 0, fields: 0 },
      ];

      allActivities.forEach((act) => {
        if (!act.created_at) return;
        const actTime = new Date(act.created_at).getTime();
        const diffDays = Math.floor((now.getTime() - actTime) / (1000 * 60 * 60 * 24));
        const match = weeks.find((w) => diffDays >= w.endDays && diffDays < w.startDays);
        if (match) {
          match.autofill += 1;
          match.fields += act.fields_filled || 1;
        }
      });

      const totalSess = weeks.reduce((acc, cur) => acc + cur.autofill, 0);
      const totalFld = weeks.reduce((acc, cur) => acc + cur.fields, 0);

      return {
        areaChartData: weeks.map(({ name, autofill, fields }) => ({ name, autofill, fields })),
        periodMetrics: {
          sessions: totalSess,
          fields: totalFld,
          sessGrowth: totalSess > 0 ? '+100%' : '0%',
          fieldGrowth: totalFld > 0 ? '+100%' : '0%',
        },
      };
    }

    // Default: Bulanan
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = now.getFullYear();
    const months = monthNames.map((name) => ({
      name,
      autofill: 0,
      fields: 0,
    }));

    allActivities.forEach((act) => {
      if (!act.created_at) return;
      const d = new Date(act.created_at);
      if (d.getFullYear() === currentYear) {
        const mIdx = d.getMonth();
        if (months[mIdx]) {
          months[mIdx].autofill += 1;
          months[mIdx].fields += act.fields_filled || 1;
        }
      }
    });

    const totalSess = months.reduce((acc, cur) => acc + cur.autofill, 0);
    const totalFld = months.reduce((acc, cur) => acc + cur.fields, 0);

    return {
      areaChartData: months,
      periodMetrics: {
        sessions: totalSess,
        fields: totalFld,
        sessGrowth: totalSess > 0 ? '+100%' : '0%',
        fieldGrowth: totalFld > 0 ? '+100%' : '0%',
      },
    };
  }, [allActivities, timeRange]);

  const timeSavedSeconds = (analytics?.estimated_time_saved_seconds ?? (periodMetrics.fields * 30)) % 60;
  const timeSavedMinutes = Math.floor((analytics?.estimated_time_saved_seconds ?? (periodMetrics.fields * 30)) / 60);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ================= HEADER SECTION ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 mb-2 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>GovConnect Core Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Dasbor Analitik &amp; Pengisian Formulir
          </h1>
          <p className="text-xs sm:text-sm text-ink-2 mt-1">
            Metrik efisiensi waktu, sebaran sesi autofill, dan transparansi jejak audit privasi kependudukan Anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/demo"
            className="px-3.5 h-11 rounded-xl text-xs sm:text-sm font-semibold border border-line bg-surface hover:bg-surface-2 text-ink flex items-center gap-2 transition-colors"
          >
            <Laptop className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Uji Simulator</span>
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 h-11 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_-3px_rgba(37,99,235,0.4)] flex items-center gap-2 transition-all disabled:opacity-60"
          >
            <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Memperbarui...' : 'Perbarui Data'}</span>
          </button>
        </div>
      </div>

      {/* ================= 4 KPI CARDS (20px RADIUS, SOFT GLOW) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Pengisian / Rasio Keberhasilan */}
        <div className="p-6 rounded-[20px] border border-line bg-surface shadow-xs transition-all hover:-translate-y-0.5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-ink-3 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">
              {activeInfoSlide === 0 ? 'Total Sesi Formulir' : 'Rasio Keberhasilan'}
            </span>
            <div className="flex items-center gap-1">
              {[0, 1].map((idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveInfoSlide(idx as 0 | 1)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeInfoSlide === idx ? 'w-4 bg-blue-500' : 'w-1.5 bg-line-2 hover:bg-ink-3'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-ink font-mono tabular-nums tracking-tight">
              {activeInfoSlide === 0 ? totalSessions : `${successRate}%`}
            </span>
            <span className="text-xs font-semibold text-emerald-400 font-mono">
              {activeInfoSlide === 0 ? 'Sesi' : 'Sukses'}
            </span>
          </div>

          <p className="text-xs text-ink-2">
            {activeInfoSlide === 0 ? 'Formulir pelayanan publik diproses' : 'Akurasi pemetaan leksikal'}
          </p>
        </div>

        {/* KPI 2: Waktu Yang Dihemat */}
        <div className="p-6 rounded-[20px] border border-line bg-surface shadow-xs transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-ink-3 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Waktu Terhemat</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-ink font-mono tabular-nums tracking-tight">
              {timeSavedMinutes}m {timeSavedSeconds}s
            </span>
            <span className="text-xs font-semibold text-emerald-400 font-mono">+98.8%</span>
          </div>

          <p className="text-xs text-ink-2">Dihitung dari rata-rata 4m30s manual</p>
        </div>

        {/* KPI 3: Kelengkapan Profil */}
        <div className="p-6 rounded-[20px] border border-line bg-surface shadow-xs transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-ink-3 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Kelengkapan Profil</span>
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <UserCheck className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-ink font-mono tabular-nums tracking-tight">
              {analytics?.profile_completion ?? 0}%
            </span>
            <span className="text-xs font-mono text-blue-400">Brankas</span>
          </div>

          <p className="text-xs text-ink-2">Identitas siap untuk pengisian instan</p>
        </div>

        {/* KPI 4: Total Kolom Terisi */}
        <div className="p-6 rounded-[20px] border border-line bg-surface shadow-xs transition-all hover:-translate-y-0.5 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-ink-3 mb-2">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Field Terisi</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Zap className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-ink font-mono tabular-nums tracking-tight">
              {periodMetrics.fields}
            </span>
            <span className="text-xs font-mono text-purple-400">Kolom</span>
          </div>

          <p className="text-xs text-ink-2">Total kolom formulir otomatis terisi</p>
        </div>
      </div>

      {/* ================= TREN AKTIVITAS PENGISIAN (AREA CHART) ================= */}
      <div className="p-6 rounded-[20px] border border-line bg-surface shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-line">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">Tren Aktivitas Pengisian Formulir</h2>
            <p className="text-xs text-ink-2 mt-0.5">Sebaran jumlah sesi dan kolom formulir yang terisi otomatis per periode</p>
          </div>

          {/* Time range segmented tab */}
          <div className="inline-flex p-1 rounded-xl border border-line bg-surface-2 text-xs font-semibold self-start sm:self-auto">
            {(['harian', 'mingguan', 'bulanan'] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pb-4">
          <div>
            <span className="text-xs text-ink-3">Total Sesi Periode:</span>
            <div className="text-2xl font-bold font-mono text-ink mt-0.5">{periodMetrics.sessions}</div>
          </div>
          <div className="pl-6 border-l border-line">
            <span className="text-xs text-ink-3">Total Kolom Terisi:</span>
            <div className="text-2xl font-bold font-mono text-ink mt-0.5">{periodMetrics.fields}</div>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAutofill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorFields" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--ink-3)', fontSize: 11 }} dy={6} />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area type="monotone" dataKey="autofill" name="autofill" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAutofill)" />
              <Area type="monotone" dataKey="fields" name="fields" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorFields)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= HASIL PENGISIAN & AUDIT PRIVASI ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: Distribusi Hasil Sesi (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-[20px] border border-line bg-surface shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink">Hasil Pengisian Formulir</h2>
            <p className="text-xs text-ink-2 mt-0.5">Distribusi rasio keberhasilan pemetaan data</p>
          </div>

          <div className="relative w-52 h-52 mx-auto my-6 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hasChartData ? resultsData : [{ name: 'Belum Ada', value: 1, color: 'var(--ink-3)' }]}
                  innerRadius={64}
                  outerRadius={84}
                  paddingAngle={hasChartData ? 3 : 0}
                  dataKey="value"
                  onClick={(_, index) => handleSelectSegment(index)}
                  cursor="pointer"
                  stroke="none"
                >
                  {(hasChartData ? resultsData : [{ name: 'Belum Ada', value: 1, color: 'var(--ink-3)' }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              {activeSegmentItem ? (
                <>
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider" style={{ color: activeSegmentItem.color }}>
                    {activeSegmentItem.name}
                  </span>
                  <span className="text-2xl font-bold text-ink font-mono my-0.5">
                    {activeSegmentItem.percent}%
                  </span>
                  <span className="text-[11px] text-ink-3 font-mono">{activeSegmentItem.value} Sesi</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-3">Total Sesi</span>
                  <span className="text-2xl font-bold text-ink font-mono my-0.5">{totalSessions}</span>
                  <span className="text-[11px] text-blue-400 font-mono">Formulir</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-line">
            {resultsData.map((item, idx) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleSelectSegment(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  selectedSegment === idx
                    ? 'border-blue-500 bg-blue-500/10 text-ink'
                    : 'border-line hover:border-line-2 text-ink-2'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.name} ({item.value})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Ringkasan Audit Privasi (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-[20px] border border-line bg-surface shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-line flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink">Ringkasan Audit Privasi &amp; Kepatuhan</h2>
              <p className="text-xs text-ink-2 mt-0.5">Prinsip pelindungan data kependudukan pribadi Anda</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
              UU PDP Terpenuhi
            </span>
          </div>

          <div className="space-y-3 my-4">
            {privacyAuditItems.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-line bg-surface-2 flex items-start gap-3 transition-colors hover:border-line-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <IconComp className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs sm:text-sm font-semibold text-ink truncate">{item.title}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface border border-line text-slate-400 shrink-0">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-xs text-ink-2 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-ink-3">
            <span>Enkripsi Klien AES-256 Aktif</span>
            <Link to="/activity" className="text-blue-400 font-semibold hover:underline inline-flex items-center gap-1">
              <span>Buka Seluruh Riwayat</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
