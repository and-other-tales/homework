// This file configures the Jest test environment

// Mock Map implementation that's compatible with the tests
class MockMap {
  constructor() {
    this.store = {};
  }
  
  set(key, value) {
    this.store[key] = value;
  }
  
  get(key) {
    return this.store[key];
  }
  
  has(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key);
  }
  
  delete(key) {
    delete this.store[key];
  }
  
  clear() {
    this.store = {};
  }
}

// Inject the mock Map into global space before tests run
global.Map = MockMap;

// Configure the test environment
if (typeof window !== 'undefined') {
  // Mock window methods and properties
  window.scrollTo = jest.fn();
  
  // Mock IntersectionObserver
  window.IntersectionObserver = class IntersectionObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  // Mock ResizeObserver
  window.ResizeObserver = class ResizeObserver {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  // Mock matchMedia
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
}

// Mock missing modules
jest.mock('@radix-ui/react-collection', () => {
  return {
    createCollection: () => ({
      Provider: ({ children }) => children,
      Slot: ({ children }) => children,
      ItemSlot: ({ children }) => children
    }),
    Collection: ({ children }) => children,
    CollectionProvider: ({ children }) => children,
    CollectionSlot: ({ children }) => children,
    CollectionItemSlot: ({ children }) => children
  };
});
