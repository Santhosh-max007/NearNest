import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://lustrous-marshmallow-c0585f.netlify.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});