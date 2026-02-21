import React, { forwardRef, useId } from 'react';
import { InputProps, ComponentSize } from './types';

// Size mappings based on style guide
const sizeClasses: Record<ComponentSize, string> = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-[52px] px-4.5 text-lg',
  xl: 'h-[60px] px-5 text-xl',
};

// Base input styles
const baseClasses = 'w-full border border-[#e2e8f0] rounded-md bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#222834] focus:border-[#222834] disabled:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-400';

// Error state styles
const errorClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50';

interface InputComponentProps extends Omit<InputProps, 'onChange'> {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input = forwardRef<HTMLInputElement, InputComponentProps>(
  ({
    type = 'text',
    placeholder,
    value,
    onChange,
    error,
    label,
    required = false,
    size = 'md',
    className = '',
    disabled = false,
    ...props
  }, ref) => {
    const inputId = useId();
    const hasError = Boolean(error);

    const inputClasses = `${baseClasses} ${sizeClasses[size]} ${hasError ? errorClasses : ''} ${className}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#14171f] mb-1.5"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={inputClasses}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          aria-invalid={hasError}
          {...props}
        />
        {hasError && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';