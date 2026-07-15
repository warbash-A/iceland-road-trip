import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-service-worker',
      writeBundle() {
        try {
          copyFileSync('public/service-worker.js', 'dist/service-worker.js')
          copyFileSync('public/sw-register.js', 'dist/sw-register.js')
        } catch (err) {
          // Service worker files don't exist yet, will be added in later tasks
          console.warn('Service worker files not found, skipping copy')
        }
      }
    }
  ],
  base: '/iceland-road-trip/',
})
