import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import {
  adminApi, type AdminStats, type Complaint,
  type AdminUserItem,
} from '../../services/api';
import { Button, FontAwesome } from '../../components/ui';
import { usePolling } from '../../hooks/usePolling';
import {
  AdminCard, SectionTitle, KpiCard, StatusBadge, PriorityBadge,
  CATEGORY_LABEL, EmptyState, LoadingBlock, relativeTime, LiveSyncBar,
} from '../../components/admin/adminUi';

const CATEGORY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];
const PRIORITY_COLORS: Record<string, string> = {
  tinggi: '#F43F5E', sedang: '#F59E0B', rendah: '#94A3B8',
};

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recent, setRecent] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, c, u] = await Promise.all([
        adminApi.getStats(),
        adminApi.getComplaints({ page: 1, page_size: 5 }),
        adminApi.getUsers(),
      ]);
      setStats(s.data);
      setRecent(c.data.items);
      setUsers(u.data);
      setError(null);
    } catch {
      setError('Gagal memuat data admin. Pastikan Anda memiliki akses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Live sync every 15s so new warga complaints appear automatically.
  const { refresh, lastUpdated } = usePolling(load, { interval: 15000 });

  useEffect(() => { load(); }, [load]);

  if (isLoading) return <LoadingBlock label="Memuat dashboard admin..." />;
  if (error || !stats) return <EmptyState icon="alert-circle" title="Tidak dapat memuat data" desc={error || undefined} />;

  const trendData = stats.complaints_trend.map(t => ({
    name: new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
    count: t.count,
  }));

  const categoryData = Object.entries(stats.complaints_by_category).map(([k, v], i) => ({
    name: CATEGORY_LABEL[k] || k, value: v, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const priorityData = ['tinggi', 'sedang', 'rendah'].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    value: stats.complaints_by_priority[p] || 0,
    color: PRIORITY_COLORS[p],
  }));

  const statusData = [
    { name: 'Diterima', value: stats.complaints_by_status['diterima'] || 0, color: '#3B82F6' },
    { name: 'Diproses', value: stats.complaints_by_status['diproses'] || 0, color: '#F59E0B' },
    { name: 'Selesai', value: stats.complaints_by_status['selesai'] || 0, color: '#10B981' },
    { name: 'Ditolak', value: stats.complaints_by_status['ditolak'] || 0, color: '#F43F5E' },
  ];

  return (
    <div className="w-full space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1121] tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">
            Ringkasan operasional, tren pengaduan & kepatuhan privasi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LiveSyncBar lastUpdated={lastUpdated} onRefresh={refresh} />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Pengguna" value={stats.total_users} icon="users" tone="blue" hint={`${stats.active_users} aktif`} />
        <KpiCard label="Pengaduan Baru (7h)" value={stats.new_users_7d} icon="user" tone="indigo" hint="Pengguna terdaftar" />
        <KpiCard label="Total Pengaduan" value={stats.total_complaints} icon="inbox" tone="blue" />
        <KpiCard label="Belum Selesai" value={stats.open_complaints} icon="clock" tone="amber" hint={`${stats.in_progress_complaints} sedang diproses`} />
      </div>

      {/* Security report KPI (surfaced prominently) */}
      <AdminCard className={stats.security_reports_open_high > 0 ? 'border-violet-300 ring-1 ring-violet-100' : ''}>
        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <FontAwesome name="shield-exclamation" className="text-[18px]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-violet-700 uppercase tracking-wide">Laporan Keamanan & Bug</p>
              <p className="text-[12px] text-slate-500">Dugaan kebocoran data, privasi & bug dari ekstensi/web</p>
            </div>
          </div>
          <div className="flex items-center gap-6 sm:ml-auto">
            <div>
              <p className="text-2xl font-black text-[#0B1121]">{stats.security_reports_total}</p>
              <p className="text-[11px] text-slate-500 font-medium">Total</p>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600">{stats.security_reports_open}</p>
              <p className="text-[11px] text-slate-500 font-medium">Belum Selesai</p>
            </div>
            <div>
              <p className={`text-2xl font-black ${stats.security_reports_open_high > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                {stats.security_reports_open_high}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Prioritas Tinggi</p>
            </div>
            <Link
              to="/admin/complaints"
              className="hidden sm:inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
            >
              <FontAwesome name="shield-check" className="text-[12px]" />
              Tinjau Laporan
            </Link>
          </div>
        </div>
      </AdminCard>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Selesai" value={stats.resolved_complaints} icon="check-circle" tone="emerald" />
        <KpiCard label="Ditolak" value={stats.rejected_complaints} icon="cross" tone="rose" />
        <KpiCard label="Rata-rata Respon" value={`${stats.avg_response_hours}j`} icon="chart-line" tone="indigo" hint="Jam per pengaduan" />
        <KpiCard label="Lewat SLA (>3h)" value={stats.sla_breached} icon="alert-circle" tone={stats.sla_breached > 0 ? 'rose' : 'slate'} />
      </div>

      {/* Trend + Privacy */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
        <AdminCard>
          <SectionTitle icon="chart-area" title="Tren Pengaduan (14 Hari)" subtitle="Jumlah pengaduan masuk per hari" />
          <div className="p-5 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="admTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }}
                  cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="count" name="Pengaduan" stroke="#0A4174" strokeWidth={2.5} fill="url(#admTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        {/* Privacy panel */}
        <AdminCard className="bg-gradient-to-br from-[#001D39] via-[#0A4174] to-[#001D39] border border-[#BDD8E9]/20">
          <div className="p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <span className="inline-flex"><span className="text-sm">🛡️</span></span>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Ringkasan Audit Privasi</h2>
                <p className="text-[11px] text-slate-400">Transparansi & proteksi data</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-300">Akses PII hari ini</span>
                <span className={`text-sm font-black ${stats.pii_views_today > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {stats.pii_views_today}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-xs text-slate-300">Aktivitas admin hari ini</span>
                <span className="text-sm font-black text-white">{stats.audit_logs_today}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-300">Cakupan enkripsi PII</span>
                  <span className="text-sm font-black text-emerald-400">{stats.encryption_coverage}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${Math.min(stats.encryption_coverage, 100)}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Field PII terenkripsi AES-256 di database</p>
              </div>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AdminCard>
          <SectionTitle icon="chart-pie" title="Per Kategori" />
          <div className="p-5 h-60">
            {categoryData.length === 0 ? (
              <EmptyState icon="chart-pie" title="Belum ada data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="px-5 pb-5 flex flex-wrap gap-3">
            {categoryData.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c.color }} />
                {c.name} ({c.value})
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <SectionTitle icon="chart-bar" title="Per Status" />
          <div className="p-5 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                <Bar dataKey="value" name="Jumlah" radius={[6, 6, 0, 0]}>
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard>
          <SectionTitle icon="bolt" title="Per Prioritas" />
          <div className="p-5 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.15)" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} width={60} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 12 }} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
                <Bar dataKey="value" name="Jumlah" radius={[0, 6, 6, 0]}>
                  {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </div>

      {/* Recent complaints + workload */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-5">
        <AdminCard>
          <SectionTitle
            icon="inbox"
            title="Pengaduan Terbaru"
            subtitle="Hanya email pengirim — tanpa data pribadi"
            action={<Button size="sm" variant="outline" onClick={() => window.location.assign('/admin/complaints')}>Lihat semua</Button>}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                  <th className="px-5 py-3 font-bold">Referensi</th>
                  <th className="px-5 py-3 font-bold">Pengirim</th>
                  <th className="px-5 py-3 font-bold">Kategori</th>
                  <th className="px-5 py-3 font-bold">Prioritas</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr><td colSpan={5}><EmptyState icon="inbox" title="Belum ada pengaduan" /></td></tr>
                ) : recent.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-mono text-[11px] text-blue-600 font-semibold">{c.reference_number}</td>
                    <td className="px-5 py-3 text-slate-600">{c.user_email}</td>
                    <td className="px-5 py-3 text-slate-600">{CATEGORY_LABEL[c.category] || c.category}</td>
                    <td className="px-5 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>

        <AdminCard>
          <SectionTitle icon="briefcase" title="Beban Kerja Admin" subtitle="Kasus yang ditangani per admin" />
          <div className="p-5 space-y-3">
            {stats.admin_workload.length === 0 ? (
              <EmptyState icon="briefcase" title="Belum ada penanganan" />
            ) : stats.admin_workload.map((w, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {w.admin_email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 truncate">{w.admin_email}</span>
                </div>
                <span className="text-sm font-black text-[#0B1121]">{w.handled_count}</span>
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* Latest users */}
      <AdminCard>
        <SectionTitle
          icon="users"
          title="Pengguna Terbaru"
          subtitle="Email & kelengkapan profil saja — tanpa PII"
          action={<Button size="sm" variant="outline" onClick={() => window.location.assign('/admin/users')}>Kelola pengguna</Button>}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-bold">Email</th>
                <th className="px-5 py-3 font-bold">Status</th>
                <th className="px-5 py-3 font-bold">Pengaduan</th>
                <th className="px-5 py-3 font-bold">Kelengkapan</th>
                <th className="px-5 py-3 font-bold">Terdaftar</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3 text-slate-700 font-medium">{u.email}</td>
                  <td className="px-5 py-3">
                    {u.is_active
                      ? <span className="text-emerald-600 text-xs font-semibold">Aktif</span>
                      : <span className="text-rose-600 text-xs font-semibold">Nonaktif</span>}
                    {u.is_admin && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-bold">ADMIN</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{u.complaint_count}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(u.profile_completion, 100)}%` }} />
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium">{u.profile_completion}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{relativeTime(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  );
}
