import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tsconfigPaths()
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: [
        { find: '@/components', replacement: path.resolve(__dirname, 'components') },
        { find: '@/lib', replacement: path.resolve(__dirname, 'lib') },
        { find: '@/features', replacement: path.resolve(__dirname, 'src/features') },
        { find: '@/shared', replacement: path.resolve(__dirname, 'src/shared') },
        { find: '@/core', replacement: path.resolve(__dirname, 'src/core') },
        { find: '@/infrastructure', replacement: path.resolve(__dirname, 'src/infrastructure') },

        { find: '@admin', replacement: path.resolve(__dirname, 'modules/admin') },
        { find: '@customer', replacement: path.resolve(__dirname, 'modules/customer') },
        { find: '@domain', replacement: path.resolve(__dirname, 'domain') },
        { find: '@application', replacement: path.resolve(__dirname, 'application') },
        { find: '@infrastructure', replacement: path.resolve(__dirname, 'infrastructure') },
      ]
    }
  };
});


