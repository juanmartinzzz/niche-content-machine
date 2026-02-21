import React, { forwardRef } from 'react';
import { ButtonProps, ComponentSize } from './types';
import styles from './Button.module.css';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', onClick, children, type = 'button', className = '', disabled = false, ...props }, ref) => {
    const variantClass = styles[variant];
    const sizeClass = styles[size];

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={`${styles.base} ${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';