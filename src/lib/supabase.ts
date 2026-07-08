import { createClient } from '@supabase/supabase-js'

// In local dev, Vite exposes VITE_SUPABASE_URL via import.meta.env.
// On Vercel (SSR + SPA), use unprefixed SUPABASE_URL via process.env.
const rawSupabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  process.env.SUPABASE_URL

export const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  process.env.SUPABASE_ANON_KEY

export function normalizeSupabaseProjectUrl(value: string | undefined) {
  if (!value) return undefined

  try {
    return new URL(value).origin
  } catch {
    return value.replace(/\/+$/, '')
  }
}

export const supabaseProjectUrl = normalizeSupabaseProjectUrl(rawSupabaseUrl)

if (!supabaseProjectUrl || !supabaseAnonKey) {
  console.error(
    '[TradeDesk] Missing Supabase environment variables.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY locally, and SUPABASE_URL and SUPABASE_ANON_KEY in Vercel.',
  )
}

export const supabase = createClient(
  supabaseProjectUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
)

export const isSupabaseConfigured =
  Boolean(supabaseProjectUrl) && supabaseProjectUrl !== 'https://placeholder.supabase.co'
