'use client'

import React, { useState } from 'react';
import { PillListProps } from './types';
import { Pill } from './Pill';

export const PillList: React.FC<PillListProps> = ({
  options,
  selected,
  onChange,
  variant = 'single',
  size = 'md',
  maxVisibleItems = 9,
  className = '',
  disabled = false,
  ...props
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Determine which options to show
  const visibleOptions = isExpanded ? options : options.slice(0, maxVisibleItems);
  const shouldShowExpandButton = options.length > maxVisibleItems;

  const containerClasses = `flex flex-wrap gap-2 ${className}`;

  return (
    <div className={containerClasses} role={variant === 'multiple' ? 'group' : 'radiogroup'} {...props}>
      {visibleOptions.map((option) => (
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
      {shouldShowExpandButton && (
        <Pill
          label={isExpanded ? 'Show less' : `+${options.length - maxVisibleItems} more`}
          selected={false}
          onClick={handleToggleExpand}
          variant="single"
          size={size}
          disabled={disabled}
          className="cursor-pointer"
        />
      )}
    </div>
  );
};