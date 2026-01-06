import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173
    },
    define: {
      // We do NOT define process.env.API_KEY here because it requires runtime evaluation 
      // of window.env, which esbuild's define feature does not support.
      // Instead, we rely on the polyfill in index.html.

      // These are safe static strings from build-time env
      'process.env.VITE_DEFAULT_WEBHOOK_URL': JSON.stringify(env.VITE_DEFAULT_WEBHOOK_URL),
      'process.env.VITE_DEFAULT_STREAM_URL': JSON.stringify(env.VITE_DEFAULT_STREAM_URL),
      
      // We don't define 'process.env': {} here to avoid overwriting our index.html polyfill
    }
  };
});