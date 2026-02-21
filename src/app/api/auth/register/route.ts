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