import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@miscuentas/shared': path.resolve(__dirname, '../shared/src/types.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.ts'],
    server: {
      deps: {
        inline: ['@miscuentas/shared'],
      },
    },
  },
})
