/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/../tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Fix the regex pattern for frontend imports in tests
    '\\.\\.[\\\\/]\\.\\./frontend/src/(.*)$': '<rootDir>/src/$1',
    // Mock problematic modules
    '^sonner$': '<rootDir>/__mocks__/sonner.js',
    '^next/navigation$': '<rootDir>/__mocks__/next/navigation.js',
    '^next/link$': '<rootDir>/__mocks__/next/link.js',
    '^next/image$': '<rootDir>/__mocks__/next/image.js',
    '^next/router$': '<rootDir>/__mocks__/next/router.js',
    // Mock Babel runtime helpers
    '@babel/runtime/helpers/interopRequireDefault': '<rootDir>/__mocks__/interopRequireDefault.js'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }]
  },
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.mjs',
    '@testing-library/jest-dom/extend-expect'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@radix-ui|sonner)/)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/'
  ],
  moduleDirectories: ['node_modules', '<rootDir>'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)'
  ]
};

module.exports = config;
