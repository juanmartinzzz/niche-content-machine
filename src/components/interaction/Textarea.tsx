import React, { forwardRef, useId, useEffect, useRef } from 'react';
import { TextareaProps, ComponentSize } from './types';

// Size mappings based on style guide (same as input but with different vertical padding)
const sizeClasses: Record<ComponentSize, string> = {
  xs: 'px-3 py-2 text-xs',
  sm: 'px-3.5 py-2.5 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-4.5 py-3.5 text-lg',
  xl: 'px-5 py-4 text-xl',
};

// Base textarea styles
const baseClasses = 'w-full border border-[#e2e8f0] rounded-md bg-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#222834] focus:border-[#222834] disabled:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed placeholder:text-gray-400 resize-none';

// Error state styles
const errorClasses = 'border-red-500 focus:ring-red-500 focus:border-red-500 bg-red-50';

interface TextareaComponentProps extends Omit<TextareaProps, 'onChange'> {
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaComponentProps>(
  ({
    placeholder,
    value,
    onChange,
    error,
    label,
    required = false,
    size = 'md',
    rows = 3,
    autoResize = false,
    className = '',
    disabled = false,
    ...props
  }, ref) => {
    const textareaId = useId();
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) || internalRef;
    const hasError = Boolean(error);

    // Auto-resize functionality
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        const textarea = textareaRef.current;
        // Reset height to auto to get the correct scrollHeight
        textarea.style.height = 'auto';
        // Set height to scrollHeight to fit content
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [value, autoResize, textareaRef]);

    const textareaClasses = `${baseClasses} ${sizeClasses[size]} ${hasError ? errorClasses : ''} ${className}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[#14171f] mb-1.5"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={textareaId}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          rows={autoResize ? 1 : rows}
          className={textareaClasses}
          aria-describedby={hasError ? `${textareaId}-error` : undefined}
          aria-invalid={hasError}
          {...props}
        />
        {hasError && (
          <p
            id={`${textareaId}-error`}
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

Textarea.displayName = 'Textarea';