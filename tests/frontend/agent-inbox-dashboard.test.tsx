import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentInboxDashboard } from '../../frontend/src/components/dashboard/agent-inbox-dashboard';
import { fetchHumanInLoopTasks } from '../../frontend/src/components/dashboard/simple-api';
import { toast } from 'sonner';

// Mock the API functions
jest.mock('../../frontend/src/components/dashboard/simple-api', () => ({
  fetchHumanInLoopTasks: jest.fn()
}));

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('AgentInboxDashboard Component', () => {
  const mockTasks = [
    {
      id: 'task1',
      action_request: {
        action: 'approve_repository',
        args: { 
          repository: 'user/repo',
          reason: 'Contains sensitive information'
        }
      },
      description: 'Please review this repository for processing',
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
    
    // Mock the API response
    (fetchHumanInLoopTasks as jest.Mock).mockResolvedValue({
      success: true,
      data: { tasks: mockTasks }
    });
  });

  it('renders the component with loading state initially', () => {
    render(<AgentInboxDashboard />);
    
    expect(screen.getByText('Task Management & Human-in-Loop')).toBeInTheDocument();
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('displays tasks after loading', async () => {
    render(<AgentInboxDashboard />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(fetchHumanInLoopTasks).toHaveBeenCalledTimes(1);
    });
    
    // Check if task content is displayed
    expect(screen.getByText('approve_repository')).toBeInTheDocument();
    expect(screen.getByText('Please review this repository for processing')).toBeInTheDocument();
    expect(screen.getByText('Waiting for review')).toBeInTheDocument();
  });

  it('opens the dialog when clicking Accept button', async () => {
    render(<AgentInboxDashboard />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('approve_repository')).toBeInTheDocument();
    });
    
    // Click Accept button
    fireEvent.click(screen.getByText('Accept'));
    
    // Dialog should appear
    expect(screen.getByText('Accept Task')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to accept this task with the current arguments?')).toBeInTheDocument();
  });

  it('opens the edit dialog and allows editing arguments', async () => {
    render(<AgentInboxDashboard />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('approve_repository')).toBeInTheDocument();
    });
    
    // Click Edit button
    fireEvent.click(screen.getByText('Edit'));
    
    // Dialog should appear with editable fields
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByText('Edit the arguments before submitting:')).toBeInTheDocument();
    
    // Should have form fields for each argument
    expect(screen.getByLabelText('repository')).toBeInTheDocument();
    expect(screen.getByLabelText('reason')).toBeInTheDocument();
    
    // Edit a field
    fireEvent.change(screen.getByLabelText('repository'), {
      target: { value: 'othertales/homework' }
    });
    
    // Submit the edit
    fireEvent.click(screen.getByText('Submit'));
    
    // After submission, should show success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Task edited successfully');
    });
  });

  it('opens the respond dialog and allows submitting a response', async () => {
    render(<AgentInboxDashboard />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('approve_repository')).toBeInTheDocument();
    });
    
    // Click Respond button
    fireEvent.click(screen.getByText('Respond'));
    
    // Dialog should appear with response field
    expect(screen.getByText('Respond to Task')).toBeInTheDocument();
    expect(screen.getByText('Enter your response:')).toBeInTheDocument();
    
    // Type a response
    fireEvent.change(screen.getByPlaceholderText('Type your response here...'), {
      target: { value: 'This repository is approved for processing.' }
    });
    
    // Submit the response
    fireEvent.click(screen.getByText('Submit'));
    
    // After submission, should show success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Response submitted successfully');
    });
  });

  it('handles the ignore action directly without opening dialog', async () => {
    render(<AgentInboxDashboard />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('approve_repository')).toBeInTheDocument();
    });
    
    // Click Ignore button - doesn't open dialog, acts immediately
    fireEvent.click(screen.getByText('Ignore'));
    
    // Should show success message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Task ignored');
    });
  });

  it('displays empty state when there are no tasks', async () => {
    // Mock empty tasks response
    (fetchHumanInLoopTasks as jest.Mock).mockResolvedValue({
      success: true,
      data: { tasks: [] }
    });
    
    render(<AgentInboxDashboard />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(fetchHumanInLoopTasks).toHaveBeenCalledTimes(1);
    });
    
    // Should show empty state
    expect(screen.getByText('No tasks requiring human intervention at this time.')).toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    // Mock API error
    (fetchHumanInLoopTasks as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Failed to load tasks'
    });
    
    render(<AgentInboxDashboard />);
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(fetchHumanInLoopTasks).toHaveBeenCalledTimes(1);
    });
    
    // Should show error toast
    expect(toast.error).toHaveBeenCalledWith('Failed to load tasks: Failed to load tasks');
  });
});
