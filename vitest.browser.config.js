import process from 'node:process';
import { URL, fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

import inject from '@rollup/plugin-inject';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL;

export default defineConfig({
  plugins: [
    react(),
    inject({
      styled: ['@mui/material/styles', 'styled'],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['src/**/*.browser.test.jsx'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: browserChannel ? { channel: browserChannel } : undefined,
      }),
      instances: [{ browser: 'chromium' }],
    },
  },
});
