// Test settings. `npm run test:coverage` also measures how much of the game
// the tests run, and fails if it drops below the thresholds below. The
// deploy runs it, so a change that leaves new code untested doesn't ship.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Some tests play a whole level frame by frame, which takes a few
    // seconds, more while coverage is measured.
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      include: ['public/**/*.js'],
      reporter: ['text-summary', 'text'],
      // Every line and branch of the game is tested; keep it that way.
      thresholds: { lines: 100, statements: 100, functions: 100, branches: 100 },
    },
  },
});
