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