/**
 * Ultra simple API client for dashboard components
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Most basic client possible
export const fetchStatus = async (): Promise<ApiResponse<any>> => {
  try {
    // First try the Next.js API route
    const response = await fetch('/api/status');
    
    if (!response.ok) {
      return {
        success: false,
        message: `API Error: ${response.status} - ${response.statusText}`,
      };
    }
    
    return {
      success: true,
      message: "Success",
      data: await response.json(),
    };
  } catch (error) {
    console.error('Error fetching status:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const fetchTasks = async (): Promise<ApiResponse<any>> => {
  try {
    // First try the Next.js API route
    const response = await fetch('/api/tasks');
    
    if (!response.ok) {
      return {
        success: false,
        message: `API Error: ${response.status} - ${response.statusText}`,
      };
    }
    
    return {
      success: true,
      message: "Success",
      data: await response.json(),
    };
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