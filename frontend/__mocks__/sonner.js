// Mock for sonner toast library
module.exports = {
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  },
  Toaster: jest.fn().mockImplementation(({ children }) => children)
};
