/**
 * Cross-platform script for running Jest tests
 * This helps normalize path issues between Windows and WSL
 */
const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

// Determine the proper Jest path
let jestPath;
const possiblePaths = [
  path.resolve(__dirname, 'node_modules', '.bin', 'jest'),
  path.resolve(__dirname, 'node_modules', '.bin', 'jest.cmd'),
  path.resolve(__dirname, 'node_modules', 'jest', 'bin', 'jest.js')
];

// Find the first existing Jest path
for (const testPath of possiblePaths) {
  if (existsSync(testPath)) {
    jestPath = testPath;
    break;
  }
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
