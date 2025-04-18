import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source_type, source_name, dataset_name, description } = body;
    
    // Validate required fields
    if (!source_type || !source_name || !dataset_name) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: source_type, source_name, and dataset_name are required' 
        },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/api/datasets/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_type,
        source_name,
        dataset_name,
        description: description || `Dataset generated from ${source_type} ${source_name}`,
      }),
    });
    
    const data = await response.json();
    
    // Forward the backend response
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error generating dataset:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate dataset', error: String(error) },
      { status: 500 }
    );
  }
}