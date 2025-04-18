// Import testing library extensions
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
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
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/'),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn()
  }),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
  useParams: jest.fn().mockReturnValue({}),
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
}

// Set up any global mocks or test environment customizations here

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
