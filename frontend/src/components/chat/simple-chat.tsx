'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Briefcase, Play, ArrowRight, X, Settings, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type Message = {
  id: string;
  type: 'system' | 'user' | 'assistant' | 'error' | 'thinking' | 'tool';
  content: string;
  timestamp: string;
  toolName?: string;
  toolInput?: any;
  toolOutput?: string;
  taskId?: string;
};

type AgentTaskOptions = {
  maxPages?: number;
  recursive?: boolean;
  maxDepth?: number;
  contentFilters?: string[];
  urlPatterns?: string[];
  exportToGraph?: boolean;
  graphName?: string;
};

export function SimpleChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [agentTaskModalOpen, setAgentTaskModalOpen] = useState(false);
  const [agentTaskType, setAgentTaskType] = useState('crawl');
  const [taskInProgress, setTaskInProgress] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [agentTaskOptions, setAgentTaskOptions] = useState<AgentTaskOptions>({
    maxPages: 100,
    recursive: true,
    maxDepth: 3,
    contentFilters: [],
    urlPatterns: [],
    exportToGraph: false,
    graphName: '',
  });
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentFilterRef = useRef<HTMLInputElement>(null);
  const urlPatternRef = useRef<HTMLInputElement>(null);

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

  // Track task status if there's an active task
  useEffect(() => {
    if (currentTaskId && taskInProgress) {
      const taskStatusInterval = setInterval(() => {
        checkTaskStatus(currentTaskId);
      }, 3000);
      return () => clearInterval(taskStatusInterval);
    }
  }, [currentTaskId, taskInProgress]);

  const checkTaskStatus = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/status?id=${taskId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.task) {
          const taskData = data.data.task;
          
          // Update task progress in messages
          setMessages(prevMessages => {
            const updatedMessages = [...prevMessages];
            const taskMessageIndex = updatedMessages.findIndex(m => m.taskId === taskId);
            
            if (taskMessageIndex >= 0) {
              // Update the existing task message
              updatedMessages[taskMessageIndex] = {
                ...updatedMessages[taskMessageIndex],
                content: `Task ${taskData.status}: ${taskData.message || ''} (${taskData.progress || 0}%)`,
              };
            }
            
            return updatedMessages;
          });
          
          // Mark task as complete if it's done
          if (['completed', 'failed', 'cancelled'].includes(taskData.status)) {
            setTaskInProgress(false);
            
            // Add completion message
            if (taskData.status === 'completed') {
              // Add the result as a new assistant message
              setMessages(prev => [...prev, {
                id: `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type: 'assistant',
                content: `✅ Task completed successfully: ${taskData.message || 'Task completed'}\n\n${taskData.result ? JSON.stringify(taskData.result, null, 2) : ''}`,
                timestamp: new Date().toISOString()
              }]);
              
              toast.success('Task completed successfully');
            } else if (taskData.status === 'failed') {
              setMessages(prev => [...prev, {
                id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                type: 'error',
                content: `❌ Task failed: ${taskData.message || 'Unknown error'}`,
                timestamp: new Date().toISOString()
              }]);
              
              toast.error(`Task failed: ${taskData.message || 'Unknown error'}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking task status:', error);
    }
  };

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
      content: agentMode ? 'Agent thinking...' : 'Thinking...',
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
      
      // Send message to API with agent mode flag
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input,
          model: chatModel,
          apiKey: apiKey,
          agentMode: agentMode  // Let the backend know if agent mode is enabled
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
      
      // Check if this is a tool usage response
      if (data.toolName && data.toolUsage) {
        // Tool was used, add a tool message
        const toolMessage: Message = {
          id: `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'tool',
          toolName: data.toolName,
          toolInput: data.toolInput,
          toolOutput: data.toolOutput,
          content: `Used tool: ${data.toolName}\n\n${data.message}`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, toolMessage]);
        
        // If this is a task tool, track the task
        if (data.taskId) {
          setCurrentTaskId(data.taskId);
          setTaskInProgress(true);
          
          // Add task tracking message
          const taskMessage: Message = {
            id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: 'system',
            taskId: data.taskId,
            content: `Task started: ${data.taskDescription || 'Processing task...'}`,
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, taskMessage]);
        }
      } else {
        // Normal assistant message
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
      
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
    
    // Reset states
    setTaskInProgress(false);
    setCurrentTaskId(null);
    
    // Show toast confirmation
    toast.success('Chat history cleared');
  };

  const handleAgentTaskSubmit = async () => {
    // Close the modal
    setAgentTaskModalOpen(false);
    
    // Create a user message describing the task
    let userContent = '';
    
    if (agentTaskType === 'crawl') {
      userContent = `I want to crawl a website and create a dataset.${agentTaskOptions.maxPages ? ` Limit to ${agentTaskOptions.maxPages} pages.` : ''}${agentTaskOptions.recursive ? ' Crawl recursively.' : ''}${agentTaskOptions.maxDepth ? ` Maximum depth: ${agentTaskOptions.maxDepth}.` : ''}`;
      
      if (agentTaskOptions.contentFilters?.length) {
        userContent += ` Only include content containing: ${agentTaskOptions.contentFilters.join(', ')}.`;
      }
      
      if (agentTaskOptions.urlPatterns?.length) {
        userContent += ` Only follow URLs matching: ${agentTaskOptions.urlPatterns.join(', ')}.`;
      }
      
      if (agentTaskOptions.exportToGraph) {
        userContent += ` Export results to knowledge graph${agentTaskOptions.graphName ? ` named "${agentTaskOptions.graphName}"` : ''}.`;
      }
    } else if (agentTaskType === 'github') {
      userContent = `I want to create a dataset from a GitHub repository or organization. Please collect all documentation, examples, and sample code.`;
    } else if (agentTaskType === 'knowledge') {
      userContent = `I want to ${agentTaskOptions.graphName ? `create a knowledge graph named "${agentTaskOptions.graphName}"` : 'work with knowledge graphs'}.`;
    }
    
    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'user',
      content: userContent,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Add thinking message
    const thinkingMessage: Message = {
      id: `thinking_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type: 'thinking',
      content: 'Agent thinking...',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, thinkingMessage]);
    setLoading(true);
    
    try {
      // Load preferences from localStorage
      let apiKey = "USE_SERVER_KEY";
      try {
        const savedConfig = localStorage.getItem('homework_config_state');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          if (config.openai_api_key) {
            apiKey = config.openai_api_key;
          }
        }
      } catch (e) {
        console.error("Error loading saved config:", e);
      }
      
      // Send task to API
      const response = await fetch('/api/agent-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_type: agentTaskType,
          message: userContent,
          options: agentTaskOptions,
          apiKey: apiKey
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
          content: errorData.message || 'Failed to start agent task.',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        toast.error('Error: ' + (errorData.message || 'Failed to start task'));
        return;
      }
      
      // Handle successful response
      const data = await response.json();
      
      // Add agent response
      const agentMessage: Message = {
        id: `assistant_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'assistant',
        content: data.message || 'Starting agent task...',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, agentMessage]);
      
      // If task ID is provided, start tracking it
      if (data.taskId) {
        setCurrentTaskId(data.taskId);
        setTaskInProgress(true);
        
        // Add task tracking message
        const taskMessage: Message = {
          id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          type: 'system',
          taskId: data.taskId,
          content: `Task started: ${data.taskDescription || 'Processing task...'}`,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, taskMessage]);
        
        toast.success('Agent task started');
      }
      
    } catch (error) {
      console.error('Error starting agent task:', error);
      
      // Remove thinking message
      setMessages(prev => prev.filter(msg => msg.id !== thinkingMessage.id));
      
      // Add error message
      const errorMessage: Message = {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'error',
        content: error instanceof Error 
          ? error.message 
          : 'An unknown error occurred while starting the agent task.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toast.error('Failed to start agent task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContentFilter = () => {
    if (contentFilterRef.current && contentFilterRef.current.value) {
      const filterValue = contentFilterRef.current.value.trim();
      if (filterValue) {
        setAgentTaskOptions(prev => ({
          ...prev,
          contentFilters: [...(prev.contentFilters || []), filterValue]
        }));
        contentFilterRef.current.value = '';
      }
    }
  };

  const handleRemoveContentFilter = (filter: string) => {
    setAgentTaskOptions(prev => ({
      ...prev,
      contentFilters: prev.contentFilters?.filter(f => f !== filter) || []
    }));
  };

  const handleAddUrlPattern = () => {
    if (urlPatternRef.current && urlPatternRef.current.value) {
      const patternValue = urlPatternRef.current.value.trim();
      if (patternValue) {
        setAgentTaskOptions(prev => ({
          ...prev,
          urlPatterns: [...(prev.urlPatterns || []), patternValue]
        }));
        urlPatternRef.current.value = '';
      }
    }
  };

  const handleRemoveUrlPattern = (pattern: string) => {
    setAgentTaskOptions(prev => ({
      ...prev,
      urlPatterns: prev.urlPatterns?.filter(p => p !== pattern) || []
    }));
  };

  return (
    <>
      <Card className="h-[70vh] overflow-hidden">
        <CardContent className="flex h-full flex-col p-0">
          <div className="flex items-center justify-between border-b p-3">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">homework AI Assistant</h3>
              {agentMode && (
                <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">
                  Agent Mode
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2 mr-2">
                <Switch 
                  id="agent-mode" 
                  checked={agentMode}
                  onCheckedChange={setAgentMode}
                />
                <Label htmlFor="agent-mode" className="text-sm">Agent Mode</Label>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAgentTaskModalOpen(true)}
                className="text-xs"
              >
                <Briefcase className="mr-1 h-3 w-3" />
                Agent Task
              </Button>
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
                            : message.type === 'tool'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-gray-100 text-gray-800'
                  } ${message.taskId ? 'border border-blue-300' : ''}`}
                >
                  {message.type === 'tool' && (
                    <div className="mb-1 text-xs font-semibold flex items-center">
                      <Settings className="w-3 h-3 mr-1" />
                      Tool: {message.toolName}
                    </div>
                  )}
                  {message.taskId && (
                    <div className="mb-1 text-xs font-semibold flex items-center">
                      <Play className="w-3 h-3 mr-1" />
                      Task: {message.taskId}
                    </div>
                  )}
                  {message.content}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {message.type === 'user' ? 'You' : message.type === 'assistant' ? 'Assistant' : message.type === 'tool' ? 'Tool' : ''}&nbsp;
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="border-t p-3">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder={agentMode ? "Ask the Agent Assistant..." : "Type a message..."}
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
      
      {/* Agent Task Modal */}
      <Dialog open={agentTaskModalOpen} onOpenChange={setAgentTaskModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Agent Task</DialogTitle>
            <DialogDescription>
              Configure an AI agent to perform a complex task.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="crawl" value={agentTaskType} onValueChange={setAgentTaskType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="crawl">Web Crawler</TabsTrigger>
              <TabsTrigger value="github">GitHub Dataset</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Graph</TabsTrigger>
            </TabsList>
            
            <TabsContent value="crawl" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-pages">Maximum Pages</Label>
                <Input 
                  id="max-pages" 
                  type="number" 
                  min="1"
                  value={agentTaskOptions.maxPages || 100}
                  onChange={(e) => setAgentTaskOptions(prev => ({
                    ...prev, 
                    maxPages: parseInt(e.target.value) || 100
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of pages to crawl.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="recursive" 
                    checked={agentTaskOptions.recursive}
                    onCheckedChange={(checked) => setAgentTaskOptions(prev => ({
                      ...prev, 
                      recursive: checked
                    }))}
                  />
                  <Label htmlFor="recursive">Crawl recursively</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Follow links to other pages on the same domain.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-depth">Maximum Depth</Label>
                <Input 
                  id="max-depth" 
                  type="number" 
                  min="1"
                  value={agentTaskOptions.maxDepth || 3}
                  onChange={(e) => setAgentTaskOptions(prev => ({
                    ...prev, 
                    maxDepth: parseInt(e.target.value) || 3
                  }))}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of links to follow from the start page.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Content Filters</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter filter term..." 
                    ref={contentFilterRef}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddContentFilter())}
                  />
                  <Button variant="outline" onClick={handleAddContentFilter} type="button">
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only include pages containing these terms.
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {agentTaskOptions.contentFilters?.map((filter, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {filter}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveContentFilter(filter)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>URL Patterns</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter regex pattern..." 
                    ref={urlPatternRef}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddUrlPattern())}
                  />
                  <Button variant="outline" onClick={handleAddUrlPattern} type="button">
                    Add
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Only follow URLs matching these patterns (regex supported).
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {agentTaskOptions.urlPatterns?.map((pattern, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {pattern}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveUrlPattern(pattern)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="export-graph" 
                    checked={agentTaskOptions.exportToGraph}
                    onCheckedChange={(checked) => setAgentTaskOptions(prev => ({
                      ...prev, 
                      exportToGraph: checked
                    }))}
                  />
                  <Label htmlFor="export-graph">Export to knowledge graph</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Create a searchable knowledge graph from the crawled content.
                </p>
              </div>
              
              {agentTaskOptions.exportToGraph && (
                <div className="space-y-2">
                  <Label htmlFor="graph-name">Graph Name</Label>
                  <Input 
                    id="graph-name" 
                    placeholder="my-knowledge-graph" 
                    value={agentTaskOptions.graphName || ''}
                    onChange={(e) => setAgentTaskOptions(prev => ({
                      ...prev, 
                      graphName: e.target.value
                    }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Name for the knowledge graph (leave empty for auto-generated name).
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="github" className="mt-4 space-y-4">
              <div className="p-4 border rounded-md bg-amber-50">
                <p className="text-sm">
                  The agent will guide you through creating a dataset from GitHub repositories or organizations. 
                  It will help identify relevant documentation, example code, and training materials.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea 
                  placeholder="Add specific instructions for the agent (optional)..."
                  rows={3}
                  onChange={(e) => setAgentTaskOptions(prev => ({
                    ...prev, 
                    githubInstructions: e.target.value
                  }))}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="knowledge" className="mt-4 space-y-4">
              <div className="p-4 border rounded-md bg-amber-50">
                <p className="text-sm">
                  The agent will help you create, query, or manage knowledge graphs. You can create new graphs from 
                  datasets or crawled content, or work with existing graph databases.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kg-graph-name">Knowledge Graph Name</Label>
                <Input 
                  id="kg-graph-name" 
                  placeholder="my-knowledge-graph" 
                  value={agentTaskOptions.graphName || ''}
                  onChange={(e) => setAgentTaskOptions(prev => ({
                    ...prev, 
                    graphName: e.target.value
                  }))}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgentTaskModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAgentTaskSubmit}>
              Start Agent Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}