import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper function to execute with sudo if needed
async function execWithSudo(command: string): Promise<{stdout: string, stderr: string}> {
  try {
    // Try without sudo first
    console.log(`Executing: ${command}`);
    return await execAsync(command);
  } catch (error) {
    console.error(`Command failed without sudo: ${error.message}`);
    
    if (error.message.includes('permission denied') || 
        error.message.includes('Permission denied') ||
        error.message.includes('EACCES')) {
      
      // Use pkexec or sudo depending on what's available
      console.log(`Retrying with sudo: sudo ${command}`);
      try {
        return await execAsync(`sudo ${command}`);
      } catch (sudoError) {
        console.error(`Command also failed with sudo: ${sudoError.message}`);
        throw new Error(`Command failed with and without sudo: ${sudoError.message}`);
      }
    }
    
    // If it's not a permission error, rethrow
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    console.log('Starting Neo4j Docker deployment...');
    
    // Check if Docker is installed - try with and without sudo
    try {
      try {
        const { stdout } = await execAsync('docker --version');
        console.log('Docker version detected:', stdout.trim());
      } catch (error) {
        // Try with sudo if permission denied
        if (error.message.includes('permission denied') || 
            error.message.includes('Permission denied') ||
            error.message.includes('EACCES')) {
          
          console.log('Trying docker with sudo due to permission issues');
          const { stdout } = await execAsync('sudo docker --version');
          console.log('Docker version detected (with sudo):', stdout.trim());
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Docker check error:', error);
      return NextResponse.json({ 
        success: false, 
        message: 'Docker is not installed, not available, or requires sudo permissions. Please install Docker or run this application with appropriate permissions.' 
      }, { status: 500 });
    }
    
    // Check if Neo4j container is already running
    let containerExists = false;
    
    try {
      console.log('Checking for existing Neo4j container...');
      const { stdout: containersOutput } = await execAsync('docker ps -a --filter "name=homework-neo4j" --format "{{.Names}}"');
      
      if (containersOutput.trim()) {
        containerExists = true;
        console.log('Found existing Neo4j container:', containersOutput.trim());
        
        // Check if the container is running
        const { stdout: statusOutput } = await execAsync('docker ps --filter "name=homework-neo4j" --format "{{.Status}}"');
        
        if (statusOutput.trim()) {
          console.log('Container is running with status:', statusOutput.trim());
          
          // Container exists and is running, get its info
          const { stdout: portOutput } = await execAsync('docker port homework-neo4j');
          console.log('Container ports:', portOutput.trim());
          
          try {
            // Parse the password from environment variables
            const { stdout: envOutput } = await execAsync('docker exec homework-neo4j printenv NEO4J_AUTH');
            console.log('Container auth:', envOutput.trim());
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
          } catch (envError) {
            console.error('Error getting Neo4j auth:', envError);
            // Just use default password if we can't get it
            return NextResponse.json({
              success: true, 
              message: 'Neo4j container is already running (password unknown)',
              data: {
                uri: 'bolt://localhost:7687',
                username: 'neo4j',
                password: 'password'
              }
            });
          }
        } else {
          console.log('Container exists but is not running, starting it...');
          
          try {
            await execAsync('docker start homework-neo4j');
            console.log('Successfully started existing Neo4j container');
            
            // Wait for Neo4j to start up
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            return NextResponse.json({
              success: true, 
              message: 'Neo4j container started successfully',
              data: {
                uri: 'bolt://localhost:7687',
                username: 'neo4j',
                password: 'password' // We can't easily get this for an existing container
              }
            });
          } catch (startError) {
            console.error('Error starting container:', startError);
            
            // If starting failed, remove the container and create a new one
            try {
              await execAsync('docker rm homework-neo4j');
              console.log('Removed existing container to create a new one');
              containerExists = false;
            } catch (rmError) {
              console.error('Error removing container:', rmError);
              return NextResponse.json({ 
                success: false, 
                message: 'Failed to start or remove existing Neo4j container' 
              }, { status: 500 });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for Neo4j container:', error);
      // Continue to create a new container
    }
    
    // If we reach here, we need to create a new container
    if (!containerExists) {
      console.log('Creating new Neo4j container...');
      
      // Try to pull Neo4j image first
      try {
        console.log('Pulling Neo4j image...');
        await execAsync('docker pull neo4j:5.3');
        console.log('Successfully pulled Neo4j image');
      } catch (pullError) {
        console.error('Error pulling Neo4j image:', pullError);
        // Continue anyway, the image might already be present
      }
      
      // Generate a random password
      const randomPassword = Math.random().toString(36).substring(2, 12);
      console.log('Generated password for new container');
      
      // Start Neo4j container with a simple command (less likely to fail)
      try {
        const simpleCommand = `docker run -d --name homework-neo4j -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/${randomPassword} neo4j:5.3`;
        console.log('Running Docker command:', simpleCommand);
        
        try {
          // Try without sudo first
          const { stdout, stderr } = await execAsync(simpleCommand);
          console.log('Docker run output:', stdout.trim());
          if (stderr) {
            console.warn('Docker run stderr:', stderr);
          }
        } catch (error) {
          // If permission denied, try with sudo
          if (error.message.includes('permission denied') || 
              error.message.includes('Permission denied') ||
              error.message.includes('EACCES')) {
            
            console.log('Trying docker run with sudo due to permission issues');
            const { stdout, stderr } = await execAsync(`sudo ${simpleCommand}`);
            console.log('Docker run output (with sudo):', stdout.trim());
            if (stderr) {
              console.warn('Docker run stderr (with sudo):', stderr);
            }
          } else {
            throw error;
          }
        }
        
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
      } catch (runError) {
        console.error('Error running Neo4j container:', runError);
        
        // Specific message for permission errors
        if (runError.message.includes('permission denied') || 
            runError.message.includes('Permission denied') ||
            runError.message.includes('EACCES')) {
          return NextResponse.json({ 
            success: false, 
            message: `Permission denied. Please run the application with sufficient privileges to use Docker, or add your user to the docker group.` 
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: false, 
          message: `Failed to run Neo4j container: ${runError.message}` 
        }, { status: 500 });
      }
    }
    
    // We should never reach here
    return NextResponse.json({ 
      success: false, 
      message: 'Unexpected flow in Neo4j deployment' 
    }, { status: 500 });
    
  } catch (error) {
    console.error('Unhandled error deploying Neo4j:', error);
    return NextResponse.json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error deploying Neo4j container' 
    }, { status: 500 });
  }
}