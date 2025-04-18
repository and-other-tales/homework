import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const configuration = await request.json();

    // Forward the configuration to the backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/configuration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configuration),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        success: false, 
        message: errorData.message || 'Failed to save configuration' 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in configuration API route:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error saving configuration' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Get configuration from backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/configuration`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        success: false, 
        message: errorData.message || 'Failed to get configuration' 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error fetching configuration' 
    }, { status: 500 });
  }
}