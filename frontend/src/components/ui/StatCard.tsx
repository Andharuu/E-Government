import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subLabel?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subLabel,
  icon,
  iconBg,
  trend,
  className = '',
}) => (
  <div className={`kpi ${className}`}>
    <div className="kpi-label">
      <span className="truncate">{title}</span>
      {icon && (
        <span
          className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-[12px] ${
            iconBg || 'bg-accent-soft text-accent-text'
          }`}
        >
          {icon}
        </span>
      )}
    </div>

    <div className="flex items-baseline gap-2 min-w-0">
      <span className="kpi-value truncate">{value}</span>
      {trend && (
        <span
          className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
            trend.positive ? 'text-ok bg-ok-soft' : 'text-danger bg-danger-soft'
          }`}
        >
          {trend.positive ? '+' : ''}
          {trend.value}
        </span>
      )}
    </div>

    {subLabel && <p className="kpi-foot truncate">{subLabel}</p>}
  </div>
);
