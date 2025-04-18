/**
 * Ultra simple API client for tasks page
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

export interface TaskStatus {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  message: string;
  created_at: string;
  updated_at: string;
  result?: any;
}

// Most basic client possible
export const fetchTaskList = async (): Promise<ApiResponse<{ tasks: TaskStatus[] }>> => {
  try {
    // First try the Next.js API route
    const response = await fetch('/api/tasks');
    
    if (!response.ok) {
      return {
        success: false,
        message: `API Error: ${response.status} - ${response.statusText}`,
      };
    }
    
    // Parse the response
    const responseData = await response.json();
    
    // Check if the response contains tasks data
    if (responseData.data && responseData.data.tasks) {
      return {
        success: true,
        message: responseData.message || "Tasks loaded successfully",
        data: responseData.data,
      };
    } else {
      return {
        success: false,
        message: "No task data received from server",
      };
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const cancelTask = async (taskId: string): Promise<ApiResponse<any>> => {
  try {
    // First try the Next.js API route
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cancel',
        task_id: taskId,
      }),
    });
    
    if (!response.ok) {
      return {
        success: false,
        message: `API Error: ${response.status} - ${response.statusText}`,
      };
    }
    
    return {
      success: true,
      message: "Task cancelled successfully",
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error cancelling task:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};