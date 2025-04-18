// Import necessary testing libraries
import '@testing-library/jest-dom';

// Mock global objects that might not be available in the test environment
if (typeof window !== 'undefined') {
  // Mock IntersectionObserver
  window.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
  };
  
  // Mock ResizeObserver
  window.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() { return null; }
    unobserve() { return null; }
    disconnect() { return null; }
  };
  
  // Mock window.matchMedia
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }));
  
  // Mock scrollTo
  window.scrollTo = jest.fn();
}

// Set timezone for consistent date/time testing
jest.setSystemTime(new Date('2023-06-01T12:00:00Z'));

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
