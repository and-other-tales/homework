"""LLM client module supporting OpenAI models."""

import json
import os
import logging
import requests
from typing import Dict, Any, Optional, List

# Setup logging
logger = logging.getLogger(__name__)

class LLMClient:
    """Simple LLM client for generating chat responses using OpenAI API."""

    def __init__(self, api_key: str = None):
        """
        Initialize the LLM client.
        
        Args:
            api_key: The OpenAI API key
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.model = "gpt-3.5-turbo"  # Default model
        
        if not self.api_key:
            logger.warning("No OpenAI API key provided")
        else:
            logger.info("LLM client initialized with API key")

    async def generate_response(self, user_message: str) -> str:
        """
        Generate a chat response to the user's message.
        
        Args:
            user_message: The user's message
            
        Returns:
            str: The generated response
        """
        # If no API key, return a specific error message
        if not self.api_key:
            return "I need an OpenAI API key to respond to messages. Please set up your OpenAI API key in the Configuration page."
        
        try:
            # Make actual API call to OpenAI
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }
            
            data = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.7,
                "max_tokens": 500
            }
            
            logger.info(f"Sending request to OpenAI API with model {self.model}")
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            # Handle API response
            if response.status_code == 200:
                result = response.json()
                message_content = result.get("choices", [{}])[0].get("message", {}).get("content", "")
                if message_content:
                    logger.info("Successfully generated response from OpenAI")
                    return message_content
                else:
                    logger.warning("Empty response from OpenAI")
                    return "I received an empty response. Please try again."
            else:
                error_info = response.json().get("error", {})
                error_message = error_info.get("message", "Unknown error")
                logger.error(f"OpenAI API error: {response.status_code} - {error_message}")
                
                # Return a more specific error message for common issues
                if response.status_code == 401:
                    return "Authentication error: The OpenAI API key seems to be invalid. Please check your configuration."
                elif response.status_code == 429:
                    return "Rate limit exceeded: The OpenAI API request was rate limited. Please try again later."
                else:
                    return f"OpenAI API error: {error_message}"
                
        except requests.exceptions.Timeout:
            logger.error("Request to OpenAI API timed out")
            return "The request to the OpenAI API timed out. Please try again later."
        except requests.exceptions.ConnectionError:
            logger.error("Connection error when calling OpenAI API")
            return "Could not connect to the OpenAI API. Please check your internet connection."
        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            return f"I encountered an error while processing your message: {str(e)}"