import React from 'react';
import { FontAwesome } from '../ui';

/* ─── Shared admin UI primitives (clean white/navy government theme) ─── */

export const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  diterima: { label: 'Diterima', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  diproses: { label: 'Diproses', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  proses: { label: 'Diproses', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  selesai: { label: 'Selesai', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  ditolak: { label: 'Ditolak', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

export const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  tinggi: { label: 'Tinggi', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  sedang: { label: 'Sedang', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  rendah: { label: 'Rendah', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const CATEGORY_LABEL: Record<string, string> = {
  pelayanan: 'Pelayanan',
  teknis: 'Teknis',
  administrasi: 'Administrasi',
  lainnya: 'Lainnya',
};

/* ─── Report type (layanan vs keamanan) ─── */
export const REPORT_TYPE_META: Record<string, { label: string; cls: string; dot: string; icon: string }> = {
  layanan: { label: 'Layanan', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', icon: 'inbox' },
  keamanan: { label: 'Keamanan & Bug', cls: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500', icon: 'shield-exclamation' },
};

export function ReportTypeBadge({ type }: { type?: string }) {
  const meta = REPORT_TYPE_META[type || 'layanan'] || REPORT_TYPE_META.layanan;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${meta.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/* ─── Security/bug report vocabulary ─── */
export const SECURITY_KIND_LABEL: Record<string, string> = {
  kebocoran_data: 'Kebocoran Data',
  bug: 'Bug / Kesalahan Teknis',
  privasi: 'Pelanggaran Privasi',
  akses_tidak_sah: 'Akses Tidak Sah',
  lainnya: 'Lainnya',
};

export const SECURITY_SOURCE_LABEL: Record<string, string> = {
  ekstensi: 'Ekstensi Browser',
  web: 'Website GovConnect',
};

export const SEVERITY_META: Record<string, { label: string; cls: string; dot: string }> = {
  kritis: { label: 'Kritis', cls: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-600' },
  tinggi: { label: 'Tinggi', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  sedang: { label: 'Sedang', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  rendah: { label: 'Rendah', cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
};

export function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return null;
  const meta = SEVERITY_META[severity] || { label: severity, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${meta.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${meta.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority] || { label: priority, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export function AdminCard({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E8ECF2] shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ icon, title, subtitle, action }: {
  icon: string; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#E8ECF2]">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center shrink-0">
          <FontAwesome name={icon} className="text-sm" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-[#0F172A] truncate">{title}</h2>
          {subtitle && <p className="text-xs text-[#64748B] mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function KpiCard({ label, value, icon, tone = 'blue', hint }: {
  label: string; value: React.ReactNode; icon: string;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate'; hint?: string;
}) {
  const tones: Record<string, string> = {
    blue: 'bg-[#EFF4FF] text-[#2563EB]',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-violet-50 text-violet-600',
    slate: 'bg-slate-100 text-slate-600',
  };
  return (
    <AdminCard className="p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#64748B] truncate">{label}</p>
          <p className="text-[28px] leading-tight font-black text-[#0F172A] mt-1.5 tracking-tight">{value}</p>
          {hint && <p className="text-[11px] text-[#94A3B8] mt-1 font-medium">{hint}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <FontAwesome name={icon} className="text-base" />
        </div>
      </div>
    </AdminCard>
  );
}

export function EmptyState({ icon = 'inbox', title, desc }: { icon?: string; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <FontAwesome name={icon} className="text-xl" />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      {desc && <p className="text-xs text-slate-400 mt-1 max-w-sm">{desc}</p>}
    </div>
  );
}

export function LoadingBlock({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400 gap-2 text-sm">
      <FontAwesome name="spinner" spin className="text-lg text-blue-500" />
      {label}
    </div>
  );
}

export function relativeTime(iso?: string): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

/** Live-sync indicator: pulsing dot + last update time + manual refresh. */
export function LiveSyncBar({ lastUpdated, onRefresh, refreshing }: {
  lastUpdated: Date | null; onRefresh: () => void; refreshing?: boolean;
}) {
  // Store "now" in state, refreshed every 10s, so the relative label stays
  // fresh without calling the impure Date.now() during render.
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(t);
  }, []);

  const secondsAgo = lastUpdated ? Math.floor((now - lastUpdated.getTime()) / 1000) : null;
  const label =
    secondsAgo === null ? 'Menghubungkan...'
    : secondsAgo < 5 ? 'Baru saja disinkronkan'
    : secondsAgo < 60 ? `Tersinkron ${secondsAgo} detik lalu`
    : `Tersinkron ${Math.floor(secondsAgo / 60)} menit lalu`;

  return (
    <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
      <span className="relative flex items-center justify-center w-2.5 h-2.5">
        <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
      </span>
      <span className="text-[11px] font-bold text-emerald-700">Data Langsung</span>
      <span className="text-[11px] text-emerald-600/80 hidden sm:inline">• {label}</span>
      <button
        onClick={onRefresh}
        className="ml-1 text-emerald-600 hover:text-emerald-800 transition-colors cursor-pointer"
        title="Sinkronkan sekarang"
      >
        <FontAwesome name="rotate-right" spin={refreshing} className="text-[12px]" />
      </button>
    </div>
  );
}
