import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'outline' | 'primary';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-[#4E8EA2]/15 text-[#0A4174] border-[#4E8EA2]/40',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-800 border-rose-200/80',
    info: 'bg-[#BDD8E9]/40 text-[#0A4174] border-[#6EA2B3]/40',
    neutral: 'bg-[#BDD8E9]/25 text-[#001D39] border-[#BDD8E9]',
    outline: 'bg-transparent text-[#49769F] border-[#BDD8E9]',
    primary: 'bg-[#0A4174] text-white border-transparent shadow-xs',
  };

  const dotColors: Record<BadgeVariant, string> = {
    success: 'bg-[#4E8EA2]',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-[#7BBDE8]',
    neutral: 'bg-[#6EA2B3]',
    outline: 'bg-[#49769F]',
    primary: 'bg-white',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] px-2 py-0.5 font-bold',
    md: 'text-[11px] px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};
