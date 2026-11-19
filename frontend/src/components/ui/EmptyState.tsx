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
}) => (
  <div className={`empty ${className}`}>
    <div className="empty-icon">{icon || <FontAwesome name="inbox" className="text-[15px]" />}</div>
    <h4 className="text-[13.5px] font-semibold text-ink">{title}</h4>
    {description && (
      <p className="text-[12.5px] text-ink-3 mt-1 max-w-[380px] leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
