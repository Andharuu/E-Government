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
  iconBg: _iconBg = 'bg-[#BDD8E9]/30 text-[#0A4174]',
  trend,
  className = '',
}) => {
  return (
    <div
      className={`group bg-white dark:bg-[#171F2F] rounded-[16px] border border-slate-200 dark:border-[#243048] p-5 shadow-sm flex items-start justify-between gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${className}`}
    >
      <div className="min-w-0">
        <p className="text-[13px] leading-[20px] font-medium text-slate-500 dark:text-[#6EA2B3] truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-[28px] leading-[34px] font-semibold text-slate-900 dark:text-white tracking-[-0.02em] tabular-nums">
            {value}
          </span>
          {trend && (
            <span
              className={`text-[12px] leading-[16px] font-medium px-2 py-0.5 rounded-full ${
                trend.positive
                  ? 'bg-blue-50 dark:bg-[#BDD8E9]/20 text-blue-700 dark:text-[#7BBDE8]'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.positive ? '+' : ''}
              {trend.value}
            </span>
          )}
        </div>
        {subLabel && (
          <p className="text-[12px] leading-[18px] font-normal text-slate-400 dark:text-[#6EA2B3] truncate mt-1">
            {subLabel}
          </p>
        )}
      </div>

      {icon && (
        <div className="shrink-0 flex items-center justify-center text-[20px] text-blue-600 dark:text-[#7BBDE8] pt-0.5 transition-transform duration-300 group-hover:scale-115 group-hover:rotate-6">
          {icon}
        </div>
      )}
    </div>
  );
};
