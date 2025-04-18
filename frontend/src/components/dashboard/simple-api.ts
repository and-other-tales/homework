/**
 * Ultra simple API client for dashboard components
 */
import { config, getApiUrl } from '@/config';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Helper to create fetch options with proper SSL handling
const createFetchOptions = (options: RequestInit = {}): RequestInit => {
  // Create a new options object to avoid modifying the input
  const fetchOptions: RequestInit = { ...options };
  
  // Add node-fetch specific options for SSL certificate handling if needed
  // This is for the server-side fetching from Next.js API routes
  if (!fetchOptions.next) {
    fetchOptions.next = {
      // @ts-ignore - There's a type issue with the revalidate property
      revalidate: 0, // Don't cache
    };
  }
  
  return fetchOptions;
};

// Most basic client possible
export const fetchStatus = async (): Promise<ApiResponse<any>> => {
  try {
    // First try the Next.js API route
    const response = await fetch('/api/status', createFetchOptions());
    
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
    const response = await fetch('/api/tasks', createFetchOptions());
    
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
    const response = await fetch('/api/tasks', createFetchOptions({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cancel',
        task_id: taskId,
      }),
    }));
    
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

export const fetchHumanInLoopTasks = async (): Promise<ApiResponse<any>> => {
  try {
    // First try the Next.js API route
    const response = await fetch('/api/agent-tasks/human', createFetchOptions());
    
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
      // For now, return mock data for development
      return {
        success: true,
        message: "Success (mock data)",
        data: { 
          tasks: [
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
          ] 
        }
      };
    }
  } catch (error) {
    console.error('Error fetching human-in-loop tasks:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};