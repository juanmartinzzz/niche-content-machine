'use client'

import React, { forwardRef, useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { ExpandableTableProps } from './types';
import styles from './ExpandableTable.module.css';

export const ExpandableTable = forwardRef<HTMLDivElement, ExpandableTableProps>(
  <T extends Record<string, any>>({
    data,
    columns,
    expandableContent,
    getRowKey,
    className = '',
    emptyMessage = 'No data available',
    size = 'md',
    ...props
  }: ExpandableTableProps<T>, ref) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const toggleRowExpansion = (rowKey: string) => {
      const newExpanded = new Set(expandedRows);
      if (newExpanded.has(rowKey)) {
        newExpanded.delete(rowKey);
      } else {
        newExpanded.add(rowKey);
      }
      setExpandedRows(newExpanded);
    };

    const handleKeyDown = (event: React.KeyboardEvent, rowKey: string) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleRowExpansion(rowKey);
      }
    };

    const sizeClass = styles[size];

    return (
      <div
        ref={ref}
        className={`${styles.container} ${sizeClass} ${className}`}
        {...props}
      >
        <table className={styles.table} role="table">
          <thead className={styles.header}>
            <tr role="row">
              {expandableContent && (
                <th className={styles.expandColumn} aria-label="Expand row">
                  <span className={styles.visuallyHidden}>Expand</span>
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={String(column.key) || `col-${index}`}
                  className={`${styles.headerCell} ${column.className || ''}`}
                  role="columnheader"
                  scope="col"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.body}>
            {data.length === 0 ? (
              <tr role="row">
                <td
                  colSpan={columns.length + (expandableContent ? 1 : 0)}
                  className={styles.emptyCell}
                  role="cell"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowKey = getRowKey(row, rowIndex);
                const isExpanded = expandedRows.has(rowKey);
                const hasExpandableContent = expandableContent && expandableContent(row, rowIndex);

                return (
                  <React.Fragment key={rowKey}>
                    <tr
                      className={`${styles.row} ${isExpanded ? styles.expanded : ''}`}
                      role="row"
                    >
                      {expandableContent && (
                        <td className={styles.expandCell} role="cell">
                          {hasExpandableContent ? (
                            <button
                              type="button"
                              className={styles.expandButton}
                              onClick={() => toggleRowExpansion(rowKey)}
                              onKeyDown={(e) => handleKeyDown(e, rowKey)}
                              aria-expanded={isExpanded}
                              aria-label={isExpanded ? 'Collapse row' : 'Expand row'}
                            >
                              {isExpanded ? (
                                <ChevronDown className={styles.expandIcon} size={16} />
                              ) : (
                                <ChevronRight className={styles.expandIcon} size={16} />
                              )}
                            </button>
                          ) : (
                            <div className={styles.expandPlaceholder} />
                          )}
                        </td>
                      )}
                      {columns.map((column, colIndex) => (
                        <td
                          key={String(column.key) || `cell-${rowIndex}-${colIndex}`}
                          className={`${styles.cell} ${column.className || ''}`}
                          role="cell"
                        >
                          {column.render ? column.render(row, rowIndex) : row[column.key]}
                        </td>
                      ))}
                    </tr>
                    {isExpanded && hasExpandableContent && (
                      <tr className={styles.expandedContentRow} role="row">
                        <td
                          colSpan={columns.length + (expandableContent ? 1 : 0)}
                          className={styles.expandedContentCell}
                          role="cell"
                        >
                          <div className={styles.expandedContent}>
                            {expandableContent(row, rowIndex)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }
);

ExpandableTable.displayName = 'ExpandableTable';