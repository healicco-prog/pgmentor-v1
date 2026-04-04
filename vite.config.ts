import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    // SECURITY: Gemini API key is no longer bundled into the client.
    // All AI calls should go through the backend proxy at /api/ai/*
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // In Antigravity/IDX, clientPort 443 routes WebSocket through the HTTPS proxy.
      hmr: process.env.DISABLE_HMR === 'true'
        ? false
        : {
            ...(process.env.IDX_CHANNEL ? { clientPort: 443 } : {}),
          },
    },
  };
});
