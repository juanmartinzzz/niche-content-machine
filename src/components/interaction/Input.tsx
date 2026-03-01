'use client'

import React, { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
    showPasswordToggle = false,
    ...props
  }, ref) => {
    const inputId = useId();
    const hasError = Boolean(error);
    const [showPassword, setShowPassword] = useState(false);

    const isPasswordType = type === 'password';
    const shouldShowToggle = isPasswordType && showPasswordToggle;
    const actualInputType = isPasswordType && showPassword ? 'text' : type;

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
        <div className={styles.inputContainer}>
          <input
            ref={ref}
            id={inputId}
            type={actualInputType}
            placeholder={placeholder}
            value={value}
            onChange={(event) => {
              if (onChange) {
                (onChange as (value: string) => void)(event.target.value);
              }
            }}
            disabled={disabled}
            required={required}
            className={`${styles.base} ${styles[size]} ${hasError ? styles.error : ''} ${shouldShowToggle ? styles.inputWithToggle : ''} ${className}`}
            aria-describedby={hasError ? `${inputId}-error` : undefined}
            aria-invalid={hasError}
            {...props}
          />
          {shouldShowToggle && (
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
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