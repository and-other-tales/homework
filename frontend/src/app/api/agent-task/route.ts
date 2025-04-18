import { NextRequest, NextResponse } from 'next/server';

// Define types for the request payload
interface AgentTaskRequest {
  task_type: string;
  message: string;
  options: Record<string, any>;
  apiKey?: string;
}

// Define types for the response
interface AgentTaskResponse {
  taskId: string;
  status: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json() as AgentTaskRequest;
    const { task_type, message, options, apiKey } = body;
    
    // Validate required fields
    if (!task_type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: task_type and message are required' },
        { status: 400 }
      );
    }

    // Call the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const apiEndpoint = `${backendUrl}/api/agent/tasks`;
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-KEY': apiKey })
      },
      body: JSON.stringify({
        task_type,
        message,
        options
      }),
    });
    
    // Handle backend response
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to create agent task' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      taskId: data.task_id,
      status: data.status,
      message: 'Agent task created successfully'
    });
  } catch (error) {
    console.error('Error creating agent task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get task ID from the query parameters
    const taskId = request.nextUrl.searchParams.get('taskId');
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing required parameter: taskId' },
        { status: 400 }
      );
    }

    // Call the backend API to get task status
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const apiEndpoint = `${backendUrl}/api/agent/tasks/${taskId}`;
    
    const apiKey = request.headers.get('X-API-KEY');
    
    const response = await fetch(apiEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'X-API-KEY': apiKey })
      }
    });
    
    // Handle backend response
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to get task status' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error getting task status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}