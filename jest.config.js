module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  moduleDirectories: [
    'node_modules',
    '<rootDir>/frontend/node_modules',
    '<rootDir>/frontend/src'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '^../../frontend/src/lib/api/(.*)$': '<rootDir>/frontend/__mocks__/lib/api/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)'
  ],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest'
  },
  collectCoverageFrom: [
    'frontend/src/**/*.{js,jsx,ts,tsx}',
    '!**/node_modules/**',
    '!**/vendor/**'
  ]
};
