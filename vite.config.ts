import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: { port: 3000, allowedHosts: true },
  build: {
    rollupOptions: {
      // Exclude Deno-only Supabase Edge Functions from the Node.js/Vite build
      external: [],
    },
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    tanstackStart({
      routes: {
        routeFileIgnorePattern: '(\\.\\.tsx$|settings\\.tsx$)',
      },
    }),
    viteReact(),
  ],
})