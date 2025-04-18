import React from 'react';
import { render, screen } from '@testing-library/react';
import Sidebar from '../../frontend/src/components/layout/sidebar';

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/'),
}));

jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

describe('Sidebar Component', () => {
  it('renders correctly with all navigation links', () => {
    render(<Sidebar />);
    
    // Check app title
    expect(screen.getByText('homework')).toBeInTheDocument();
    expect(screen.getByText('datasets and knowledge graph tools')).toBeInTheDocument();
    
    // Check all nav items are rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
    expect(screen.getByText('Datasets')).toBeInTheDocument();
    expect(screen.getByText('Knowledge Graphs')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    
    // Check server status indicator
    expect(screen.getByText('Server Status: Online')).toBeInTheDocument();
    expect(screen.getByText('API Port: 8080')).toBeInTheDocument();
  });
  
  it('highlights the active page correctly', () => {
    // Mock usePathname to return different values
    const usePathname = require('next/navigation').usePathname;
    
    // Test with Dashboard active
    usePathname.mockReturnValue('/');
    render(<Sidebar />);
    
    // There should be 7 links, with the Dashboard one active
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(7);
    
    // The Dashboard link should have the active class
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('bg-slate-700');
    
    // Clean up
    jest.clearAllMocks();
  });
});