import { createBrowserClient } from '@supabase/ssr'

let supabase: ReturnType<typeof createBrowserClient>
let configPromise: Promise<{ supabaseUrl: string; supabaseAnonKey: string }> | null = null

async function getSupabaseConfig() {
  if (!configPromise) {
    configPromise = fetch('/api/config').then(res => res.json())
  }
  return configPromise
}

export async function createClient() {
  // Create a singleton instance
  if (!supabase) {
    const config = await getSupabaseConfig()
    supabase = createBrowserClient(
      config.supabaseUrl,
      config.supabaseAnonKey
    )
  }
  return supabase
}

export { supabase }