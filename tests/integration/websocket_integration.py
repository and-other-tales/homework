"""WebSocket integration tests between frontend and backend"""
import json
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure both backend and frontend paths are properly configured
from api.server import WebSocketManager
from web.chat_handler import ChatHandler

class TestWebSocketIntegration:
    """Test WebSocket communication between frontend and backend"""
    
    @pytest.fixture
    def websocket_manager(self):
        """Create a WebSocketManager instance for testing"""
        manager = WebSocketManager()
        return manager
    
    @pytest.fixture
    def chat_handler(self):
        """Create a ChatHandler instance for testing"""
        handler = ChatHandler()
        return handler
    
    @pytest.mark.asyncio
    async def test_websocket_message_flow(self, websocket_manager, chat_handler):
        """Test the full message flow from frontend to backend and back"""
        # Mock client websocket connection
        mock_websocket = AsyncMock()
        mock_websocket.receive_json.return_value = {
            "type": "message",
            "content": "Hello AI",
            "session_id": "test-session"
        }
        
        # Mock LLM client response
        with patch('utils.llm_client.LLMClient.generate_response', 
                  return_value="Hello human, how can I help you?"):
            
            # Create a client connection
            client_id = await websocket_manager.connect(mock_websocket)
            assert client_id is not None
            
            # Register the client connection with the chat handler
            chat_handler.register_client(client_id, "test-session")
            
            # Process an incoming message
            await websocket_manager.process_message(mock_websocket)
            
            # Verify message was sent to client
            mock_websocket.send_json.assert_called()
            call_args = mock_websocket.send_json.call_args[0][0]
            
            # Validate response format
            assert "type" in call_args
            assert call_args["type"] == "message"
            assert "content" in call_args
            assert "Hello human" in call_args["content"]
            
            # Clean up
            await websocket_manager.disconnect(client_id)
    
    @pytest.mark.asyncio
    async def test_broadcast_status_updates(self, websocket_manager):
        """Test system status updates are broadcast to all connected clients"""
        # Create multiple mock client connections
        mock_clients = [AsyncMock() for _ in range(3)]
        client_ids = []
        
        # Connect all clients
        for client in mock_clients:
            client_id = await websocket_manager.connect(client)
            client_ids.append(client_id)
        
        # Broadcast a system status update
        status_update = {
            "type": "status_update",
            "status": "running",
            "connections": len(client_ids)
        }
        
        await websocket_manager.broadcast(status_update)
        
        # Verify all clients received the broadcast
        for client in mock_clients:
            client.send_json.assert_called_with(status_update)
        
        # Clean up
        for client_id in client_ids:
            await websocket_manager.disconnect(client_id)
    
    @pytest.mark.asyncio
    async def test_error_handling(self, websocket_manager, chat_handler):
        """Test error handling during WebSocket communication"""
        # Mock client websocket connection
        mock_websocket = AsyncMock()
        mock_websocket.receive_json.return_value = {
            "type": "message",
            "content": "Generate an error",
            "session_id": "test-session"
        }
        
        # Mock LLM client to raise an exception
        with patch('utils.llm_client.LLMClient.generate_response', 
                  side_effect=Exception("LLM service unavailable")):
            
            # Create a client connection
            client_id = await websocket_manager.connect(mock_websocket)
            
            # Register the client connection with the chat handler
            chat_handler.register_client(client_id, "test-session")
            
            # Process an incoming message
            await websocket_manager.process_message(mock_websocket)
            
            # Verify error message was sent to client
            mock_websocket.send_json.assert_called()
            call_args = mock_websocket.send_json.call_args[0][0]
            
            # Validate error response format
            assert call_args["type"] == "error"
            assert "service unavailable" in call_args["message"].lower()
            
            # Clean up
            await websocket_manager.disconnect(client_id)