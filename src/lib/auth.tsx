import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'

type AuthState = { user: User | null; session: Session | null; loading: boolean }
const AuthContext = createContext<AuthState>({ user: null, session: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  // Start as loading:true so the spinner shows until we know auth state
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true })

  useEffect(() => {
    // If Supabase isn't configured, stop loading immediately so the app renders
    if (!isSupabaseConfigured) {
      setState({ user: null, session: null, loading: false })
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, session, loading: false })
    }).catch(() => {
      setState({ user: null, session: null, loading: false })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setState({ user: session?.user ?? null, session, loading: false })
    })
    return () => subscription.unsubscribe()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export const signInWithEmail = (email: string, password: string) =>
  supabase.auth.signInWithPassword({ email, password })

export const signUpWithEmail = (email: string, password: string) =>
  supabase.auth.signUp({ email, password })

export const signInWithGoogle = () =>
  supabase.auth.signInWithOAuth({
    provider: 'google',
    // Use a safe fallback for SSR where window is not defined
    options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : '/' },
  })

export const signOut = () => supabase.auth.signOut()
