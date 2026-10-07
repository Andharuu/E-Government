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
  iconBg: _iconBg = 'bg-blue-50 text-blue-600',
  trend,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-[16px] border border-[#E8ECF2] p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] flex items-start justify-between gap-3 ${className}`}
    >
      <div className="min-w-0">
        <p className="text-[13px] leading-[20px] font-medium text-[#475569] truncate">
          {title}
        </p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-[28px] leading-[34px] font-semibold text-[#0F172A] tracking-[-0.02em] tabular-nums">
            {value}
          </span>
          {trend && (
            <span
              className={`text-[12px] leading-[16px] font-medium px-2 py-0.5 rounded-full ${
                trend.positive
                  ? 'bg-[#ECFDF5] text-[#047857]'
                  : 'bg-[#FFF1F2] text-[#BE123C]'
              }`}
            >
              {trend.positive ? '+' : ''}
              {trend.value}
            </span>
          )}
        </div>
        {subLabel && (
          <p className="text-[12px] leading-[18px] font-normal text-[#64748B] truncate mt-1">
            {subLabel}
          </p>
        )}
      </div>

      {icon && (
        <div className="shrink-0 flex items-center justify-center text-[20px] text-[#2563EB] pt-0.5">
          {icon}
        </div>
      )}
    </div>
  );
};
