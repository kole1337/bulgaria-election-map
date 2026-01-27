import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/bulgaria-election-map/',
  build: {
    // Ignore warnings during build
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress all warnings
        return;
      }
    }
  }
})
