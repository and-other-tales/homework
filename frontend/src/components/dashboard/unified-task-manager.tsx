'use client';

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
import { 
  AlertCircle, CheckCircle2, Edit2, MessageSquare, X, 
  Eye, XCircle, Play, Clock, Loader2, RefreshCw, RotateCw
} from 'lucide-react';
import { format as dateFormat, formatDistanceToNow } from 'date-fns';
import { fetchTasks, cancelTask, fetchHumanInLoopTasks } from './simple-api';
import { toast } from 'sonner';

// Define local formatDate function
function formatDate(date: string | Date, formatString = "PPp") {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // If it's less than a day ago, show relative time
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return formatDistanceToNow(dateObj, { addSuffix: true });
  }
  
  // Otherwise show formatted date
  return dateFormat(dateObj, formatString);
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

export function UnifiedTaskManager() {
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
            onClick={() => {
              setRefreshing(true);
              Promise.all([
                fetchTasks(),
                fetchHumanInLoopTasks()
              ]).then(([tasksResponse, humanResponse]) => {
                if (tasksResponse.success) {
                  setSystemTasks(tasksResponse.data?.tasks || []);
                }
                if (humanResponse.success) {
                  setHumanTasks(humanResponse.data?.tasks || []);
                }
              }).catch(error => {
                console.error('Error refreshing tasks:', error);
              }).finally(() => {
                setRefreshing(false);
              });
            }}
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
                              title="View Task"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(task.status === 'in_progress' || task.status === 'running' || task.status === 'pending') && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Cancel Task"
                                onClick={() => {
                                  cancelTask(task.id)
                                    .then(response => {
                                      if (response.success) {
                                        toast.success("Task cancelled successfully");
                                        setSystemTasks(systemTasks.map(t => 
                                          t.id === task.id ? { ...t, status: 'cancelled', progress: -1 } : t
                                        ));
                                      }
                                    })
                                    .catch(error => {
                                      console.error('Error cancelling task:', error);
                                      toast.error("Failed to cancel task");
                                    });
                                }}
                              >
                                <XCircle className="h-4 w-4" />
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
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">{task.action_request.action}</h3>
                      <div className="mb-2 text-sm text-gray-600">
                        Created {formatDate(task.created_at)}
                      </div>
                      <div className="mb-4 rounded-md bg-gray-50 p-3 text-sm">
                        {task.description}
                      </div>
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
    </Card>
  );
}
