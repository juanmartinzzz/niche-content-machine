import { ReactNode, HTMLInputTypeAttribute } from 'react';

// Common size types based on the style guide
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Common props shared across multiple components
export interface CommonProps {
  className?: string;
  disabled?: boolean;
}

// Button component types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonType = 'button' | 'submit' | 'reset';

export interface ButtonProps extends CommonProps {
  variant?: ButtonVariant;
  size?: ComponentSize;
  onClick?: () => void;
  children: ReactNode;
  type?: ButtonType;
}

// Input component types
export interface InputProps extends CommonProps {
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  label?: string;
  required?: boolean;
  size?: ComponentSize;
}

// Textarea component types
export interface TextareaProps extends InputProps {
  rows?: number;
  autoResize?: boolean;
}

// Pill component types
export type PillVariant = 'single' | 'multiple';

export interface PillProps extends CommonProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  variant?: PillVariant;
  size?: ComponentSize;
}

// PillList component types
export interface PillOption {
  id: string;
  label: string;
}

export interface PillListProps extends CommonProps {
  options: PillOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  variant?: PillVariant;
  size?: ComponentSize;
}

// Drawer component types
export type DrawerPosition = 'left' | 'right' | 'bottom';

export interface DrawerProps extends CommonProps {
  isOpen: boolean;
  onClose: () => void;
  position?: DrawerPosition;
  shouldOpenWithBackdrop?: boolean;
  widthClass?: string;
  children: ReactNode;
}