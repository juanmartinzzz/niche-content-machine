'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DrawerProps, DrawerPosition } from './types';
import styles from './Drawer.module.css';

interface DrawerContentProps extends Omit<DrawerProps, 'isOpen'> {
  onClose: () => void;
}

const DrawerContent: React.FC<DrawerContentProps> = ({
  position = 'right',
  widthClass = 'w-80',
  children,
  onClose,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Handle click outside is handled by backdrop onClick

  // Animation variants based on position
  const getVariants = (position: DrawerPosition) => {
    const baseVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
    };

    switch (position) {
      case 'left':
        return {
          ...baseVariants,
          hidden: { ...baseVariants.hidden, x: '-100%' },
          visible: { ...baseVariants.visible, x: 0 },
        };
      case 'right':
        return {
          ...baseVariants,
          hidden: { ...baseVariants.hidden, x: '100%' },
          visible: { ...baseVariants.visible, x: 0 },
        };
      case 'bottom':
        return {
          ...baseVariants,
          hidden: { ...baseVariants.hidden, y: '100%' },
          visible: { ...baseVariants.visible, y: 0 },
        };
      default:
        return baseVariants;
    }
  };

  const variants = getVariants(position);
  const positionClasses = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    bottom: 'bottom-0 left-0 right-0 w-full',
  };

  return (
    <motion.div
      ref={drawerRef}
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={variants}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className={`${styles.content} ${styles[position]}`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className={styles.closeButton}
        aria-label="Close drawer"
      >
        <X size={16} />
      </button>

      {/* Content */}
      <div className={styles.contentArea}>
        {children}
      </div>
    </motion.div>
  );
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  position = 'right',
  shouldOpenWithBackdrop = true,
  widthClass = 'w-80',
  children,
  className = '',
  disabled = false,
  ...props
}) => {
  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (disabled) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          {shouldOpenWithBackdrop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={styles.overlay}
              onClick={onClose}
            />
          )}

          {/* Drawer */}
          <DrawerContent
            position={position}
            widthClass={widthClass}
            onClose={onClose}
            className={className}
            {...props}
          >
            {children}
          </DrawerContent>
        </>
      )}
    </AnimatePresence>
  );
};