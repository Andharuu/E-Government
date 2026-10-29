import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { adminApi, type AuditLog } from '../../services/api';
import { Button, FontAwesome } from '../../components/ui';
import { usePolling } from '../../hooks/usePolling';
import {
  AdminCard, SectionTitle, KpiCard, EmptyState, LoadingBlock, formatDateTime, LiveSyncBar,
} from '../../components/admin/adminUi';

const ACTION_LABEL: Record<string, { label: string; tone: string }> = {
  view_dashboard: { label: 'Lihat Dashboard', tone: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700' },
  view_complaint_detail: { label: 'Lihat Detail Pengaduan', tone: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' },
  update_complaint_status: { label: 'Ubah Status Pengaduan', tone: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60' },
  toggle_user_active: { label: 'Ubah Status Akun', tone: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60' },
  view_audit_logs: { label: 'Lihat Audit Log', tone: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700' },
  broadcast_announcement: { label: 'Kirim Pengumuman', tone: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' },
  export_complaints: { label: 'Export Data', tone: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60' },
  view_user_profile: { label: 'Lihat Profil Warga', tone: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' },
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
    <div className="w-full space-y-5 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Audit Log</h1>
          <p className="text-sm text-slate-500 dark:text-[#6EA2B3] mt-1.5 font-medium">
            Jejak semua aksi admin — transparansi & akuntabilitas akses data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={!logs.length}
            icon={<FontAwesome name="download" className="text-xs" />}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            icon={<FontAwesome name="rotate-right" className="text-xs" />}
            onClick={() => load(false)}
          >
            Muat ulang
          </Button>
        </div>
      </div>

      <LiveSyncBar lastUpdated={lastUpdated} onRefresh={refresh} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Aktivitas" value={logs.length} icon="list-check" tone="blue" hint={`${limit} terakhir`} />
        <KpiCard label="Akses PII" value={piiCount} icon="shield-halved" tone={piiCount > 0 ? 'amber' : 'emerald'} hint="Aksi menyentuh PII" />
        <KpiCard label="Admin Aktif" value={new Set(logs.map(l => l.admin_id)).size} icon="users" tone="indigo" />
        <KpiCard label="Export Data" value={logs.filter(l => l.action === 'export_complaints').length} icon="file-arrow-up" tone="rose" />
      </div>

      <AdminCard>
        <SectionTitle
          icon="clock-rotate-left"
          title="Riwayat Aksi Admin"
          subtitle={`${filtered.length} catatan ditampilkan`}
          action={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-[#101828] text-slate-600 dark:text-[#6EA2B3] border-slate-200 dark:border-[#243048] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilter('pii')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  filter === 'pii'
                    ? 'bg-amber-600 dark:bg-amber-500 text-white border-amber-600 dark:border-amber-500 shadow-sm'
                    : 'bg-white dark:bg-[#101828] text-slate-600 dark:text-[#6EA2B3] border-slate-200 dark:border-[#243048] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                Hanya PII
              </button>
            </div>
          }
        />

        {loading ? (
          <LoadingBlock />
        ) : filtered.length === 0 ? (
          <EmptyState icon="clock-rotate-left" title="Belum ada aktivitas" desc="Aksi admin akan tercatat di sini secara otomatis." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 dark:text-[#6EA2B3] border-b border-slate-200 dark:border-[#243048]">
                  <th className="px-5 py-3 font-bold">Waktu</th>
                  <th className="px-5 py-3 font-bold">Admin</th>
                  <th className="px-5 py-3 font-bold">Aksi</th>
                  <th className="px-5 py-3 font-bold">Sumber Daya</th>
                  <th className="px-5 py-3 font-bold">Detail</th>
                  <th className="px-5 py-3 font-bold">IP</th>
                  <th className="px-5 py-3 font-bold">PII</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const meta = ACTION_LABEL[l.action] || {
                    label: l.action,
                    tone: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  };
                  return (
                    <tr key={l.id} className="border-b border-slate-100 dark:border-[#1E293B] hover:bg-slate-50/80 dark:hover:bg-[#1E293B]/50 transition-colors">
                      <td className="px-5 py-3 text-slate-500 dark:text-[#6EA2B3] text-xs whitespace-nowrap font-mono">{formatDateTime(l.created_at)}</td>
                      <td className="px-5 py-3 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">{l.admin_email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.tone}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 dark:text-[#6EA2B3] text-xs">
                        {l.resource_type}{l.resource_id != null ? ` #${l.resource_id}` : ''}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300 max-w-[260px] truncate">{l.detail || '-'}</td>
                      <td className="px-5 py-3 text-slate-400 dark:text-[#6EA2B3] text-xs font-mono">{l.ip_address || '-'}</td>
                      <td className="px-5 py-3">
                        {l.was_pii_exposed
                          ? <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/60">PII</span>
                          : <span className="text-[10px] text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
