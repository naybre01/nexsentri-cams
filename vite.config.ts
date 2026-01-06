import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    port: 5173
  },
  define: {
    'process.env': {} // simple polyfill for process.env access
  }
});