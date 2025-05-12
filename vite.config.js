import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['5ddd-45-167-142-116.ngrok-free.app'], // <--- Adicione essa linha
    proxy: {
      // Configuração do proxy para redirecionar chamadas API para o backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
