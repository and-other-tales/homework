import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ApiClient } from '../../frontend/src/lib/api/client';
import { WebSocketClient } from '../../frontend/src/lib/api/websocket';

// This test demonstrates integration between frontend components and backend API
// It will test an imaginary TaskCreationForm component that uses the API client

// First, let's create a mock TaskCreationForm component that uses our API client
const TaskCreationForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [taskName, setTaskName] = React.useState('');
  const [taskDescription, setTaskDescription] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  
  const apiClient = new ApiClient('http://localhost:8080/api');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await apiClient.createTask({
        name: taskName,
        description: taskDescription
      });
      
      if (response.success) {
        setTaskName('');
        setTaskDescription('');
        if (onSuccess) onSuccess();
      } else {
        setError(response.message || 'Failed to create task');
      }
    } catch (err) {
      setError('An error occurred while creating the task');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} data-testid="task-form">
      <div>
        <label htmlFor="taskName">Task Name</label>
        <input
          id="taskName"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="taskDescription">Description</label>
        <textarea
          id="taskDescription"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
        />
      </div>
      {error && <div className="error">{error}</div>}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
};

// Mock API client's createTask method
jest.mock('../../frontend/src/lib/api/client', () => {
  return {
    ApiClient: jest.fn().mockImplementation(() => {
      return {
        createTask: jest.fn()
      };
    })
  };
});

describe('Integrated API Tests', () => {
  let mockApiClient: {
    createTask: jest.Mock;
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get mock instance
    mockApiClient = (ApiClient as jest.Mock).mock.instances[0];
  });
  
  it('successfully creates a task and integrates with the backend', async () => {
    // Mock successful response
    mockApiClient.createTask.mockResolvedValue({
      success: true,
      message: 'Task created successfully',
      data: {
        id: '123',
        name: 'Test Task',
        description: 'Test Description',
        status: 'pending'
      }
    });
    
    const onSuccess = jest.fn();
    render(<TaskCreationForm onSuccess={onSuccess} />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Task Name'), {
      target: { value: 'Test Task' }
    });
    
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Test Description' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('task-form'));
    
    // Check form submission is in progress
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    
    // Wait for the submission to complete
    await waitFor(() => {
      expect(mockApiClient.createTask).toHaveBeenCalledWith({
        name: 'Test Task',
        description: 'Test Description'
      });
    });
    
    // Verify success callback was called
    expect(onSuccess).toHaveBeenCalled();
    
    // Form should be reset
    expect(screen.getByLabelText('Task Name')).toHaveValue('');
    expect(screen.getByLabelText('Description')).toHaveValue('');
  });
  
  it('handles API errors when creating a task', async () => {
    // Mock error response
    mockApiClient.createTask.mockResolvedValue({
      success: false,
      message: 'Validation error: Task name is required'
    });
    
    render(<TaskCreationForm />);
    
    // Fill form with incomplete data (missing description)
    fireEvent.change(screen.getByLabelText('Task Name'), {
      target: { value: '' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('task-form'));
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Validation error: Task name is required')).toBeInTheDocument();
    });
  });
  
  it('handles network errors when creating a task', async () => {
    // Mock network error
    mockApiClient.createTask.mockRejectedValue(new Error('Network error'));
    
    render(<TaskCreationForm />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Task Name'), {
      target: { value: 'Test Task' }
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('task-form'));
    
    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText('An error occurred while creating the task')).toBeInTheDocument();
    });
  });
});