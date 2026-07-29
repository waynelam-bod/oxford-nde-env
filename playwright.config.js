const { defineConfig } = require('@playwright/test');

const baseURL = 'http://localhost:4201';

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry'
  },
  reporter: [['list']]
});
