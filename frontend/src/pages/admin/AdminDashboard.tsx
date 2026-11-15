import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import {
  adminApi, type AdminStats, type Complaint,
  type AdminUserItem,
} from '../../services/api';
import {
  Button, FontAwesome, Badge, Card, CardHeader, CardTitle, CardDescription,
  CardContent, EmptyState, StatCard,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui';
import type { BadgeVariant } from '../../components/ui';
import { usePolling } from '../../hooks/usePolling';
import { CATEGORY_LABEL, relativeTime, LiveStamp } from '../../components/admin/adminUi';

const CATEGORY_COLORS = ['var(--accent)', 'var(--ok)', 'var(--warn)', 'var(--danger)', 'var(--ink-3)'];
const PRIORITY_COLORS: Record<string, string> = {
  tinggi: 'var(--danger)', sedang: 'var(--warn)', rendah: 'var(--ink-3)',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface)',
  border: '1px solid var(--line)',
  color: 'var(--ink)',
  borderRadius: 8,
  fontSize: 12,
  boxShadow: 'var(--shadow-sm)',
};
const GRID_STROKE = 'var(--line)';
const AXIS_TICK = 'var(--ink-3)';

const STATUS_LABEL: Record<string, string> = {
  diterima: 'Diterima', diproses: 'Diproses', proses: 'Diproses', selesai: 'Selesai', ditolak: 'Ditolak',
};
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  diterima: 'info', diproses: 'warn', proses: 'warn', selesai: 'ok', ditolak: 'danger',
};
const PRIORITY_LABEL: Record<string, string> = { tinggi: 'Tinggi', sedang: 'Sedang', rendah: 'Rendah' };
const PRIORITY_VARIANT: Record<string, BadgeVariant> = { tinggi: 'danger', sedang: 'warn', rendah: 'neutral' };

