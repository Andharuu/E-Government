import { useEffect, useRef, useState, useMemo } from 'react';
import { activityApi, publicServicesApi, type ActivityAnalytics, type PublicServiceAgenda } from '../services/api';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Flaticon, FontAwesome } from '../components/ui';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

/* ─── Color System ─── */
const C = {
  navy: '#001D39',
  navyLight: '#0A4174',
  slate: '#49769F',
  muted: '#6EA2B3',
  subtle: '#BDD8E9',
  border: '#BDD8E9',
  surface: '#F6F8FB',
  white: '#FFFFFF',
  emerald: '#4E8EA2',
  emeraldGlow: 'rgba(78,142,162,0.2)',
  amber: '#F59E0B',
  amberGlow: 'rgba(245,158,11,0.15)',
  rose: '#F43F5E',
  roseGlow: 'rgba(244,63,94,0.15)',
  blue: '#0A4174',
  blueGlow: 'rgba(10,65,116,0.2)',
  indigo: '#49769F',
  sky: '#7BBDE8',
  skyGlow: 'rgba(123,189,232,0.25)',
} as const;

/* ─── Custom Area Tooltip (module scope so it isn't recreated each render) ─── */
function CustomAreaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0B1121] text-white px-4 py-3 rounded-xl shadow-2xl border border-white/10 text-xs">
      <p className="font-semibold mb-1.5 text-slate-300">{label}</p>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-400">Autofill:</span>
          <span className="font-bold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Default reminders (module scope, stable reference) ─── */
const DEFAULT_REMINDERS = [
  { id: 1, title: 'Pelaporan SPT Tahunan PPh Orang Pribadi', agency: 'DJP Online', deadline: '31 Maret 2026', logoUrl: '/logos/djp.svg', url: 'https://djponline.pajak.go.id' },
  { id: 2, title: 'Aktivasi Identitas Kependudukan Digital (IKD)', agency: 'Ditjen Dukcapil', deadline: 'Berkala 2026', logoUrl: '/logos/dukcapil.svg', url: 'https://dukcapil.kemendagri.go.id' },
  { id: 3, title: 'Seleksi CASN & PPPK Nasional', agency: 'BKN', deadline: 'Periode Berjalan', logoUrl: '/logos/bkn.svg', url: 'https://sscasn.bkn.go.id' },
  { id: 4, title: 'Validasi BPJS Kesehatan', agency: 'BPJS Kesehatan', deadline: 'Bulanan', logoUrl: '/logos/bpjs.svg', url: 'https://bpjs-kesehatan.go.id' },
  { id: 5, title: 'Perpanjangan Paspor RI', agency: 'Ditjen Imigrasi', deadline: 'Fleksibel', logoUrl: '/logos/imigrasi.svg', url: 'https://imigrasi.go.id' },
];

/* ─── Animated Counter Hook ─── */
function useCountUp(target: number, duration = 1500) {
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

/* ─── Mouse Glow Component ─── */
function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!glowRef.current) return;
      glowRef.current.style.left = `${e.clientX - 150}px`;
      glowRef.current.style.top = `${e.clientY - 150}px`;
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed w-[300px] h-[300px] rounded-full opacity-30 z-0"
      style={{
        background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        transition: 'left 0.3s ease-out, top 0.3s ease-out',
      }}
    />
  );
}

