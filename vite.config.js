import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import notes from './plugins/vite-plugin-notes.js'
import labsApi from './plugins/vite-plugin-labs-api.js'

// https://vite.dev/config/
export default defineConfig({
  // notes() serves src/content/notes as `virtual:notes` and drops
  // private notes from production builds (see the plugin header).
  // labsApi() serves /api/labs in `npm run dev` (Vercel runs
  // api/labs.js in production) — see LABS_GUIDE.md.
  plugins: [react(), notes(), labsApi()],
})
