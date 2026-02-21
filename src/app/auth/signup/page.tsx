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