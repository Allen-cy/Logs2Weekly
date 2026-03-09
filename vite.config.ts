import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import electron from 'vite-plugin-electron/simple';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    // 为 Electron 生产打包使用相对路径，普通 Web 开发使用绝对路径防止刷新 404
    base: process.env.VITE_ELECTRON || mode === 'production' ? './' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    plugins: [
      react(),
      ...(process.env.VITE_ELECTRON ? [electron({
        main: {
          entry: 'electron/main.ts',
        },
        preload: {
          input: 'electron/preload.ts',
        },
      })] : []),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Logs2Weekly',
          short_name: 'Logs2Weekly',
          description: 'AI Productivity Hub',
          theme_color: '#3b82f6',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
