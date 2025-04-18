#!/bin/bash

# Run Homework Application Tests
set -e  # Exit on error

# Print colorful messages
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

# Check for pytest
if ! command -v pytest &> /dev/null; then
    print_message "red" "❌ pytest is not installed. Please install it with 'pip install pytest pytest-cov'."
    exit 1
fi

# Default values
TEST_PATH="tests"
VERBOSE=""
COVERAGE=""
PARALLEL=""
PYTHON_PATH_SETUP="PYTHONPATH=."

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backend)
            TEST_PATH="tests/backend"
            shift
            ;;
        --frontend)
            TEST_PATH="tests/frontend"
            shift
            ;;
        --integration)
            TEST_PATH="tests/integration"
            shift
            ;;
        --unit)
            TEST_PATH="tests/unit"
            shift
            ;;
        --verbose|-v)
            VERBOSE="-v"
            shift
            ;;
        --coverage|-c)
            COVERAGE="--cov=backend --cov=frontend --cov-report=term-missing"
            shift
            ;;
        --parallel|-p)
            PARALLEL="-n auto"
            shift
            ;;
        --help|-h)
            print_message "green" "Homework Application Test Runner"
            echo "Usage: ./run_tests.sh [options]"
            echo "Options:"
            echo "  --backend          Run only backend tests"
            echo "  --frontend         Run only frontend tests"
            echo "  --integration      Run only integration tests"
            echo "  --unit             Run only unit tests"
            echo "  --verbose, -v      Verbose output"
            echo "  --coverage, -c     Generate coverage report"
            echo "  --parallel, -p     Run tests in parallel"
            echo "  --help, -h         Show this help message"
            exit 0
            ;;
        *)
            print_message "red" "❌ Unknown option: $1"
            echo "Run './run_tests.sh --help' for usage information."
            exit 1
            ;;
    esac
done

# Execute the tests
print_message "green" "🧪 Running tests in ${TEST_PATH}..."
$PYTHON_PATH_SETUP pytest $TEST_PATH $VERBOSE $COVERAGE $PARALLEL

# Print completion message
print_message "green" "✅ Tests completed!"