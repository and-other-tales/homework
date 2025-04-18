'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type Message = {
  id: string;
  type: 'system' | 'user' | 'assistant' | 'error' | 'thinking';
  content: string;
  timestamp: string;
};

export function SimpleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add welcome message on component mount
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        type: 'system',
        content: 'Welcome to the homework AI Assistant. I can help you with web search, website crawling, dataset creation from GitHub repositories or websites, and knowledge graph management. How can I help you today?',
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Add thinking message
    const thinkingMessage: Message = {
      id: `thinking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'thinking',
      content: 'Thinking...',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, thinkingMessage]);
    setLoading(true);
    setInput('');
    
    try {
      // Load preferences from localStorage if available
      let chatModel = "gpt-3.5-turbo";
      let apiKey = "";
      
      try {
        const savedConfig = localStorage.getItem('homework_config_state');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          if (config.chat_model) {
            chatModel = config.chat_model;
          }
          
          // Include API key if available in local storage
          if (config.openai_api_key) {
            apiKey = config.openai_api_key;
          }
        }
        
        // Check if OpenAI is configured in config status
        const configStatus = localStorage.getItem('config_status');
        if (configStatus) {
          const status = JSON.parse(configStatus);
          if (status.openai_configured && !apiKey) {
            console.log("OpenAI is configured according to status, but no key in localStorage");
            // Set a flag to tell backend to use server-side key
            apiKey = "USE_SERVER_KEY";
          }
        }
      } catch (e) {
        console.error("Error loading saved config:", e);
      }
      
      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          model: chatModel,
          apiKey: apiKey  // Send API key if available from client storage
        })
      });
      
      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Add error message
        const errorMessage: Message = {
          id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'error',
          content: errorData.message || 'Failed to get a response from the chat server.',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        toast.error('Error: ' + (errorData.message || 'Failed to get response'));
        return;
      }
      
      // Handle successful response
      const data = await response.json();
      
      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Show token usage in toast if available
      if (data.tokenUsage) {
        toast.info(`Token usage: ${data.tokenUsage.total_tokens} tokens`);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
      
      // Add error message
      const errorMessage: Message = {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'error',
        content: error instanceof Error 
          ? error.message 
          : 'An unknown error occurred while sending your message.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    // Keep only the welcome message
    setMessages([{
      id: 'welcome',
      type: 'system',
      content: 'Welcome to the homework AI Assistant. I can help you with web search, website crawling, dataset creation from GitHub repositories or websites, and knowledge graph management. How can I help you today?',
      timestamp: new Date().toISOString()
    }]);
    
    // Show toast confirmation
    toast.success('Chat history cleared');
  };

  return (
    <Card className="h-[70vh] overflow-hidden">
      <CardContent className="flex h-full flex-col p-0">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">homework AI Assistant</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleClearChat}>
              Clear Chat
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`mb-4 ${
                message.type === 'user' 
                  ? 'text-right' 
                  : message.type === 'system' || message.type === 'error'
                    ? 'text-center' 
                    : 'text-left'
              }`}
            >
              <div 
                className={`inline-block rounded-lg px-4 py-2 ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : message.type === 'assistant'
                      ? 'bg-muted'
                      : message.type === 'error'
                        ? 'bg-red-100 text-red-800'
                        : message.type === 'thinking'
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : 'bg-gray-100 text-gray-800'
                }`}
              >
                {message.content}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {message.type === 'user' ? 'You' : message.type === 'assistant' ? 'Assistant' : ''}&nbsp;
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t p-3">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}