import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173
    },
    define: {
      // Polyfill process.env.API_KEY to read from window.env (runtime) or fallback to build env (dev)
      // We use a string for the value so it compiles to code access, not a string literal
      'process.env.API_KEY': `(window.env?.API_KEY || "${env.API_KEY || ''}")`,
      
      // Polyfill other config vars
      'process.env.VITE_DEFAULT_WEBHOOK_URL': JSON.stringify(env.VITE_DEFAULT_WEBHOOK_URL),
      'process.env.VITE_DEFAULT_STREAM_URL': JSON.stringify(env.VITE_DEFAULT_STREAM_URL),
      
      // Polyfill the process.env object so destructuring or general access doesn't crash
      'process.env': {}
    }
  };
});