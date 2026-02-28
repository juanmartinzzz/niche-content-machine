'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronLeft, ChevronRight, Bot, MessageCircle, TestTube, Workflow, Settings } from 'lucide-react'
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
        <Button
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={styles.collapseButton}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </Button>

        {/* Logo Section */}
        <div className={styles.logo}>
          {!isCollapsed && (
            <span className={styles.logoText}>Niche Content Machine</span>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className={styles.navigation}>
          <Link href="/results-v1">
            <Button
              variant="ghost"
              size="sm"
              className={styles.navItem}
            >
              <TestTube size={20} />
              {!isCollapsed && <span className={styles.navText}>Results V1</span>}
            </Button>
          </Link>
          <div className={styles.navDivider} />
          {!isCollapsed && <div className={styles.navSection}>Settings</div>}
          <Link href="/runbooks">
            <Button
              variant="ghost"
              size="sm"
              className={styles.navItem}
            >
              <Workflow size={20} />
              {!isCollapsed && <span className={styles.navText}>Runbooks</span>}
            </Button>
          </Link>
          <Link href="/prompt-templates">
            <Button
              variant="ghost"
              size="sm"
              className={styles.navItem}
            >
              <MessageCircle size={20} />
              {!isCollapsed && <span className={styles.navText}>Prompt Templates</span>}
            </Button>
          </Link>
          <Link href="/llm-models-config">
            <Button
              variant="ghost"
              size="sm"
              className={styles.navItem}
            >
              <Bot size={20} />
              {!isCollapsed && <span className={styles.navText}>Models & Endpoints</span>}
            </Button>
          </Link>
          <div className={styles.navDivider} />
          {!isCollapsed && <div className={styles.navSection}>Integrations</div>}
          <Link href="/integrations/manage">
            <Button
              variant="ghost"
              size="sm"
              className={styles.navItem}
            >
              <Settings size={20} />
              {!isCollapsed && <span className={styles.navText}>Manage</span>}
            </Button>
          </Link>
          <Link href="/integrations/telegram">
            <Button
              variant="ghost"
              size="sm"
              className={styles.navItem}
            >
              <MessageCircle size={20} />
              {!isCollapsed && <span className={styles.navText}>Telegram Chats</span>}
            </Button>
          </Link>
        </nav>

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