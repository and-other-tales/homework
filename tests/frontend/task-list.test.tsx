import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DashboardTaskList } from '../../frontend/src/components/dashboard/task-list';
import { fetchTasks, cancelTask } from '../../frontend/src/components/dashboard/simple-api';

// Mock the API functions
jest.mock('../../frontend/src/components/dashboard/simple-api', () => ({
  fetchTasks: jest.fn(),
  cancelTask: jest.fn()
}));

describe('DashboardTaskList Component', () => {
  const mockTasks = [
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
    },
    {
      id: 'task3',
      type: 'knowledge_graph',
      status: 'paused',
      progress: 75,
      description: 'Knowledge graph creation',
      created_at: '2023-06-01T09:00:00Z',
      updated_at: '2023-06-01T09:45:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the API response
    (fetchTasks as jest.Mock).mockResolvedValue({
      success: true,
      data: { tasks: mockTasks }
    });
  });

  it('renders the component with loading state initially', () => {
    render(<DashboardTaskList />);
    
    expect(screen.getByText('Task Management')).toBeInTheDocument();
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('displays tasks after loading', async () => {
    render(<DashboardTaskList />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(fetchTasks).toHaveBeenCalledTimes(1);
    });
    
    // Check if task content is displayed
    expect(screen.getByText('task1')).toBeInTheDocument();
    expect(screen.getByText('github_dataset')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('handles task cancellation', async () => {
    (cancelTask as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Task cancelled successfully'
    });

    render(<DashboardTaskList />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('task1')).toBeInTheDocument();
    });
    
    // Find and click the cancel button for the first task (in_progress)
    const cancelButtons = screen.getAllByTitle('Cancel Task');
    fireEvent.click(cancelButtons[0]);
    
    // Verify cancelTask was called with the correct task ID
    await waitFor(() => {
      expect(cancelTask).toHaveBeenCalledWith('task1');
    });
  });

  it('handles task resumption', async () => {
    // Create a spy on console.error to detect any errors
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<DashboardTaskList />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('task3')).toBeInTheDocument();
    });
    
    // Find and click the resume button for the paused task
    const resumeButton = screen.getByTitle('Resume Task');
    fireEvent.click(resumeButton);
    
    // Check that the task status updates in the UI
    expect(console.error).not.toHaveBeenCalled();
    
    // Restore console.error
    (console.error as jest.Mock).mockRestore();
  });

  it('displays empty state when there are no tasks', async () => {
    // Mock empty tasks response
    (fetchTasks as jest.Mock).mockResolvedValue({
      success: true,
      data: { tasks: [] }
    });
    
    render(<DashboardTaskList />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(fetchTasks).toHaveBeenCalledTimes(1);
    });
    
    // Should show empty state
    expect(screen.getByText('No active tasks found. Start a new task to begin processing data.')).toBeInTheDocument();
  });

  it('handles view task action', async () => {
    // Spy on console.log to check if viewTask is called
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    render(<DashboardTaskList />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('task1')).toBeInTheDocument();
    });
    
    // Find and click the view button
    const viewButtons = screen.getAllByTitle('View Task');
    fireEvent.click(viewButtons[0]);
    
    // Check if viewTask was called with the right task ID
    expect(console.log).toHaveBeenCalledWith('View task:', 'task1');
    
    // Restore console.log
    (console.log as jest.Mock).mockRestore();
  });
});
