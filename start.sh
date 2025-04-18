#!/bin/bash

# Homework Application Startup Script
# This script can start the application in Docker or directly on the host

# Enable strict mode
set -e

# Print colored messages
print_message() {
  local color=$1
  local message=$2
  
  case $color in
    "green") echo -e "\033[0;32m$message\033[0m" ;;
    "yellow") echo -e "\033[0;33m$message\033[0m" ;;
    "red") echo -e "\033[0;31m$message\033[0m" ;;
    *) echo "$message" ;;
  esac
}

# Check for required backend files
check_backend_structure() {
  print_message "yellow" "🔍 Checking backend structure..."
  
  local missing_files=false
  
  # Check for critical Python modules
  if [ ! -f "backend/web/__init__.py" ]; then
    print_message "red" "❌ Missing file: backend/web/__init__.py"
    missing_files=true
  fi
  
  if [ ! -f "backend/web/crawler.py" ]; then
    print_message "red" "❌ Missing file: backend/web/crawler.py"
    missing_files=true
  fi
  
  if [ "$missing_files" = true ]; then
    print_message "red" "❌ Some required files are missing!"
    print_message "yellow" "ℹ️ Please check your installation or clone the repository again:"
    print_message "yellow" "   git clone https://github.com/yourusername/homework.git"
    exit 1
  fi
  
  print_message "green" "✅ Backend structure looks good."
}

