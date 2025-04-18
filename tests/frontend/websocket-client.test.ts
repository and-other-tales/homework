import { WebSocketClient, WebSocketEvent } from '../../frontend/src/lib/api/websocket';

// Mock WebSocket
class MockWebSocket {
  url: string;
  addEventListener: jest.Mock;
  removeEventListener: jest.Mock;
  send: jest.Mock;
  close: jest.Mock;
  readyState: number;
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  constructor(url: string) {
    this.url = url;
    this.addEventListener = jest.fn();
    this.removeEventListener = jest.fn();
    this.send = jest.fn();
    this.close = jest.fn();
    this.readyState = MockWebSocket.CONNECTING;
  }
  
  // Helper to simulate connection open
  simulateOpen() {
    this.readyState = MockWebSocket.OPEN;
    const openHandler = this.addEventListener.mock.calls.find(
      call => call[0] === 'open'
    )?.[1];
    if (openHandler) openHandler();
  }
  
  // Helper to simulate receiving a message
  simulateMessage(data: any) {
    const messageHandler = this.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )?.[1];
    if (messageHandler) messageHandler({ data: JSON.stringify(data) });
  }
  
  // Helper to simulate connection close
  simulateClose(code = 1000, reason = '') {
    this.readyState = MockWebSocket.CLOSED;
    const closeHandler = this.addEventListener.mock.calls.find(
      call => call[0] === 'close'
    )?.[1];
    if (closeHandler) closeHandler({ code, reason });
  }
  
  // Helper to simulate error
  simulateError(error = new Error('WebSocket error')) {
    const errorHandler = this.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )?.[1];
    if (errorHandler) errorHandler(error);
  }
}

// Replace global WebSocket with mock
global.WebSocket = MockWebSocket as any;

describe('WebSocketClient', () => {
  let wsClient: WebSocketClient;
  let mockSocket: MockWebSocket;
  
  beforeEach(() => {
    wsClient = new WebSocketClient('wss://test.example.com/ws');
    // Capture the WebSocket instance created during connect()
    wsClient.connect().then(() => {
      mockSocket = (global.WebSocket as any).mock.instances[0];
    });
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  describe('connection management', () => {
    it('should connect to the specified WebSocket URL', async () => {
      expect(global.WebSocket).toHaveBeenCalledWith('wss://test.example.com/ws');
    });
    
    it('should add event listeners on connect', async () => {
      await wsClient.connect();
      mockSocket = (global.WebSocket as any).mock.instances[0];
      
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockSocket.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
    });
    
    it('should emit connected event when socket opens', async () => {
      const eventListener = jest.fn();
      wsClient.addEventListener('connected', eventListener);
      
      await wsClient.connect();
      mockSocket = (global.WebSocket as any).mock.instances[0];
      mockSocket.simulateOpen();
      
      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].type).toBe('connected');
    });
    
    it('should emit disconnected event when socket closes', async () => {
      const eventListener = jest.fn();
      wsClient.addEventListener('disconnected', eventListener);
      
      await wsClient.connect();
      mockSocket = (global.WebSocket as any).mock.instances[0];
      mockSocket.simulateOpen();
      mockSocket.simulateClose(1000, 'Normal closure');
      
      expect(eventListener).toHaveBeenCalled();
      expect(eventListener.mock.calls[0][0].type).toBe('disconnected');
      expect(eventListener.mock.calls[0][0].data).toEqual(
        expect.objectContaining({
          code: 1000,
          reason: 'Normal closure'
        })
      );
    });
  });
  
  describe('message handling', () => {
    it('should parse and emit messages correctly', async () => {
      const messageListener = jest.fn();
      wsClient.addEventListener('message', messageListener);
      
      await wsClient.connect();
      mockSocket = (global.WebSocket as any).mock.instances[0];
      mockSocket.simulateOpen();
      
      const testMessage = {
        id: 'msg1',
        role: 'assistant',
        content: 'Hello, I am an AI assistant',
        timestamp: '2023-01-01T12:00:00Z'
      };
      
      mockSocket.simulateMessage(testMessage);
      
      expect(messageListener).toHaveBeenCalled();
      expect(messageListener.mock.calls[0][0].message).toEqual(
        expect.objectContaining({
          id: 'msg1',
          role: 'assistant',
          content: 'Hello, I am an AI assistant'
        })
      );
    });
    
    it('should detect task updates in system messages', async () => {
      const taskListener = jest.fn();
      wsClient.addEventListener('task_update', taskListener);
      
      await wsClient.connect();
      mockSocket = (global.WebSocket as any).mock.instances[0];
      mockSocket.simulateOpen();
      
      const testTaskMessage = {
        id: 'task1',
        role: 'system',
        content: 'Task started',
        data: {
          task: {
            id: 'task123',
            progress: 50,
            status: 'running'
          }
        },
        timestamp: '2023-01-01T12:00:00Z'
      };
      
      mockSocket.simulateMessage(testTaskMessage);
      
      expect(taskListener).toHaveBeenCalled();
      expect(taskListener.mock.calls[0][0].type).toBe('task_update');
      expect(taskListener.mock.calls[0][0].data).toEqual(
        expect.objectContaining({
          task: expect.objectContaining({
            id: 'task123',
            progress: 50
          })
        })
      );
    });
  });
  
  describe('sending messages', () => {
    it('should send text messages correctly', async () => {
      await wsClient.connect();
      mockSocket = (global.WebSocket as any).mock.instances[0];
      mockSocket.simulateOpen();
      
      wsClient.sendTextMessage('Hello, world!');
      
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Hello, world!')
      );
      
      const sentData = JSON.parse(mockSocket.send.mock.calls[0][0]);
      expect(sentData).toEqual(
        expect.objectContaining({
          type: 'text',
          content: 'Hello, world!'
        })
      );
    });
    
    it('should send commands correctly', async () => {
      await wsClient.connect();
      mockSocket = (global.WebSocket as any).mock.instances[0];
      mockSocket.simulateOpen();
      
      wsClient.sendCommand('task list');
      
      expect(mockSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('task list')
      );
      
      const sentData = JSON.parse(mockSocket.send.mock.calls[0][0]);
      expect(sentData).toEqual(
        expect.objectContaining({
          type: 'command',
          content: 'task list'
        })
      );
    });
    
    it('should not send if socket is not connected', async () => {
      // Don't simulate open
      await wsClient.connect();
      mockSocket = (global.WebSocket as any).mock.instances[0];
      // Keep readyState as CONNECTING
      
      const result = wsClient.sendTextMessage('Should not send');
      
      expect(result).toBe(false);
      expect(mockSocket.send).not.toHaveBeenCalled();
    });
  });
});