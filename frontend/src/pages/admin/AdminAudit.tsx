import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { adminApi, type AuditLog } from '../../services/api';
import {
  Button, FontAwesome, Badge, Card, CardHeader, CardTitle, CardDescription,
  EmptyState, StatCard, Tabs,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '../../components/ui';
import type { BadgeVariant } from '../../components/ui';
import { usePolling } from '../../hooks/usePolling';
import { formatDateTime } from '../../components/admin/adminUi';

const ACTION_LABEL: Record<string, { label: string; variant: BadgeVariant }> = {
  view_dashboard: { label: 'Lihat Dashboard', variant: 'neutral' },
  view_complaint_detail: { label: 'Lihat Detail Pengaduan', variant: 'warn' },
  update_complaint_status: { label: 'Ubah Status Pengaduan', variant: 'info' },
  toggle_user_active: { label: 'Ubah Status Akun', variant: 'info' },
  view_audit_logs: { label: 'Lihat Audit Log', variant: 'neutral' },
  broadcast_announcement: { label: 'Kirim Pengumuman', variant: 'ok' },
  export_complaints: { label: 'Export Data', variant: 'danger' },
  view_user_profile: { label: 'Lihat Profil Warga', variant: 'warn' },
};

export function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pii'>('all');
  const [limit] = useState(50);
  const firstLoad = useRef(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await adminApi.getAuditLogs({ limit });
      setLogs(res.data);
    } catch {
      // Diamkan: polling berikutnya akan mencoba lagi.
    } finally {
      if (!silent) setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(firstLoad.current ? false : true); firstLoad.current = false; }, [load]);

  // Live sync every 30s
  const { refresh, lastUpdated } = usePolling(() => load(true), { interval: 30000 });

  const filtered = useMemo(() => {
    if (filter === 'pii') return logs.filter(l => l.was_pii_exposed);
    return logs;
  }, [logs, filter]);

  const piiCount = useMemo(() => logs.filter(l => l.was_pii_exposed).length, [logs]);

  const exportCsv = () => {
    if (!logs.length) return;
    const headers = ['ID', 'Waktu', 'Admin ID', 'Admin Email', 'Aksi', 'Resource Type', 'Resource ID', 'Akses PII', 'IP Address', 'Detail'];
    const rows = logs.map(l => [
      l.id,
      `"${l.created_at || ''}"`,
      l.admin_id,
      `"${l.admin_email || ''}"`,
      `"${ACTION_LABEL[l.action]?.label || l.action}"`,
      `"${l.resource_type || ''}"`,
      l.resource_id ?? '',
      l.was_pii_exposed ? 'Ya' : 'Tidak',
      `"${l.ip_address || ''}"`,
      `"${(l.detail || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => window.URL.revokeObjectURL(url), 200);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Kepatuhan</p>
          <h1 className="page-title">Audit Log</h1>
          <p className="page-sub">
            Jejak semua aksi admin — transparansi &amp; akuntabilitas akses data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={exportCsv}
            disabled={!logs.length}
            icon={<FontAwesome name="download" className="text-[12px]" />}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            icon={<FontAwesome name="rotate-right" className="text-[12px]" />}
            onClick={() => load(false)}
          >
            Muat ulang
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-ink-3">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Aktivitas"
          value={logs.length}
          subLabel={`${limit} terakhir`}
          icon={<FontAwesome name="list-check" className="text-[12px]" />}
        />
        <StatCard
          title="Akses PII"
          value={piiCount}
          subLabel="Aksi menyentuh PII"
          icon={<FontAwesome name="shield-halved" className="text-[12px]" />}
          iconBg={piiCount > 0 ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok'}
        />
        <StatCard
          title="Admin Aktif"
          value={new Set(logs.map(l => l.admin_id)).size}
          icon={<FontAwesome name="users" className="text-[12px]" />}
        />
        <StatCard
          title="Export Data"
          value={logs.filter(l => l.action === 'export_complaints').length}
          icon={<FontAwesome name="file-arrow-up" className="text-[12px]" />}
          iconBg="bg-surface-3 text-ink-2"
        />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Riwayat Aksi Admin</CardTitle>
            <CardDescription>{filtered.length} catatan ditampilkan</CardDescription>
          </div>
          <Tabs
            items={[
              { id: 'all', label: 'Semua' },
              { id: 'pii', label: 'Hanya PII' },
            ]}
            activeTab={filter}
            onChange={id => setFilter(id as 'all' | 'pii')}
          />
        </CardHeader>

        {loading ? (
          <div className="empty">
            <FontAwesome name="spinner" spin className="text-[15px] text-ink-3 mb-3" />
            <p className="text-[12.5px] text-ink-3">Memuat data...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FontAwesome name="clock" />}
            title="Belum ada aktivitas"
            description="Aksi admin akan tercatat di sini secara otomatis."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Sumber Daya</TableHead>
                <TableHead>Detail</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>PII</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => {
                const meta = ACTION_LABEL[l.action] || { label: l.action, variant: 'neutral' as BadgeVariant };
                return (
                  <TableRow key={l.id}>
                    <TableCell className="cell-mono text-ink-3">{formatDateTime(l.created_at)}</TableCell>
                    <TableCell className="cell-strong whitespace-nowrap">{l.admin_email}</TableCell>
                    <TableCell>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-ink-3">
                      {l.resource_type}{l.resource_id != null ? ` #${l.resource_id}` : ''}
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate">{l.detail || '-'}</TableCell>
                    <TableCell className="cell-mono text-ink-3">{l.ip_address || '-'}</TableCell>
                    <TableCell>
                      {l.was_pii_exposed
                        ? <Badge variant="warn" dot>PII</Badge>
                        : <span className="text-[12px] text-ink-3">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
