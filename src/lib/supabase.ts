import { createClient } from '@supabase/supabase-js'

// In local dev, Vite exposes VITE_SUPABASE_URL via import.meta.env.
// On Vercel (SSR + SPA), use unprefixed SUPABASE_URL via process.env.
const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  process.env.SUPABASE_URL

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[TradeDesk] Missing Supabase environment variables.\n' +
    'Add SUPABASE_URL and SUPABASE_ANON_KEY to your Vercel project settings.',
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
)

export const isSupabaseConfigured =
  Boolean(supabaseUrl) && supabaseUrl !== 'https://placeholder.supabase.co'
