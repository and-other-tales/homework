# Tests configuration file
import os
import sys
import pytest

# Add the parent directory to the path so we can import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
# Add the backend directory directly to the path for direct imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))
# Add the frontend directory to the path for frontend imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../frontend')))

# Common fixtures that can be used by all tests
@pytest.fixture
def temp_directory(tmp_path):
    """Provide a temporary directory for tests."""
    return tmp_path

@pytest.fixture
def sample_repository_url():
    """Sample GitHub repository URL for testing."""
    return "https://github.com/othertales/homework"

@pytest.fixture
def sample_crawl_url():
    """Sample URL for web crawling tests."""
    return "https://example.com"