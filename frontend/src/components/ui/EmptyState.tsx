import React from 'react';
import { FontAwesome } from './FontAwesome';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-10 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-14 h-14 rounded-xl bg-[#F6F8FB] border border-[#E8ECF2] flex items-center justify-center text-[#64748B] mb-3">
        {icon || <FontAwesome name="folder-open" className="text-2xl" />}
      </div>
      <h4 className="text-[14px] leading-[20px] font-medium text-[#0F172A]">{title}</h4>
      {description && (
        <p className="text-[13px] leading-[20px] font-normal text-[#64748B] mt-1 max-w-[360px] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
