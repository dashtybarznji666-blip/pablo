import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      strict: false,
    },
  },
  build: {
    sourcemap: false, // Disable source maps in production to avoid parsing errors
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-alert-dialog', '@radix-ui/react-label', '@radix-ui/react-slot', '@radix-ui/react-toast'],
          i18n: ['i18next', 'react-i18next'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  // Suppress source map warnings in development
  esbuild: {
    sourcemap: false,
  },
})


