import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { databaseService } from '@/lib/database'
import { Button } from '@/components/interaction'
import styles from './page.module.css'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user profile data from database
  let userProfile = null
  try {
    userProfile = await databaseService.getUserProfile(user.id)
  } catch (error) {
    // Profile doesn't exist yet, user needs to complete their profile
    userProfile = null
  }

  return (
    <div className={styles.container}>
      {/* Clean Navigation (see guideline-1-style.md) */}
      <nav className={styles.nav}>
        <div className="container">
          <div className={styles.navContent}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <span>NCM</span>
              </div>
              <span className={styles.logoText}>Niche Content Machine</span>
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userEmail}>{user.email}</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.href = '/auth/signout'}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Clean Main Content (see guideline-1-style.md) */}
      <main className="container">
        <div className={styles.main}>
          {/* Clean Hero Section (see guideline-1-style.md) */}
          <div className={`${styles.hero} ${styles.fadeIn}`}>
            <h1 className={styles.heroTitle}>
              Welcome{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}!
            </h1>
            <p className={styles.heroSubtitle}>
              Your personal content creation dashboard
            </p>
          </div>

          {/* Clean Profile Section (see guideline-1-style.md) */}
          {userProfile ? (
            <div className={styles.slideIn}>
              <h2 className={styles.heroTitle}>Your Profile</h2>

              <div className={styles.profileGrid}>
                {/* Clean Basic Info Card (see guideline-1-style.md) */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Basic Information</h3>
                  <div className={styles.cardContent}>
                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Email</span>
                      <p className={styles.fieldValue}>{user.email}</p>
                    </div>
                    {userProfile.location && (
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Location</span>
                        <p className={styles.fieldValue}>{userProfile.location}</p>
                      </div>
                    )}
                    {userProfile.company && (
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Company</span>
                        <p className={styles.fieldValue}>{userProfile.company}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clean Additional Info Card (see guideline-1-style.md) */}
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>About You</h3>
                  <div className={styles.cardContent}>
                    {userProfile.bio && (
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Bio</span>
                        <p className={styles.fieldValue}>{userProfile.bio}</p>
                      </div>
                    )}
                    {userProfile.website && (
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Website</span>
                        <a
                          href={userProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.link}
                        >
                          {userProfile.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
            </div>

              {/* Clean Action Buttons (see guideline-1-style.md) */}
              <div className={styles.actions}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => window.location.href = '/profile/edit'}
                >
                  Edit Profile
                </Button>
              </div>
          </div>
          ) : (
            /* Clean Setup Profile Section (see guideline-1-style.md) */
            <div className={styles.slideIn}>
              <div className={styles.setupCard}>
                <div>
                  <div className={styles.setupIcon}>
                    <span>👤</span>
                  </div>
                  <h2 className={styles.setupTitle}>Complete Your Profile</h2>
                  <p className={styles.setupDescription}>
                    Set up your profile to unlock all features and personalize your experience.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => window.location.href = '/profile/setup'}
                >
                  Set up Profile
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
