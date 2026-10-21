import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir: './e2e',
 use: {
  baseURL: 'http://127.0.0.1:4175',
  launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] },
 },
 webServer: {
  command: 'npm run preview -- --port 4175 --strictPort',
  url: 'http://127.0.0.1:4175',
  reuseExistingServer: false,
 },
});
