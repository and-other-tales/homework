'use client';

import { DashboardTaskList } from "./task-list";
import { AgentInboxDashboard } from "./agent-inbox-dashboard";

// Export a combined card component that includes both task views
export function DashboardCards() {
  return (
    <div className="grid gap-4 grid-cols-1">
      {/* We'll replace both components with our new unified task viewer */}
      <UnifiedTaskViewer />
    </div>
  );
}

// Create a new unified task viewer that combines both task management components
import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  AlertCircle, CheckCircle2, Edit2, MessageSquare, X, 
  Eye, XCircle, Play, Clock, Loader2, RefreshCw, RotateCw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fetchTasks, cancelTask } from './simple-api';

// Define local formatDate function
function formatDate(date: string | Date, format = "PPp") {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // If it's less than a day ago, show relative time
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  }
  
  // Otherwise show formatted date
  return format(dateObj, format);
}

// Define task types
type SystemTask = {
  id: string;
  type: string;
  status: string;
  progress: number;
  description: string;
  created_at: string;
  updated_at: string;
  message?: string;
};

type HumanInLoopTask = {
  id: string;
  action_request: {
    action: string;
    args: Record<string, any>;
  };
  description: string;
  config: {
    allow_ignore: boolean;
    allow_respond: boolean;
    allow_edit: boolean;
    allow_accept: boolean;
  };
  status: string;
  created_at: string;
};

