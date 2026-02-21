'use client'

import React, { useState } from 'react'
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/interaction'
import styles from './AppSidebar.module.css'

interface AppSidebarProps {
  userEmail?: string
  onSignOut?: () => void
  className?: string
  defaultCollapsed?: boolean
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  userEmail,
  onSignOut,
  className = '',
  defaultCollapsed = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''} ${className}`}>
        {/* Collapse Toggle Button */}
        <button
          className={styles.collapseButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Logo Section */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <span>NCM</span>
          </div>
          {!isCollapsed && (
            <span className={styles.logoText}>Niche Content Machine</span>
          )}
        </div>

        {/* User Actions */}
        {userEmail && (
          <div className={styles.userActions}>
            {!isCollapsed && (
              <span className={styles.userEmail}>{userEmail}</span>
            )}
            <div className={styles.signOutContainer}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSignOut}
                className={styles.signOutButton}
              >
                {!isCollapsed && 'Sign Out'}
                {isCollapsed && <X size={16} />}
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Menu Button */}
      <button
        className={styles.mobileToggle}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle sidebar"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </>
  )
}

// Keep AppBar as alias for backward compatibility
export const AppBar = AppSidebar