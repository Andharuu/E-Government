import React from 'react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  hint,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#49769F]">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600 mt-1">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#94A3B8] mt-1">{hint}</p>
      ) : null}
    </div>
  );
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-4 py-2 h-11 text-sm bg-white border rounded-xl placeholder:text-[#94A3B8] text-[#001D39] focus:outline-none focus:ring-4 transition-all duration-150 ${
          error
            ? 'border-rose-300 focus:ring-rose-500/15 focus:border-rose-500'
            : 'border-[#BDD8E9] hover:border-[#49769F] focus:ring-[#7BBDE8]/20 focus:border-[#0A4174]'
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full p-4 text-sm bg-white border rounded-xl placeholder:text-[#94A3B8] text-[#001D39] focus:outline-none focus:ring-4 transition-all duration-150 ${
          error
            ? 'border-rose-300 focus:ring-rose-500/15 focus:border-rose-500'
            : 'border-[#BDD8E9] hover:border-[#49769F] focus:ring-[#7BBDE8]/20 focus:border-[#0A4174]'
        } ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error = false, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-4 py-2 h-11 text-sm bg-white border rounded-xl text-[#001D39] focus:outline-none focus:ring-4 transition-all duration-150 ${
          error
            ? 'border-rose-300 focus:ring-rose-500/15 focus:border-rose-500'
            : 'border-[#BDD8E9] hover:border-[#49769F] focus:ring-[#7BBDE8]/20 focus:border-[#0A4174]'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';
