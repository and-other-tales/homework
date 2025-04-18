import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardCards } from '../../frontend/src/components/dashboard/dashboard-cards';

// Mock fetch globally
global.fetch = jest.fn();

describe('DashboardCards Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'running',
        github_status: true,
        huggingface_status: true,
        neo4j_status: false,
        dataset_count: 10,
        cache_size: '250 MB'
      }),
    });
  });
  
  it('renders the dashboard cards correctly with fetched data', async () => {
    render(<DashboardCards />);
    
    // Check that loading state is displayed initially
    // (depending on implementation, there might be loading indicators)
    
    // Wait for the data to be loaded and component to re-render
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/status');
    });
    
    // Check card titles
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Statistics')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    
    // Check status indicators are showing correctly based on API response
    expect(screen.getByText('Server: Running')).toBeInTheDocument();
    expect(screen.getByText('GitHub API: Connected')).toBeInTheDocument();
    expect(screen.getByText('Hugging Face: Connected')).toBeInTheDocument();
    expect(screen.getByText('Neo4j: Disconnected')).toBeInTheDocument();
    
    // Check statistics
    expect(screen.getByText('10')).toBeInTheDocument(); // Dataset count
    expect(screen.getByText('250 MB')).toBeInTheDocument(); // Cache size
    
    // Check quick action links
    expect(screen.getByText('Open Chat Interface')).toBeInTheDocument();
    expect(screen.getByText('View All Tasks')).toBeInTheDocument();
    expect(screen.getByText('Dataset Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
  });
  
  it('handles API error gracefully', async () => {
    // Mock failed API response
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<DashboardCards />);
    
    // Wait for the component to attempt to fetch data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/status');
    });
    
    // Check that the component still renders with default values
    expect(screen.getByText('Server: Stopped')).toBeInTheDocument();
    expect(screen.getByText('GitHub API: Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Hugging Face: Disconnected')).toBeInTheDocument();
    expect(screen.getByText('Neo4j: Disconnected')).toBeInTheDocument();
    
    // Default dataset count should be 0
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});