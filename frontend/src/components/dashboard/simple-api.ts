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
    
    // Parse the response data
    const responseData = await response.json();
    
    // Check if the response contains the expected format
    if (responseData.success && responseData.data?.tasks) {
      return {
        success: true,
        message: responseData.message || "Success",
        data: responseData.data,
      };
    } else if (responseData.tasks) {
      // Handle alternative response format
      return {
        success: true,
        message: "Success",
        data: { tasks: responseData.tasks },
      };
    } else {
      // Fallback for any response format
      return {
        success: true,
        message: "Success",
        data: { tasks: [] },
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