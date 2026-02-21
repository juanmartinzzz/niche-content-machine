import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DrawerProps, DrawerPosition } from './types';

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
      className={`fixed z-50 bg-white shadow-xl ${positionClasses[position]} ${widthClass} ${position === 'bottom' ? 'max-h-[80vh]' : ''}`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
        aria-label="Close drawer"
      >
        <X size={20} />
      </button>

      {/* Content */}
      <div className="p-6 pt-12 h-full overflow-y-auto">
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
              className="fixed inset-0 z-40 bg-black bg-opacity-50"
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