export function AdminDashboard() {
  const navigate = useNavigate();

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

  // Live sync every 15s so new pengguna complaints appear automatically.
  const { refresh, lastUpdated } = usePolling(load, { interval: 8000 });

  useEffect(() => { load(); }, [load]);

  if (isLoading) return (
    <div className="page">
      <div className="empty">
        <FontAwesome name="spinner" spin className="text-[15px] text-ink-3 mb-3" />
        <p className="text-[12.5px] text-ink-3">Memuat dashboard admin...</p>
      </div>
    </div>
  );

  if (error || !stats) return (
    <div className="page">
      <EmptyState
        icon={<FontAwesome name="triangle-exclamation" />}
        title="Tidak dapat memuat data"
        description={error || undefined}
      />
    </div>
  );

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
    { name: 'Diterima', value: stats.complaints_by_status['diterima'] || 0, color: 'var(--accent)' },
    { name: 'Diproses', value: stats.complaints_by_status['diproses'] || 0, color: 'var(--warn)' },
    { name: 'Selesai', value: stats.complaints_by_status['selesai'] || 0, color: 'var(--ok)' },
    { name: 'Ditolak', value: stats.complaints_by_status['ditolak'] || 0, color: 'var(--danger)' },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-head">
        <div>
          <p className="eyebrow">Ringkasan</p>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-sub">
            Ringkasan operasional, tren pengaduan &amp; kepatuhan privasi
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11.5px] text-ink-3">
          <span className="dot text-ok" />
          <LiveStamp at={lastUpdated} />
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
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pengguna"
          value={stats.total_users}
          subLabel={`${stats.active_users} aktif`}
          icon={<FontAwesome name="users" className="text-[12px]" />}
        />
        <StatCard
          title="Pengguna Baru (7h)"
          value={stats.new_users_7d}
          subLabel="Pengguna terdaftar"
          icon={<FontAwesome name="user-plus" className="text-[12px]" />}
        />
        <StatCard
          title="Total Pengaduan"
          value={stats.total_complaints}
          icon={<FontAwesome name="inbox" className="text-[12px]" />}
        />
        <StatCard
          title="Belum Selesai"
          value={stats.open_complaints}
          subLabel={`${stats.in_progress_complaints} sedang diproses`}
          icon={<FontAwesome name="clock" className="text-[12px]" />}
          iconBg="bg-warn-soft text-warn"
        />
      </div>

      {/* Security report KPI banner */}
      <Card>
        <div className="card-body flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md border border-line bg-surface-2 text-ink-2 flex items-center justify-center shrink-0">
              <FontAwesome name="shield-halved" className="text-[14px]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[13px] font-semibold text-ink">Laporan Keamanan &amp; Bug</p>
              </div>
              <p className="text-[12px] text-ink-3 mt-0.5">
                Dugaan kebocoran data, privasi &amp; bug dari ekstensi/web
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 sm:ml-auto">
            <div>
              <p className="text-[20px] font-bold tracking-[-0.02em] text-ink tabular-nums">{stats.security_reports_total}</p>
              <p className="text-[11.5px] text-ink-3">Total</p>
            </div>
            <div>
              <p className="text-[20px] font-bold tracking-[-0.02em] text-warn tabular-nums">{stats.security_reports_open}</p>
              <p className="text-[11.5px] text-ink-3">Belum Selesai</p>
            </div>
            <div>
              <p className={`text-[20px] font-bold tracking-[-0.02em] tabular-nums ${stats.security_reports_open_high > 0 ? 'text-danger' : 'text-ink-3'}`}>
                {stats.security_reports_open_high}
              </p>
              <p className="text-[11.5px] text-ink-3">Prioritas Tinggi</p>
            </div>
            <Link
              to="/admin/complaints"
              className="btn btn-secondary btn-sm hidden sm:inline-flex"
            >
              <FontAwesome name="shield-halved" className="text-[11px]" />
              <span>Tinjau Laporan</span>
            </Link>
          </div>
        </div>
      </Card>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Selesai"
          value={stats.resolved_complaints}
          icon={<FontAwesome name="circle-check" className="text-[12px]" />}
          iconBg="bg-ok-soft text-ok"
        />
        <StatCard
          title="Ditolak"
          value={stats.rejected_complaints}
          icon={<FontAwesome name="circle-xmark" className="text-[12px]" />}
          iconBg="bg-danger-soft text-danger"
        />
        <StatCard
          title="Rata-rata Respon"
          value={`${stats.avg_response_hours}j`}
          subLabel="Jam per pengaduan"
          icon={<FontAwesome name="chart-line" className="text-[12px]" />}
        />
        <StatCard
          title="Lewat SLA (>3h)"
          value={stats.sla_breached}
          icon={<FontAwesome name="triangle-exclamation" className="text-[12px]" />}
          iconBg={stats.sla_breached > 0 ? 'bg-danger-soft text-danger' : 'bg-surface-3 text-ink-2'}
        />
      </div>

      {/* Trend + Privacy */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-5">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Tren Pengaduan (14 Hari)</CardTitle>
              <CardDescription>Jumlah pengaduan masuk per hari</CardDescription>
            </div>
          </CardHeader>
          <div className="p-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: AXIS_TICK, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: AXIS_TICK, fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  cursor={{ stroke: 'var(--line-2)', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Pengaduan"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="var(--accent-soft)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Privacy panel */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Ringkasan Audit Privasi</CardTitle>
              <CardDescription>Transparansi &amp; proteksi data pengguna</CardDescription>
            </div>
            <FontAwesome name="shield-halved" className="text-[13px] text-ink-3" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3 py-2.5">
              <span className="text-[12.5px] text-ink-2">Akses PII hari ini</span>
              <span className={`text-[13px] font-semibold tabular-nums ${stats.pii_views_today > 0 ? 'text-warn' : 'text-ok'}`}>
                {stats.pii_views_today}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-3 py-2.5">
              <span className="text-[12.5px] text-ink-2">Aktivitas admin hari ini</span>
              <span className="text-[13px] font-semibold text-ink tabular-nums">{stats.audit_logs_today}</span>
            </div>
            <div className="rounded-md border border-line bg-surface-2 px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-ink-2">Cakupan enkripsi PII</span>
                <span className="text-[13px] font-semibold text-ok tabular-nums">{stats.encryption_coverage}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-ok transition-[width] duration-200"
                  style={{ width: `${Math.min(stats.encryption_coverage, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-ink-3 mt-2">Field PII terenkripsi AES-256 di database</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Per Kategori</CardTitle>
          </CardHeader>
          <div className="p-4 h-60">
            {categoryData.length === 0 ? (
              <EmptyState icon={<FontAwesome name="chart-pie" />} title="Belum ada data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="px-4 pb-4 flex flex-wrap gap-x-4 gap-y-2">
            {categoryData.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11.5px] text-ink-2">
                <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: c.color }} />
                <span>{c.name} ({c.value})</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per Status</CardTitle>
          </CardHeader>
          <div className="p-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: AXIS_TICK, fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: AXIS_TICK, fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--surface-3)' }} />
                <Bar dataKey="value" name="Jumlah" radius={[4, 4, 0, 0]}>
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Per Prioritas</CardTitle>
          </CardHeader>
          <div className="p-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID_STROKE} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: AXIS_TICK, fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: AXIS_TICK, fontSize: 11 }} width={60} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--surface-3)' }} />
                <Bar dataKey="value" name="Jumlah" radius={[0, 4, 4, 0]}>
                  {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent complaints + workload */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-5">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Pengaduan Terbaru</CardTitle>
              <CardDescription>Hanya email pengirim — tanpa data pribadi</CardDescription>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/admin/complaints')}>
              Lihat semua
            </Button>
          </CardHeader>

          {recent.length === 0 ? (
            <EmptyState icon={<FontAwesome name="inbox" />} title="Belum ada pengaduan" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referensi</TableHead>
                  <TableHead>Pengirim</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Prioritas</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="cell-mono text-accent-text font-semibold">{c.reference_number}</TableCell>
                    <TableCell className="cell-strong">{c.user_email}</TableCell>
                    <TableCell>{CATEGORY_LABEL[c.category] || c.category}</TableCell>
                    <TableCell>
                      <Badge variant={PRIORITY_VARIANT[c.priority] || 'neutral'}>
                        {PRIORITY_LABEL[c.priority] || c.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[c.status] || 'neutral'} dot>
                        {STATUS_LABEL[c.status] || c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Beban Kerja Admin</CardTitle>
              <CardDescription>Kasus yang ditangani per admin</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {stats.admin_workload.length === 0 ? (
              <EmptyState icon={<FontAwesome name="briefcase" />} title="Belum ada penanganan" />
            ) : stats.admin_workload.map((w, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-full border border-line bg-surface text-ink-2 text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {w.admin_email.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-[12.5px] font-medium text-ink-2 truncate">{w.admin_email}</span>
                </div>
                <span className="text-[13px] font-semibold text-ink tabular-nums shrink-0">{w.handled_count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Latest users */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Pengguna Terbaru</CardTitle>
            <CardDescription>Email &amp; kelengkapan profil saja — tanpa PII</CardDescription>
          </div>
          <Button size="sm" variant="secondary" onClick={() => navigate('/admin/users')}>
            Kelola pengguna
          </Button>
        </CardHeader>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pengaduan</TableHead>
              <TableHead>Kelengkapan</TableHead>
              <TableHead>Terdaftar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.slice(0, 5).map(u => (
              <TableRow key={u.id}>
                <TableCell className="cell-strong">{u.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.is_active ? 'ok' : 'danger'} dot>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                    {u.is_admin && <Badge variant="info">ADMIN</Badge>}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">{u.complaint_count}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-accent transition-[width] duration-200"
                        style={{ width: `${Math.min(u.profile_completion, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11.5px] text-ink-3 tabular-nums">{u.profile_completion}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-[12px] text-ink-3 whitespace-nowrap">{relativeTime(u.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
