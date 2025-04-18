import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    // Check if Docker is installed
    try {
      await execAsync('docker --version');
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Docker is not installed or not available from this environment. Please install Docker first.' 
      }, { status: 500 });
    }
    
    // Check if Neo4j container is already running
    try {
      const { stdout: containersOutput } = await execAsync('docker ps --filter "name=homework-neo4j" --format "{{.Names}}"');
      
      if (containersOutput.trim()) {
        // Container exists and is running, get its info
        const { stdout: portOutput } = await execAsync('docker port homework-neo4j');
        
        // Parse the password from environment variables
        const { stdout: envOutput } = await execAsync('docker exec homework-neo4j printenv NEO4J_AUTH');
        const password = envOutput.split('/')[1]?.trim() || 'password';
        
        return NextResponse.json({
          success: true, 
          message: 'Neo4j container is already running',
          data: {
            uri: 'bolt://localhost:7687',
            username: 'neo4j',
            password: password
          }
        });
      }
    } catch (error) {
      // Ignore error, container probably doesn't exist yet
    }
    
    // Generate a random password
    const randomPassword = Math.random().toString(36).substring(2, 12);
    
    // Start Neo4j container
    const dockerCommand = `docker run -d --name homework-neo4j \
      -p 7474:7474 -p 7687:7687 \
      -e NEO4J_AUTH=neo4j/${randomPassword} \
      -e NEO4J_server_memory_pagecache_size=512M \
      -e NEO4J_server_memory_heap_initial__size=512M \
      -e NEO4J_server_memory_heap_max__size=1G \
      -v neo4j-data:/data \
      neo4j:5.3`;
    
    await execAsync(dockerCommand);
    
    // Wait for Neo4j to start up (might take a few seconds)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return NextResponse.json({
      success: true, 
      message: 'Neo4j container deployed successfully',
      data: {
        uri: 'bolt://localhost:7687',
        username: 'neo4j',
        password: randomPassword
      }
    });
  } catch (error) {
    console.error('Error deploying Neo4j:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error deploying Neo4j container' 
    }, { status: 500 });
  }
}