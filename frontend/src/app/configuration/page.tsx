'use client';

import { useState, useEffect } from 'react';
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, Database } from 'lucide-react';

// Configuration interface
interface ConfigurationState {
  huggingface_token: string;
  github_token: string;
  openai_api_key: string;
  neo4j_uri: string;
  neo4j_username: string;
  neo4j_password: string;
  server_port: string;
}

export default function ConfigurationPage() {
  const [loading, setLoading] = useState(false);
  const [deployingNeo4j, setDeployingNeo4j] = useState(false);
  const [configStatus, setConfigStatus] = useState<Record<string, boolean>>({});
  const [config, setConfig] = useState<ConfigurationState>({
    huggingface_token: '',
    github_token: '',
    openai_api_key: '',
    neo4j_uri: 'bolt://localhost:7687',
    neo4j_username: 'neo4j',
    neo4j_password: '',
    server_port: '8080'
  });

  // Load configuration status on mount
  useEffect(() => {
    loadConfigurationStatus();
  }, []);

  const loadConfigurationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuration');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setConfigStatus({
            huggingface_configured: data.data.huggingface_configured || false,
            github_configured: data.data.github_configured || false,
            openai_configured: data.data.openai_configured || false,
            neo4j_configured: data.data.neo4j_configured || false
          });
        }
      } else {
        toast.error('Failed to load configuration status');
      }
    } catch (error) {
      console.error('Error loading configuration status:', error);
      toast.error('Error loading configuration status');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig({
      ...config,
      [name]: value
    });
  };

  const handleSaveConfiguration = async () => {
    try {
      setLoading(true);
      toast.loading('Saving configuration...');
      
      // Filter out empty values except for required fields
      const configToSave: Record<string, string> = {};
      
      if (config.huggingface_token) {
        configToSave.huggingface_token = config.huggingface_token;
      }
      
      if (config.github_token) {
        configToSave.github_token = config.github_token;
      }
      
      if (config.openai_api_key) {
        configToSave.openai_api_key = config.openai_api_key;
      }
      
      // Only save Neo4j configuration if all fields are filled
      if (config.neo4j_uri && config.neo4j_username && config.neo4j_password) {
        configToSave.neo4j_uri = config.neo4j_uri;
        configToSave.neo4j_username = config.neo4j_username;
        configToSave.neo4j_password = config.neo4j_password;
      }
      
      // Save configuration
      const response = await fetch('/api/configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave),
      });
      
      if (response.ok) {
        toast.success('Configuration saved successfully');
        await loadConfigurationStatus();
        
        // Clear sensitive fields
        setConfig({
          ...config,
          huggingface_token: '',
          github_token: '',
          openai_api_key: '',
          neo4j_password: ''
        });
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error saving configuration');
    } finally {
      setLoading(false);
      toast.dismiss();
    }
  };

  const handleDeployNeo4j = async () => {
    setDeployingNeo4j(true);
    
    try {
      toast.loading('Deploying Neo4j Docker container...');
      
      // Call the API to deploy Neo4j
      const response = await fetch('/api/deploy-neo4j', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to deploy Neo4j container');
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Neo4j deployed successfully!');
        
        // Update the Neo4j configuration fields with the values from the response
        setConfig({
          ...config,
          neo4j_uri: data.data.uri || 'bolt://localhost:7687',
          neo4j_username: data.data.username || 'neo4j',
          neo4j_password: data.data.password || ''
        });
      } else {
        throw new Error(data.message || 'Unknown error deploying Neo4j');
      }
    } catch (error) {
      console.error('Error deploying Neo4j:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deploy Neo4j');
    } finally {
      setDeployingNeo4j(false);
      toast.dismiss();
    }
  };

  return (
    <PageLayout title="Configuration">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>API Credentials</CardTitle>
            <CardDescription>
              Configure API keys and credentials for external services.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="huggingface_token">
                Hugging Face Token
                {configStatus.huggingface_configured && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">
                    Configured
                  </span>
                )}
              </Label>
              <Input
                id="huggingface_token"
                name="huggingface_token"
                type="password"
                placeholder="hf_..."
                value={config.huggingface_token}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">
                Required for dataset creation and management with Hugging Face.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github_token">
                GitHub Token
                {configStatus.github_configured && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">
                    Configured
                  </span>
                )}
              </Label>
              <Input
                id="github_token"
                name="github_token"
                type="password"
                placeholder="ghp_..."
                value={config.github_token}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">
                Optional: Provides higher rate limits for GitHub API access.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="openai_api_key">
                OpenAI API Key
                {configStatus.openai_configured && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">
                    Configured
                  </span>
                )}
              </Label>
              <Input
                id="openai_api_key"
                name="openai_api_key"
                type="password"
                placeholder="sk-..."
                value={config.openai_api_key}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">
                Optional: Used for AI-powered features.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Neo4j Configuration</CardTitle>
            <CardDescription>
              Configure Neo4j connection for knowledge graph storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Database Status</h3>
                <p className="text-sm text-muted-foreground">
                  {configStatus.neo4j_configured
                    ? "Neo4j is configured and ready to use"
                    : "Neo4j is not configured yet"
                  }
                </p>
              </div>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleDeployNeo4j}
                disabled={loading || deployingNeo4j}
              >
                {deployingNeo4j ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                {deployingNeo4j ? "Deploying..." : "Deploy Neo4j Docker"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neo4j_uri">Neo4j URI</Label>
              <Input
                id="neo4j_uri"
                name="neo4j_uri"
                placeholder="bolt://localhost:7687"
                value={config.neo4j_uri}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neo4j_username">Neo4j Username</Label>
              <Input
                id="neo4j_username"
                name="neo4j_username"
                placeholder="neo4j"
                value={config.neo4j_username}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="neo4j_password">Neo4j Password</Label>
              <Input
                id="neo4j_password"
                name="neo4j_password"
                type="password"
                placeholder="password"
                value={config.neo4j_password}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">
                All fields are required to save Neo4j configuration.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Server Settings</CardTitle>
            <CardDescription>
              Configure server port and cache directory.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="server_port">API Port</Label>
              <Input
                id="server_port"
                name="server_port"
                type="text"
                placeholder="8080"
                value={config.server_port}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">
                Default: 8080 (requires restart to take effect)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            onClick={handleSaveConfiguration}
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {loading ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}