import logging
import os
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
        
    def update_configuration(self, config: ConfigurationModel):
        """Update application configuration."""
        try:
            # Save each configuration item if provided
            if config.huggingface_token:
                # For HuggingFace, we need a username but can use a default if not provided
                self.credentials_manager.save_huggingface_credentials(
                    username="homework_user",  # Default username
                    token=config.huggingface_token
                )
            
            if config.openai_api_key:
                self.credentials_manager.save_openai_key(config.openai_api_key)
            
            # If Neo4j credentials are provided, save them all together
            if config.neo4j_uri and config.neo4j_username and config.neo4j_password:
                self.credentials_manager.save_neo4j_credentials(
                    uri=config.neo4j_uri,
                    username=config.neo4j_username,
                    password=config.neo4j_password
                )
            
            # For GitHub token, we'll save it to the environment file
            if config.github_token:
                env_file = Path(".env")
                env_content = {}
                
                # Read existing .env file if it exists
                if env_file.exists():
                    with open(env_file, "r") as f:
                        for line in f:
                            if line.strip() and not line.startswith("#"):
                                try:
                                    key, value = line.strip().split("=", 1)
                                    env_content[key] = value
                                except ValueError:
                                    # Skip lines that don't have an equals sign
                                    pass
                
                # Update GitHub token
                env_content["GITHUB_TOKEN"] = config.github_token
                
                # Write back to .env file
                with open(env_file, "w") as f:
                    for key, value in env_content.items():
                        f.write(f"{key}={value}\n")
            
            return {
                "success": True,
                "message": "Configuration updated successfully",
                "data": {"updated": True}
            }
        except Exception as e:
            logger.error(f"Error updating configuration: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to update configuration: {str(e)}")
    
    def get_configuration_status(self):
        """Get current configuration status (not actual values for security)."""
        try:
            # Get credentials status
            hf_username, hf_token = self.credentials_manager.get_huggingface_credentials()
            openai_key = self.credentials_manager.get_openai_key()
            neo4j_creds = self.credentials_manager.get_neo4j_credentials()
            
            # Check for GitHub token in environment
            github_token = os.environ.get("GITHUB_TOKEN", "")
            
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