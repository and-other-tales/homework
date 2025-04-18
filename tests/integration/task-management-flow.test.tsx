import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UnifiedTaskManager } from '../../frontend/src/components/dashboard/unified-task-manager';
import { DashboardTaskList } from '../../frontend/src/components/dashboard/task-list';
import { AgentInboxDashboard } from '../../frontend/src/components/dashboard/agent-inbox-dashboard';
import { fetchTasks, cancelTask, fetchHumanInLoopTasks } from '../../frontend/src/components/dashboard/simple-api';
import DashboardPage from '../../frontend/src/app/page';

// Mock the Next.js components
jest.mock('../../frontend/src/components/layout/page-layout', () => {
  return function MockPageLayout({ children, title }: { children: React.ReactNode, title: string }) {
    return (
      <div data-testid="page-layout">
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

// Mock the dashboard components
jest.mock('../../frontend/src/components/dashboard/dashboard-cards', () => ({
  DashboardCards: () => <div data-testid="dashboard-cards">Dashboard Cards</div>
}));

jest.mock('../../frontend/src/components/dashboard/unified-task-manager', () => ({
  UnifiedTaskManager: jest.fn(() => <div data-testid="unified-task-manager">Unified Task Manager</div>)
}));

jest.mock('../../frontend/src/components/dashboard/new-task-modal', () => ({
  NewTaskModal: jest.fn(() => <div data-testid="new-task-modal">New Task Modal</div>),
  __esModule: true,
  default: jest.fn()
}));

// Mock the API functions
jest.mock('../../frontend/src/components/dashboard/simple-api', () => ({
  fetchTasks: jest.fn(),
  cancelTask: jest.fn(),
  fetchHumanInLoopTasks: jest.fn(),
  createAgentTask: jest.fn()
}));

// Mock the useRef hook
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useRef: jest.fn(() => ({ current: { open: jest.fn() } }))
  };
});

describe('Task Management Integration', () => {
  const mockSystemTasks = [
    {
      id: 'task1',
      type: 'github_dataset',
      status: 'in_progress',
      progress: 50,
      description: 'Creating GitHub dataset',
      created_at: '2023-06-01T12:00:00Z',
      updated_at: '2023-06-01T12:30:00Z'
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
        allow_accept: true,
        allow_edit: true,
        allow_respond: true,
        allow_ignore: true
      },
      status: 'pending',
      created_at: '2023-06-01T12:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the API responses
    (fetchTasks as jest.Mock).mockResolvedValue({
      success: true,
      data: { tasks: mockSystemTasks }
    });
    
    (fetchHumanInLoopTasks as jest.Mock).mockResolvedValue({
      success: true,
      data: { tasks: mockHumanTasks }
    });
    
    (cancelTask as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Task cancelled successfully'
    });
  });

  it('renders the dashboard page with all components', () => {
    render(<DashboardPage />);
    
    expect(screen.getByTestId('page-layout')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-cards')).toBeInTheDocument();
    expect(screen.getByTestId('unified-task-manager')).toBeInTheDocument();
    expect(screen.getByTestId('new-task-modal')).toBeInTheDocument();
  });
  
  // Un-mock the UnifiedTaskManager for this test
  it('integrates task listing and task cancellation', async () => {
    // Restore the real component
    jest.unmock('../../frontend/src/components/dashboard/unified-task-manager');
    const { UnifiedTaskManager: ActualUnifiedTaskManager } = jest.requireActual('../../frontend/src/components/dashboard/unified-task-manager');
    (UnifiedTaskManager as jest.Mock).mockImplementation(ActualUnifiedTaskManager);
    
    render(<UnifiedTaskManager />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(fetchTasks).toHaveBeenCalledTimes(1);
      expect(fetchHumanInLoopTasks).toHaveBeenCalledTimes(0); // Not called initially because tab is not active
    });
    
    // Switch to human tasks tab and verify API call
    fireEvent.click(screen.getByText('Human-in-Loop Tasks'));
    
    // Verify both tabs show the correct data
    expect(screen.getByText('task1')).toBeInTheDocument(); // From system tasks
    
    // API call for human tasks should happen when tab is clicked
    await waitFor(() => {
      expect(fetchHumanInLoopTasks).toHaveBeenCalledTimes(1);
    });
  });

  // Test the actual component integration with real components
  it('allows seamless flow between task components', async () => {
    // Use the real components for this test
    jest.resetModules();
    jest.unmock('../../frontend/src/components/dashboard/unified-task-manager');
    jest.unmock('../../frontend/src/components/dashboard/task-list');
    
    // Render both components to simulate the dashboard
    const { rerender } = render(
      <div>
        <UnifiedTaskManager />
        <DashboardTaskList />
      </div>
    );
    
    // Wait for tasks to load in both components
    await waitFor(() => {
      expect(fetchTasks).toHaveBeenCalledTimes(2); // Called by both components
    });
    
    // Cancel a task in one component
    const cancelButtons = screen.getAllByTitle('Cancel Task');
    fireEvent.click(cancelButtons[0]);
    
    // Verify cancelTask was called
    await waitFor(() => {
      expect(cancelTask).toHaveBeenCalledWith('task1');
    });
    
    // Mock API response for the next fetch after cancellation
    const updatedTasks = [
      {
        ...mockSystemTasks[0],
        status: 'cancelled',
        progress: -1
      }
    ];
    
    (fetchTasks as jest.Mock).mockResolvedValue({
      success: true,
      data: { tasks: updatedTasks }
    });
    
    // Force a refresh
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // Verify both components update with the new data
    await waitFor(() => {
      // Both components should have called fetchTasks again
      expect(fetchTasks).toHaveBeenCalledTimes(4);
    });
    
    // Check for the updated status badge (Failed) - this will appear in both components
    const failedBadges = await screen.findAllByText('Failed');
    expect(failedBadges.length).toBeGreaterThan(0);
  });
});
