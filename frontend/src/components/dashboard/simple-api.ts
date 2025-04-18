/**
 * Simple API client for dashboard functionality
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// Helper function to create consistent fetch options
function createFetchOptions(options: RequestInit = {}): RequestInit {
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  return {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };
}

export const fetchStatus = async (): Promise<ApiResponse<any>> => {
  try {
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
    const response = await fetch('/api/tasks', createFetchOptions());

    if (!response.ok) {
      return {
        success: false,
        message: `API Error: ${response.status} - ${response.statusText}`,
      };
    }

    const responseData = await response.json();

    if (responseData.success && responseData.data?.tasks) {
      return {
        success: true,
        message: responseData.message || "Success",
        data: responseData.data,
      };
    } else if (responseData.tasks) {
      return {
        success: true,
        message: "Success",
        data: { tasks: responseData.tasks },
      };
    } else {
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
    const response = await fetch('/api/tasks', createFetchOptions({
      method: 'POST',
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
    const response = await fetch('/api/agent-tasks/human', createFetchOptions());

    if (!response.ok) {
      return {
        success: false,
        message: `API Error: ${response.status} - ${response.statusText}`,
      };
    }

    const responseData = await response.json();

    if (responseData.success && responseData.data?.tasks) {
      return {
        success: true,
        message: responseData.message || "Success",
        data: responseData.data,
      };
    } else if (responseData.tasks) {
      return {
        success: true,
        message: "Success",
        data: { tasks: responseData.tasks },
      };
    } else {
      return {
        success: true,
        message: "Success",
        data: { tasks: [] },
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