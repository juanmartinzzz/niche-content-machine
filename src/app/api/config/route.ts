import { NextResponse } from 'next/server'

export async function GET() {
  // Return public Supabase configuration
  // These values are safe to expose to the client since they're meant for public use
  return NextResponse.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  })
}