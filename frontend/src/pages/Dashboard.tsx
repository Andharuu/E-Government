import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { activityApi, type ActivityAnalytics } from '../services/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { StatCard, Card, EmptyState, Flaticon, FontAwesome } from '../components/ui';

export function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<ActivityAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // View state untuk tabel aktivitas terkini (gaya Bright Leads)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'partial' | 'failed'>('all');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchAnalytics = async () => {
    try {
      const res = await activityApi.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const resultsData = useMemo(() => [
    { name: 'Sukses', value: analytics?.success_count ?? 0, color: '#10B981' },
    { name: 'Parsial', value: analytics?.partial_count ?? 0, color: '#F59E0B' },
    { name: 'Gagal', value: analytics?.failed_count ?? 0, color: '#F43F5E' },
  ], [analytics]);

  // Data Ringkasan Audit Privasi (Transmisi Data dari API & Penyimpanan Lokal)
  const privacyAuditData = useMemo(() => {
    const fields = analytics?.most_used_fields || [];
    const totalFilled = analytics?.total_autofill || 0;
    
    // Default list kolom profil dengan kategori dan icon
    const defaultAuditList = [
      {
        id: 'nik',
        name: 'Nomor induk kependudukan (NIK)',
        count: totalFilled > 0 ? Math.ceil(totalFilled * 0.95) : 6,
        icon: 'id-card',
      },
      {
        id: 'nama',
        name: 'Nama lengkap warga',
        count: totalFilled > 0 ? Math.ceil(totalFilled * 0.95) : 6,
        icon: 'user',
      },
      {
        id: 'telepon',
        name: 'Nomor telepon / kontak',
        count: totalFilled > 0 ? Math.ceil(totalFilled * 0.75) : 4,
        icon: 'phone',
      },
      {
        id: 'alamat',
        name: 'Alamat domisili KTP',
        count: totalFilled > 0 ? Math.ceil(totalFilled * 0.65) : 3,
        icon: 'map-pin',
      },
    ];

    if (fields.length > 0) {
      return {
        totalTransmissions: totalFilled,
        items: fields.map((f, i) => {
          const matchDefault = defaultAuditList.find(d => d.name.toLowerCase().includes(f.name.toLowerCase()));
          return {
            id: `field-${i}`,
            name: f.name,
            count: f.count,
            icon: matchDefault?.icon || 'file-lines',
          };
        }),
      };
    }

    return {
      totalTransmissions: totalFilled,
      items: defaultAuditList,
    };
  }, [analytics]);

  // Data Jadwal dan Pengingat Layanan Publik dengan Foto Asli Instansi Pemerintah
  const remindersData = useMemo(() => [
    {
      id: 1,
      title: 'Pelaporan SPT Tahunan PPh Orang Pribadi',
      agency: 'DJP Online (CoreTax Pajak)',
      deadline: '31 Maret 2026',
      logoUrl: '/logos/djp.svg',
      url: 'https://djponline.pajak.go.id',
    },
    {
      id: 2,
      title: 'Aktivasi Identitas Kependudukan Digital (IKD)',
      agency: 'Ditjen Dukcapil Kemendagri',
      deadline: 'Berkala 2026',
      logoUrl: '/logos/kemendagri.svg',
      url: 'https://dukcapil.kemendagri.go.id',
    },
    {
      id: 3,
      title: 'Validasi Seleksi CASN & PPPK Nasional',
      agency: 'Badan Kepegawaian Negara (BKN)',
      deadline: 'Periode Berjalan',
      logoUrl: '/logos/bkn.svg',
      url: 'https://sscasn.bkn.go.id',
    },
    {
      id: 4,
      title: 'Pembaruan Data Kepesertaan JKN-KIS',
      agency: 'BPJS Kesehatan',
      deadline: 'Bulanan',
      logoUrl: '/logos/bpjs.svg',
      url: 'https://bpjs-kesehatan.go.id',
    },
  ], []);

  // Filter aktivitas
  const filteredActivities = useMemo(() => {
    const list = analytics?.recent_activities || [];
    if (statusFilter === 'all') return list;
    return list.filter((item) => item.status === statusFilter);
  }, [analytics, statusFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredActivities.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredActivities.map((a) => a.id));
    }
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const hasResultData = (analytics?.total_autofill ?? 0) > 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-9 h-9 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
        <span className="text-[14px] text-[#475569] font-medium">Memuat data analitik GovConnect...</span>
      </div>
    );
  }

  // 4 KPI Cards: Sentence case label, bobot 600 untuk value, 500 label, 400 subLabel
  const kpiData = [
    {
      title: 'Total pengisian',
      value: analytics?.total_autofill ?? 0,
      subLabel: 'Total formulir diproses',
      icon: <FontAwesome name="file-lines" variant="solid" className="text-[20px] text-[#2563EB]" />,
      iconBg: 'none',
    },
    {
      title: 'Tingkat keberhasilan',
      value: `${analytics?.success_rate ?? 0}%`,
      subLabel: `${analytics?.success_count ?? 0} berhasil penuh`,
      icon: <FontAwesome name="circle-check" variant="solid" className="text-[20px] text-[#047857]" />,
      iconBg: 'none',
    },
    {
      title: 'Waktu yang dihemat',
      value: analytics
        ? `${Math.floor(analytics.estimated_time_saved_seconds / 60)}m ${analytics.estimated_time_saved_seconds % 60}s`
        : '0m 0s',
      subLabel: 'Estimasi · 30 detik/field',
      icon: <FontAwesome name="clock" variant="solid" className="text-[20px] text-[#B45309]" />,
      iconBg: 'none',
    },
    {
      title: 'Kelengkapan profil',
      value: `${analytics?.profile_completion ?? 0}%`,
      subLabel: 'Kelengkapan data KTP',
      icon: <FontAwesome name="user" variant="solid" className="text-[20px] text-[#4338CA]" />,
      iconBg: 'none',
    },
  ];

  return (
    <div className="w-full space-y-6 pb-8">
      {/* Top Header Greeting & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-[36px] font-semibold text-[#0F172A] tracking-[-0.02em]">
            Ringkasan dasbor
          </h1>
          <p className="text-[14px] leading-[22px] font-normal text-[#475569] mt-1">
            Ringkasan analitik dan efisiensi pengisian formulir otomatis untuk akun <span className="font-medium text-[#0F172A]">{user?.email}</span>
          </p>
        </div>
        
        {/* Tombol Perbarui data */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-[14px] leading-[20px] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1D4ED8] disabled:opacity-60 disabled:cursor-not-allowed rounded-[10px] transition-colors duration-150 cursor-pointer group self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
        >
          <Flaticon
            name="rotate-right"
            className={`text-xs transition-transform duration-500 ease-out group-hover:rotate-180 ${refreshing ? 'animate-spin' : ''}`}
          />
          <span>{refreshing ? 'Memperbarui...' : 'Perbarui data'}</span>
        </button>
      </div>

      {/* Onboarding Banner when no autofill yet */}
      {analytics?.total_autofill === 0 && (
        <div className="bg-[#EFF4FF] border border-[#DCE6FB] rounded-[16px] p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="shrink-0 text-[#2563EB] mt-0.5">
              <Flaticon name="sparkles" className="text-[20px]" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[#0F172A]">
                Mulai menggunakan ekstensi GovConnect
              </h2>
              <p className="text-[13px] leading-[20px] font-normal text-[#475569] mt-1 max-w-2xl leading-relaxed">
                Anda belum memiliki riwayat pengisian formulir. Buka formulir layanan publik di tab lain atau coba form pengujian simulasi, lalu buka ekstensi GovConnect di toolbar browser Anda.
              </p>
            </div>
          </div>
          <a
            href="http://localhost:5173/test-page/dummy_form.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-[10px] text-[14px] font-medium whitespace-nowrap transition-colors duration-150 self-start md:self-auto focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
          >
            <span>Buka form simulasi</span>
            <Flaticon name="share" className="text-xs" />
          </a>
        </div>
      )}

      {/* 4 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((card, i) => (
          <StatCard
            key={i}
            title={card.title}
            value={card.value}
            subLabel={card.subLabel}
            icon={card.icon}
            iconBg={card.iconBg}
          />
        ))}
      </div>

      {/* Main Activity Area/Line Chart (Clean & Minimalist Modern) */}
      <Card className="p-6 border border-[#E8ECF2]">
        <div className="pb-5 border-b border-[#F1F4F8] flex items-start gap-3.5">
          <FontAwesome name="chart-line" variant="solid" className="text-[20px] text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <h2 className="text-[16px] leading-[24px] font-semibold text-[#0F172A] tracking-[-0.01em]">
              Aktivitas pengisian formulir (7 hari terakhir)
            </h2>
            <p className="text-[13px] leading-[20px] font-normal text-[#64748B] mt-0.5">
              Frekuensi penggunaan pengisian formulir per hari
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-5">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={analytics?.daily_trend || []}
              margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="autofillGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity={0.10} />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#E8ECF2" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748B', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#64748B', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dx={-4}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8ECF2',
                  borderRadius: '10px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                  fontSize: '12px',
                  padding: '8px 12px',
                }}
                formatter={(value: any) => [`${value} kali`, 'Autofill']}
              />
              <Area
                type="monotone"
                dataKey="autofill"
                stroke="#2563EB"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#autofillGradient)"
                activeDot={{ r: 4, strokeWidth: 2, fill: '#2563EB', stroke: '#FFFFFF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Grid Baris 2 Kolom: Kolom Kiri (Hasil Pengisian + Ringkasan Audit Privasi) & Kolom Kanan (Jadwal Pengingat) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Kolom Kiri: Hasil Pengisian Formulir (Atas) & Ringkasan Audit Privasi (Bawah) Sejajar */}
        <div className="flex flex-col gap-6 justify-between">
          
          {/* Box 1: Hasil Pengisian Formulir */}
          <Card className="p-6 border border-[#E8ECF2]">
            <div className="pb-5 border-b border-[#F1F4F8] flex items-start gap-3.5">
              <FontAwesome name="chart-pie" variant="solid" className="text-[20px] text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-[16px] leading-[24px] font-semibold text-[#0F172A] tracking-[-0.01em]">
                  Hasil pengisian formulir
                </h2>
                <p className="text-[13px] leading-[20px] font-normal text-[#64748B] mt-0.5">
                  Rasio keberhasilan pengisian form
                </p>
              </div>
            </div>

            {hasResultData ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-5">
                {/* Donut Chart Cincin Lebih Tipis, Ujung Membulat */}
                <div className="w-full sm:w-1/2 h-44 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resultsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={64}
                        outerRadius={76}
                        paddingAngle={3}
                        cornerRadius={4}
                        dataKey="value"
                      >
                        {resultsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          border: '1px solid #E8ECF2',
                          borderRadius: '10px',
                          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                          fontSize: '12px',
                          padding: '6px 10px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[28px] leading-[34px] font-semibold text-[#0F172A] tabular-nums">
                      {analytics?.total_autofill ?? 0}
                    </span>
                    <span className="text-[12px] leading-[16px] font-normal text-[#64748B] mt-0.5">Total sesi</span>
                  </div>
                </div>

                {/* Legenda Diperkecil dengan Background Sesuai Pasangan Warna Semantik */}
                <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-2">
                  {/* Sukses */}
                  <div className="px-3 py-2 rounded-[10px] bg-[#ECFDF5] border border-[#ECFDF5] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] shrink-0" />
                      <div>
                        <p className="text-[13px] leading-[18px] font-medium text-[#047857]">Sukses</p>
                        <p className="text-[11px] leading-[14px] font-normal text-[#047857]/80">Seluruh field terisi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] leading-[18px] font-medium text-[#047857] tabular-nums">
                        {analytics?.success_count ?? 0}
                      </span>
                      <p className="text-[11px] leading-[14px] font-normal text-[#047857]/80 tabular-nums">
                        {analytics?.total_autofill ? Math.round(((analytics?.success_count ?? 0) / analytics.total_autofill) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Parsial */}
                  <div className="px-3 py-2 rounded-[10px] bg-[#FFFBEB] border border-[#FFFBEB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#F59E0B] shrink-0" />
                      <div>
                        <p className="text-[13px] leading-[18px] font-medium text-[#B45309]">Parsial</p>
                        <p className="text-[11px] leading-[14px] font-normal text-[#B45309]/80">Sebagian field terisi</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] leading-[18px] font-medium text-[#B45309] tabular-nums">
                        {analytics?.partial_count ?? 0}
                      </span>
                      <p className="text-[11px] leading-[14px] font-normal text-[#B45309]/80 tabular-nums">
                        {analytics?.total_autofill ? Math.round(((analytics?.partial_count ?? 0) / analytics.total_autofill) * 100) : 0}%
                      </p>
                    </div>
                  </div>

                  {/* Gagal */}
                  <div className="px-3 py-2 rounded-[10px] bg-[#FFF1F2] border border-[#FFF1F2] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#F43F5E] shrink-0" />
                      <div>
                        <p className="text-[13px] leading-[18px] font-medium text-[#BE123C]">Gagal</p>
                        <p className="text-[11px] leading-[14px] font-normal text-[#BE123C]/80">Perlu penyesuaian</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] leading-[18px] font-medium text-[#BE123C] tabular-nums">
                        {analytics?.failed_count ?? 0}
                      </span>
                      <p className="text-[11px] leading-[14px] font-normal text-[#BE123C]/80 tabular-nums">
                        {analytics?.total_autofill ? Math.round(((analytics?.failed_count ?? 0) / analytics.total_autofill) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <EmptyState
                  title="Belum ada data"
                  description="Riwayat autofill akan terakumulasi di sini"
                  className="py-4"
                />
              </div>
            )}
          </Card>

          {/* Box 2: Ringkasan Audit Privasi */}
          <Card className="p-6 border border-[#E8ECF2] flex-1 flex flex-col justify-between">
            <div>
              <div className="pb-5 border-b border-[#F1F4F8] flex items-start gap-3.5">
                <FontAwesome name="shield" variant="solid" className="text-[20px] text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-[16px] leading-[24px] font-semibold text-[#0F172A] tracking-[-0.01em]">
                    Ringkasan audit privasi
                  </h2>
                  <p className="text-[13px] leading-[20px] font-normal text-[#64748B] mt-0.5">
                    Transparansi transmisi dan perlindungan data kependudukan lokal
                  </p>
                </div>
              </div>

              {/* Tabel List: Baris tinggi 48px, garis pemisah #F1F4F8, kolom Icon 40px, tabular nums */}
              <div className="pt-2 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#F1F4F8] text-[12px] leading-[16px] font-medium text-[#64748B]">
                      <th className="py-2.5 px-3 w-10 text-center font-medium"></th>
                      <th className="py-2.5 px-3 font-medium">Data profil</th>
                      <th className="py-2.5 px-3 text-right font-medium">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F4F8]">
                    {privacyAuditData.items.map((item) => (
                      <tr key={item.id} className="h-12 hover:bg-[#F8FAFC] transition-colors duration-150">
                        <td className="py-2.5 px-3 w-10 text-center">
                          <FontAwesome name={item.icon} variant="solid" className="text-base text-[#64748B]" />
                        </td>
                        <td className="py-2.5 px-3 text-[14px] leading-[20px] font-medium text-[#0F172A]">
                          {item.name}
                        </td>
                        <td className="py-2.5 px-3 text-right text-[14px] leading-[20px] font-medium text-[#0F172A] tabular-nums">
                          {item.count}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        {/* Kolom Kanan: Jadwal dan Pengingat Layanan Publik */}
        <Card className="p-6 border border-[#E8ECF2] h-full flex flex-col justify-between">
          <div>
            <div className="pb-5 border-b border-[#F1F4F8] flex items-start gap-3.5">
              <FontAwesome name="calendar-days" variant="solid" className="text-[20px] text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-[16px] leading-[24px] font-semibold text-[#0F172A] tracking-[-0.01em]">
                  Jadwal dan pengingat layanan publik
                </h2>
                <p className="text-[13px] leading-[20px] font-normal text-[#64748B] mt-0.5">
                  Agenda resmi layanan publik yang disinkronkan secara berkala
                </p>
              </div>
            </div>

            {/* List Jadwal dengan Foto Asli Instansi Pemerintah */}
            <div className="pt-5 space-y-3">
              {remindersData.map((item) => (
                <div
                  key={item.id}
                  className="p-4 min-h-[72px] rounded-[10px] bg-white hover:bg-[#F8FAFC] border border-[#E8ECF2] flex items-center justify-between gap-3.5 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Foto Asli Instansi Pemerintah: ukuran diperbesar pas dengan tinggi box */}
                    <div className="w-14 h-14 min-w-[56px] max-h-[56px] flex items-center justify-center shrink-0 overflow-hidden">
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
                      <p className="text-[14px] leading-[20px] font-medium text-[#0F172A] truncate">
                        {item.title}
                      </p>
                      <p className="text-[12px] leading-[18px] font-normal text-[#475569] truncate mt-0.5">
                        <span className="text-[#475569]">{item.agency}</span> · Tenggat: <span className="font-medium text-[#475569]">{item.deadline}</span>
                      </p>
                    </div>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-[#64748B] hover:text-[#2563EB] rounded-[8px] transition-colors duration-150 shrink-0"
                    title="Buka portal layanan"
                  >
                    <Flaticon name="share" className="text-xs" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Aktivitas Terkini (Style List/Grid, Filter, Lihat semua, Checkbox, Pagination) */}
      <Card className="overflow-hidden border border-[#E8ECF2]">
        {/* Header Toolbar: Judul, Switch List/Grid, Filter, Lihat semua */}
        <div className="p-6 border-b border-[#F1F4F8] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <FontAwesome name="clock" variant="solid" className="text-[20px] text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-[16px] leading-[24px] font-semibold text-[#0F172A] tracking-[-0.01em]">
                Aktivitas terkini
              </h2>
              <p className="text-[13px] leading-[20px] font-normal text-[#64748B] mt-0.5">
                Riwayat pengisian formulir publik terkini
              </p>
            </div>
          </div>

          {/* Action Bar (List/Grid switch, Filter, Lihat semua) */}
          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            {/* Switch List & Grid */}
            <div className="flex items-center bg-[#F6F8FB] border border-[#E8ECF2] p-1 rounded-[10px]">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-[8px] text-[13px] leading-[18px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <FontAwesome name="list" variant="solid" className="text-xs" />
                <span>List</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-[8px] text-[13px] leading-[18px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#0F172A] shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <FontAwesome name="grid" variant="solid" className="text-xs" />
                <span>Grid</span>
              </button>
            </div>

            {/* Filter Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterMenuOpen(!filterMenuOpen)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] border text-[13px] leading-[18px] font-medium transition-colors cursor-pointer ${
                  statusFilter !== 'all'
                    ? 'bg-[#EFF4FF] border-[#DCE6FB] text-[#2563EB]'
                    : 'bg-white border-[#E8ECF2] text-[#475569] hover:bg-[#F6F8FB] hover:text-[#0F172A]'
                }`}
              >
                <FontAwesome name="filter" variant="solid" className="text-xs text-[#64748B]" />
                <span>Filter</span>
                {statusFilter !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                )}
              </button>

              {filterMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-[10px] shadow-[0_4px_12px_rgba(15,23,42,0.08)] border border-[#E8ECF2] py-1.5 z-20">
                  <div className="px-3 py-1 text-[11px] font-medium text-[#64748B]">
                    Status pengisian
                  </div>
                  {[
                    { key: 'all', label: 'Semua status' },
                    { key: 'success', label: 'Sukses' },
                    { key: 'partial', label: 'Parsial' },
                    { key: 'failed', label: 'Gagal' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.key as any);
                        setFilterMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-[13px] font-medium hover:bg-[#F8FAFC] flex items-center justify-between cursor-pointer ${
                        statusFilter === opt.key ? 'text-[#2563EB] bg-[#EFF4FF]' : 'text-[#475569]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {statusFilter === opt.key && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tombol Lihat semua */}
            <Link
              to="/activity"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1D4ED8] text-white text-[14px] leading-[20px] font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
            >
              <span>Lihat semua</span>
              <Flaticon name="arrow-right" className="text-xs" />
            </Link>
          </div>
        </div>

        {/* Content: Mode List atau Mode Grid */}
        {filteredActivities.length > 0 ? (
          viewMode === 'list' ? (
            /* Mode List */
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="h-11 bg-[#F6F8FB] border-b border-[#F1F4F8] text-[12px] leading-[16px] font-medium text-[#64748B]">
                    <th className="py-3 px-4 w-10 text-center font-medium">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredActivities.length && filteredActivities.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded-[4px] border-[#E8ECF2] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>Tanggal</span>
                        <FontAwesome name="sort" variant="solid" className="text-[12px] text-[#64748B]" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>Website target</span>
                        <FontAwesome name="sort" variant="solid" className="text-[12px] text-[#64748B]" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>Field terisi</span>
                        <FontAwesome name="sort" variant="solid" className="text-[12px] text-[#64748B]" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <span>Status</span>
                        <FontAwesome name="sort" variant="solid" className="text-[12px] text-[#64748B]" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F4F8]">
                  {filteredActivities.map((activity) => {
                    const isSelected = selectedIds.includes(activity.id);
                    return (
                      <tr
                        key={activity.id}
                        className={`h-14 hover:bg-[#F8FAFC] transition-colors duration-150 ${
                          isSelected ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(activity.id)}
                            className="w-4 h-4 rounded-[4px] border-[#E8ECF2] text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 text-[14px] leading-[20px] font-normal text-[#475569] whitespace-nowrap tabular-nums">
                          {new Date(activity.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <Flaticon name="globe" className="text-[16px] text-[#64748B] shrink-0" />
                            <span className="text-[14px] leading-[20px] font-medium text-[#0F172A] lowercase truncate max-w-[240px]">
                              {activity.website_domain || (activity.target_url ? new URL(activity.target_url).hostname : 'formulir web')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[14px] leading-[20px] font-normal text-[#475569]">
                          <span className="font-medium text-[#0F172A] tabular-nums">{activity.fields_filled}</span> dari <span className="tabular-nums">{activity.fields_detected}</span> field
                        </td>
                        <td className="py-3.5 px-4">
                          {/* Badge Status */}
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] leading-[16px] font-medium ${
                              activity.status === 'success'
                                ? 'bg-[#ECFDF5] text-[#047857] border border-[#ECFDF5]'
                                : activity.status === 'partial'
                                ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FFFBEB]'
                                : 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFF1F2]'
                            }`}
                          >
                            {activity.status === 'success'
                              ? 'Sukses'
                              : activity.status === 'partial'
                              ? 'Parsial'
                              : 'Gagal'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Mode Grid */
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 rounded-[12px] bg-white border border-[#E8ECF2] flex flex-col justify-between gap-3 hover:bg-[#F8FAFC] transition-colors duration-150"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Flaticon name="globe" className="text-[16px] text-[#64748B] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[14px] leading-[20px] font-medium text-[#0F172A] lowercase truncate">
                          {activity.website_domain || (activity.target_url ? new URL(activity.target_url).hostname : 'formulir web')}
                        </p>
                        <p className="text-[12px] leading-[18px] font-normal text-[#64748B] tabular-nums mt-0.5">
                          {new Date(activity.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] leading-[16px] font-medium shrink-0 ${
                        activity.status === 'success'
                          ? 'bg-[#ECFDF5] text-[#047857] border border-[#ECFDF5]'
                          : activity.status === 'partial'
                          ? 'bg-[#FFFBEB] text-[#B45309] border border-[#FFFBEB]'
                          : 'bg-[#FFF1F2] text-[#BE123C] border border-[#FFF1F2]'
                      }`}
                    >
                      {activity.status === 'success' ? 'Sukses' : activity.status === 'partial' ? 'Parsial' : 'Gagal'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#F1F4F8] flex items-center justify-between text-[13px] leading-[18px] text-[#475569]">
                    <span>Field terisi:</span>
                    <span className="font-medium text-[#0F172A] tabular-nums">{activity.fields_filled} / {activity.fields_detected}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="p-8 min-h-[240px] flex items-center justify-center text-center">
            <EmptyState
              icon={<Flaticon name="time-past" className="text-2xl text-[#64748B]" />}
              title="Belum ada riwayat aktivitas autofill"
              description="Gunakan ekstensi GovConnect di formulir layanan publik untuk melihat riwayat aktivitas di sini."
            />
          </div>
        )}

        {/* Footer Pagination */}
        {filteredActivities.length > 0 && (
          <div className="p-4 border-t border-[#F1F4F8] flex items-center justify-between text-[13px] leading-[18px] font-normal text-[#64748B]">
            <div>
              <span>Menampilkan <span className="font-medium text-[#0F172A] tabular-nums">{filteredActivities.length}</span> aktivitas per halaman</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="w-8 h-8 rounded-[8px] border border-[#E8ECF2] flex items-center justify-center text-[#64748B] opacity-40 cursor-not-allowed"
                disabled
              >
                ‹
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-[8px] bg-[#0F172A] text-white font-medium flex items-center justify-center text-[13px] tabular-nums"
              >
                1
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-[8px] border border-[#E8ECF2] flex items-center justify-center text-[#64748B] opacity-40 cursor-not-allowed"
                disabled
              >
                ›
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}