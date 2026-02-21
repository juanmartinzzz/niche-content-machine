import React, { forwardRef } from 'react';
import { PillProps, ComponentSize } from './types';
import styles from './Pill.module.css';

export const Pill = forwardRef<HTMLButtonElement, PillProps>(
  ({
    label,
    selected = false,
    onClick,
    variant = 'single',
    size = 'md',
    className = '',
    disabled = false,
    ...props
  }, ref) => {
    const stateClass = selected ? styles.selected : styles.unselected;

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={`${styles.base} ${styles[size]} ${stateClass} ${className}`}
        role={variant === 'multiple' ? 'checkbox' : 'radio'}
        aria-checked={selected}
        aria-label={label}
        {...props}
      >
        {label}
      </button>
    );
  }
);

Pill.displayName = 'Pill';