import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    // Avoid resolving localhost to ::1 on machines where IPv6 loopback binds are restricted.
    host: '127.0.0.1',
    // Windows reserves port 5173 on this machine (TCP exclusion range 5141-5440).
    port: 5500,
    strictPort: true,
    proxy: {
      // Laravel API → http://127.0.0.1:8000
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})


