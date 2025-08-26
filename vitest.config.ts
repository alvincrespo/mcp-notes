/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Test file patterns
    include: ['tests/**/*.test.ts'],

    // Global test setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/index.ts', // Entry point usually excluded
        'node_modules/**',
        'build/**',
        'tests/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },

    // Timeout configuration
    testTimeout: 10000,

    // Better error reporting
    reporter: ['verbose'],

    // Mock configuration
    clearMocks: true,
    restoreMocks: true
  },

  // Path resolution (equivalent to Jest's moduleNameMapping)
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
})
