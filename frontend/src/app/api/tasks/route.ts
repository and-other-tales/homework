import { NextResponse } from 'next/server';

/**
 * GET handler for tasks API route
 * Fetches tasks from the backend API with robust error handling
 */
export async function GET(request: Request) {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/tasks`;
    console.log(`Fetching tasks from: ${apiUrl}`);

    // Add timeout for fetch to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      next: { revalidate: 0 } // Don't cache
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle API error responses
      const errorData = await response.json().catch(() => ({}));
      console.error(`API responded with error ${response.status}:`, errorData);
      
      return NextResponse.json({
        success: false,
        message: errorData.message || `API responded with status ${response.status}`,
        data: { tasks: [] }
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    
    // More detailed error messages based on error type
    let errorMessage = 'Unknown error occurred while fetching tasks';
    let status = 500;
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Failed to connect to the backend API. Please check that the backend server is running.';
      status = 503; // Service Unavailable
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      errorMessage = 'Request timed out. The backend server is taking too long to respond.';
      status = 504; // Gateway Timeout
    }

    // Return a fallback response with empty tasks array to prevent UI errors
    return NextResponse.json({
      success: false,
      message: errorMessage,
      data: { tasks: [] }
    }, { status });
  }
}

/**
 * POST handler for canceling a task
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { taskId } = body;
    
    if (!taskId) {
      return NextResponse.json({
        success: false,
        message: 'Task ID is required'
      }, { status: 400 });
    }
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/tasks/${taskId}/cancel`;
    
    // Add timeout for fetch to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        message: errorData.message || `Failed to cancel task (${response.status})`
      }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error canceling task:', error);
    
    let errorMessage = 'Unknown error occurred while canceling task';
    let status = 500;
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Failed to connect to the backend API. Please check that the backend server is running.';
      status = 503;
    } else if (error instanceof DOMException && error.name === 'AbortError') {
      errorMessage = 'Request timed out. The backend server is taking too long to respond.';
      status = 504;
    }
    
    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status });
  }
}
