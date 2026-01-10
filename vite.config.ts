import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');

  // In production (Docker), we want to read from the runtime injected global variable window.GEMINI_KEY
  // In development, we want to read from the .env file loaded by Vite
  const apiKeyReplacement = mode === 'production' 
    ? 'window.GEMINI_KEY' 
    : JSON.stringify(env.API_KEY || env.VITE_API_KEY || '');

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      // Dev Proxy to match Nginx configuration
      proxy: {
        '/api/frigate': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/frigate/, '/api')
        }
      }
    },
    define: {
      // Safely replace process.env.API_KEY with the correct value for the environment
      'process.env.API_KEY': apiKeyReplacement,

      // These are safe static strings from build-time env
      'process.env.VITE_DEFAULT_WEBHOOK_URL': JSON.stringify(env.VITE_DEFAULT_WEBHOOK_URL),
      'process.env.VITE_DEFAULT_STREAM_URL': JSON.stringify(env.VITE_DEFAULT_STREAM_URL),
    },
    // Fix for mqtt library in browser
    resolve: {
        alias: {
            // Force browser build if available
            // 'mqtt': 'mqtt/dist/mqtt.min.js', 
        }
    }
  };
});