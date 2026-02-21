import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { databaseService } from '@/lib/database'

export default async function Home() {
  const supabase = createClient()
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
    <main>
      <div>
        <div>
          <h1>
            Welcome{userProfile?.full_name ? `, ${userProfile.full_name}` : ''}!
          </h1>
          <p>
            Email: {user.email}
          </p>
          {userProfile ? (
            <div>
              {userProfile.bio && <p>Bio: {userProfile.bio}</p>}
              {userProfile.location && <p>Location: {userProfile.location}</p>}
              {userProfile.company && <p>Company: {userProfile.company}</p>}
              {userProfile.website && (
                <p>
                  Website: <a href={userProfile.website} target="_blank" rel="noopener noreferrer">
                    {userProfile.website}
                  </a>
                </p>
              )}
            </div>
          ) : (
            <div>
              <p>Please complete your profile to get started.</p>
              <button onClick={() => window.location.href = '/profile/setup'}>
                Set up Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
