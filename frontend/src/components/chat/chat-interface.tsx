'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ChatMessages } from '@/components/chat/chat-messages';
import { TaskProgressPopup } from '@/components/chat/task-progress-popup';
import { WebSocketClient, ChatMessage, WebSocketEvent } from './websocket';

type Message = {
  id: string;
  type: 'system' | 'user' | 'assistant' | 'error' | 'thinking';
  content: string;
  timestamp: string;
};

type TaskUpdate = {
  task_id: string;
  progress: number;
  status: string;
  task_type?: string;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<TaskUpdate | null>(null);
  const wsClientRef = useRef<WebSocketClient | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset connection error when component is unmounted/remounted
  useEffect(() => {
    setConnectionError(null);
  }, []);
  
  useEffect(() => {
    // Create WebSocket client
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use the correct port 8080 for WebSocket, since the backend is running there
    const socketUrl = `${protocol}//${window.location.hostname}:8080/ws`;
    console.log(`Attempting to connect to WebSocket at ${socketUrl}`);
    wsClientRef.current = new WebSocketClient(socketUrl);
    
    // Register event listeners
    wsClientRef.current.addEventListener('connected', (event) => {
      setConnected(true);
      setConnecting(false);
      toast.success('Connected to chat server');
    });
    
    wsClientRef.current.addEventListener('disconnected', (event) => {
      setConnected(false);
      setConnecting(false);
      toast.error('Disconnected from chat server');
      
      if (event.data && event.data.reason) {
        setConnectionError(event.data.reason);
      }
    });
    
    wsClientRef.current.addEventListener('error', (event) => {
      if (event.data && event.data.message) {
        setConnectionError(event.data.message);
        toast.error(event.data.message);
      }
    });
    
    wsClientRef.current.addEventListener('message', (event) => {
      if (event.message) {
        // Convert to our message format
        const newMessage: Message = {
          id: event.message.id || crypto.randomUUID(),
          type: event.message.role as any, // Map roles to types
          content: event.message.content,
          timestamp: event.message.timestamp || new Date().toISOString()
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
    });
    
    wsClientRef.current.addEventListener('system', (event) => {
      // Check for LLM service not available error
      if (event.message && event.message.error) {
        const content = event.message.content || '';
        
        if (content.includes('LLM service is not available') || 
            content.includes('OpenAI API key')) {
          setConnectionError('OpenAI API key is not configured. Please visit the configuration page to set it up.');
          toast.error('OpenAI API key is required for chat');
        }
      }
      
      // Check for connection info with service availability
      if (event.data && typeof event.data.llm_available !== 'undefined') {
        // If LLM is not available, show error
        if (!event.data.llm_available) {
          setConnectionError('OpenAI API key is not configured. Please visit the configuration page to set it up.');
        }
      }
    });
    
    wsClientRef.current.addEventListener('task_update', (event) => {
      if (event.data && event.data.task) {
        const task = event.data.task;
        setActiveTask({
          task_id: task.id,
          progress: task.progress || 0,
          status: task.status,
          task_type: task.type
        });
        
        // If task completed or failed, clear active task after a delay
        if (task.status === 'completed' || task.status === 'failed') {
          setTimeout(() => {
            setActiveTask(null);
          }, 5000);
        }
      }
    });
    
    // Connect
    wsClientRef.current.connect().catch(error => {
      console.error('Failed to connect to WebSocket:', error);
      setConnected(false);
      setConnecting(false);
      
      // Create helpful error message with troubleshooting steps
      const errorMessage = `
        Failed to connect to chat server. Please ensure:
        
        1. The backend server is running on port 8080
        2. Your OpenAI API key is configured correctly
        3. There are no network issues blocking WebSocket connections
        
        You can check the configuration in the Configuration page.
      `;
      
      setConnectionError(errorMessage);
      toast.error('Failed to connect to chat server');
      
      // Try alternative connection methods if primary fails
      setTimeout(() => {
        // Try a different WebSocket URL as fallback
        try {
          console.log("Trying fallback WebSocket connection...");
          const fallbackUrl = `${protocol}//localhost:8080/ws`;
          wsClientRef.current = new WebSocketClient(fallbackUrl);
          
          // Attempt to connect with the fallback
          wsClientRef.current.connect().catch(fallbackError => {
            console.error('Fallback WebSocket connection also failed:', fallbackError);
          });
        } catch (fallbackError) {
          console.error('Error setting up fallback connection:', fallbackError);
        }
      }, 2000);
    });
    
    // Cleanup on unmount
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, []);
  
  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!input.trim()) return;
    if (!connected || !wsClientRef.current) {
      toast.error('Not connected to chat server');
      return;
    }
    
    // Send message to server
    const success = wsClientRef.current.sendTextMessage(input);
    
    if (success) {
      // Add user message to chat immediately (server will also echo it back)
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'user',
        content: input,
        timestamp: new Date().toISOString()
      }]);
      
      // Clear input
      setInput('');
      
      // Add a "thinking" message
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'thinking',
        content: 'Thinking...',
        timestamp: new Date().toISOString()
      }]);
    } else {
      toast.error('Failed to send message');
    }
  };
  
  const handleClearChat = () => {
    setMessages([]);
  };
  
  const handleCancelTask = () => {
    if (!activeTask || !wsClientRef.current) return;
    
    try {
      // Send cancel command
      wsClientRef.current.sendCommand(`task cancel ${activeTask.task_id}`);
      toast.success('Task cancellation requested');
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error('Failed to cancel task');
    }
  };

  return (
    <>
      <Card className="h-[70vh] overflow-hidden">
        <CardContent className="flex h-full flex-col p-0">
          <div className="flex items-center justify-between border-b p-3">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">homework AI Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="mr-2 flex items-center">
                <div className={`mr-2 h-2 w-2 rounded-full ${connected ? 'bg-green-500' : connecting ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearChat}>
                Clear Chat
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {connectionError ? (
              <div className="flex h-full flex-col items-center justify-center text-center p-4">
                <div className="mb-4 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-500 mb-2">Connection Error</h3>
                <p className="text-sm text-muted-foreground mb-4">{connectionError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.href = '/configuration'}
                >
                  Go to Configuration
                </Button>
              </div>
            ) : (
              <>
                <ChatMessages messages={messages} />
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
          
          <div className="border-t p-3">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!connected || !!connectionError}
                className="flex-1"
              />
              <Button type="submit" disabled={!connected || !input.trim() || !!connectionError}>
                {connected ? <Send className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
      
      {activeTask && (
        <TaskProgressPopup
          task={activeTask}
          onCancel={handleCancelTask}
        />
      )}
    </>
  );
}