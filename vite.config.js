import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import notes from './plugins/vite-plugin-notes.js'

// https://vite.dev/config/
export default defineConfig({
  // notes() serves src/content/notes as `virtual:notes` and drops
  // private notes from production builds (see the plugin header).
  plugins: [react(), notes()],
})
