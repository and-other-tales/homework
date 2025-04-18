/**
 * WebSocket client for real-time communication with the backend
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  error?: boolean;
  data?: any;
}

export type WebSocketEventType = 
  | 'message'
  | 'system'
  | 'error'
  | 'task_update'
  | 'connected'
  | 'disconnected';

export interface WebSocketEvent {
  type: WebSocketEventType;
  message?: ChatMessage;
  data?: any;
}

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private autoReconnect: boolean;
  private reconnectInterval: number; // in milliseconds
  private reconnectAttempts: number;
  private maxReconnectAttempts: number;
  private eventListeners: Map<string, ((event: WebSocketEvent) => void)[]> = new Map();
  private clientId: string | null = null;

  constructor(
    url: string = '',
    autoReconnect: boolean = true,
    reconnectInterval: number = 5000,
    maxReconnectAttempts: number = 5
  ) {
    // Use environment variable if available, or dynamically determine based on window location
    this.url = url || this.determineWebSocketUrl();
    this.autoReconnect = autoReconnect;
    this.reconnectInterval = reconnectInterval;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = maxReconnectAttempts;
  }

  /**
   * Determine WebSocket URL based on environment or window location
   */
  private determineWebSocketUrl(): string {
    // Import configuration
    let apiConfig;
    try {
      // Dynamic import for config (since this code runs on both server and client)
      apiConfig = {
        baseUrl: (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || 'http://localhost:8080'
      };
    } catch (e) {
      // Fallback if dynamic import fails
      apiConfig = {
        baseUrl: 'http://localhost:8080'
      };
    }
    
    if (typeof window === 'undefined') {
      // Server-side rendering
      // Use wss for https API URLs, ws otherwise
      const protocol = apiConfig.baseUrl.startsWith('https') ? 'wss' : 'ws';
      const host = apiConfig.baseUrl.replace(/^https?:\/\//, '');
      return `${protocol}://${host}/ws`;
    }
    
    // Client-side rendering
    // Prefer window location protocol when available (for automatic HTTPS detection)
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    
    // For development where frontend and backend are on different hosts/ports
    if (process.env.NODE_ENV === 'development') {
      // Extract host from API URL for WebSocket
      const apiHost = apiConfig.baseUrl.replace(/^https?:\/\//, '');
      // Use API host but with appropriate ws/wss protocol
      return `${protocol}://${apiHost}/ws`;
    }
    
    // For production where frontend and backend are likely on same host
    const host = window.location.host;
    return `${protocol}://${host}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        // Connection opened
        this.socket.addEventListener('open', () => {
          // Reset reconnect attempts on successful connection
          this.reconnectAttempts = 0;
          
          // Emit connected event
          this.emitEvent({
            type: 'connected',
            data: { timestamp: new Date().toISOString() }
          });
          
          resolve();
        });

        // Listen for messages
        this.socket.addEventListener('message', (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Store client ID if provided in system message
            if (data.role === 'system' && data.data && data.data.client_id) {
              this.clientId = data.data.client_id;
              // Store client ID but don't log it
            }
            
            // Create chat message
            const message: ChatMessage = {
              id: data.id || `msg_${Date.now()}`,
              role: data.role || 'system',
              content: data.content || '',
              timestamp: data.timestamp || new Date().toISOString(),
              error: data.error || false,
              data: data.data || undefined
            };
            
            // Determine event type
            let eventType: WebSocketEventType = 'message';
            if (message.role === 'system') {
              eventType = 'system';
              
              // Check if it's a task update
              if (message.data && (message.data.task || message.data.status === 'working')) {
                eventType = 'task_update';
              }
            }
            if (message.error) {
              eventType = 'error';
            }
            
            // Emit the appropriate event
            this.emitEvent({
              type: eventType,
              message,
              data: message.data
            });
          } catch (error) {
            // Emit error event for parsing failure
            this.emitEvent({
              type: 'error',
              data: { 
                message: 'Failed to parse WebSocket message',
                timestamp: new Date().toISOString()
              }
            });
          }
        });

        // Connection closed
        this.socket.addEventListener('close', (event) => {
          // Emit disconnected event
          this.emitEvent({
            type: 'disconnected',
            data: { 
              code: event.code,
              reason: event.reason,
              timestamp: new Date().toISOString()
            }
          });
          
          this.socket = null;
          
          // Auto reconnect if enabled and hasn't exceeded max attempts
          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            setTimeout(() => {
              this.connect().catch(() => {
                // Silent error handling, error is emitted as an event
              });
            }, this.reconnectInterval);
          }
        });

        // Connection error
        this.socket.addEventListener('error', (error) => {
          // Log error for debugging
          console.error('WebSocket connection error:', error);
          
          // Emit error event
          this.emitEvent({
            type: 'error',
            data: { 
              message: `WebSocket connection error: Please ensure the backend server is running on port 8080`,
              timestamp: new Date().toISOString()
            }
          });
          
          reject(error);
        });
      } catch (error) {
        // Error handling via Promise rejection
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      // Disable auto reconnect when manually disconnecting
      this.autoReconnect = false;
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Send a text message to the server
   */
  sendTextMessage(content: string): boolean {
    return this.sendMessage('text', content);
  }

  /**
   * Send a command to the server
   */
  sendCommand(command: string): boolean {
    return this.sendMessage('command', command);
  }

  /**
   * Request status update for a task
   */
  requestTaskStatus(taskId: string): boolean {
    return this.sendMessage('task_status', taskId);
  }

  /**
   * Send a message of a specific type
   */
  private sendMessage(type: string, content: string): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // Emit error event instead of logging
      this.emitEvent({
        type: 'error',
        data: { 
          message: 'Cannot send message: WebSocket is not connected',
          timestamp: new Date().toISOString()
        }
      });
      return false;
    }

    try {
      const message = {
        type,
        content,
        client_id: this.clientId || 'unknown',
        timestamp: new Date().toISOString()
      };
      
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      // Emit error event instead of logging
      this.emitEvent({
        type: 'error',
        data: { 
          message: 'Failed to send message',
          timestamp: new Date().toISOString()
        }
      });
      return false;
    }
  }

  /**
   * Register an event listener
   */
  addEventListener(eventType: WebSocketEventType, callback: (event: WebSocketEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    
    this.eventListeners.get(eventType)?.push(callback);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(eventType: WebSocketEventType, callback: (event: WebSocketEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   */
  private emitEvent(event: WebSocketEvent): void {
    // Call specific event type listeners
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          // Silent error handling for event listeners
        }
      });
    }
    
    // Also call general 'message' listeners for all events except 'message' itself
    // to avoid duplicate notifications
    if (event.type !== 'message') {
      const messageListeners = this.eventListeners.get('message');
      if (messageListeners) {
        messageListeners.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            // Silent error handling for event listeners
          }
        });
      }
    }
  }

  /**
   * Check if the connection is open
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getStatus(): 'connected' | 'connecting' | 'disconnected' | 'closed' {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
      default:
        return 'closed';
    }
  }
}