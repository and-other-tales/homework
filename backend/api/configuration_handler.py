import logging
import os
import re
import sys
from pathlib import Path
from fastapi import HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

from config.credentials_manager import CredentialsManager

# Setup logging
logger = logging.getLogger(__name__)

class ConfigurationModel(BaseModel):
    huggingface_token: Optional[str] = None
    github_token: Optional[str] = None
    openai_api_key: Optional[str] = None
    neo4j_uri: Optional[str] = None
    neo4j_username: Optional[str] = None
    neo4j_password: Optional[str] = None

class ConfigurationHandler:
    def __init__(self):
        self.credentials_manager = CredentialsManager()
        
    def update_env_file(self, updates):
        """Update the .env file with new values."""
        env_file = Path(".env")
        
        # Create .env file if it doesn't exist
        if not env_file.exists():
            logger.info("Creating new .env file")
            with open(env_file, "w") as f:
                f.write("# Environment variables for the homework app\n\n")
        
        # Read existing content
        with open(env_file, "r") as f:
            content = f.read()
        
        # Update each key
        for key, value in updates.items():
            pattern = re.compile(f"^{key}=.*$", re.MULTILINE)
            if pattern.search(content):
                # Replace existing key
                content = pattern.sub(f"{key}={value}", content)
            else:
                # Add new key
                content += f"\n{key}={value}"
        
        # Write updated content
        with open(env_file, "w") as f:
            f.write(content)
        
        logger.info(f"Updated .env file with keys: {', '.join(updates.keys())}")
            
    def update_configuration(self, config: ConfigurationModel):
        """Update application configuration."""
        try:
            # Track which items were updated for the response
            updated_items = {}
            
            # Updates for .env file
            env_updates = {}
            
            # Save each configuration item if provided
            if config.huggingface_token:
                # For HuggingFace, we need a username but can use a default if not provided
                self.credentials_manager.save_huggingface_credentials(
                    username="homework_user",  # Default username
                    token=config.huggingface_token
                )
                updated_items["huggingface"] = True
                
                # Also update .env file
                env_updates["HUGGINGFACE_TOKEN"] = config.huggingface_token
            
            if config.openai_api_key:
                self.credentials_manager.save_openai_key(config.openai_api_key)
                updated_items["openai"] = True
                
                # Also update .env file
                env_updates["OPENAI_API_KEY"] = config.openai_api_key
            
            # If Neo4j credentials are provided, save them all together
            if config.neo4j_uri and config.neo4j_username and config.neo4j_password:
                self.credentials_manager.save_neo4j_credentials(
                    uri=config.neo4j_uri,
                    username=config.neo4j_username,
                    password=config.neo4j_password
                )
                updated_items["neo4j"] = True
                
                # Also update .env file
                env_updates["NEO4J_URI"] = config.neo4j_uri
                env_updates["NEO4J_USER"] = config.neo4j_username
                env_updates["NEO4J_PASSWORD"] = config.neo4j_password
            
            # For GitHub token, we'll save it to the environment file
            if config.github_token:
                env_updates["GITHUB_TOKEN"] = config.github_token
                updated_items["github"] = True
                
                # Make GitHub token available in current process
                os.environ["GITHUB_TOKEN"] = config.github_token
            
            # Update the .env file with all changes
            if env_updates:
                self.update_env_file(env_updates)
            
            return {
                "success": True,
                "message": "Configuration updated successfully",
                "data": {
                    "updated": True,
                    "items": updated_items
                }
            }
        except Exception as e:
            logger.error(f"Error updating configuration: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to update configuration: {str(e)}")
    
    def get_configuration_status(self):
        """Get current configuration status (not actual values for security)."""
        try:
            # Get credentials status with extra logging for debugging
            try:
                hf_username, hf_token = self.credentials_manager.get_huggingface_credentials()
                logger.info(f"HuggingFace token found: {bool(hf_token)}")
            except Exception as e:
                logger.error(f"Error retrieving HuggingFace credentials: {e}")
                hf_username, hf_token = None, None
            
            try:
                openai_key = self.credentials_manager.get_openai_key()
                logger.info(f"OpenAI key found: {bool(openai_key)}")
            except Exception as e:
                logger.error(f"Error retrieving OpenAI key: {e}")
                openai_key = None
            
            try:
                neo4j_creds = self.credentials_manager.get_neo4j_credentials()
                logger.info(f"Neo4j credentials found: {bool(neo4j_creds)}")
            except Exception as e:
                logger.error(f"Error retrieving Neo4j credentials: {e}")
                neo4j_creds = None
            
            # Check for GitHub token in environment and .env file
            github_token = os.environ.get("GITHUB_TOKEN", "")
            logger.info(f"GitHub token in environment: {bool(github_token)}")
            
            # Also check .env file directly as a fallback
            if not github_token:
                try:
                    env_file = Path(".env")
                    if env_file.exists():
                        with open(env_file, "r") as f:
                            content = f.read()
                            match = re.search(r'^GITHUB_TOKEN=(.+)$', content, re.MULTILINE)
                            if match and match.group(1):
                                github_token = match.group(1)
                                logger.info("GitHub token found in .env file")
                except Exception as e:
                    logger.error(f"Error checking .env file for GitHub token: {e}")
            
            # Check for missing required configurations
            missing_configs = []
            
            # Check for HuggingFace token
            if not hf_token:
                missing_configs.append("huggingface_token")
            
            # Return status of each configuration item
            return {
                "success": True,
                "message": "Configuration status retrieved",
                "data": {
                    "huggingface_configured": bool(hf_token),
                    "github_configured": bool(github_token),
                    "openai_configured": bool(openai_key),
                    "neo4j_configured": bool(neo4j_creds),
                    "missing_configs": missing_configs
                }
            }
        except Exception as e:
            logger.error(f"Error retrieving configuration: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to retrieve configuration: {str(e)}")