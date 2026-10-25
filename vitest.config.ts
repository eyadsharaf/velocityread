import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so tests never touch the PWA/React plugins —
// the suites here cover pure utilities (parser, pacing).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
