import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: { port: 3000, allowedHosts: true },

  // Statically replace process.env.* at build time so unprefixed env vars
  // (set in Vercel without VITE_ prefix) are inlined into the client bundle.
  // This makes both VITE_SUPABASE_URL and SUPABASE_URL work regardless of
  // which one is set in the deployment environment.
  define: {
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL ?? ''),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY ?? ''),
    'process.env.APP_URL': JSON.stringify(process.env.APP_URL ?? ''),
  },

  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart({
      // Disable SSR — this app is fully client-side (Supabase auth + queries).
      // SSR caused HTTPError because Supabase's getSession() makes real
      // network requests during server-side render that Nitro's ofetch
      // intercepts and throws as unhandled HTTPError.
      spa: { enabled: true },
      routes: {
        routeFileIgnorePattern: '(\\.\\.tsx$|settings\\.tsx$)',
      },
    }),
    nitro(),
    viteReact(),
  ],
})