export function UnifiedTaskViewer() {
  // State for system tasks
  const [systemTasks, setSystemTasks] = useState<SystemTask[]>([]);
  const [systemTasksLoading, setSystemTasksLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // State for human-in-loop tasks
  const [humanTasks, setHumanTasks] = useState<HumanInLoopTask[]>([]);
  const [humanTasksLoading, setHumanTasksLoading] = useState(true);
  
  // Selected task and action dialog state
  const [selectedTask, setSelectedTask] = useState<HumanInLoopTask | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'accept' | 'edit' | 'respond' | null>(null);
  const [responseText, setResponseText] = useState('');
  const [editedArgs, setEditedArgs] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch system tasks
  useEffect(() => {
    async function loadSystemTasks() {
      try {
        setSystemTasksLoading(true);
        const response = await fetchTasks();
        if (response.success) {
          setSystemTasks(response.data?.tasks || []);
        }
      } catch (error) {
        console.error('Error fetching system tasks:', error);
      } finally {
        setSystemTasksLoading(false);
      }
    }

    loadSystemTasks();
    
    // Set up a polling interval to refresh tasks every 15 seconds
    const interval = setInterval(loadSystemTasks, 15000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Fetch human-in-loop tasks
  useEffect(() => {
    async function loadHumanTasks() {
      try {
        setHumanTasksLoading(true);
        // In a real app, this would fetch from your API
        // For now, we'll use mock data
        const mockTasks: HumanInLoopTask[] = [
          {
            id: "hil_" + Math.floor(Math.random() * 1000),
            action_request: {
              action: "approve_code_change",
              args: {
                file_path: "/src/main.py",
                old_code: "def process_data(data):\n    return data",
                new_code: "def process_data(data):\n    # Add validation\n    if not data:\n        return None\n    return data"
              }
            },
            description: "AI suggests adding validation to the process_data function. Please review and approve the change.",
            config: {
              allow_ignore: true,
              allow_respond: true,
              allow_edit: true,
              allow_accept: true
            },
            status: "pending",
            created_at: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
          }
        ];
        
        setHumanTasks(mockTasks);
      } catch (error) {
        console.error('Error fetching human-in-loop tasks:', error);
      } finally {
        setHumanTasksLoading(false);
      }
    }

    loadHumanTasks();
    
    // Also refresh human tasks periodically
    const interval = setInterval(loadHumanTasks, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle refresh tasks
  const handleRefreshTasks = async () => {
    setRefreshing(true);
    try {
      const response = await fetchTasks();
      if (response.success) {
        setSystemTasks(response.data?.tasks || []);
      }
      
      // Also refresh human tasks here (in a real app)
      // const humanResponse = await fetchHumanTasks();
      // if (humanResponse.success) {
      //   setHumanTasks(humanResponse.data?.tasks || []);
      // }
    } catch (error) {
      console.error('Error refreshing tasks:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle system task actions
  const handleViewSystemTask = (taskId: string) => {
    console.log('View task:', taskId);
    // Open task details modal
  };

  const handleCancelSystemTask = async (taskId: string) => {
    try {
      const response = await cancelTask(taskId);
      
      if (response.success) {
        toast.success("Task cancelled successfully");
        // Update the task list
        setSystemTasks(systemTasks.map(task => 
          task.id === taskId ? { ...task, status: 'cancelled', progress: -1 } : task
        ));
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error("Failed to cancel task");
    }
  };

  const handleResumeSystemTask = async (taskId: string) => {
    try {
      toast.success("Task resumed");
      // This would need to be added to the backend API
      // For now, we'll just update the UI as if it succeeded
      setSystemTasks(systemTasks.map(task => 
        task.id === taskId ? { ...task, status: 'in_progress', progress: task.progress < 0 ? 0 : task.progress } : task
      ));
    } catch (error) {
      console.error('Error resuming task:', error);
      toast.error("Failed to resume task");
    }
  };

  // Handle human-in-loop task actions
  const handleHumanTaskAction = (task: HumanInLoopTask, action: 'accept' | 'edit' | 'respond' | 'ignore') => {
    setSelectedTask(task);
    
    if (action === 'ignore') {
      // Handle ignore immediately
      handleSubmitHumanTaskAction('ignore', null);
    } else {
      // For other actions, open the dialog
      setActionType(action);
      
      // Initialize edited args for edit action
      if (action === 'edit') {
        setEditedArgs({...task.action_request.args});
      }
      
      setActionDialogOpen(true);
    }
  };

  const handleSubmitHumanTaskAction = async (
    action: 'accept' | 'edit' | 'respond' | 'ignore', 
    data: any
  ) => {
    if (!selectedTask) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real app, this would send to your API
      console.log('Submitting action:', {
        task_id: selectedTask.id,
        action,
        data
      });
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update tasks list by removing the handled task
      setHumanTasks(humanTasks.filter(t => t.id !== selectedTask.id));
      
      // Show success message
      const actionMessages = {
        accept: 'Task accepted successfully',
        edit: 'Task edited successfully',
        respond: 'Response submitted successfully',
        ignore: 'Task ignored'
      };
      
      toast.success(actionMessages[action]);
      
      // Reset states
      setSelectedTask(null);
      setActionType(null);
      setResponseText('');
      setEditedArgs({});
      setActionDialogOpen(false);
    } catch (error) {
      console.error('Error submitting action:', error);
      toast.error('Failed to submit action');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status badge for system tasks
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"><CheckCircle2 className="mr-1 h-3 w-3" /> Completed</span>;
      case 'in_progress':
      case 'running':
      case 'pending':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"><Clock className="mr-1 h-3 w-3" /> In Progress</span>;
      case 'paused':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"><AlertCircle className="mr-1 h-3 w-3" /> Paused</span>;
      case 'failed':
      case 'cancelled':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"><XCircle className="mr-1 h-3 w-3" /> Failed</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{status}</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Unified Task Management</CardTitle>
          <CardDescription>
            Manage system tasks and respond to human-in-loop requests
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshTasks}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/tasks">View All Tasks</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="system">
          <TabsList className="mb-4">
            <TabsTrigger value="system">System Tasks</TabsTrigger>
            <TabsTrigger value="human">Human-in-Loop Tasks</TabsTrigger>
          </TabsList>
          
          {/* System Tasks Tab */}
          <TabsContent value="system">
            {systemTasksLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
                <span className="ml-2">Loading tasks...</span>
              </div>
            ) : systemTasks.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                      <th className="px-4 py-3">Task ID</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Started</th>
                      <th className="px-4 py-3">Progress</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemTasks.slice(0, 5).map((task) => (
                      <tr key={task.id} className="border-b">
                        <td className="px-4 py-3 text-sm">{task.id}</td>
                        <td className="px-4 py-3 text-sm">{task.type}</td>
                        <td className="px-4 py-3 text-sm">{getStatusBadge(task.status)}</td>
                        <td className="px-4 py-3 text-sm">{formatDate(task.created_at)}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <div 
                              className={`absolute h-full ${task.progress < 0 ? 'bg-red-500' : 'bg-primary'}`}
                              style={{ width: `${task.progress < 0 ? 100 : task.progress}%` }}
                            ></div>
                          </div>
                          <span className="mt-1 text-xs">{task.progress < 0 ? 'Failed' : `${task.progress}%`}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleViewSystemTask(task.id)}
                              title="View Task"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(task.status === 'in_progress' || task.status === 'running' || task.status === 'pending') && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleCancelSystemTask(task.id)}
                                title="Cancel Task"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                            {task.status === 'paused' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleResumeSystemTask(task.id)}
                                title="Resume Task"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-center text-muted-foreground">No active tasks found. Start a new task to begin processing data.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Human-in-Loop Tasks Tab */}
          <TabsContent value="human">
            {humanTasksLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <span className="ml-2">Loading tasks...</span>
              </div>
            ) : humanTasks.length > 0 ? (
              <div className="space-y-4">
                {humanTasks.map((task) => (
                  <div key={task.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-lg font-medium">{task.action_request.action}</h3>
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                        Waiting for review
                      </span>
                    </div>
                    <div className="mb-4">
                      <div className="mb-2 text-sm text-gray-600">
                        Created {formatDate(task.created_at)}
                      </div>
                      <div className="mb-4 rounded-md bg-gray-50 p-3 text-sm">
                        {task.description}
                      </div>
                      <div className="mb-2 font-medium">Arguments:</div>
                      <pre className="mb-4 overflow-auto rounded-md bg-gray-100 p-3 text-xs">
                        {JSON.stringify(task.action_request.args, null, 2)}
                      </pre>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.config.allow_accept && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleHumanTaskAction(task, 'accept')}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Accept
                        </Button>
                      )}
                      {task.config.allow_edit && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleHumanTaskAction(task, 'edit')}
                        >
                          <Edit2 className="mr-1 h-4 w-4" /> Edit
                        </Button>
                      )}
                      {task.config.allow_respond && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleHumanTaskAction(task, 'respond')}
                        >
                          <MessageSquare className="mr-1 h-4 w-4" /> Respond
                        </Button>
                      )}
                      {task.config.allow_ignore && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleHumanTaskAction(task, 'ignore')}
                        >
                          <X className="mr-1 h-4 w-4" /> Ignore
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-center text-muted-foreground">No tasks requiring human intervention at this time.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t bg-slate-50/50 px-6 py-3">
        <p className="text-xs text-muted-foreground">Tasks are automatically monitored and managed by the system.</p>
      </CardFooter>

      {/* Action Dialog for Human-in-Loop Tasks */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' ? 'Accept Task' : 
               actionType === 'edit' ? 'Edit Task' : 
               'Respond to Task'}
            </DialogTitle>
          </DialogHeader>
          
          {actionType === 'accept' && selectedTask && (
            <div className="space-y-4">
              <p>Are you sure you want to accept this task with the current arguments?</p>
              <pre className="max-h-60 overflow-auto rounded-md bg-gray-100 p-3 text-xs">
                {JSON.stringify(selectedTask.action_request.args, null, 2)}
              </pre>
            </div>
          )}
          
          {actionType === 'edit' && selectedTask && (
            <div className="space-y-4">
              <p>Edit the arguments before submitting:</p>
              <div className="space-y-4">
                {Object.entries(editedArgs).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <Label htmlFor={`edit-${key}`}>{key}</Label>
                    {typeof value === 'string' && value.length > 50 ? (
                      <Textarea
                        id={`edit-${key}`}
                        value={value}
                        onChange={(e) => setEditedArgs({...editedArgs, [key]: e.target.value})}
                        rows={4}
                      />
                    ) : (
                      <Input
                        id={`edit-${key}`}
                        value={value}
                        onChange={(e) => setEditedArgs({...editedArgs, [key]: e.target.value})}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {actionType === 'respond' && (
            <div className="space-y-4">
              <p>Enter your response:</p>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response here..."
                rows={5}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setActionDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (actionType === 'accept') {
                  handleSubmitHumanTaskAction('accept', null);
                } else if (actionType === 'edit') {
                  handleSubmitHumanTaskAction('edit', editedArgs);
                } else if (actionType === 'respond') {
                  handleSubmitHumanTaskAction('respond', responseText);
                }
              }}
              disabled={isSubmitting || (actionType === 'respond' && !responseText)}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
