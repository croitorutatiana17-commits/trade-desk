import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsConfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  server: { port: 3000 },
  define: {
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL ?? ''),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY ?? ''),
    'process.env.APP_URL': JSON.stringify(process.env.APP_URL ?? ''),
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    viteReact(),
  ],
})
