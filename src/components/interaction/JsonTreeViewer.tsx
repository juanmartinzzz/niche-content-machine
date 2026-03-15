'use client';

import React, { forwardRef, useState, useEffect, useRef, useId } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { JsonTreeViewerProps } from './types';
import styles from './JsonTreeViewer.module.css';

interface TreeNode {
  key: string;
  children?: TreeNode[];
  isArray?: boolean;
}

export const JsonTreeViewer = forwardRef<HTMLTextAreaElement, JsonTreeViewerProps>(
  ({
    placeholder = 'Enter JSON...',
    value,
    onChange,
    error: externalError,
    label,
    required = false,
    rows = 2,
    className = '',
    disabled = false,
    ...props
  }, ref) => {
    const [jsonError, setJsonError] = useState<string>('');
    const [parsedJson, setParsedJson] = useState<TreeNode[]>([]);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLTextAreaElement>) || textareaRef;
    const textareaId = useId();
    const errorId = useId();

    const parseJsonToTree = (jsonString: string): TreeNode[] => {
      if (!jsonString.trim()) return [];

      try {
        const parsed = JSON.parse(jsonString);
        setJsonError('');

        const convertToTree = (obj: any, prefix = 'root'): TreeNode[] => {
          if (obj === null || typeof obj !== 'object') return [];

          if (Array.isArray(obj)) {
            return obj.map((item, index) => ({
              key: `[${index}]`,
              children: convertToTree(item, `${prefix}[${index}]`),
              isArray: true
            }));
          }

          return Object.keys(obj).map(key => ({
            key,
            children: convertToTree(obj[key], `${prefix}.${key}`)
          }));
        };

        return convertToTree(parsed);
      } catch (e) {
        setJsonError('Invalid JSON');
        return [];
      }
    };

    useEffect(() => {
      if (value) {
        const tree = parseJsonToTree(value);
        setParsedJson(tree);
      } else {
        setParsedJson([]);
        setJsonError('');
      }
    }, [value]);

    const toggleNode = (nodePath: string) => {
      const newExpanded = new Set(expandedNodes);
      if (newExpanded.has(nodePath)) {
        newExpanded.delete(nodePath);
      } else {
        newExpanded.add(nodePath);
      }
      setExpandedNodes(newExpanded);
    };

    const renderTreeNode = (node: TreeNode, path: string, depth = 0): React.ReactNode => {
      const isExpanded = expandedNodes.has(path);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={path} className={styles.treeNode} style={{ paddingLeft: `${depth * 16}px` }}>
          <div className={styles.nodeContent}>
            {hasChildren ? (
              <button
                type="button"
                className={styles.expandButton}
                onClick={() => toggleNode(path)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <ChevronDown className={styles.chevron} size={14} />
                ) : (
                  <ChevronRight className={styles.chevron} size={14} />
                )}
              </button>
            ) : (
              <div className={styles.placeholder} />
            )}
            <span className={styles.nodeKey}>{node.key}</span>
          </div>
          {hasChildren && isExpanded && (
            <div className={styles.children}>
              {node.children!.map((child, index) =>
                renderTreeNode(child, `${path}.${index}`, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    };

    const hasError = externalError || jsonError;

    return (
      <div className={`${styles.container} ${className}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className={styles.label}
          >
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}
        <textarea
          ref={combinedRef}
          id={textareaId}
          placeholder={placeholder}
          value={value}
          rows={rows}
          onChange={(event) => {
            if (onChange) {
              onChange(event.target.value);
            }
          }}
          disabled={disabled}
          required={required}
          className={`${styles.textarea} ${hasError ? styles.error : ''}`}
          aria-describedby={hasError ? errorId : undefined}
          aria-invalid={!!hasError}
          {...props}
        />
        {hasError && (
          <p
            id={errorId}
            className={styles.errorMessage}
            role="alert"
          >
            {hasError}
          </p>
        )}
        {parsedJson.length > 0 && (
          <div className={styles.treeContainer}>
            <div className={styles.tree}>
              {parsedJson.map((node, index) =>
                renderTreeNode(node, `root.${index}`)
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

JsonTreeViewer.displayName = 'JsonTreeViewer';