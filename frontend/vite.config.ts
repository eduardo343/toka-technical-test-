import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/oauth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/.well-known': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/roles': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      },
      '/audits': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
      '/ai': {
        target: 'http://localhost:3004',
        changeOrigin: true,
      },
    },
  },
});
