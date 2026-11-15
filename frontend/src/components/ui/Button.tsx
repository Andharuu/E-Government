import React from 'react';
import { FontAwesome } from './FontAwesome';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  /** Hanya ikon, tanpa teks */
  iconOnly?: boolean;
}

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  soft: 'btn-soft',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  outline: 'btn-secondary',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconOnly = false,
      className = '',
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={`btn ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${iconOnly ? 'btn-icon' : ''} ${className}`}
        {...props}
      >
        {loading ? (
          <FontAwesome name="spinner" spin className="text-[13px] shrink-0" />
        ) : icon ? (
          <span className="shrink-0 text-[13px] leading-none">{icon}</span>
        ) : null}
        {!iconOnly && children}
      </button>
    );
  }
);
Button.displayName = 'Button';
