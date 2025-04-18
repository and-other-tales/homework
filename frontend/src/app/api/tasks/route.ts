import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config';
import https from 'https';

// Backend API URL from config
const API_URL = config.api.baseUrl;

// Create custom HTTPS agent for self-signed certificates in development
const httpsAgent = new https.Agent({
  rejectUnauthorized: config.api.nodeRejectUnauthorized
});

export async function GET(request: NextRequest) {
  try {
    // Forward the request to the backend
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Add HTTPS agent if needed (for self-signed certificates)
    if (API_URL.startsWith('https://')) {
      // @ts-ignore - The agent property is not in the TypeScript types
      fetchOptions.agent = httpsAgent;
    }

    const response = await fetch(`${API_URL}/api/agent/tasks`, fetchOptions);

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // If backend request fails, handle it gracefully
    console.warn("Backend request failed, using mock task data");
    return NextResponse.json(
      { error: true, message: 'Failed to fetch tasks from backend' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Error in tasks API route:', error);
    return NextResponse.json(
      { error: true, message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward the request to the backend
    const fetchOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    };

    // Add HTTPS agent if needed (for self-signed certificates)
    if (API_URL.startsWith('https://')) {
      // @ts-ignore - The agent property is not in the TypeScript types
      fetchOptions.agent = httpsAgent;
    }

    const response = await fetch(`${API_URL}/api/agent/tasks`, fetchOptions);

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }

    // If backend request fails, handle it gracefully
    console.warn("Backend task action failed, using mock response");
    return NextResponse.json(
      { error: true, message: 'Failed to perform task action on backend' },
      { status: response.status }
    );
  } catch (error) {
    console.error('Error in tasks POST route:', error);
    return NextResponse.json(
      { error: true, message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
