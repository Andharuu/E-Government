import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { adminApi, type AuditLog } from '../../services/api';
import { Button } from '../../components/ui';
import { usePolling } from '../../hooks/usePolling';
import {
  AdminCard, SectionTitle, KpiCard, EmptyState, LoadingBlock, formatDateTime, LiveSyncBar,
} from '../../components/admin/adminUi';

const ACTION_LABEL: Record<string, { label: string; tone: string }> = {
  view_dashboard: { label: 'Lihat Dashboard', tone: 'bg-slate-100 text-slate-600' },
  view_complaint_detail: { label: 'Lihat Detail Pengaduan', tone: 'bg-amber-50 text-amber-700' },
  update_complaint_status: { label: 'Ubah Status Pengaduan', tone: 'bg-blue-50 text-blue-700' },
  toggle_user_active: { label: 'Ubah Status Akun', tone: 'bg-indigo-50 text-indigo-700' },
  view_audit_logs: { label: 'Lihat Audit Log', tone: 'bg-slate-100 text-slate-600' },
  broadcast_announcement: { label: 'Kirim Pengumuman', tone: 'bg-emerald-50 text-emerald-700' },
  export_complaints: { label: 'Export Data', tone: 'bg-rose-50 text-rose-700' },
  view_user_profile: { label: 'Lihat Profil Warga', tone: 'bg-amber-50 text-amber-700' },
};

export function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pii'>('all');
  const [limit, setLimit] = useState(50);
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

  // Live sync every 30s (audit viewing itself is logged, so poll gently).
  const { refresh, lastUpdated } = usePolling(() => load(true), { interval: 30000 });

  const filtered = useMemo(() => {
    if (filter === 'pii') return logs.filter(l => l.was_pii_exposed);
    return logs;
  }, [logs, filter]);

  const piiCount = useMemo(() => logs.filter(l => l.was_pii_exposed).length, [logs]);

  return (
    <div className="w-full space-y-5 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1121] tracking-tight">Audit Log</h1>
          <p className="text-sm text-slate-500 mt-1.5 font-medium">
            Jejak semua aksi admin — transparansi & akuntabilitas akses data
          </p>
        </div>
        <Button variant="outline" icon={<span>🔄</span>} onClick={() => load(false)}>Muat ulang</Button>
      </div>

      <LiveSyncBar lastUpdated={lastUpdated} onRefresh={refresh} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Aktivitas" value={logs.length} icon="list" tone="blue" hint={`${limit} terakhir`} />
        <KpiCard label="Akses PII" value={piiCount} icon="shield" tone={piiCount > 0 ? 'amber' : 'emerald'} hint="Aksi menyentuh PII" />
        <KpiCard label="Admin Aktif" value={new Set(logs.map(l => l.admin_id)).size} icon="users" tone="indigo" />
        <KpiCard label="Export Data" value={logs.filter(l => l.action === 'export_complaints').length} icon="upload" tone="rose" />
      </div>

      <AdminCard>
        <SectionTitle
          icon="time-past"
          title="Riwayat Aksi Admin"
          subtitle={`${filtered.length} catatan ditampilkan`}
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  filter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilter('pii')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  filter === 'pii' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'
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
          <EmptyState icon="time-past" title="Belum ada aktivitas" desc="Aksi admin akan tercatat di sini secara otomatis." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100">
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
                  const meta = ACTION_LABEL[l.action] || { label: l.action, tone: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDateTime(l.created_at)}</td>
                      <td className="px-5 py-3 text-slate-700 font-medium whitespace-nowrap">{l.admin_email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${meta.tone}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {l.resource_type}{l.resource_id != null ? ` #${l.resource_id}` : ''}
                      </td>
                      <td className="px-5 py-3 text-slate-600 max-w-[260px] truncate">{l.detail || '-'}</td>
                      <td className="px-5 py-3 text-slate-400 text-xs font-mono">{l.ip_address || '-'}</td>
                      <td className="px-5 py-3">
                        {l.was_pii_exposed
                          ? <span className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">PII</span>
                          : <span className="text-[10px] text-slate-300">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && logs.length >= limit && (
          <div className="flex justify-center px-5 py-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setLimit(l => l + 50)}>
              Muat {filtered.length >= limit ? 'lebih banyak' : 'lagi'}
            </Button>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
