import React, { forwardRef, useId } from 'react';
import { InputProps, ComponentSize } from './types';
import styles from './Input.module.css';

export const Input = forwardRef<HTMLInputElement, InputProps>(
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

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={styles.label}
          >
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            if (onChange) {
              (onChange as (value: string) => void)(event.target.value);
            }
          }}
          disabled={disabled}
          required={required}
          className={`${styles.base} ${styles[size]} ${hasError ? styles.error : ''} ${className}`}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          aria-invalid={hasError}
          {...props}
        />
        {hasError && (
          <p
            id={`${inputId}-error`}
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

Input.displayName = 'Input';