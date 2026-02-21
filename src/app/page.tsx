import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { databaseService } from '@/lib/database'
import { DashboardButton } from '@/components/DashboardButton'
import { EditProfileButton } from '@/components/EditProfileButton'
import { SetupProfileButton } from '@/components/SetupProfileButton'
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
      {/* Clean Main Content (see guideline-1-style.md) */}
      <main className="container">
        <div className={styles.main}>
          {/* Clean Header Section */}
          <div className={`${styles.header} ${styles.fadeIn}`}>
            <h1 className={styles.headerTitle}>
              {userProfile?.full_name}
            </h1>
          </div>

          {/* Dashboard Content */}
          {userProfile ? (
            <div className={styles.dashboard}>
              {/* Quick Stats Overview */}
              <div className={`${styles.statsGrid} ${styles.slideIn}`}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}></div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statNumber}>0</h3>
                    <p className={styles.statLabel}>Projects</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}></div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statNumber}>0</h3>
                    <p className={styles.statLabel}>Content Pieces</p>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}></div>
                  <div className={styles.statContent}>
                    <h3 className={styles.statNumber}>100%</h3>
                    <p className={styles.statLabel}>Profile Complete</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={`${styles.actionsSection} ${styles.slideIn}`}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <div className={styles.actionButtons}>
                  <DashboardButton />
                  <EditProfileButton />
                </div>
              </div>

              {/* Profile Overview */}
              <div className={`${styles.profileOverview} ${styles.slideIn}`}>
                <h2 className={styles.sectionTitle}>Profile Overview</h2>
                <div className={styles.profileGrid}>
                  <div className={styles.infoCard}>
                    <h3 className={styles.cardTitle}>Contact</h3>
                    <div className={styles.cardContent}>
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Email</span>
                        <p className={styles.fieldValue}>{user.email}</p>
                      </div>
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

                  <div className={styles.infoCard}>
                    <h3 className={styles.cardTitle}>Details</h3>
                    <div className={styles.cardContent}>
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
                      {userProfile.bio && (
                        <div className={styles.field}>
                          <span className={styles.fieldLabel}>Bio</span>
                          <p className={styles.fieldValue}>{userProfile.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Setup Profile Section */
            <div className={`${styles.setupSection} ${styles.slideIn}`}>
              <p className={styles.setupDescription}>
                Complete your profile to unlock powerful content creation tools and personalized features.
              </p>
              <SetupProfileButton />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
