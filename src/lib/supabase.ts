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