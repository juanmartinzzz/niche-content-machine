import React, { forwardRef } from 'react';
import { ButtonProps, ComponentSize } from './types';

// Size mappings based on style guide
const sizeClasses: Record<ComponentSize, string> = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-[52px] px-6 text-lg',
  xl: 'h-[60px] px-7 text-xl',
};

// Base button styles
const baseClasses = 'inline-flex items-center justify-center font-medium rounded-[24px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

// Variant styles
const variantClasses = {
  primary: 'bg-[#222834] text-white shadow-sm hover:shadow-md active:scale-95',
  secondary: 'bg-white border border-[#d0d4dc] text-[#373f51] hover:bg-gray-50 active:scale-95',
  ghost: 'bg-transparent text-[#14171f] hover:bg-[#f1f5f9] active:scale-95',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', onClick, children, type = 'button', className = '', disabled = false, ...props }, ref) => {
    const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={classes}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';