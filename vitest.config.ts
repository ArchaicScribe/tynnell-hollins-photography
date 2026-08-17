import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    // .claude/worktrees holds full checkouts of other branches. Vitest was
    // picking their test files up alongside the real ones, so `npm test`
    // reported failures from stale copies of code that is not in this tree.
    // That noise masks genuine failures, which matters most exactly when the
    // suite is being used to validate something (a dependency bump, an
    // upgrade). node_modules and .next are excluded by default; these are not.
    exclude: ['**/node_modules/**', '**/.next/**', '**/.claude/**'],
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@payload-config': path.resolve(__dirname, 'payload.config.ts'),
    },
  },
})
