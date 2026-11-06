import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
  server: {
    port: 3000,
    strictPort: true,
    // Vite preview также наследует server.proxy.
    proxy: {
      '^/api(?:/|$)': {
        target: 'http://127.0.0.1:8080',
      },
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ogl': ['ogl'],
          'vendor-icons': ['lucide-react'],
          'vendor-gsap': ['gsap'],
        },
      },
    },
  },
})
