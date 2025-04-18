module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/../tests'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock Next.js modules
    '^next/router$': '<rootDir>/__mocks__/next/router.js',
    '^next/navigation$': '<rootDir>/__mocks__/next/navigation.js',
    '^next/link$': '<rootDir>/__mocks__/next/link.js',
    '^next/image$': '<rootDir>/__mocks__/next/image.js'
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
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  transformIgnorePatterns: [
    '/node_modules/(?!next|@next)/'
  ]
}
