/**
 * Cross-platform script for running Jest tests
 * This helps normalize path issues between Windows and WSL
 */
const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

// Debug information
console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);

// Locations to check for Jest
const directoriesToCheck = [
  // Current project
  __dirname,
  // Frontend project
  path.resolve(__dirname, 'frontend'),
  // Parent directory (if called from frontend)
  path.resolve(process.cwd(), '..')
];

// Determine the proper Jest path
let jestPath;

// Check each possible location
for (const baseDir of directoriesToCheck) {
  console.log(`Checking for Jest in ${baseDir}...`);
  
  const possiblePaths = [
    path.join(baseDir, 'node_modules', '.bin', 'jest'),
    path.join(baseDir, 'node_modules', '.bin', 'jest.cmd'),
    path.join(baseDir, 'node_modules', 'jest', 'bin', 'jest.js')
  ];

  // Find the first existing Jest path
  for (const testPath of possiblePaths) {
    if (existsSync(testPath)) {
      console.log(`Found Jest at: ${testPath}`);
      jestPath = testPath;
      break;
    }
  }
  
  if (jestPath) break;
}

if (!jestPath) {
  console.error('Jest executable not found. Please ensure Jest is installed.');
  process.exit(1);
}

// Get any command line arguments
const args = process.argv.slice(2).join(' ');

try {
  // Run Jest with the arguments
  execSync(`node "${jestPath}" ${args}`, { stdio: 'inherit' });
} catch (error) {
  // Jest will set its own exit code
  process.exit(1);
}
