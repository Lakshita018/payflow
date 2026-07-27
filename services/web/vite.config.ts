import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Proxy API calls to the auth service in development so the browser avoids CORS.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Preserve percent-encoded characters (e.g. %40 for @) in path params.
        // Without this, some proxy versions re-encode or mis-handle special chars.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            if (req.url) proxyReq.path = req.url;
          });
        },
      },
    },
  },
});
