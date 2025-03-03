import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    },
    allowedHosts: [
      '.loca.lt',
      'localhost',
    ]
  },
  define: {
    'process.env': {
      REACT_APP_JSON2VIDEO_API_KEY: JSON.stringify(process.env.REACT_APP_JSON2VIDEO_API_KEY)
    }
  }
})