import { ApiClient, ApiResponse } from '../../frontend/src/lib/api/client';

// Mock fetch globally
global.fetch = jest.fn();

describe('ApiClient', () => {
  let apiClient: ApiClient;
  
  beforeEach(() => {
    apiClient = new ApiClient('http://localhost:8080/api');
    jest.resetAllMocks();
  });
  
  describe('getStatus', () => {
    it('should fetch and return status correctly', async () => {
      // Mock successful response
      const mockResponse = {
        success: true,
        message: 'Server is running',
        data: { 
          status: 'running', 
          version: '1.0.0' 
        }
      };
      
      // Setup mock implementation for fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      // Call the method
      const result = await apiClient.getStatus();
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/status',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      
      // Verify the result
      expect(result).toEqual(mockResponse);
    });
    
    it('should handle errors properly', async () => {
      // Mock failed response
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      // Call the method
      const result = await apiClient.getStatus();
      
      // Verify the error response
      expect(result).toEqual({
        success: false,
        message: 'Network error'
      });
    });
  });
  
  describe('generateDataset', () => {
    it('should send correct POST request', async () => {
      // Mock successful response
      const mockResponse = {
        success: true,
        message: 'Dataset generated successfully',
        data: { 
          dataset_name: 'test-dataset' 
        }
      };
      
      // Setup mock implementation for fetch
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });
      
      // Request params
      const params = {
        source_type: 'repository' as const,
        source_name: 'user/repo',
        dataset_name: 'test-dataset',
        description: 'Test dataset'
      };
      
      // Call the method
      const result = await apiClient.generateDataset(params);
      
      // Verify fetch was called correctly
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/generate',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: JSON.stringify(params)
        })
      );
      
      // Verify the result
      expect(result).toEqual(mockResponse);
    });
  });
  
  describe('authentication', () => {
    it('should include API key in headers when set', async () => {
      // Set API key
      apiClient.setApiKey('test-api-key');
      
      // Mock successful response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      
      // Call any method
      await apiClient.getStatus();
      
      // Verify Authorization header was included
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key'
          })
        })
      );
    });
  });
});