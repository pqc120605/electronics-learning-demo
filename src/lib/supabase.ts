import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { legacySupabaseEnabled } from './backendMode'

const supabaseUrl = legacySupabaseEnabled ? import.meta.env.VITE_SUPABASE_URL?.trim() : undefined
const supabaseAnonKey = legacySupabaseEnabled ? import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() : undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null