/* ─── Shimmer Skeleton ─── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-6 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/3 mb-4" />
      <div className="h-8 bg-slate-200 rounded w-2/3 mb-2" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
    </div>
  );
}

export function Dashboard() {
  const [analytics, setAnalytics] = useState<ActivityAnalytics | null>(null);
  const [publicServices, setPublicServices] = useState<PublicServiceAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeInfoSlide, setActiveInfoSlide] = useState<0 | 1>(0);
  const [isComplaintOpen, setIsComplaintOpen] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart<'doughnut'> | null>(null);

  const fetchAnalytics = async () => {
    try {
      const res = await activityApi.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  };

  const fetchPublicServices = async () => {
    try {
      const res = await publicServicesApi.get();
      setPublicServices(res.data.agendas);
    } catch (err) {
      console.error('Error fetching public services:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchAnalytics(), fetchPublicServices()]);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveInfoSlide((prev) => (prev === 0 ? 1 : 0));
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleSendComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setComplaintSuccess(true);
    setTimeout(() => {
      setComplaintSuccess(false);
      setIsComplaintOpen(false);
      setComplaintText('');
    }, 1800);
  };

  /* ─── Data ─── */
  const resultsData = useMemo(() => {
    const totalFilled = analytics?.total_autofill ?? 0;
    const success = analytics?.success_count ?? (totalFilled > 0 ? totalFilled : 6);
    const partial = analytics?.partial_count ?? (totalFilled > 0 ? 0 : 2);
    const failed = analytics?.failed_count ?? (totalFilled > 0 ? 0 : 1);
    const total = success + partial + failed || 1;

    return [
      {
        name: 'Sukses',
        value: success,
        percent: Math.round((success / total) * 100),
        color: C.emerald,
        glow: C.emeraldGlow,
      },
      {
        name: 'Parsial',
        value: partial,
        percent: Math.round((partial / total) * 100),
        color: C.amber,
        glow: C.amberGlow,
      },
      {
        name: 'Gagal',
        value: failed,
        percent: Math.round((failed / total) * 100),
        color: C.rose,
        glow: C.roseGlow,
      },
    ];
  }, [analytics]);

  const totalSessions = useCountUp(analytics?.total_autofill ?? 0);
  const successRate = useCountUp(analytics?.success_rate ?? 0);

  /* ─── Donut Chart with Premium Effects ─── */
  useEffect(() => {
    if (!chartRef.current || loading) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Create gradient fills
    const gradients = resultsData.map((d) => {
      const grad = ctx.createLinearGradient(0, 0, 0, 200);
      grad.addColorStop(0, d.color);
      grad.addColorStop(1, d.color + '80');
      return grad;
    });

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: resultsData.map((d) => d.name),
        datasets: [
          {
            data: resultsData.map((d) => d.value),
            backgroundColor: gradients,
            borderWidth: 0,
            borderRadius: 10,
            spacing: 4,
            hoverOffset: 12,
            hoverBorderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        rotation: -90,
        circumference: 360,
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: C.navy,
            padding: 14,
            cornerRadius: 12,
            titleFont: { size: 13, weight: 'bold' as const },
            bodyFont: { size: 12, weight: 'normal' as const },
            titleColor: '#fff',
            bodyColor: '#94A3B8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            displayColors: true,
            boxPadding: 6,
            callbacks: {
              label: (context) => {
                const item = resultsData[context.dataIndex];
                return ` ${item.name}: ${item.value} sesi (${item.percent}%)`;
              },
            },
          },
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1800,
          easing: 'easeOutQuart',
        },
        onHover: (_event, elements) => {
          if (elements.length > 0) {
            const idx = elements[0].index;
            setHoveredSegment(resultsData[idx]?.name ?? null);
          } else {
            setHoveredSegment(null);
          }
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [resultsData, loading]);

  /* ─── Privacy Audit ─── */
  const privacyAuditItems = useMemo(() => {
    const totalFilled = analytics?.total_autofill || 0;
    return [
      {
        id: 'nik',
        title: 'Nomor Induk Kependudukan (NIK)',
        detail: 'Enkripsi AES-256 lokal',
        status: 'Terenkripsi',
        code: `${totalFilled > 0 ? totalFilled : 6}x akses`,
        icon: 'id-card',
      },
      {
        id: 'nama',
        title: 'Nama Lengkap Warga',
        detail: 'Identitas resmi KTP',
        status: 'Terverifikasi',
        code: `${totalFilled > 0 ? totalFilled : 6}x akses`,
        icon: 'user',
      },
      {
        id: 'telepon',
        title: 'Nomor Kontak & HP',
        detail: 'Kontak aktif terdaftar',
        status: 'Aman',
        code: `${totalFilled > 0 ? Math.ceil(totalFilled * 0.75) : 4}x akses`,
        icon: 'phone',
      },
      {
        id: 'alamat',
        title: 'Alamat Domisili KTP',
        detail: 'Wilayah kelurahan/kota',
        status: 'Tersimpan',
        code: `${totalFilled > 0 ? Math.ceil(totalFilled * 0.65) : 3}x akses`,
        icon: 'map-pin',
      },
      {
        id: 'foto',
        title: 'Foto Dokumen (KTP / KK)',
        detail: 'Penyimpanan lokal browser',
        status: 'Terenkripsi',
        code: 'Aktif',
        icon: 'file-shield',
      },
    ];
  }, [analytics]);

  /* ─── Bar Chart Data ─── */
  /* ─── Area Chart Data (Daily Trend) ─── */
  const areaChartData = useMemo(() => {
    if (analytics?.daily_trend && analytics.daily_trend.length > 0) {
      return analytics.daily_trend.map((d) => ({
        name: d.date,
        autofill: d.autofill,
      }));
    }
    return [
      { name: 'Sen', autofill: 5 },
      { name: 'Sel', autofill: 8 },
      { name: 'Rab', autofill: 6 },
      { name: 'Kam', autofill: 11 },
      { name: 'Jum', autofill: 14 },
      { name: 'Sab', autofill: 7 },
      { name: 'Min', autofill: 9 },
    ];
  }, [analytics]);

  /* ─── Reminders ─── */
  const remindersData = useMemo(() => {
    if (publicServices.length > 0) {
      return publicServices.slice(0, 5).map((item, idx) => ({
        id: idx + 1,
        title: item.title,
        agency: item.agency,
        deadline: item.deadline,
        logoUrl: '/logos/default.svg',
        url: item.url,
      }));
    }
    return DEFAULT_REMINDERS;
  }, [publicServices]);

  if (loading) {
    return (
      <div className="w-full space-y-6 pb-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1.6fr_1.1fr] gap-4">
          <div className="flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  const timeSavedMinutes = Math.floor((analytics?.estimated_time_saved_seconds ?? 0) / 60);
  const timeSavedSeconds = (analytics?.estimated_time_saved_seconds ?? 0) % 60;

  return (
    <div className="w-full space-y-6 pb-6 relative">
      <MouseGlow />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-[#001D39] tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#49769F] mt-1.5 font-medium">
            Ringkasan analitik dan efisiensi pengisian formulir otomatis
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white hover:bg-[#BDD8E9]/15 border border-[#BDD8E9] text-sm font-semibold text-[#0A4174] transition-all duration-300 cursor-pointer self-start sm:self-auto disabled:opacity-50 hover:shadow-lg hover:shadow-[#BDD8E9]/30 hover:-translate-y-0.5"
        >
          <Flaticon
            name="rotate-right"
            className={`text-sm text-[#0A4174] transition-transform duration-700 ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'}`}
          />
          <span>{refreshing ? 'Memperbarui...' : 'Perbarui data'}</span>
        </button>
      </div>

      {/* Main Grid — Responsive: 1 col mobile → 2 col tablet → 3 col desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1.2fr_1.5fr] 2xl:grid-cols-[1.1fr_1.6fr_1.1fr] gap-4 relative z-10">

        {/* ─── Left Column ─── */}
        <div className="flex flex-col gap-4">
          {/* Info Card — Premium Dark */}
          <div className="rounded-2xl bg-gradient-to-br from-[#001D39] via-[#0A4174] to-[#001D39] text-white p-6 min-h-[200px] flex flex-col justify-between relative overflow-hidden group border border-[#49769F]/20 shadow-xl">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#7BBDE8]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#4E8EA2]/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#7BBDE8] animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase text-[#7BBDE8]">
                  {activeInfoSlide === 0 ? 'Total Pengisian' : 'Tingkat Keberhasilan'}
                </span>
              </div>
              <span className="text-[11px] text-[#BDD8E9] font-medium bg-white/10 px-2.5 py-1 rounded-full">
                Update Otomatis
              </span>
            </div>

            <div className="my-4 relative z-10">
              {activeInfoSlide === 0 ? (
                <div key="slide-0" className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <p className="text-xs text-[#BDD8E9] mb-2 font-medium">Total formulir diproses</p>
                  <div className="text-4xl font-black tracking-tight text-white">
                    {totalSessions}
                    <span className="text-lg font-semibold text-[#BDD8E9] ml-2">Formulir</span>
                  </div>
                </div>
              ) : (
                <div key="slide-1" className="animate-in fade-in slide-in-from-right-4 duration-500">
                  <p className="text-xs text-[#BDD8E9] mb-2 font-medium">Rasio keberhasilan pengisian</p>
                  <div className="text-4xl font-black text-[#7BBDE8] tracking-tight">
                    {successRate}%
                    <span className="text-lg font-semibold text-white ml-2">Sukses</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10 relative z-10">
              <div className="flex items-center gap-2">
                {[0, 1].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveInfoSlide(idx as 0 | 1)}
                    className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                      activeInfoSlide === idx ? 'w-6 bg-[#7BBDE8]' : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-[#BDD8E9]/70 font-medium">Berganti tiap 7s</span>
            </div>
          </div>

          {/* Privacy Audit */}
          <div className="rounded-2xl bg-white border border-[#BDD8E9]/60 p-5 flex-1 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2EBF2]">
              <div>
                <h2 className="text-sm font-bold text-[#001D39]">Ringkasan Audit Privasi</h2>
                <p className="text-xs text-[#49769F] mt-0.5 font-medium">Transparansi & proteksi data</p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#49769F] hover:text-[#001D39] hover:bg-[#BDD8E9]/20 transition-all duration-200 cursor-pointer"
              >
                <FontAwesome name="ellipsis" variant="solid" className="text-xs" />
              </button>
            </div>

            <div className="divide-y divide-[#E2EBF2] flex-1 flex flex-col justify-evenly">
              {privacyAuditItems.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 group/item hover:bg-[#BDD8E9]/15 -mx-2 px-2 rounded-xl transition-all duration-200 cursor-default"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BDD8E9]/40 to-[#BDD8E9]/80 text-[#0A4174] flex items-center justify-center shrink-0 shadow-sm group-hover/item:scale-110 transition-transform duration-200">
                      <FontAwesome name={item.icon} variant="solid" className="text-xs" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#001D39] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#49769F] truncate font-medium">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#BDD8E9]/40 text-[#0A4174] border border-[#6EA2B3]/30">
                      {item.status}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">{item.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Center Column ─── */}
        <div className="flex flex-col gap-4">
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Time Saved */}
            <div className="rounded-2xl bg-white border border-[#BDD8E9]/60 p-6 min-h-[200px] flex flex-col justify-between shadow-sm hover:shadow-lg hover:shadow-[#BDD8E9]/30 hover:-translate-y-1 transition-all duration-300 group cursor-default">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#49769F]">Waktu yang dihemat</span>
                <div className="w-8 h-8 rounded-xl bg-[#BDD8E9]/30 text-[#0A4174] flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <FontAwesome name="clock" variant="solid" className="text-xs" />
                </div>
              </div>
              <div>
                <div className="text-[32px] font-black text-[#001D39] tracking-tight">
                  {timeSavedMinutes}m {timeSavedSeconds}s
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4174] mt-2 bg-[#BDD8E9]/40 w-fit px-2.5 py-1 rounded-full">
                  <FontAwesome name="arrow-trend-up" variant="solid" className="text-[10px]" />
                  <span>+35% efisiensi</span>
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            <div className="rounded-2xl bg-white border border-[#BDD8E9]/60 p-6 min-h-[200px] flex flex-col justify-between shadow-sm hover:shadow-lg hover:shadow-[#BDD8E9]/30 hover:-translate-y-1 transition-all duration-300 group cursor-default">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#49769F]">Kelengkapan profil</span>
                <div className="w-8 h-8 rounded-xl bg-[#BDD8E9]/30 text-[#0A4174] flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <FontAwesome name="shield-check" variant="solid" className="text-xs" />
                </div>
              </div>
              <div>
                <div className="text-[32px] font-black text-[#001D39] tracking-tight">
                  {analytics?.profile_completion ?? 0}%
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0A4174] mt-2 bg-[#BDD8E9]/40 w-fit px-2.5 py-1 rounded-full">
                  <FontAwesome name="check" variant="solid" className="text-[10px]" />
                  <span>Data terverifikasi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart — Premium */}
          <div className="rounded-2xl bg-white border border-[#BDD8E9]/60 p-6 flex-1 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-[#001D39]">Aktivitas Pengisian Formulir</h2>
                <div className="flex items-center gap-2.5 mt-1.5">
                  <span className="text-xl font-black text-[#001D39]">
                    {analytics?.total_autofill ?? 0}
                  </span>
                  <span className="text-sm font-semibold text-[#49769F]">Sesi</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0A4174] bg-[#BDD8E9]/40 px-2.5 py-1 rounded-full border border-[#6EA2B3]/30">
                    +35%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-[#49769F]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-md bg-gradient-to-br from-[#0A4174] to-[#7BBDE8] shadow-sm" />
                  <span>Tren Harian</span>
                </div>
              </div>
            </div>

            <div className="min-h-48 w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0A4174" stopOpacity={0.35} />
                      <stop offset="60%" stopColor="#4E8EA2" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#BDD8E9" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="0"
                    horizontal={true}
                    vertical={false}
                    stroke="rgba(189,216,233,0.3)"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#49769F', fontSize: 11, fontWeight: 600 }}
                    dy={8}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: '#0A4174', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area
                    type="monotone"
                    dataKey="autofill"
                    stroke="#0A4174"
                    strokeWidth={2.5}
                    fill="url(#areaGradient)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#0A4174', strokeWidth: 2, stroke: '#fff' }}
                    animationDuration={1800}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart — Premium */}
          <div className="rounded-2xl bg-white border border-[#BDD8E9]/60 p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2EBF2]">
              <div>
                <h2 className="text-sm font-bold text-[#001D39]">Hasil Pengisian Formulir</h2>
                <p className="text-xs text-[#49769F] mt-0.5 font-medium">Distribusi rasio penyelesaian</p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#49769F] hover:text-[#001D39] hover:bg-[#BDD8E9]/20 transition-all duration-200 cursor-pointer"
              >
                <FontAwesome name="ellipsis" variant="solid" className="text-xs" />
              </button>
            </div>

            <div className="pt-5 flex flex-col items-center">
              <div className="w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52 relative flex items-center justify-center">
                {/* Glow behind chart */}
                <div
                  className="absolute inset-0 rounded-full blur-3xl opacity-20 transition-all duration-500"
                  style={{
                    background: hoveredSegment
                      ? resultsData.find((d) => d.name === hoveredSegment)?.glow
                      : 'transparent',
                  }}
                />
                <canvas ref={(el) => { chartRef.current = el; }} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.15em]">
                    Total Sesi
                  </span>
                  <span className="text-3xl font-black text-[#0B1121] tabular-nums mt-1">
                    {totalSessions}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                {resultsData.map((item) => (
                  <div
                    key={item.name}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 cursor-default ${
                      hoveredSegment === item.name
                        ? 'border-slate-200 bg-white shadow-lg scale-105'
                        : 'border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-200'
                    }`}
                    onMouseEnter={() => setHoveredSegment(item.name)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-md shrink-0 shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                    <span className="text-xs font-black text-slate-900">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Column ─── */}
        <div className="flex flex-col gap-4">
          {/* Reminders */}
          <div className="rounded-2xl bg-white border border-[#BDD8E9]/60 p-5 flex-1 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2EBF2]">
              <div>
                <h2 className="text-sm font-bold text-[#001D39]">Jadwal & Pengingat</h2>
                <p className="text-xs text-[#49769F] mt-0.5 font-medium">Agenda layanan publik</p>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#49769F] hover:text-[#001D39] hover:bg-[#BDD8E9]/20 transition-all duration-200 cursor-pointer"
              >
                <FontAwesome name="ellipsis" variant="solid" className="text-xs" />
              </button>
            </div>

            <div className="divide-y divide-[#E2EBF2] flex-1 flex flex-col justify-evenly">
              {remindersData.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 group/item hover:bg-[#BDD8E9]/15 -mx-2 px-2 rounded-xl transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F6F8FB] to-[#BDD8E9]/30 border border-[#BDD8E9]/50 flex items-center justify-center p-1.5 shrink-0 group-hover/item:scale-110 transition-transform duration-200">
                      <img
                        src={item.logoUrl}
                        alt={item.agency}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#001D39] truncate group-hover/item:text-[#0A4174] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-[#49769F] truncate font-medium">
                        {item.agency} · <span className="text-[#001D39] font-semibold">{item.deadline}</span>
                      </p>
                    </div>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-[#49769F] hover:text-[#0A4174] hover:bg-[#BDD8E9]/30 rounded-xl transition-all duration-200 shrink-0 hover:scale-110"
                  >
                    <Flaticon name="share" className="text-xs" />
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Complaint Box — Premium */}
          <div className="rounded-2xl bg-gradient-to-br from-[#001D39] via-[#0A4174] to-[#49769F] border border-[#BDD8E9]/30 p-6 relative overflow-hidden group hover:shadow-xl hover:shadow-[#001D39]/20 hover:-translate-y-1 transition-all duration-300 text-white">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#7BBDE8]/15 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-[#BDD8E9]/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 text-[#7BBDE8] flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-200 backdrop-blur-sm">
                <FontAwesome name="comments" variant="solid" className="text-sm" />
              </div>

              <h3 className="text-sm font-black text-white">
                Pusat Pengaduan & Bantuan
              </h3>
              <p className="text-xs text-[#BDD8E9] mt-1.5 leading-relaxed font-medium">
                Temukan kendala autofill atau butuh bantuan formulir? Laporkan di sini.
              </p>

              <button
                type="button"
                onClick={() => setIsComplaintOpen(true)}
                className="mt-5 w-full h-10 px-4 rounded-xl bg-[#7BBDE8] hover:bg-white text-[#001D39] text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#001D39]/30 hover:-translate-y-0.5"
              >
                <span>Kirim Pengaduan</span>
                <Flaticon name="arrow-right" className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Modal — Premium */}
      {isComplaintOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-[#BDD8E9]/60 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2EBF2]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#BDD8E9]/40 text-[#0A4174] flex items-center justify-center shadow-sm">
                  <FontAwesome name="circle-exclamation" variant="solid" className="text-sm" />
                </div>
                <h3 className="text-base font-black text-[#001D39]">Pengaduan Layanan</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsComplaintOpen(false)}
                className="text-[#49769F] hover:text-[#001D39] p-2 hover:bg-[#BDD8E9]/20 rounded-xl transition-all duration-200 cursor-pointer"
              >
                <Flaticon name="cross" className="text-xs" />
              </button>
            </div>

            {complaintSuccess ? (
              <div className="py-10 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-[#BDD8E9]/40 text-[#0A4174] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#BDD8E9]/30">
                  <FontAwesome name="check" variant="solid" className="text-xl" />
                </div>
                <h4 className="text-base font-black text-[#001D39]">Laporan Terkirim</h4>
                <p className="text-sm text-[#49769F] mt-1.5 font-medium">
                  Tim bantuan akan segera meninjau kendala Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendComplaint} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#001D39] mb-2">
                    Jenis Kendala
                  </label>
                  <select className="w-full h-11 px-4 bg-[#F6F8FB] border border-[#BDD8E9] rounded-xl text-sm text-[#001D39] outline-none focus:border-[#0A4174] focus:ring-2 focus:ring-[#7BBDE8]/20 font-medium transition-all duration-200">
                    <option>Field formulir tidak cocok / tidak terisi</option>
                    <option>Gagal sinkronisasi ekstensi</option>
                    <option>Portal layanan publik belum didukung</option>
                    <option>Pertanyaan keamanan data & privasi</option>
                    <option>Kendala lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#001D39] mb-2">
                    Deskripsi Masalah
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={complaintText}
                    onChange={(e) => setComplaintText(e.target.value)}
                    placeholder="Tuliskan kendala yang Anda alami secara detail..."
                    className="w-full p-4 bg-[#F6F8FB] border border-[#BDD8E9] rounded-xl text-sm text-[#001D39] outline-none focus:border-[#0A4174] focus:ring-2 focus:ring-[#7BBDE8]/20 placeholder-[#6EA2B3] resize-none font-medium transition-all duration-200"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2EBF2]">
                  <button
                    type="button"
                    onClick={() => setIsComplaintOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#49769F] hover:bg-[#BDD8E9]/20 transition-all duration-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#0A4174] hover:bg-[#001D39] shadow-lg shadow-[#0A4174]/20 hover:shadow-xl transition-all duration-200 cursor-pointer"
                  >
                    Kirim Laporan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
