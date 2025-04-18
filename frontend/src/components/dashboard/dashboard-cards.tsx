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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  AlertCircle, CheckCircle2, Edit2, MessageSquare, X, 
  Eye, XCircle, Play, Clock, Loader2, RefreshCw, RotateCw,
  Server, Cpu, HardDrive, ArrowRight, PlusCircle
} from 'lucide-react';
import { format as dateFormat, formatDistanceToNow } from 'date-fns';
import { fetchTasks, cancelTask, fetchStatus } from './simple-api';

// Export a combined card component that includes both task views
export function DashboardCards() {
  // Get server status
  const [serverStatus, setServerStatus] = useState({
    online: true,
    apiPort: '8080',
    version: '1.0.0',
    uptime: '0 days',
    memoryUsage: '0%'
  });
  
  const [statusLoading, setStatusLoading] = useState(true);
  
  // Get server status on mount
  useEffect(() => {
    async function fetchServerStatus() {
      try {
        setStatusLoading(true);
        const response = await fetchStatus();
        if (response.success) {
          const data = response.data || {};
          setServerStatus({
            online: true,
            apiPort: data.port || '8080',
            version: data.version || '1.0.0',
            uptime: data.uptime || '0 days',
            memoryUsage: data.memory_usage || '0%'
          });
        }
      } catch (error) {
        console.error('Error fetching server status:', error);
      } finally {
        setStatusLoading(false);
      }
    }
    
    fetchServerStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Server Status Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Server Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`h-2.5 w-2.5 rounded-full ${serverStatus.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-medium">
                {serverStatus.online ? 'Online' : 'Offline'}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              API Port: {serverStatus.apiPort}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Version:</span>
              <span className="text-xs font-medium">{serverStatus.version}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Uptime:</span>
              <span className="text-xs font-medium">{serverStatus.uptime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Memory:</span>
              <span className="text-xs font-medium">{serverStatus.memoryUsage}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Current Tasks Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Current Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Tasks</span>
              <span className="text-sm font-bold">3</span>
            </div>
            <Progress value={33} className="h-2" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">1 of 3 completed</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                <a href="/tasks">
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-18 justify-start flex-col items-center py-3">
              <PlusCircle className="h-4 w-4 mb-1" />
              <span className="text-xs">New Task</span>
            </Button>
            <Button variant="outline" size="sm" className="h-18 justify-start flex-col items-center py-3" asChild>
              <a href="/chat">
                <MessageSquare className="h-4 w-4 mb-1" />
                <span className="text-xs">Chat</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" className="h-18 justify-start flex-col items-center py-3" asChild>
              <a href="/knowledge_graphs">
                <Server className="h-4 w-4 mb-1" />
                <span className="text-xs">Graphs</span>
              </a>
            </Button>
            <Button variant="outline" size="sm" className="h-18 justify-start flex-col items-center py-3" asChild>
              <a href="/configuration">
                <Cpu className="h-4 w-4 mb-1" />
                <span className="text-xs">Config</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
