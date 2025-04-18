// Import testing library extensions
import '@testing-library/jest-dom';

// Ensure React is globally available
import React from 'react';
global.React = React;

// Mock Next.js router - define mocks inline in the factory function
jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    route: '/',
    pathname: '',
    query: {},
    asPath: '',
    push: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn()
    },
    beforePopState: jest.fn(() => null),
    prefetch: jest.fn(() => null)
  })
}));

// Mock Next.js navigation - define mocks inline in the factory function
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/'),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
  useParams: jest.fn().mockReturnValue({})
}));

// Mock browser APIs that might be missing in the test environment
if (typeof window !== 'undefined') {
  // Mock IntersectionObserver
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: class IntersectionObserver {
      constructor() {}
      observe() { return null; }
      unobserve() { return null; }
      disconnect() { return null; }
    }
  });

  // Mock ResizeObserver
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: class ResizeObserver {
      constructor() {}
      observe() { return null; }
      unobserve() { return null; }
      disconnect() { return null; }
    }
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock window.scrollTo
  window.scrollTo = jest.fn();
}

// Set current date for consistent testing
jest.useFakeTimers();
jest.setSystemTime(new Date('2023-06-01T12:00:00Z'));

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
