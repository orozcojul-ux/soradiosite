
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqsqwoqeqfcpkbvhasyd.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_u1oFzBaa42YP1OIYKYddXg_ZeBnAWYQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  email: string
  full_name: string
  phone?: string
  avatar_url?: string
  bio?: string
  is_admin: boolean
  created_at: string
  updated_at: string
}
