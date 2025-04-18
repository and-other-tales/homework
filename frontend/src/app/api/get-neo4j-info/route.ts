import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get Neo4j configuration from backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/neo4j-info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ 
        success: false, 
        message: errorData.message || 'Failed to get Neo4j information' 
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      data: {
        uri: data.data?.uri || 'bolt://localhost:7687',
        username: data.data?.username || 'neo4j'
      }
    });
  } catch (error) {
    console.error('Error fetching Neo4j information:', error);
    
    // Return default values as fallback
    return NextResponse.json({ 
      success: true,
      message: 'Using default Neo4j connection values',
      data: {
        uri: 'bolt://localhost:7687',
        username: 'neo4j'
      }
    });
  }
}