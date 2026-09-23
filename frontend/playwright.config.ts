import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

// E2E runs against an isolated stack so tests never touch dev data:
//   FastAPI on :8001 backed by the `stay_e2e` database (reset + seeded by backend/scripts/e2e_stack.sh)
//   Vite on :5181 proxying /api to :8001
// Credentials for a real Supabase account come from frontend/.env.e2e.local (E2E_EMAIL, E2E_PASSWORD).
const env = loadEnv('e2e', process.cwd(), '')
process.env.E2E_EMAIL ??= env.E2E_EMAIL
process.env.E2E_PASSWORD ??= env.E2E_PASSWORD

const BASE_URL = 'http://localhost:5181'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  timeout: 30_000,
  expect: { timeout: 7_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'mobile',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        hasTouch: true,
        storageState: 'e2e/.auth/user.json',
      },
    },
  ],
  webServer: [
    {
      command: '../backend/scripts/e2e_stack.sh',
      url: 'http://localhost:8001/health',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'npx vite --port 5181 --strictPort',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      env: { VITE_API_PROXY_TARGET: 'http://localhost:8001' },
      timeout: 60_000,
    },
  ],
})
