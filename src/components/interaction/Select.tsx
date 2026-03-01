'use client'

import React, { forwardRef, useState, useEffect, useRef, useId } from 'react';
import { SelectProps, SelectOption, ComponentSize } from './types';
import styles from './Select.module.css';
import { ChevronDown, X } from 'lucide-react';

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    label,
    required = false,
    error,
    size = 'md',
    numberOptionsToShowSearch = 9,
    className = '',
    disabled = false,
    ...props
  }, ref) => {
    const selectId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const hasError = Boolean(error);
    const showSearch = options.length > numberOptionsToShowSearch;

    // Filter options based on search term (case-insensitive)
    const filteredOptions = showSearch && searchTerm
      ? options.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;


    // Find selected option
    const selectedOption = options.find(option => option.id === value);

    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle keyboard navigation
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (!isOpen) return;

        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setHighlightedIndex(prev =>
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
            break;
          case 'ArrowUp':
            event.preventDefault();
            setHighlightedIndex(prev =>
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
            break;
          case 'Enter':
            event.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
              handleSelect(filteredOptions[highlightedIndex].id);
            }
            break;
          case 'Escape':
            event.preventDefault();
            setIsOpen(false);
            setSearchTerm('');
            setHighlightedIndex(-1);
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, highlightedIndex, filteredOptions]);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && showSearch && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [isOpen, showSearch]);

    const handleSelect = (optionId: string) => {
      if (onChange) {
        onChange(optionId);
      }
      setIsOpen(false);
      setSearchTerm('');
      setHighlightedIndex(-1);
    };

    const handleToggle = () => {
      if (disabled) return;
      setIsOpen(!isOpen);
      setSearchTerm('');
      setHighlightedIndex(-1);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(event.target.value);
      setHighlightedIndex(-1);
    };

    const handleClear = (event: React.MouseEvent) => {
      event.stopPropagation();
      if (onChange) {
        onChange('');
      }
    };

    return (
      <div ref={containerRef} className={styles.container}>
        {label && (
          <label
            htmlFor={selectId}
            className={styles.label}
          >
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <div className={styles.triggerContainer}>
          <button
            ref={ref}
            id={selectId}
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={`${styles.trigger} ${styles[size]} ${hasError ? styles.error : ''} ${className}`}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-describedby={hasError ? `${selectId}-error` : undefined}
            aria-invalid={hasError}
            {...props}
          >
            <span className={styles.triggerText}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </button>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearButton}
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          />
        </div>

        {isOpen && (
          <div className={styles.dropdown}>
            {showSearch && (
              <div className={styles.searchContainer}>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={styles.searchInput}
                />
              </div>
            )}
            <div className={styles.optionsContainer}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelect(option.id)}
                    className={`${styles.option} ${highlightedIndex === index ? styles.highlighted : ''} ${option.id === value ? styles.selected : ''}`}
                    role="option"
                    aria-selected={option.id === value}
                  >
                    {option.label}
                  </button>
                ))
              ) : (
                <div className={styles.noOptions}>
                  No options found
                </div>
              )}
            </div>
          </div>
        )}

        {hasError && (
          <p
            id={`${selectId}-error`}
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

Select.displayName = 'Select';