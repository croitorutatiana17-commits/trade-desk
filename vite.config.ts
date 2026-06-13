import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'

export default defineConfig({
  server: { port: 3000, allowedHosts: true },
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
