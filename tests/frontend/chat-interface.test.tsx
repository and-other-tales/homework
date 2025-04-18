import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatInterface } from '../../frontend/src/components/chat/chat-interface';
import { WebSocketClient } from '../../frontend/src/lib/api/websocket';

// Mock the websocket client
jest.mock('../../frontend/src/lib/api/websocket', () => {
  // First, create a mock class
  const mockConnect = jest.fn().mockResolvedValue(undefined);
  const mockSendTextMessage = jest.fn().mockReturnValue(true);
  const mockAddEventListener = jest.fn();
  const mockDisconnect = jest.fn();
  
  // Mock implementation of the WebSocketClient
  const MockWebSocketClient = jest.fn().mockImplementation(() => {
    return {
      connect: mockConnect,
      sendTextMessage: mockSendTextMessage,
      addEventListener: mockAddEventListener,
      disconnect: mockDisconnect,
      isConnected: jest.fn().mockReturnValue(true),
      getStatus: jest.fn().mockReturnValue('connected')
    };
  });
  
  // Return the module exports
  return {
    __esModule: true,
    WebSocketClient: MockWebSocketClient,
    default: MockWebSocketClient()
  };
});

// Mock toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the chat interface correctly', () => {
    render(<ChatInterface />);
    
    // Check for important UI elements
    expect(screen.getByText('homework AI Assistant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('establishes WebSocket connection on mount', () => {
    render(<ChatInterface />);
    
    // Verify WebSocketClient was initialized with correct URL
    const wsConstructor = WebSocketClient as jest.Mock;
    expect(wsConstructor).toHaveBeenCalled();
    
    // Verify connection was attempted
    const mockWsInstance = wsConstructor.mock.instances[0];
    expect(mockWsInstance.connect).toHaveBeenCalled();
    
    // Verify event listeners were registered
    expect(mockWsInstance.addEventListener).toHaveBeenCalledWith(
      'connected', 
      expect.any(Function)
    );
    expect(mockWsInstance.addEventListener).toHaveBeenCalledWith(
      'disconnected', 
      expect.any(Function)
    );
    expect(mockWsInstance.addEventListener).toHaveBeenCalledWith(
      'message', 
      expect.any(Function)
    );
  });
  
  it('sends message when form is submitted', async () => {
    render(<ChatInterface />);
    
    // Get the input and submit button
    const input = screen.getByPlaceholderText('Type a message...');
    const submitButton = screen.getByRole('button');
    
    // Type a message
    fireEvent.change(input, { target: { value: 'Hello AI' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Verify the message was sent
    const wsConstructor = WebSocketClient as jest.Mock;
    const mockWsInstance = wsConstructor.mock.instances[0];
    
    expect(mockWsInstance.sendTextMessage).toHaveBeenCalledWith('Hello AI');
    
    // Verify input was cleared
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });
  
  it('handles connection state correctly', async () => {
    render(<ChatInterface />);
    
    // Get WebSocketClient mock
    const wsConstructor = WebSocketClient as jest.Mock;
    const mockWsInstance = wsConstructor.mock.instances[0];
    
    // Get the connected event handler
    const connectedHandler = mockWsInstance.addEventListener.mock.calls.find(
      call => call[0] === 'connected'
    )?.[1];
    
    // Simulate connection success
    if (connectedHandler) {
      connectedHandler({ type: 'connected' });
    }
    
    // Check that the UI reflects connected state
    expect(screen.getByText('Connected')).toBeInTheDocument();
    
    // Get the disconnected event handler
    const disconnectedHandler = mockWsInstance.addEventListener.mock.calls.find(
      call => call[0] === 'disconnected'
    )?.[1];
    
    // Simulate disconnection
    if (disconnectedHandler) {
      disconnectedHandler({ type: 'disconnected' });
    }
    
    // Check that UI reflects disconnected state
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });
  
  it('displays received messages', async () => {
    render(<ChatInterface />);
    
    // Get WebSocketClient mock
    const wsConstructor = WebSocketClient as jest.Mock;
    const mockWsInstance = wsConstructor.mock.instances[0];
    
    // Get the message event handler
    const messageHandler = mockWsInstance.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )?.[1];
    
    // Simulate receiving a message
    if (messageHandler) {
      messageHandler({
        type: 'message',
        message: {
          id: 'msg1',
          role: 'assistant',
          content: 'Hello, I am the AI assistant',
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Check that the message is displayed
    expect(screen.getByText('Hello, I am the AI assistant')).toBeInTheDocument();
  });
});