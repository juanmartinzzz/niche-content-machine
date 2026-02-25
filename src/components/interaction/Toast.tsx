'use client'

import React, { useEffect } from 'react'
import { ToastProps } from './types'
import { X } from 'lucide-react'
import styles from './Toast.module.css'

export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  variant = 'info',
  duration = 5000,
  onClose
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  return (
    <div className={`${styles.toast} ${styles[variant]}`}>
      <div className={styles.content}>
        <span className={styles.message}>{message}</span>
        <button
          onClick={() => onClose?.(id)}
          className={styles.closeButton}
          aria-label="Close toast"
        >
          <X size={16} />
        </button>
      </div>
      {duration > 0 && <div className={styles.progressBar} />}
    </div>
  )
}