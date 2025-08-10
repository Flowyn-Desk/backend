import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'generated'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'generated/',
        'tests/',
        '**/*.d.ts',
        'vitest.config.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});