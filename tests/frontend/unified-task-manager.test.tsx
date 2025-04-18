import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedTaskManager } from '../../frontend/src/components/dashboard/unified-task-manager';
import { fetchTasks, cancelTask, fetchHumanInLoopTasks } from '../../frontend/src/components/dashboard/simple-api';
import { toast } from 'sonner';

// Mock the API functions
jest.mock('../../frontend/src/components/dashboard/simple-api', () => ({
  fetchTasks: jest.fn(),
  cancelTask: jest.fn(),
  fetchHumanInLoopTasks: jest.fn()
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('UnifiedTaskManager Component', () => {
  const mockSystemTasks = [
    {
      id: 'task1',
      type: 'github_dataset',
      status: 'in_progress',
      progress: 50,
      description: 'Creating GitHub dataset',
      created_at: '2023-06-01T12:00:00Z',
      updated_at: '2023-06-01T12:30:00Z'
    },
    {
      id: 'task2',
      type: 'web_crawl',
      status: 'completed',
      progress: 100,
      description: 'Web crawling task',
      created_at: '2023-06-01T10:00:00Z',
      updated_at: '2023-06-01T11:00:00Z'
    }
  ];

  const mockHumanTasks = [
    {
      id: 'human1',
      action_request: {
        action: 'approve_file',
        args: { file_path: '/path/to/file.md' }
      },
      description: 'Approve file for processing',
      config: {
        allow_ignore: true,
        allow_respond: true,
        allow_edit: true,
        allow_accept: true
      },
      status: 'pending',
      created_at: '2023-06-01T12:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    (fetchTasks as jest.Mock).mockResolvedValue({
      success: true,
      data: { tasks: mockSystemTasks }
    });
    
    (fetchHumanInLoopTasks as jest.Mock).mockResolvedValue({
      success: true,
      data: { tasks: mockHumanTasks }
    });
  });

  it('renders the component with loading state initially', () => {
    render(<UnifiedTaskManager />);
    
    expect(screen.getByText('Unified Task Management')).toBeInTheDocument();
    expect(screen.getByText('System Tasks')).toBeInTheDocument();
    expect(screen.getByText('Human-in-Loop Tasks')).toBeInTheDocument();
    
    // Should show loading indicators
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('displays system tasks after loading', async () => {
    render(<UnifiedTaskManager />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(fetchTasks).toHaveBeenCalledTimes(1);
    });
    
    // Check if tasks are displayed
    expect(screen.getByText('task1')).toBeInTheDocument();
    expect(screen.getByText('github_dataset')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('handles task cancellation', async () => {
    (cancelTask as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Task cancelled successfully'
    });

    render(<UnifiedTaskManager />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('task1')).toBeInTheDocument();
    });
    
    // Find and click the cancel button for the first task
    const cancelButtons = screen.getAllByTitle('Cancel Task');
    fireEvent.click(cancelButtons[0]);
    
    // Verify cancelTask was called with the correct task ID
    await waitFor(() => {
      expect(cancelTask).toHaveBeenCalledWith('task1');
      expect(toast.success).toHaveBeenCalledWith('Task cancelled successfully');
    });
  });

  it('switches between system and human-in-loop tabs', async () => {
    render(<UnifiedTaskManager />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('task1')).toBeInTheDocument();
    });
    
    // Switch to human-in-loop tab
    fireEvent.click(screen.getByText('Human-in-Loop Tasks'));
    
    // Should now show human-in-loop tasks
    await waitFor(() => {
      expect(screen.getByText('approve_file')).toBeInTheDocument();
      expect(screen.getByText('Approve file for processing')).toBeInTheDocument();
    });
  });

  it('handles refresh action', async () => {
    render(<UnifiedTaskManager />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('task1')).toBeInTheDocument();
    });
    
    // Clear mocks to test refresh
    (fetchTasks as jest.Mock).mockClear();
    (fetchHumanInLoopTasks as jest.Mock).mockClear();
    
    // Click refresh button
    fireEvent.click(screen.getByText('Refresh'));
    
    // Verify both API calls were made
    await waitFor(() => {
      expect(fetchTasks).toHaveBeenCalledTimes(1);
      expect(fetchHumanInLoopTasks).toHaveBeenCalledTimes(1);
    });
  });

  it('handles API error gracefully', async () => {
    // Mock API error
    (fetchTasks as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<UnifiedTaskManager />);
    
    // Component should still render without crashing
    await waitFor(() => {
      expect(screen.getByText('Unified Task Management')).toBeInTheDocument();
      expect(screen.getByText('No active tasks found.')).toBeInTheDocument();
    });
  });
});
