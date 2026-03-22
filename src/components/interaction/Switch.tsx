'use client'

import React, { forwardRef, useId } from 'react'
import { SwitchProps } from './types'
import styles from './Switch.module.css'

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({
    checked = false,
    onChange,
    label,
    required = false,
    size = 'md',
    className = '',
    disabled = false,
    ...props
  }, ref) => {
    const switchId = useId()

    return (
      <label htmlFor={switchId} className={`${styles.container} ${styles[size]} ${disabled ? styles.disabled : ''} ${className}`}>
        <input
          ref={ref}
          id={switchId}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => {
            onChange?.(event.target.checked)
          }}
          className={styles.input}
          {...props}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
        {label && (
          <span className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </span>
        )}
      </label>
    )
  }
)

Switch.displayName = 'Switch'
