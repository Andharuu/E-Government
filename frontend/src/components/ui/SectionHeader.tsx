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
  iconBg = 'bg-blue-50 text-blue-600 border border-blue-100/80',
  title,
  description,
  action,
  badge,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${iconBg}`}>
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
              {title}
            </h2>
            {badge && <span>{badge}</span>}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="self-start sm:self-auto shrink-0">{action}</div>}
    </div>
  );
};
