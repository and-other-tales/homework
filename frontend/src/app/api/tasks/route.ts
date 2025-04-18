import { NextRequest, NextResponse } from 'next/server';

// Backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the backend
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'list' }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding to backend:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error', tasks: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the request to the backend
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Error: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error forwarding to backend:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}