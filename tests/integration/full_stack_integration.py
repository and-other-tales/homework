"""Full-stack integration tests between frontend UI and backend API"""
import pytest
import json
import asyncio
from unittest.mock import MagicMock, patch

# Import backend components
from api.server import APIServer
from github.repository import GitHubRepository
from utils.task_tracker import TaskTracker

# Note: In a real integration test, these would interact with actual components
# rather than being mocked. But for demonstration purposes, we're simulating
# the integration between components.

class TestFullStackIntegration:
    """Test the entire application stack from frontend to backend"""
    
    @pytest.fixture
    def api_server(self):
        """Create an API server instance for testing"""
        server = APIServer()
        # Configure test mode
        server.configure(mode="test")
        return server
    
    @pytest.fixture
    def task_tracker(self):
        """Create a task tracker instance for testing"""
        tracker = TaskTracker()
        return tracker
    
    @pytest.mark.integration
    def test_github_repository_analysis_flow(self, api_server, task_tracker):
        """
        Test the full flow of a GitHub repository analysis task:
        1. Frontend submits repository analysis request to backend API
        2. Backend initializes task and begins processing
        3. Frontend receives task updates
        4. Backend completes task and stores results
        5. Frontend retrieves and displays results
        """
        # Mock the frontend request
        request_data = {
            "repository_url": "https://github.com/example/repo",
            "analysis_type": "code_structure",
            "task_name": "Analyze example repo"
        }
        
        # Mock GitHub API responses
        with patch('github.client.GitHubClient.get_repository') as mock_github:
            # Set up the GitHub repository mock
            mock_repo = MagicMock()
            mock_repo.name = "repo"
            mock_repo.owner = "example"
            mock_repo.get_files.return_value = [
                {"name": "README.md", "path": "README.md"},
                {"name": "main.py", "path": "main.py"}
            ]
            mock_github.return_value = mock_repo
            
            # Mock the file content retrieval
            with patch('github.content_fetcher.ContentFetcher.fetch_file') as mock_fetch:
                mock_fetch.side_effect = [
                    {"content": "# Example Repository", "metadata": {}},
                    {"content": "print('Hello, world!')", "metadata": {}}
                ]
                
                # Step 1: Frontend submits task to backend API
                task_id = api_server.create_task(request_data)
                assert task_id is not None
                
                # Step 2: Backend begins processing - register with task tracker 
                task = task_tracker.register_task(
                    task_id=task_id,
                    task_type="github_analysis",
                    params=request_data
                )
                
                # The task should be marked as pending initially
                assert task["status"] == "pending"
                
                # Step 3: Update task status as it progresses
                task_tracker.update_status(task_id, "processing", progress=25)
                task_tracker.update_status(task_id, "processing", progress=50)
                task_tracker.update_status(task_id, "processing", progress=75)
                
                # Step 4: Backend completes task and stores results
                analysis_results = {
                    "repository": "example/repo",
                    "file_count": 2,
                    "analysis": {
                        "code_structure": {
                            "files_by_type": {
                                "markdown": 1,
                                "python": 1
                            }
                        }
                    }
                }
                
                task_tracker.update_status(
                    task_id, 
                    "completed", 
                    progress=100,
                    results=analysis_results
                )
                
                # Step 5: Frontend retrieves the task results
                task_result = api_server.get_task_status(task_id)
                
                # Verify the task data
                assert task_result["status"] == "completed"
                assert task_result["progress"] == 100
                assert task_result["results"]["repository"] == "example/repo"
                assert task_result["results"]["file_count"] == 2
    
    @pytest.mark.integration
    def test_frontend_backend_error_handling(self, api_server, task_tracker):
        """
        Test how errors are handled between frontend and backend:
        1. Frontend submits invalid request to backend API
        2. Backend returns appropriate error response
        3. Frontend handles error gracefully
        """
        # Mock an invalid request (missing required fields)
        invalid_request = {
            "analysis_type": "code_structure"
            # Missing repository_url
        }
        
        # Backend should return a validation error
        with pytest.raises(ValueError) as excinfo:
            api_server.create_task(invalid_request)
        
        # Verify the error message
        assert "repository_url" in str(excinfo.value)
        
        # Another scenario: repository not found
        with patch('github.client.GitHubClient.get_repository') as mock_github:
            # Simulate GitHub API error
            mock_github.side_effect = Exception("Repository not found")
            
            # Create a valid request
            valid_request = {
                "repository_url": "https://github.com/nonexistent/repo",
                "analysis_type": "code_structure",
                "task_name": "Analyze nonexistent repo"
            }
            
            # Step 1: Frontend submits task
            task_id = api_server.create_task(valid_request)
            
            # Step 2: Backend begins processing but encounters an error
            task = task_tracker.register_task(
                task_id=task_id,
                task_type="github_analysis",
                params=valid_request
            )
            
            # Simulate task processing error
            task_tracker.update_status(
                task_id, 
                "failed", 
                error="Failed to clone repository: Repository not found"
            )
            
            # Step 3: Frontend retrieves task status
            task_result = api_server.get_task_status(task_id)
            
            # Verify error is properly communicated
            assert task_result["status"] == "failed"
            assert "Repository not found" in task_result["error"]