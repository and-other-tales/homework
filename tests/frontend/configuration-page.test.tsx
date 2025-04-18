import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfigurationPage from '../../frontend/src/app/configuration/page';
import { toast } from 'sonner';

// Mock the PageLayout component
jest.mock('../../frontend/src/components/layout/page-layout', () => {
  return function MockPageLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="page-layout">{children}</div>;
  };
});

// Mock the toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = jest.fn();

describe('ConfigurationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    
    // Default mock for fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: {
          huggingface_configured: true,
          github_configured: true,
          openai_configured: true,
          neo4j_configured: false
        } 
      })
    });
  });

  it('renders the configuration page with all sections', async () => {
    render(<ConfigurationPage />);
    
    // Check for section headers
    expect(screen.getByText('API Credentials')).toBeInTheDocument();
    expect(screen.getByText('Neo4j Configuration')).toBeInTheDocument();
    expect(screen.getByText('Server Settings')).toBeInTheDocument();
    expect(screen.getByText('Chat Configuration')).toBeInTheDocument();
    
    // Check for important form fields
    expect(screen.getByLabelText('Hugging Face Token')).toBeInTheDocument();
    expect(screen.getByLabelText('GitHub Token')).toBeInTheDocument();
    expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
    expect(screen.getByLabelText('Neo4j URI')).toBeInTheDocument();
    expect(screen.getByLabelText('Neo4j Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Neo4j Password')).toBeInTheDocument();
    
    // Wait for initial API calls to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/configuration');
    });
  });

  it('loads saved configuration from localStorage', async () => {
    // Set up mock localStorage data
    const savedConfig = {
      neo4j_uri: 'bolt://customhost:7687',
      neo4j_username: 'testuser',
      server_port: '9000',
      temp_dir: '/custom/path',
      chat_model: 'gpt-4'
    };
    
    localStorageMock.setItem('homework_config_state', JSON.stringify(savedConfig));
    
    render(<ConfigurationPage />);
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByLabelText('Neo4j URI')).toHaveValue('bolt://customhost:7687');
      expect(screen.getByLabelText('Neo4j Username')).toHaveValue('testuser');
      expect(screen.getByLabelText('API Port')).toHaveValue('9000');
    });
  });

  it('handles form input changes', async () => {
    render(<ConfigurationPage />);
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByLabelText('Hugging Face Token')).toBeInTheDocument();
    });
    
    // Change the Hugging Face token
    const hfTokenInput = screen.getByLabelText('Hugging Face Token');
    fireEvent.change(hfTokenInput, { target: { value: 'hf_test_token' } });
    
    // Verify localStorage is updated
    expect(localStorageMock.setItem).toHaveBeenCalled();
    expect(JSON.parse(localStorageMock.setItem.mock.calls[0][1])).toHaveProperty('huggingface_token', '');
  });

  it('handles Neo4j deployment', async () => {
    // Mock successful Neo4j deployment
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url === '/api/deploy-neo4j') {
        return {
          ok: true,
          json: async () => ({ 
            success: true, 
            data: {
              uri: 'bolt://localhost:7687',
              username: 'neo4j',
              password: 'password123'
            }
          })
        };
      }
      
      return {
        ok: true,
        json: async () => ({ success: true, data: {} })
      };
    });
    
    render(<ConfigurationPage />);
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('Deploy Neo4j Docker')).toBeInTheDocument();
    });
    
    // Click deploy button
    const deployButton = screen.getByText('Deploy Neo4j Docker');
    fireEvent.click(deployButton);
    
    // Verify deployment in progress
    expect(screen.getByText('Deploying...')).toBeInTheDocument();
    
    // Wait for deployment to complete
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Neo4j deployed successfully!');
    });
    
    // Verify form is updated with Neo4j credentials
    expect(screen.getByLabelText('Neo4j URI')).toHaveValue('bolt://localhost:7687');
    expect(screen.getByLabelText('Neo4j Username')).toHaveValue('neo4j');
    expect(screen.getByLabelText('Neo4j Password')).toHaveValue('password123');
  });

  it('handles saving configuration', async () => {
    // Mock successful configuration save
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url === '/api/configuration' && (global.fetch as jest.Mock).mock.calls[0][1]?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ 
            success: true, 
            message: 'Configuration saved successfully',
            data: {
              items: {
                huggingface: true,
                github: true,
                openai: true,
                neo4j: true
              }
            }
          })
        };
      }
      
      return {
        ok: true,
        json: async () => ({ success: true, data: {} })
      };
    });
    
    render(<ConfigurationPage />);
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('Save Configuration')).toBeInTheDocument();
    });
    
    // Fill in form fields
    fireEvent.change(screen.getByLabelText('Hugging Face Token'), { target: { value: 'hf_test_token' } });
    fireEvent.change(screen.getByLabelText('GitHub Token'), { target: { value: 'github_test_token' } });
    fireEvent.change(screen.getByLabelText('OpenAI API Key'), { target: { value: 'sk_test_key' } });
    
    // Click save button
    const saveButton = screen.getByText('Save Configuration');
    fireEvent.click(saveButton);
    
    // Verify loading state
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    
    // Wait for save to complete
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Configuration saved successfully');
      expect(toast.success).toHaveBeenCalledWith('Updated: Hugging Face, GitHub, OpenAI, Neo4j');
    });
    
    // Verify localStorage was updated
    expect(localStorageMock.setItem).toHaveBeenCalledWith('setup_completed', 'true');
    
    // Sensitive fields should be cleared from localStorage
    const savedConfig = JSON.parse(localStorageMock.setItem.mock.calls.find(call => call[0] === 'homework_config_state')[1]);
    expect(savedConfig.huggingface_token).toBe('');
    expect(savedConfig.github_token).toBe('');
    expect(savedConfig.openai_api_key).toBe('');
  });

  it('handles errors when saving configuration', async () => {
    // Mock error response for configuration save
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => {
      if (url === '/api/configuration' && (global.fetch as jest.Mock).mock.calls[0][1]?.method === 'POST') {
        return {
          ok: false,
          json: async () => ({ 
            success: false, 
            message: 'Failed to save configuration: Invalid token'
          })
        };
      }
      
      return {
        ok: true,
        json: async () => ({ success: true, data: {} })
      };
    });
    
    render(<ConfigurationPage />);
    
    // Wait for component to initialize
    await waitFor(() => {
      expect(screen.getByText('Save Configuration')).toBeInTheDocument();
    });
    
    // Fill in form fields and save
    fireEvent.change(screen.getByLabelText('Hugging Face Token'), { target: { value: 'invalid_token' } });
    fireEvent.click(screen.getByText('Save Configuration'));
    
    // Wait for error response
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save configuration: Invalid token');
    });
  });
});
