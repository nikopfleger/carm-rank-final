// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/e2e',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: true,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        video: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    webServer: process.env.PLAYWRIGHT_WEB_SERVER === '0' ? undefined : {
        command: process.platform === 'win32'
            ? 'npm run dev:e2e'
            : 'npm run dev:e2e',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        env: { E2E_AUTH_BYPASS: '1', PORT: '3000' },
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});


