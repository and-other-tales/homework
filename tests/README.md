# Homework Application Test Suite

This directory contains all tests for the Homework application, which integrates both frontend and backend components as a single cohesive system.

## Structure

- `integration/`: Integration tests for API, database, and third-party services, including tests that verify the interaction between frontend and backend components
- `backend/`: Tests for backend components (API, services, models)
- `frontend/`: Tests for frontend components (React components, utilities)
- `unit/`: General unit tests that don't fit into backend or frontend

## Running Tests

To run all tests, use the provided `run_tests.sh` script which ensures proper path setup:

```bash
./run_tests.sh
```

To run specific test categories:

```bash
# Run only backend tests
./run_tests.sh --backend

# Run only frontend tests
./run_tests.sh --frontend

# Run only integration tests
./run_tests.sh --integration

# Run with coverage report
./run_tests.sh --coverage

# Run tests in parallel
./run_tests.sh --parallel
```

Alternatively, you can use pytest directly:

```bash
# Make sure to set PYTHONPATH correctly
PYTHONPATH=. pytest tests

# Run only specific tests
PYTHONPATH=. pytest tests/backend
PYTHONPATH=. pytest -m integration
```

## Adding New Tests

When writing new tests, follow these guidelines:

- Place backend component tests in `tests/backend/`
- Place frontend component tests in `tests/frontend/`
- Place integration tests in `tests/integration/`
- Place general utility tests in `tests/unit/`

Make sure to include appropriate markers in your test files:

```python
import pytest

@pytest.mark.backend
def test_some_backend_function():
    # Test code here
    pass
```

### Frontend-Backend Integration

When testing features that span both frontend and backend:

1. Create integration tests that verify the entire flow
2. Mock external services (GitHub, HuggingFace, etc.)
3. Test both success and error handling paths

Example of an integration test for a full feature:

```python
@pytest.mark.integration
def test_repository_analysis_workflow():
    # Test the flow from frontend request to backend processing and back
    # ...
```

## Test Requirements

Required packages for testing:
- pytest
- pytest-cov
- pytest-xdist (for parallel testing)
- pytest-asyncio (for async tests)
- jest (for frontend tests)
- react-testing-library (for React component tests)

## Continuous Integration

Tests are automatically run in CI when code is pushed to the repository. All tests must pass before code can be merged.