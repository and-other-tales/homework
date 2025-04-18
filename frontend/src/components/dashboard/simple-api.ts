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

export async function fetchTasks(): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/tasks');

    if (!response.ok) {
      console.error(`Error fetching tasks: ${response.status}`);
      return {
        success: false,
        message: `Failed to fetch tasks (${response.status})`,
        data: { tasks: [] },
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error fetching tasks',
      data: { tasks: [] },
    };
  }
}

export async function cancelTask(taskId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      console.error(`Error cancelling task: ${response.status}`);
      return { success: false, message: `Failed to cancel task (${response.status})` };
    }

    return await response.json();
  } catch (error) {
    console.error('Error cancelling task:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error cancelling task',
    };
  }
}

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

/**
 * Send a chat message via HTTP instead of WebSockets
 */
export async function sendChatMessage(message: string, options?: {
  model?: string;
  apiKey?: string;
  agentMode?: boolean;
}): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        model: options?.model || 'gpt-3.5-turbo',
        apiKey: options?.apiKey || 'USE_SERVER_KEY',
        agentMode: options?.agentMode || false
      }),
    });

    if (!response.ok) {
      console.error(`Error sending chat message: ${response.status}`);
      return {
        success: false,
        message: `Failed to send message (${response.status})`,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending chat message:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error sending message',
    };
  }
}

/**
 * Create an agent task via HTTP instead of WebSockets
 */
export async function createAgentTask(taskType: string, message: string, options: {
  apiKey?: string;
  [key: string]: any;
}): Promise<ApiResponse<any>> {
  try {
    const response = await fetch('/api/agent-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_type: taskType,
        message,
        options: options || {},
        apiKey: options?.apiKey || 'USE_SERVER_KEY'
      }),
    });

    if (!response.ok) {
      console.error(`Error creating agent task: ${response.status}`);
      return {
        success: false,
        message: `Failed to create task (${response.status})`,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating agent task:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error creating task',
    };
  }
}

/**
 * Get task status via HTTP
 */
export async function fetchTaskStatus(taskId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, createFetchOptions());

    if (!response.ok) {
      console.error(`Error fetching task status: ${response.status}`);
      return {
        success: false,
        message: `Failed to fetch task status (${response.status})`,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching task status:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error fetching task status',
    };
  }
}