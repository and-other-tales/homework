module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/../tests'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    // These aren't needed because we're mocking in setup.js
    // but adding as fallbacks
    '^next/router$': '<rootDir>/__mocks__/next/router.js',
    '^next/navigation$': '<rootDir>/__mocks__/next/navigation.js'
  },
  setupFilesAfterEnv: ['<rootDir>/../tests/setup.js'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  // Make sure Next.js modules can be found
  moduleDirectories: ['node_modules', '<rootDir>/node_modules', '../node_modules'],
  transformIgnorePatterns: ['/node_modules/(?!next|@next)']
}
