import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBg: string; // Tailwind bg-* class for the icon container
  border: string; // Tailwind border-* class
  subLabel?: string;
}

export function KpiCard({ title, value, icon: Icon, iconBg, border, subLabel }: KpiCardProps) {
  return (
    <div className={`rounded-lg border p-5 bg-surface-elevated transition-colors-fast ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-content-tertiary uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-content-primary mt-1.5 tabular-nums">{value}</p>
          {subLabel && <p className="text-xs text-content-tertiary mt-1">{subLabel}</p>}
        </div>
        <div className={`p-2.5 rounded-md text-white ${iconBg}`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
