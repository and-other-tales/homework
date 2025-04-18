import { NextRequest, NextResponse } from 'next/server';

// Backend API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the backend
    const response = await fetch(`${API_URL}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
    
    // Get additional health information to enhance the status response
    let healthData = {};
    try {
      const healthResponse = await fetch(`${API_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        
        // Extract component statuses for the dashboard
        healthData = {
          github_status: health.components?.github_api?.status === 'up',
          huggingface_status: health.components?.huggingface_api?.status === 'up',
          neo4j_status: health.components?.neo4j?.status === 'up',
          dataset_count: 0, // This would need to come from another API call
          cache_size: '0 MB', // This would need to come from another API call
        };
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      // We'll continue even if health check fails, just with less data
    }
    
    // Combine status and health data
    const enhancedData = {
      ...data,
      ...healthData
    };
    
    return NextResponse.json(enhancedData);
  } catch (error) {
    console.error('Error forwarding to backend:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        status: 'unknown',
        version: 'unknown',
        github_status: false,
        huggingface_status: false,
        neo4j_status: false,
        dataset_count: 0,
        cache_size: '0 MB'
      },
      { status: 500 }
    );
  }
}