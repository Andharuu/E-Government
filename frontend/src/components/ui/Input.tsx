import React from 'react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  hint,
  htmlFor,
  children,
  className = '',
}) => (
  <div className={className}>
    {label && (
      <label className="label" htmlFor={htmlFor}>
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="err">{error}</p>
    ) : hint ? (
      <p className="hint">{hint}</p>
    ) : null}
  </div>
);

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error = false, ...props }, ref) => (
    <input
      ref={ref}
      className={`input ${error ? 'input-error' : ''} ${className}`}
      aria-invalid={error || undefined}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error = false, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`textarea ${error ? 'input-error' : ''} ${className}`}
      aria-invalid={error || undefined}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error = false, children, ...props }, ref) => (
    <select
      ref={ref}
      className={`select ${error ? 'input-error' : ''} ${className}`}
      aria-invalid={error || undefined}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';
