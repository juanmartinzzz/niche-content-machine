'use client';

import React, { forwardRef, useId, useEffect, useRef } from 'react';
import { TextareaProps, ComponentSize } from './types';
import styles from './Textarea.module.css';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
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

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className={styles.label}
          >
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <textarea
          ref={textareaRef}
          id={textareaId}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            if (onChange) {
              (onChange as (value: string) => void)(event.target.value);
            }
          }}
          disabled={disabled}
          required={required}
          rows={autoResize ? 1 : rows}
          className={`${styles.base} ${styles[size]} ${hasError ? styles.error : ''} ${className}`}
          aria-describedby={hasError ? `${textareaId}-error` : undefined}
          aria-invalid={hasError}
          {...props}
        />
        {hasError && (
          <p
            id={`${textareaId}-error`}
            className={styles.errorMessage}
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