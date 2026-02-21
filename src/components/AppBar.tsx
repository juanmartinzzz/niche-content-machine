'use client'

import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/interaction'
import styles from './AppBar.module.css'

interface AppBarProps {
  userEmail?: string
  onSignOut?: () => void
  className?: string
}

export const AppBar: React.FC<AppBarProps> = ({
  userEmail,
  onSignOut,
  className = ''
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut()
    } else {
      window.location.href = '/auth/signout'
    }
  }

  return (
    <nav className={`${styles.nav} ${className}`}>
      <div className="container">
        <div className={styles.navContent}>
          {/* Logo Section */}
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <span>NCM</span>
            </div>
            <span className={styles.logoText}>Niche Content Machine</span>
          </div>

          {/* Desktop User Actions */}
          <div className={styles.desktopActions}>
            {userEmail && (
              <>
                <span className={styles.userEmail}>{userEmail}</span>
                <div className={styles.signOutContainer}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className={styles.mobileActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={styles.mobileMenuButton}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenu}>
            {userEmail && (
              <div className={styles.mobileUserInfo}>
                <span className={styles.mobileUserEmail}>{userEmail}</span>
                <div className={styles.mobileSignOutContainer}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      handleSignOut()
                      setIsMobileMenuOpen(false)
                    }}
                    className={styles.mobileSignOutButton}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}