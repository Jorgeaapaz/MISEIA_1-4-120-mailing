import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['lib/**/*.ts'],
      exclude: ['lib/types.ts', 'lib/db.ts'],
      thresholds: {
        lines: 60,
        functions: 60,
      },
    },
  },
})
