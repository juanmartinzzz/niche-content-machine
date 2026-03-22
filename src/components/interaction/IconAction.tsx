'use client'

import React, { forwardRef } from 'react'
import { LucideProps } from 'lucide-react'
import { ComponentType } from 'react'
import { ButtonVariant, ComponentSize } from './types'
import styles from './IconAction.module.css'

interface IconActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ComponentType<LucideProps>
  variant?: ButtonVariant
  size?: ComponentSize
  ariaLabel: string
}

const iconSizeByButtonSize: Record<ComponentSize, number> = {
  xs: 14,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20
}

export const IconAction = forwardRef<HTMLButtonElement, IconActionProps>(
  ({
    icon: Icon,
    variant = 'ghost',
    size = 'md',
    ariaLabel,
    className = '',
    onClick,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={`${styles.base} ${styles[variant]} ${styles[size]} ${className}`}
        aria-label={ariaLabel}
        {...props}
      >
        <Icon size={iconSizeByButtonSize[size]} aria-hidden="true" />
      </button>
    )
  }
)

IconAction.displayName = 'IconAction'
