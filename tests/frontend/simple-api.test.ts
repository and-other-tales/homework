import { fetchStatus, fetchTasks, cancelTask, fetchHumanInLoopTasks, sendChatMessage, createAgentTask, fetchTaskStatus } from '../../frontend/src/components/dashboard/simple-api';

// Mock fetch
global.fetch = jest.fn();

describe('Simple API Functions', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  
  describe('fetchStatus', () => {
    it('should return success response when API call succeeds', async () => {
      const mockResponse = {
        status: 'running',
        uptime: '2h 30m',
        server_port: 8080
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await fetchStatus();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/status', expect.any(Object));
      expect(result).toEqual({
        success: true,
        message: 'Success',
        data: mockResponse
      });
    });
    
    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      const result = await fetchStatus();
      
      expect(result).toEqual({
        success: false,
        message: 'API Error: 500 - Internal Server Error'
      });
    });
    
    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await fetchStatus();
      
      expect(result).toEqual({
        success: false,
        message: 'Network error'
      });
    });
  });
  
  describe('fetchTasks', () => {
    it('should return tasks when API call succeeds', async () => {
      const mockTasks = {
        success: true,
        data: {
          tasks: [
            {
              id: 'task1',
              type: 'github_dataset',
              status: 'in_progress',
              progress: 50
            }
          ]
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks
      });
      
      const result = await fetchTasks();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/tasks');
      expect(result).toEqual(mockTasks);
    });
    
    it('should handle API errors when fetching tasks', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Server error' })
      });
      
      const result = await fetchTasks();
      
      expect(result).toEqual({
        success: false,
        message: 'Failed to fetch tasks (500)',
        data: { tasks: [] }
      });
    });
    
    it('should handle network errors when fetching tasks', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const result = await fetchTasks();
      
      expect(result).toEqual({
        success: false,
        message: 'Network error',
        data: { tasks: [] }
      });
    });
  });
  
  describe('fetchHumanInLoopTasks', () => {
    it('should return human-in-loop tasks when API call succeeds', async () => {
      const mockResponse = {
        success: true,
        data: {
          tasks: [
            {
              id: 'human_task1',
              action_request: { action: 'approve_file' },
              status: 'pending'
            }
          ]
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await fetchHumanInLoopTasks();
      
      expect(global.fetch).toHaveBeenCalledWith('/api/agent-tasks/human', expect.any(Object));
      expect(result).toEqual({
        success: true,
        message: 'Success',
        data: mockResponse.data
      });
    });
    
    it('should handle alternative response format', async () => {
      const mockResponse = {
        tasks: [{ id: 'task1' }]
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await fetchHumanInLoopTasks();
      
      expect(result).toEqual({
        success: true,
        message: 'Success',
        data: { tasks: mockResponse.tasks }
      });
    });
    
    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });
      
      const result = await fetchHumanInLoopTasks();
      
      expect(result).toEqual({
        success: false,
        message: 'API Error: 403 - Forbidden'
      });
    });
  });
  
  describe('cancelTask', () => {
    it('should cancel a task successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Task cancelled successfully'
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });
      
      const result = await cancelTask('task123');
      
      expect(global.fetch).toHaveBeenCalledWith('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId: 'task123' }),
      });
      
      expect(result).toEqual(mockResponse);
    });
  });
});