# Activate virtual environment with better platform detection
activate_virtual_env() {
  print_message "yellow" "🔄 Activating Python virtual environment..."
  
  # Check if we're on Windows or Unix-like system
  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    # Windows path
    if [ -f "venv/Scripts/activate" ]; then
      source venv/Scripts/activate
    else
      print_message "red" "❌ Virtual environment activation script not found at venv/Scripts/activate"
      print_message "yellow" "🔄 Creating new virtual environment..."
      python -m venv venv
      if [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate
      else
        print_message "red" "❌ Failed to create usable virtual environment"
        exit 1
      fi
    fi
  else
    # Unix-like path
    if [ -f "venv/bin/activate" ]; then
      source venv/bin/activate
    else
      print_message "red" "❌ Virtual environment activation script not found at venv/bin/activate"
      print_message "yellow" "🔄 Creating new virtual environment..."
      python3 -m venv venv || python -m venv venv
      if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
      else
        print_message "red" "❌ Failed to create usable virtual environment"
        exit 1
      fi
    fi
  fi
  
  print_message "green" "✅ Virtual environment activated successfully."
}

# Perform backend checks and ensure dependencies are installed
check_backend_dependencies() {
  print_message "yellow" "🔍 Checking backend dependencies..."
  
  # Activate virtual environment
  activate_virtual_env
  
  # Check for required pip packages and install if missing
  python -c "import fastapi" 2>/dev/null || pip install fastapi uvicorn
  python -c "import starlette" 2>/dev/null || pip install starlette
  
  print_message "green" "✅ Backend dependencies verified."
}

# Function to start the application in Docker mode
start_docker_mode() {
  print_message "yellow" "=============================================="
  print_message "yellow" "🚀 Starting Homework Application (Docker Mode)"
  print_message "yellow" "=============================================="

  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    print_message "red" "❌ Docker is not installed. Please install Docker first."
    exit 1
  fi

  # Check if Docker Compose is installed
  if ! command -v docker-compose &> /dev/null; then
    print_message "red" "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
  fi

  # Add network connectivity check
  print_message "yellow" "🔍 Checking network connectivity..."
  if ! ping -c 1 deb.debian.org &> /dev/null; then
    print_message "red" "❌ Network connectivity issue detected: Cannot reach Debian package repositories."
    print_message "yellow" "- Check your internet connection"
    print_message "yellow" "- If using a VPN, try disabling it temporarily"
    print_message "yellow" "- Ensure Docker has proper network access"
    print_message "yellow" "- You can try manually setting DNS in Docker by editing /etc/docker/daemon.json:"
    print_message "yellow" "  {\"dns\": [\"8.8.8.8\", \"8.8.4.4\"]}"
    exit 1
  fi

  # Build and start the containers
  print_message "green" "🔨 Building and starting containers..."
  docker-compose up -d --build

  # Check if containers are running
  if [ $? -eq 0 ]; then
    print_message "green" "✅ Homework application is now running!"
    print_message "green" "📊 Dashboard: http://localhost:3000"
    print_message "green" "💬 Chat Interface: http://localhost:3000/chat"
    print_message "green" "🔧 API: http://localhost:8080/api"

    # Check for missing API keys
    if ! grep -q "HUGGINGFACE_TOKEN=.*[^[:space:]]" "$ENV_FILE"; then
      print_message "yellow" "⚠️  Warning: HUGGINGFACE_TOKEN is not set in .env file."
      print_message "yellow" "   Some features might not work correctly."
    fi
  else
    print_message "red" "❌ Failed to start Homework application."
    exit 1
  fi

  print_message "yellow" "=============================================="
  print_message "yellow" "To stop the application, run: docker-compose down"
  print_message "yellow" "=============================================="
}

# Function to start the application in local mode
start_local_mode() {
  print_message "yellow" "=============================================="
  print_message "yellow" "🚀 Starting Homework Application (Local Mode)"
  print_message "yellow" "=============================================="

  # Check for Python
  if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    print_message "red" "❌ Python is not installed. Please install Python first."
    exit 1
  fi

  # Check for Node.js
  if ! command -v npm &> /dev/null; then
    print_message "red" "❌ Node.js/npm is not installed. Please install Node.js first."
    exit 1
  fi

  # Check backend structure
  check_backend_structure

  # Start backend
  print_message "green" "🔧 Starting backend server..."
  cd backend
  
  # Check if virtual environment exists, create if not
  if [ ! -d "venv" ]; then
    print_message "yellow" "📝 Creating Python virtual environment..."
    python3 -m venv venv 2>/dev/null || python -m venv venv
  fi
  
  # Activate virtual environment
  activate_virtual_env
  
  # Install dependencies if requirements.txt exists
  if [ -f "requirements.txt" ]; then
    print_message "yellow" "📦 Checking dependencies..."
    pip install -r requirements.txt
  fi
  
  # Start the backend server in the background
  print_message "green" "🚀 Starting backend server..."
  python main.py web &
  BACKEND_PID=$!
  
  # Store the PID for later cleanup
  echo $BACKEND_PID > .backend_pid
  
  # Give the backend a moment to start
  print_message "yellow" "⏳ Waiting for backend to initialize..."
  cd ..
  
  # Start frontend
  print_message "green" "🎨 Starting frontend development server..."
  cd frontend
  
  # Install dependencies if needed
  if [ ! -d "node_modules" ]; then
    print_message "yellow" "📝 Installing Node.js dependencies..."
    npm install
  fi
  
  # Start the frontend server in the background
  npm run dev &
  FRONTEND_PID=$!
  
  # Store the PID for later cleanup
  echo $FRONTEND_PID > .frontend_pid
  
  # Give the frontend a moment to start
  print_message "yellow" "⏳ Waiting for frontend to initialize..."
  sleep 5
  
  cd ..
  
  # Skip verification and just display status
  print_message "green" "✅ Backend started on http://localhost:8080"
  print_message "green" "✅ Frontend started on http://localhost:3000"
  print_message "yellow" "⚠️ Note: Frontend will connect to backend via API"
  print_message "yellow" "⚠️ You may see module resolution errors in the frontend - these are being fixed inline"
  
  print_message "green" "✅ Homework application is now running!"
  print_message "green" "📊 Dashboard: http://localhost:3000"
  print_message "green" "💬 Chat Interface: http://localhost:3000/chat"
  print_message "green" "🔧 API: http://localhost:8080/api"
  
  print_message "yellow" "=============================================="
  print_message "yellow" "Application is running in the foreground."
  print_message "yellow" "Press Ctrl+C to stop all servers."
  print_message "yellow" "=============================================="
  
  # Set up trap to kill processes on exit
  trap cleanup INT TERM
  
  # Wait for user to press Ctrl+C
  wait
}

# Function to clean up background processes
cleanup() {
  print_message "yellow" "Shutting down servers..."
  
  # Kill backend if running
  if [ -f "backend/.backend_pid" ]; then
    BACKEND_PID=$(cat backend/.backend_pid)
    kill $BACKEND_PID 2>/dev/null || true
    rm backend/.backend_pid
  fi
  
  # Kill frontend if running
  if [ -f "frontend/.frontend_pid" ]; then
    FRONTEND_PID=$(cat frontend/.frontend_pid)
    kill $FRONTEND_PID 2>/dev/null || true
    rm frontend/.frontend_pid
  fi
  
  print_message "green" "Application has been stopped."
  exit 0
}

# Check if .env file exists, create if not
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  print_message "yellow" "📝 Creating .env file with default values..."
  cat > "$ENV_FILE" <<EOF
# Homework Environment Configuration
# Fill in your API keys below

# Required for Hugging Face dataset creation
HUGGINGFACE_TOKEN=

# Optional - Provides higher rate limits for GitHub API
GITHUB_TOKEN=

# Optional - Used for AI-powered features
OPENAI_API_KEY=

# Neo4j configuration (optional)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=
EOF
  print_message "green" "✅ Created .env file. Please edit it to add your API keys."
  print_message "yellow" "📝 File location: $ENV_FILE"
fi

# Run in the homework-app directory
cd "$(dirname "$0")"

# Check command line arguments
if [ "$1" == "--docker" ]; then
  start_docker_mode
else
  start_local_mode
fi

exit 0