/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/../tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Fix path mapping for frontend modules with proper regex
    '^../../frontend/src/(.*)$': '<rootDir>/src/$1',
    // Direct module mappings
    '^react$': require.resolve('react'),
    '^react-dom$': require.resolve('react-dom'),
    // Mock modules
    '^sonner$': '<rootDir>/__mocks__/sonner.js',
    '^next/navigation$': '<rootDir>/__mocks__/next/navigation.js',
    '^next/link$': '<rootDir>/__mocks__/next/link.js',
    '^next/image$': '<rootDir>/__mocks__/next/image.js',
    '^next/router$': '<rootDir>/__mocks__/next/router.js',
    // API module mocks (add these for tests that need them)
    '^../../frontend/src/lib/api/websocket$': '<rootDir>/__mocks__/lib/api/websocket.js',
    '^../../frontend/src/lib/api/client$': '<rootDir>/__mocks__/lib/api/client.js',
    // Mock Babel runtime helpers
    '@babel/runtime/helpers/interopRequireDefault': '<rootDir>/__mocks__/babel-runtime/interopRequireDefault.js',
    '@babel/runtime/helpers/defineProperty': '<rootDir>/__mocks__/babel-runtime/defineProperty.js',
    '@babel/runtime/helpers/extends': '<rootDir>/__mocks__/babel-runtime/extends.js',
    '@babel/runtime/helpers/objectWithoutProperties': '<rootDir>/__mocks__/babel-runtime/objectWithoutProperties.js',
    '@babel/runtime/helpers/objectWithoutPropertiesLoose': '<rootDir>/__mocks__/babel-runtime/objectWithoutPropertiesLoose.js',
    '@babel/runtime/helpers/inherits': '<rootDir>/__mocks__/babel-runtime/inherits.js',
    '@babel/runtime/helpers/createClass': '<rootDir>/__mocks__/babel-runtime/createClass.js',
    '@babel/runtime/helpers/classCallCheck': '<rootDir>/__mocks__/babel-runtime/classCallCheck.js'
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
  moduleDirectories: [
    'node_modules', 
    '<rootDir>', 
    '../node_modules'
  ],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js|jsx)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)'
  ]
};

module.exports = config;
