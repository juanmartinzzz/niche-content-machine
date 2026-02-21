# Next.js Application Setup Guide

This guide provides step-by-step instructions for creating a new Next.js application with authentication and file storage, deployed on Vercel, using Framer Motion, Lucide Icons, Supabase for authentication and database storage, and Supabase Storage for file uploads.

## Step 1: Create Next.js Application

```bash
npx create-next-app@latest my-nextjs-app --typescript --eslint --app --src-dir --import-alias "@/*"
cd my-nextjs-app
```

## Step 2: Install Required Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr framer-motion lucide-react
```

For development:
```bash
npm install -D @types/node
```

## Step 3: Set up Environment Variables

Copy the `.env.example` file to `.env` and fill in your values:

```bash
cp .env.example .env
```

Update the following variables in `.env` (these match Vercel's Supabase integration):

**Public Variables (safe to expose in client-side code):**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL (found in your Supabase dashboard under Settings > API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous/public key (found in your Supabase dashboard under Settings > API)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable key for client-side operations

**Private Variables (keep these secret, server-side only):**
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep this secret, only use server-side)
- `SUPABASE_SECRET_KEY`: Your Supabase secret key for server-side operations
- `SUPABASE_JWT_SECRET`: Your Supabase JWT secret for token verification
- `SUPABASE_URL`: Your Supabase project URL (same as NEXT_PUBLIC_SUPABASE_URL)
- `SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable key (same as NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)

**Database Connection Variables (for direct database access):**
- `POSTGRES_DATABASE`: Database name (typically "postgres")
- `POSTGRES_HOST`: Database host URL
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_PRISMA_URL`: Prisma-compatible database URL with connection pooling
- `POSTGRES_URL`: Database URL with connection pooling
- `POSTGRES_URL_NON_POOLING`: Database URL without connection pooling
- `POSTGRES_USER`: Database username (typically "postgres")

**Optional Configuration:**
- `SUPABASE_TABLE_PREFIX`: A prefix for your database tables (useful when multiple projects share the same database)
- `NODE_ENV`: Environment setting (development/production)

## Step 3.5: Set up Database Schema

Create a `data` directory under src and add the initial SQL schema:

```bash
mkdir -p src/data
```

Create `src/data/create-user-profiles.sql`:

```sql
-- User profiles table extending Supabase auth.users
-- Uses SUPABASE_TABLE_PREFIX environment variable for table naming
CREATE TABLE IF NOT EXISTS ${SUPABASE_TABLE_PREFIX}user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  location TEXT,
  company TEXT,
  job_title TEXT,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  is_profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Row Level Security (RLS) policies
