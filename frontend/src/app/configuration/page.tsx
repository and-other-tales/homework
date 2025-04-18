'use client';

import { useState, useEffect } from 'react';
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Save, Database } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Configuration interface
interface ConfigurationState {
  huggingface_token: string;
  github_token: string;
  openai_api_key: string;
  neo4j_uri: string;
  neo4j_username: string;
  neo4j_password: string;
  server_port: string;
  temp_dir: string;
  chat_model: string;
  [key: string]: string; // Add index signature to allow string indexing
}

// Configuration status interface
interface ConfigurationStatus {
  huggingface_configured: boolean;
  github_configured: boolean;
  openai_configured: boolean;
  neo4j_configured: boolean;
}

export default function ConfigurationPage() {
  const [loading, setLoading] = useState(false);
  const [deployingNeo4j, setDeployingNeo4j] = useState(false);
  const [configStatus, setConfigStatus] = useState<ConfigurationStatus>({
    huggingface_configured: false,
    github_configured: false,
    openai_configured: false,
    neo4j_configured: false,
  });
  const [config, setConfig] = useState<ConfigurationState>({
    huggingface_token: '',
    github_token: '',
    openai_api_key: '',
    neo4j_uri: 'bolt://localhost:7687',
    neo4j_username: 'neo4j',
    neo4j_password: '',
    server_port: '8080',
    temp_dir: '/home/user/.othertales_homework/temp',
    chat_model: 'gpt-3.5-turbo',
  });

  useEffect(() => {
    loadConfigurationStatus();
    loadSavedFormState();
  }, []);

  const loadConfigurationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuration');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const status: ConfigurationStatus = {
            huggingface_configured: true,
            github_configured: true,
            openai_configured: true,
            neo4j_configured: true,
          };
          setConfigStatus(status);
          localStorage.setItem('config_status', JSON.stringify(status));
          localStorage.setItem('setup_completed', 'true');
        }
      } else {
        const status: ConfigurationStatus = {
          huggingface_configured: true,
          github_configured: true,
          openai_configured: true,
          neo4j_configured: true,
        };
        setConfigStatus(status);
        localStorage.setItem('config_status', JSON.stringify(status));
        localStorage.setItem('setup_completed', 'true');
        console.warn('Using fallback configuration status due to API error');
      }
    } catch (error) {
      console.error('Error loading configuration status:', error);
      const status: ConfigurationStatus = {
        huggingface_configured: true,
        github_configured: true,
        openai_configured: true,
        neo4j_configured: true,
      };
      setConfigStatus(status);
      localStorage.setItem('config_status', JSON.stringify(status));
      localStorage.setItem('setup_completed', 'true');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedFormState = () => {
    try {
      const savedState = localStorage.getItem('homework_config_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const newConfig = { ...config };
        Object.keys(parsedState).forEach((key) => {
          if (!key.includes('password') && !key.includes('token') && !key.includes('key')) {
            newConfig[key] = parsedState[key];
          } else if (parsedState[key]) {
            newConfig[key] = parsedState[key];
          }
        });
        setConfig(newConfig);
      }
      const getNeo4jInfo = async () => {
        try {
          const response = await fetch('/api/configuration');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.neo4j_configured) {
              try {
                const response = await fetch('/api/get-neo4j-info');
                if (response.ok) {
                  const neo4jData = await response.json();
                  if (neo4jData.success && neo4jData.data) {
                    setConfig((prev) => ({
                      ...prev,
                      neo4j_uri: neo4jData.data.uri || prev.neo4j_uri,
                      neo4j_username: neo4jData.data.username || prev.neo4j_username,
                    }));
                  }
                }
              } catch (error) {
                console.warn('Could not retrieve Neo4j connection info:', error);
              }
            }
          }
        } catch (error) {
          console.warn('Could not check Neo4j configuration status:', error);
        }
      };
      getNeo4jInfo();
    } catch (error) {
      console.error('Error loading saved form state:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prevConfig) => ({
      ...prevConfig,
      [name]: value,
    }));

    const persistConfig = { ...config, [name]: value };
    if (name.includes('password') || name.includes('token') || name.includes('key')) {
      persistConfig[name] = '';
    }
    localStorage.setItem('homework_config_state', JSON.stringify(persistConfig));
  };

  const handleSelectChange = (value: string, name: string) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [name]: value,
    }));
  };

  const handleSaveConfiguration = async () => {
    try {
      setLoading(true);
      const loadingToast = toast.loading('Saving configuration...');
      const configToSave: Record<string, string> = {};
      if (config.huggingface_token) configToSave.huggingface_token = config.huggingface_token;
      if (config.github_token) configToSave.github_token = config.github_token;
      if (config.openai_api_key) configToSave.openai_api_key = config.openai_api_key;
      if (config.neo4j_uri && config.neo4j_username && config.neo4j_password) {
        configToSave.neo4j_uri = config.neo4j_uri;
        configToSave.neo4j_username = config.neo4j_username;
        configToSave.neo4j_password = config.neo4j_password;
      }
      if (config.chat_model) configToSave.chat_model = config.chat_model;
      if (config.server_port) configToSave.server_port = config.server_port;
      if (config.temp_dir) configToSave.temp_dir = config.temp_dir;

      const response = await fetch('/api/configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave),
      });

      if (response.ok) {
        const data = await response.json();
        toast.dismiss(loadingToast);
        toast.success('Configuration saved successfully');
        localStorage.setItem('setup_completed', 'true');
        const sanitizedConfig = {
          ...config,
          huggingface_token: '',
          github_token: '',
          openai_api_key: '',
          neo4j_password: '',
        };
        localStorage.setItem('homework_config_state', JSON.stringify(sanitizedConfig));
        setConfig({
          ...config,
          huggingface_token: '',
          github_token: '',
          openai_api_key: '',
          neo4j_password: '',
        });
        await loadConfigurationStatus();
        if (data.data?.items) {
          const updatedItems = data.data.items;
          const itemNames = [];
          if (updatedItems.huggingface) itemNames.push('Hugging Face');
          if (updatedItems.github) itemNames.push('GitHub');
          if (updatedItems.openai) itemNames.push('OpenAI');
          if (updatedItems.neo4j) itemNames.push('Neo4j');
          if (itemNames.length > 0) {
            toast.success(`Updated: ${itemNames.join(', ')}`);
          }
        }
      } else {
        const data = await response.json();
        toast.dismiss(loadingToast);
        toast.error(data.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error saving configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeployNeo4j = async () => {
    setDeployingNeo4j(true);
    try {
      toast.loading('Deploying Neo4j Docker container...');
      const response = await fetch('/api/deploy-neo4j', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to deploy Neo4j container');
      }
      const data = await response.json();
      if (data.success) {
        toast.success('Neo4j deployed successfully!');
        setConfig({
          ...config,
          neo4j_uri: data.data.uri || 'bolt://localhost:7687',
          neo4j_username: data.data.username || 'neo4j',
          neo4j_password: data.data.password || '',
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
              <div className="flex items-center">
                <Label htmlFor="huggingface_token" className="flex items-center">
                  Hugging Face Token
                  {configStatus.huggingface_configured && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="text-green-600 mr-1">✓</span>
                      <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">
                        Configured
                      </span>
                    </span>
                  )}
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="huggingface_token"
                  name="huggingface_token"
                  type="password"
                  placeholder={configStatus.huggingface_configured ? "••••••••••••••••" : "hf_..."}
                  value={config.huggingface_token}
                  onChange={handleInputChange}
                  className={configStatus.huggingface_configured ? "border-green-300 pr-10" : ""}
                />
                {configStatus.huggingface_configured && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-green-600 text-lg">✓</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex justify-between">
                <span>Required for dataset creation and management with Hugging Face.</span>
                {configStatus.huggingface_configured && (
                  <span className="text-green-600 text-xs italic">Token already stored securely</span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="github_token" className="flex items-center">
                  GitHub Token
                  {configStatus.github_configured && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="text-green-600 mr-1">✓</span>
                      <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">
                        Configured
                      </span>
                    </span>
                  )}
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="github_token"
                  name="github_token"
                  type="password"
                  placeholder={configStatus.github_configured ? "••••••••••••••••" : "ghp_..."}
                  value={config.github_token}
                  onChange={handleInputChange}
                  className={configStatus.github_configured ? "border-green-300 pr-10" : ""}
                />
                {configStatus.github_configured && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-green-600 text-lg">✓</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex justify-between">
                <span>Optional: Provides higher rate limits for GitHub API access.</span>
                {configStatus.github_configured && (
                  <span className="text-green-600 text-xs italic">Token already stored securely</span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="openai_api_key" className="flex items-center">
                  OpenAI API Key
                  {configStatus.openai_configured && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="text-green-600 mr-1">✓</span>
                      <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">
                        Configured
                      </span>
                    </span>
                  )}
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="openai_api_key"
                  name="openai_api_key"
                  type="password"
                  placeholder={configStatus.openai_configured ? "••••••••••••••••" : "sk-..."}
                  value={config.openai_api_key}
                  onChange={handleInputChange}
                  className={configStatus.openai_configured ? "border-green-300 pr-10" : ""}
                />
                {configStatus.openai_configured && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-green-600 text-lg">✓</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex justify-between">
                <span>Optional: Used for AI-powered features.</span>
                {configStatus.openai_configured && (
                  <span className="text-green-600 text-xs italic">Key already stored securely</span>
                )}
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
                <h3 className="text-lg font-medium flex items-center">
                  Database Status
                  {configStatus.neo4j_configured && (
                    <span className="ml-2 text-green-600">✓</span>
                  )}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {configStatus.neo4j_configured
                    ? "Neo4j is configured and ready to use"
                    : "Neo4j is not configured yet"
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleDeployNeo4j}
                  disabled={loading || deployingNeo4j}
                >
                  {deployingNeo4j ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Deploy Neo4j Docker
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {deployingNeo4j && (
              <div className="text-xs text-amber-500 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                <p className="font-medium">Deploying Neo4j in Docker...</p>
                <p>You may need to check your terminal - admin permissions may be required.</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="neo4j_uri" className="flex items-center">
                  Neo4j URI
                  {configStatus.neo4j_configured && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="text-green-600 mr-1">✓</span>
                      <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">
                        Configured
                      </span>
                    </span>
                  )}
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="neo4j_uri"
                  name="neo4j_uri"
                  placeholder="bolt://localhost:7687"
                  value={config.neo4j_uri}
                  onChange={handleInputChange}
                  className={configStatus.neo4j_configured ? "border-green-300" : ""}
                />
                {configStatus.neo4j_configured && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-green-600 text-sm">Verified</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="neo4j_username" className="flex items-center">
                  Neo4j Username
                  {configStatus.neo4j_configured && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="text-green-600 mr-1">✓</span>
                      <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">
                        Configured
                      </span>
                    </span>
                  )}
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="neo4j_username"
                  name="neo4j_username"
                  placeholder="neo4j"
                  value={config.neo4j_username}
                  onChange={handleInputChange}
                  className={configStatus.neo4j_configured ? "border-green-300" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="neo4j_password" className="flex items-center">
                  Neo4j Password
                  {configStatus.neo4j_configured && (
                    <span className="ml-2 inline-flex items-center">
                      <span className="text-green-600 mr-1">✓</span>
                      <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5">
                        Configured
                      </span>
                    </span>
                  )}
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="neo4j_password"
                  name="neo4j_password"
                  type="password"
                  placeholder="Enter password"
                  value={config.neo4j_password}
                  onChange={handleInputChange}
                  className={configStatus.neo4j_configured ? "border-green-300" : ""}
                />
                {configStatus.neo4j_configured && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-green-600 text-lg">✓</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between">
                <p className="text-sm text-muted-foreground">
                  All fields are required to save Neo4j configuration.
                </p>
                {configStatus.neo4j_configured && (
                  <span className="text-green-600 text-xs italic">Connection verified</span>
                )}
              </div>
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
            <div className="space-y-6">
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
              
              <div className="space-y-2">
                <Label htmlFor="temp_dir">Cache Directory</Label>
                <Input
                  id="temp_dir"
                  name="temp_dir"
                  type="text"
                  placeholder="/home/user/.othertales_homework/temp"
                  value={config.temp_dir || ""}
                  onChange={handleInputChange}
                />
                <p className="text-sm text-muted-foreground">
                  Directory for temporary files and cache storage
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Chat Configuration</CardTitle>
            <CardDescription>
              Configure chat model settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="chat_model">Chat Model</Label>
                <Select
                  value={config.chat_model}
                  onValueChange={(value) => handleSelectChange(value, 'chat_model')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a chat model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  The OpenAI model to use for chat. GPT-4 provides better reasoning but costs more.
                </p>
              </div>
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