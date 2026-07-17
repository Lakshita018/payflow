/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/src/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: '<rootDir>/tsconfig.test.json',
      diagnostics: { ignoreCodes: [6059] },
    }],
  },
  // Run before every test suite — sets env vars so config/env.ts passes Zod
  // validation without requiring a real .env file in CI or local test runs.
  setupFiles: ['<rootDir>/jest.setup.ts'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/validators/**/*.ts',
    'src/utils/errors.ts',
    'src/utils/jwt.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    'src/services/auth.service.ts': {
      lines: 90,
      functions: 90,
      branches: 90,
    },
  },
};
