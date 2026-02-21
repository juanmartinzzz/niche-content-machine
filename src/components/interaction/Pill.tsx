import React, { forwardRef } from 'react';
import { PillProps, ComponentSize } from './types';

// Size mappings based on style guide
const sizeClasses: Record<ComponentSize, string> = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-4 text-base',
  lg: 'h-[52px] px-4.5 text-lg',
  xl: 'h-[60px] px-5 text-xl',
};

// Base pill styles
const baseClasses = 'inline-flex items-center justify-center font-medium rounded-[20px] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#222834] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

// Selected state styles
const selectedClasses = 'bg-[#222834] text-white hover:bg-[#1a1f2e]';

// Unselected state styles
const unselectedClasses = 'bg-[#f9fafb] text-[#14171f] hover:bg-[#f1f5f9] border border-[#e2e8f0]';

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
    const stateClasses = selected ? selectedClasses : unselectedClasses;
    const classes = `${baseClasses} ${sizeClasses[size]} ${stateClasses} ${className}`;

    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={classes}
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