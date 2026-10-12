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
        'bg-[#0A4174] hover:bg-[#001D39] active:bg-[#001D39] text-white shadow-xs hover:shadow-sm disabled:bg-[#BDD8E9] disabled:text-[#49769F]',
      secondary:
        'bg-[#BDD8E9]/30 hover:bg-[#BDD8E9]/60 active:bg-[#BDD8E9]/80 text-[#0A4174] border border-[#BDD8E9] disabled:opacity-50',
      ghost:
        'bg-transparent hover:bg-[#BDD8E9]/20 active:bg-[#BDD8E9]/35 text-[#49769F] hover:text-[#001D39] disabled:opacity-40',
      danger:
        'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs hover:shadow-sm disabled:bg-rose-300',
      outline:
        'bg-white hover:bg-[#BDD8E9]/15 text-[#0A4174] border border-[#BDD8E9] hover:border-[#49769F] shadow-xs disabled:opacity-50',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5 font-medium',
      md: 'text-xs sm:text-[13px] px-4 py-2.5 rounded-xl gap-2 font-semibold',
      lg: 'text-sm px-5 py-3 rounded-xl gap-2.5 font-bold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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
