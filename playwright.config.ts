import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    workers: 1,
    reporter: 'list',
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8010',
        screenshot: 'only-on-failure',
    },
});
