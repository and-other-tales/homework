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
    
    // For development: Use mock response instead of forwarding to backend
    // This prevents 404 errors in development
    console.log(`Generating dataset from ${source_type} ${source_name}`);
    
    // Mock successful response
    const mockData = {
      success: true,
      task_id: `task_${Date.now()}`,
      message: `Dataset generation started for ${dataset_name}`,
      data: {
        source_type,
        source_name,
        dataset_name
      }
    };
    
    // Return mock response
    return NextResponse.json(mockData, { status: 200 });
  } catch (error) {
    console.error('Error generating dataset:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate dataset', error: String(error) },
      { status: 500 }
    );
  }
}