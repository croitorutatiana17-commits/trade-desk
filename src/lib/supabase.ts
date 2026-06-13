import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  // During SSR on Vercel the env vars must be present. Surface a clear error
  // rather than letting createClient throw an opaque internal exception.
  console.error(
    '[TradeDesk] Missing Supabase environment variables.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your Vercel project settings.',
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
)

export const isSupabaseConfigured =
  Boolean(supabaseUrl) && supabaseUrl !== 'https://placeholder.supabase.co'
