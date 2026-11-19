import React, { useEffect, useState } from 'react';
import { FontAwesome } from '../ui';

/* ─── Shared admin UI primitives — Design System v3 (token semantik) ─── */

export const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  diterima: { label: 'Diterima', cls: 'badge-accent', dot: 'bg-accent' },
  diproses: { label: 'Diproses', cls: 'badge-warn', dot: 'bg-warn' },
  proses: { label: 'Diproses', cls: 'badge-warn', dot: 'bg-warn' },
  selesai: { label: 'Selesai', cls: 'badge-ok', dot: 'bg-ok' },
  ditolak: { label: 'Ditolak', cls: 'badge-danger', dot: 'bg-danger' },
};

export const PRIORITY_META: Record<string, { label: string; cls: string }> = {
  tinggi: { label: 'Tinggi', cls: 'badge-danger' },
  sedang: { label: 'Sedang', cls: 'badge-warn' },
  rendah: { label: 'Rendah', cls: 'badge-neutral' },
};

export const CATEGORY_LABEL: Record<string, string> = {
  pelayanan: 'Pelayanan',
  teknis: 'Teknis',
  administrasi: 'Administrasi',
  lainnya: 'Lainnya',
};

/* ─── Report type (layanan vs keamanan) ─── */
export const REPORT_TYPE_META: Record<string, { label: string; cls: string; dot: string; icon: string }> = {
  layanan: {
    label: 'Layanan',
    cls: 'badge-accent',
    dot: 'bg-accent',
    icon: 'inbox'
  },
  keamanan: {
    label: 'Keamanan & Bug',
    cls: 'badge-warn',
    dot: 'bg-warn',
    icon: 'shield-exclamation'
  },
};

export function ReportTypeBadge({ type }: { type?: string }) {
  const meta = REPORT_TYPE_META[type || 'layanan'] || REPORT_TYPE_META.layanan;
  return (
    <span className={`badge ${meta.cls}`}>
      <span className={`dot ${meta.dot}`} />
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
  kritis: { label: 'Kritis', cls: 'badge-danger border-danger', dot: 'bg-danger' },
  tinggi: { label: 'Tinggi', cls: 'badge-danger', dot: 'bg-danger' },
  sedang: { label: 'Sedang', cls: 'badge-warn', dot: 'bg-warn' },
  rendah: { label: 'Rendah', cls: 'badge-neutral', dot: 'bg-ink-3' },
};

export function SeverityBadge({ severity }: { severity?: string | null }) {
  if (!severity) return null;
  const meta = SEVERITY_META[severity] || {
    label: severity,
    cls: 'badge-neutral',
    dot: 'bg-ink-3'
  };
  return (
    <span className={`badge ${meta.cls}`}>
      <span className={`dot ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] || {
    label: status,
    cls: 'badge-neutral',
    dot: 'bg-ink-3'
  };
  return (
    <span className={`badge ${meta.cls}`}>
      <span className={`dot ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority] || {
    label: priority,
    cls: 'badge-neutral'
  };
  return (
    <span className={`badge ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export function AdminCard({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ icon, title, subtitle, action }: {
  icon: string; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-accent-line bg-accent-soft text-accent-text">
          <FontAwesome name={icon} className="text-[13px]" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-[12px] text-ink-3">{subtitle}</p>}
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
    blue: 'border-accent-line bg-accent-soft text-accent-text',
    emerald: 'border-ok-line bg-ok-soft text-ok',
    amber: 'border-warn-line bg-warn-soft text-warn',
    rose: 'border-danger-line bg-danger-soft text-danger',
    indigo: 'border-accent-line bg-accent-soft text-accent-text',
    slate: 'border-line bg-surface-3 text-ink-2',
  };

  const selectedTone = tones[tone] || tones.blue;

  return (
    <div className="kpi">
      <div className="kpi-label">
        <span className="truncate">{label}</span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border ${selectedTone}`}>
          <FontAwesome name={icon} className="text-[11px]" />
        </span>
      </div>
      <p className="kpi-value">{value}</p>
      {hint && <p className="kpi-foot">{hint}</p>}
    </div>
  );
}

export function EmptyState({ icon = 'inbox', title, desc }: { icon?: string; title: string; desc?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <FontAwesome name={icon} className="text-[15px]" />
      </div>
      <p className="text-[13px] font-semibold text-ink">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-[12px] text-ink-3">{desc}</p>}
    </div>
  );
}

export function LoadingBlock({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-[12.5px] text-ink-3">
      <FontAwesome name="spinner" spin className="text-[15px] text-accent-text" />
      <span>{label}</span>
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
    <div className="flex items-center gap-3 rounded-md border border-ok-line bg-ok-soft px-3.5 py-2">
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok opacity-40" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
      </span>
      <span className="text-[11px] font-semibold text-ok">Data Langsung</span>
      <span className="hidden text-[11px] text-ok/80 sm:inline">• {label}</span>
      <button
        type="button"
        onClick={onRefresh}
        className="btn btn-ghost btn-icon btn-sm ml-1 text-ok hover:text-ok"
        title="Sinkronkan sekarang"
      >
        <FontAwesome name="rotate-right" spin={refreshing} className="text-[12px]" />
      </button>
    </div>
  );
}

/**
 * Indikator sinkronisasi yang benar-benar berdetak: menampilkan berapa detik
 * sejak data terakhir diambil, bukan hanya jam statis.
 */
export function LiveStamp({ at }: { at: Date | null }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!at) return <span>Menghubungkan…</span>;

  const seconds = Math.max(0, Math.round((Date.now() - at.getTime()) / 1000));
  const label = seconds < 5 ? 'baru saja' : seconds < 60 ? `${seconds} detik lalu` : `${Math.round(seconds / 60)} menit lalu`;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex w-1.5 h-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ok opacity-60" />
        <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-ok" />
      </span>
      Diperbarui {label}
    </span>
  );
}
