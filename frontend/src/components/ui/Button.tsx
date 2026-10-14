import React from 'react';
import { FontAwesome } from './FontAwesome';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-[#0A4174] hover:bg-[#001D39] active:bg-[#001D39] text-white shadow-xs disabled:bg-slate-200 disabled:text-slate-400',
      secondary:
        'bg-[#BDD8E9]/30 hover:bg-[#BDD8E9]/60 active:bg-[#BDD8E9]/80 text-[#0A4174] border border-[#BDD8E9] disabled:opacity-50',
      ghost:
        'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-[#49769F] hover:text-[#001D39] disabled:opacity-40',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs disabled:bg-rose-200 disabled:text-rose-400',
      outline:
        'bg-white hover:bg-slate-50 active:bg-slate-100 text-[#001D39] border border-[#BDD8E9] hover:border-[#49769F] disabled:opacity-50',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-2 font-medium min-h-[32px]',
      md: 'text-sm px-4 py-2 rounded-xl gap-2 font-semibold min-h-[40px]',
      lg: 'text-sm px-6 py-3 rounded-xl gap-2 font-bold min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center transition-colors duration-150 cursor-pointer select-none disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <FontAwesome name="spinner" spin className="text-sm shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
