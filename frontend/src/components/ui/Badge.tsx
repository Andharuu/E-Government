import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline' | 'primary' | 'ok' | 'warn';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const VARIANT_CLASS: Record<BadgeVariant, string> = {
  success: 'badge-ok',
  ok: 'badge-ok',
  warning: 'badge-warn',
  warn: 'badge-warn',
  danger: 'badge-danger',
  info: 'badge-accent',
  primary: 'badge-accent',
  neutral: 'badge-neutral',
  outline: 'badge-neutral',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...props
}) => (
  <span
    className={`badge ${VARIANT_CLASS[variant]} ${size === 'sm' ? 'text-[10px] h-[18px] px-1.5' : ''} ${className}`}
    {...props}
  >
    {dot && <span className="dot" />}
    {children}
  </span>
);
