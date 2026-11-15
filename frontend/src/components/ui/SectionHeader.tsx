import React from 'react';

export interface SectionHeaderProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  iconBg,
  title,
  description,
  action,
  badge,
  className = '',
}) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-line ${className}`}
  >
    <div className="flex items-center gap-3 min-w-0">
      {icon && (
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-[13px] ${
            iconBg || 'bg-surface-3 text-ink-2 border border-line'
          }`}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-[14px] font-semibold text-ink tracking-[-0.01em] leading-snug">
            {title}
          </h2>
          {badge}
        </div>
        {description && <p className="text-[12px] text-ink-3 mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
    {action && <div className="self-start sm:self-auto shrink-0">{action}</div>}
  </div>
);
