'use client';

import { useState, useEffect } from "react";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Play, Pause, AlertCircle, CheckCircle, RefreshCw, 
  Clock, Loader2, RotateCw, Filter 
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchTaskList, cancelTask, TaskStatus } from './simple-api';

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Tasks categorized by status
  const activeTasks = tasks.filter(task => 
    task.status === 'pending' || task.status === 'running'
  );
  
  const completedTasks = tasks.filter(task => 
    task.status === 'completed' || task.status === 'failed'
  );
  
  // Function to load tasks
  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await fetchTaskList();
      
      if (response.success && response.data?.tasks) {
        setTasks(response.data.tasks);
      } else {
        toast.error(`Failed to load tasks: ${response.message}`);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to refresh tasks
  const handleRefreshTasks = async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  };
  
  // Function to cancel a task
  const handleCancelTask = async (taskId: string) => {
    try {
      const response = await cancelTask(taskId);
      
      if (response.success) {
        toast.success('Task cancelled successfully');
        
        // Update task status in the UI immediately
        setTasks(prev => prev.map(task => 
          task.id === taskId 
            ? { ...task, status: 'cancelled' } 
            : task
        ));
        
        // Reload after a short delay to get updated data
        setTimeout(loadTasks, 1000);
      } else {
        toast.error(`Failed to cancel task: ${response.message}`);
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error('Failed to cancel task');
    }
  };
  
  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
    
    // Refresh active tasks periodically
    const intervalId = setInterval(() => {
      if (activeTasks.length > 0) {
        loadTasks();
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    
    if (diffSec < 60) return `${diffSec} seconds ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
  };
  
  return (
    <PageLayout title="Tasks">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tasks</h1>
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
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : activeTasks.length > 0 ? (
                activeTasks.map(task => (
                  <div key={task.id} className="rounded-md border p-4">
                    <div className="flex justify-between">
                      <div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                          <h3 className="text-lg font-medium">
                            {task.type}: {task.id}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Started: {formatRelativeTime(task.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleCancelTask(task.id)}
                        >
                          <AlertCircle className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-sm mb-1">Progress: {task.progress}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {task.message}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">
                    No active tasks. Create a task using the GitHub or Web Crawler tools.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : completedTasks.length > 0 ? (
                completedTasks.map(task => (
                  <div key={task.id} className="rounded-md border p-4">
                    <div className="flex justify-between">
                      <div>
                        <div className="flex items-center">
                          {task.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                          )}
                          <h3 className="text-lg font-medium">
                            {task.type}: {task.id}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {task.status === 'completed' ? 'Completed' : 'Failed'}: {formatRelativeTime(task.updated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">{task.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">No completed tasks found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}