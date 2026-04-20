import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const normalizedRootDir = rootDir.replace(/\\/g, '/')

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@\//,
        replacement: `${normalizedRootDir}/`,
      },
    ],
  },
  test: {
    alias: {
      '@': normalizedRootDir,
    },
    css: false,
    pool: 'threads',
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    passWithNoTests: false,
    reporters: ['default'],
    restoreMocks: true,
    clearMocks: true,
    mockReset: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      include: [
        'app/**/*.js',
        'app/**/*.jsx',
        'components/**/*.js',
        'components/**/*.jsx',
        'lib/**/*.js',
      ],
      exclude: [
        'tests/**',
        'node_modules/**',
        '.next/**',
        'next-env.d.ts',
      ],
    },
    projects: [
      {
        test: {
          name: 'contracts',
          environment: 'node',
          pool: 'threads',
          fileParallelism: false,
          include: ['tests/contracts/**/*.test.{js,jsx}'],
        },
      },
      {
        test: {
          name: 'unit',
          environment: 'node',
          pool: 'threads',
          fileParallelism: false,
          include: ['tests/unit/**/*.test.{js,jsx}'],
        },
      },
      {
        test: {
          name: 'component',
          environment: 'jsdom',
          pool: 'threads',
          fileParallelism: false,
          setupFiles: ['./tests/support/setup-dom.js'],
          include: ['tests/component/**/*.test.{js,jsx}'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'jsdom',
          pool: 'threads',
          fileParallelism: false,
          setupFiles: ['./tests/support/setup-dom.js'],
          include: ['tests/integration/**/*.test.{js,jsx}'],
        },
      },
      {
        test: {
          name: 'smoke',
          environment: 'jsdom',
          pool: 'threads',
          fileParallelism: false,
          setupFiles: ['./tests/support/setup-dom.js'],
          include: ['tests/smoke/**/*.test.{js,jsx}'],
        },
      },
    ],
  },
})
