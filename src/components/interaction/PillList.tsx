'use client'

import React from 'react';
import { PillListProps } from './types';
import { Pill } from './Pill';

export const PillList: React.FC<PillListProps> = ({
  options,
  selected,
  onChange,
  variant = 'single',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}) => {
  const handlePillClick = (optionId: string) => {
    if (disabled) return;

    if (variant === 'single') {
      // Single selection: only one item can be selected
      const newSelected = selected.includes(optionId) ? [] : [optionId];
      onChange(newSelected);
    } else {
      // Multiple selection: toggle selection
      const newSelected = selected.includes(optionId)
        ? selected.filter(id => id !== optionId)
        : [...selected, optionId];
      onChange(newSelected);
    }
  };

  const containerClasses = `flex flex-wrap gap-2 ${className}`;

  return (
    <div className={containerClasses} role={variant === 'multiple' ? 'group' : 'radiogroup'} {...props}>
      {options.map((option) => (
        <Pill
          key={option.id}
          label={option.label}
          selected={selected.includes(option.id)}
          onClick={() => handlePillClick(option.id)}
          variant={variant}
          size={size}
          disabled={disabled}
        />
      ))}
    </div>
  );
};