ALTER TABLE ${SUPABASE_TABLE_PREFIX}user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON ${SUPABASE_TABLE_PREFIX}user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON ${SUPABASE_TABLE_PREFIX}user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON ${SUPABASE_TABLE_PREFIX}user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON ${SUPABASE_TABLE_PREFIX}user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON ${SUPABASE_TABLE_PREFIX}user_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at ON ${SUPABASE_TABLE_PREFIX}user_profiles(updated_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on profile changes
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON ${SUPABASE_TABLE_PREFIX}user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup (optional - can be called from auth triggers)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ${SUPABASE_TABLE_PREFIX}user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup (optional)
-- Uncomment the following lines if you want automatic profile creation:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 4: Set up Supabase Configuration

Create `src/lib/supabase.ts` for client-side Supabase client:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Create `src/lib/supabase-server.ts` for server-side Supabase client:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

Create `src/lib/supabase-admin.ts` for admin operations:

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

Create `src/lib/database.ts` for database operations:

```typescript
import { supabaseAdmin } from './supabase-admin'

export class DatabaseService {
  private tablePrefix: string

  constructor() {
    this.tablePrefix = process.env.SUPABASE_TABLE_PREFIX || ''
  }

  private getTableName(table: string): string {
    return `${this.tablePrefix}${table}`
  }

  // User profile methods
  async createUserProfile(userId: string, profileData: {
    email?: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    website?: string;
    location?: string;
    company?: string;
    job_title?: string;
  }) {
    const { data, error } = await supabaseAdmin
      .from(this.getTableName('user_profiles'))
      .insert([{
        id: userId,
        ...profileData,
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getUserProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from(this.getTableName('user_profiles'))
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  async updateUserProfile(userId: string, updates: Partial<{
    full_name: string;
    avatar_url: string;
    bio: string;
    website: string;
    location: string;
    company: string;
    job_title: string;
    timezone: string;
    preferences: Record<string, any>;
    is_profile_complete: boolean;
  }>) {
    const { data, error } = await supabaseAdmin
      .from(this.getTableName('user_profiles'))
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Legacy methods for backward compatibility (deprecated - use profile methods above)
  async createUser(userData: { email: string; name: string; role?: string }) {
    return this.createUserProfile(userData.email, {
      email: userData.email,
      full_name: userData.name,
    })
  }

  async getUserById(id: string) {
    return this.getUserProfile(id)
  }

  async getUserByEmail(email: string) {
    const { data, error } = await supabaseAdmin
      .from(this.getTableName('user_profiles'))
      .select('*')
      .eq('email', email)
      .single()

    if (error) throw error
    return data
  }
}

export const databaseService = new DatabaseService()
```

## Step 5: Create API Routes

Create `src/app/api/auth/callback/route.ts` for Supabase auth callback:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          },
        },
      }
    )
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // We can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
```

Create `src/app/api/auth/register/route.ts` for user registration:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { databaseService } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password, and name are required' }, { status: 400 })
    }

    // Check if user already exists in profiles
    try {
      await databaseService.getUserByEmail(email)
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    } catch (error) {
      // User doesn't exist, continue with registration
    }

    // Note: User profile will be created automatically via database trigger
    // or can be created manually after Supabase auth user creation

    return NextResponse.json({
      message: 'Registration initiated. Please check your email to confirm your account.',
      email
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Step 6: Create Authentication Pages

Create `src/app/auth/signin/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        alert(error.message)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Sign in error:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignInWithProvider = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        alert(error.message)
      }
    } catch (error) {
      console.error('OAuth sign in error:', error)
      alert('An unexpected error occurred')
    }
  }

  return (
    <div>
      <div>
        <div>
          <h2>
            Sign in to your account
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div>
            <div>
              <div>
                <div></div>
              </div>
              <div>
                <span>Or continue with</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => handleSignInWithProvider('google')}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSignInWithProvider('github')}
              >
                GitHub
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
```

Create `src/app/auth/signup/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      })

      if (error) {
        alert(error.message)
      } else {
        alert('Check your email for the confirmation link')
        router.push('/auth/signin')
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div>
        <div>
          <h2>
            Create your account
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <div>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

## Step 7: Set up Supabase Provider

Update `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { SupabaseProvider } from '@/components/SupabaseProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My Next.js App',
  description: 'Next.js app with Supabase authentication',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}
```

Create `src/components/SupabaseProvider.tsx`:

```tsx
'use client'

import { createClient } from '@/lib/supabase'
import { SessionContextProvider } from '@supabase/auth-helpers-react'

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  )
}
```

Update your `src/lib/supabase.ts` to export the client for the provider:

```typescript
import { createBrowserClient } from '@supabase/ssr'

let supabase: ReturnType<typeof createBrowserClient>

export function createClient() {
  // Create a singleton instance
  if (!supabase) {
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabase
}

export { supabase }
```

## Step 8: Create Protected Routes and Role-Based Access

Create `src/components/ProtectedRoute.tsx`:

```tsx
'use client'

import { useUser } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { databaseService } from '@/lib/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const user = useUser()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (user === undefined) return // Still loading

    if (!user) {
      router.push('/auth/signin')
      return
    }

    // Check user role if required (roles can be stored in preferences JSONB field)
    if (requiredRole) {
      const checkUserRole = async () => {
        try {
          const userProfile = await databaseService.getUserProfile(user.id)
          const userRole = userProfile.preferences?.role || 'user'
          if (userRole !== requiredRole) {
            router.push('/unauthorized')
          }
        } catch (error) {
          console.error('Error checking user role:', error)
          router.push('/unauthorized')
        }
      }
      checkUserRole()
    }
  }, [user, router, requiredRole])

  if (user === undefined) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```



## Step 9: Update Main Page

Update `src/app/page.tsx`:

```tsx
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
```
