import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    // Run `ANALYZE=true npm run build` to generate dist/stats.html
    ...(process.env.ANALYZE ? [visualizer({ open: true, filename: 'dist/stats.html' })] : []),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
