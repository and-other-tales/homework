'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigItem {
  key: string;
  name: string;
  description: string;
  required: boolean;
  value: string;
  placeholder?: string;
  type?: string;
}

export function SetupWizard() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deployingNeo4j, setDeployingNeo4j] = useState(false);
  const [step, setStep] = useState(0);
  const [configItems, setConfigItems] = useState<ConfigItem[]>([
    {
      key: 'huggingface_token',
      name: 'Hugging Face Token',
      description: 'Required for dataset creation and management',
      required: true,
      value: '',
      placeholder: 'hf_...',
      type: 'password'
    },
    {
      key: 'github_token',
      name: 'GitHub Access Token',
      description: 'Optional: Provides higher rate limits for GitHub API access',
      required: false,
      value: '',
      placeholder: 'ghp_...',
      type: 'password'
    },
    {
      key: 'openai_api_key',
      name: 'OpenAI API Key',
      description: 'Optional: Used for AI-powered features',
      required: false,
      value: '',
      placeholder: 'sk-...',
      type: 'password'
    },
    {
      key: 'neo4j_uri',
      name: 'Neo4j URI',
      description: 'Optional: For knowledge graph storage',
      required: false,
      value: 'bolt://localhost:7687',
      placeholder: 'bolt://localhost:7687'
    },
    {
      key: 'neo4j_username',
      name: 'Neo4j Username',
      description: 'Optional: For knowledge graph authentication',
      required: false,
      value: 'neo4j',
      placeholder: 'neo4j'
    },
    {
      key: 'neo4j_password',
      name: 'Neo4j Password',
      description: 'Optional: For knowledge graph authentication',
      required: false,
      value: '',
      placeholder: 'password',
      type: 'password'
    }
  ]);

  // Check if required environment variables are missing
  useEffect(() => {
    // Check if setup was previously completed
    const setupCompleted = localStorage.getItem('setup_completed') === 'true';
    if (setupCompleted) {
      // Don't show the wizard if setup was completed
      return;
    }
    
    // Show the wizard for initial setup
    setOpen(true);

    const checkEnvironment = async () => {
      try {
        // Check if we have saved state for the wizard
        const savedState = localStorage.getItem('setup_wizard_state');
        
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          
          // If we have saved state, update the config items
          if (parsedState.configItems) {
            // For security, don't load sensitive values from localStorage
            const loadedItems = parsedState.configItems.map(item => {
              if (item.type === 'password') {
                return {...item, value: ''};
              }
              return item;
            });
            
            setConfigItems(loadedItems);
          }
          
          // If we have a saved step, use it
          if (parsedState.step !== undefined) {
            setStep(parsedState.step);
          }
        }
        
        try {
          // Try to get server status
          const response = await fetch('/api/status');
          
          if (response.ok) {
            const data = await response.json();
            
            // If there are missing configs in the response, open the wizard
            if (data.success && data.data?.missing_configs) {
              const missingConfigs = data.data.missing_configs as string[];
              
              if (missingConfigs.length > 0) {
                // Mark the items that are missing as required
                setConfigItems(prev => 
                  prev.map(item => ({
                    ...item,
                    required: missingConfigs.includes(item.key) || item.required
                  }))
                );
                // Wizard already opened for testing
                // setOpen(true);
              }
            }
          } else {
            // If we can't connect to the server, we should show the setup wizard
            // Wizard already opened for testing
            // setOpen(true);
          }
        } catch (e) {
          console.error('Failed to fetch status:', e);
          // Wizard already opened for testing
          // setOpen(true);
        }
      } catch (error) {
        console.error('Failed to check environment:', error);
        // If we can't connect at all, show the setup wizard
        // Wizard already opened for testing
        // setOpen(true);
      }
    };

    checkEnvironment();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    const updatedItems = [...configItems];
    updatedItems[index].value = value;
    setConfigItems(updatedItems);
    
    // Save to localStorage for persistence
    // For security, create a copy without sensitive values
    const persistItems = updatedItems.map(item => {
      if (item.type === 'password') {
        return {...item, value: ''};
      }
      return item;
    });
    
    localStorage.setItem('setup_wizard_state', JSON.stringify({
      configItems: persistItems,
      step
    }));
  };

  const handleDeployNeo4j = async () => {
    setDeployingNeo4j(true);
    
    try {
      const loadingToast = toast.loading('Deploying Neo4j Docker container...');
      
      console.log('Starting Neo4j deployment...');
      
      // Call the API to deploy Neo4j
      const response = await fetch('/api/deploy-neo4j', {
        method: 'POST',
      });
      
      // Get response text for diagnostic purposes
      const responseText = await response.text();
      console.log('Deploy Neo4j response:', response.status, responseText);
      
      // Parse the response as JSON if possible
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        throw new Error(`Failed to parse response: ${responseText}`);
      }
      
      if (!response.ok) {
        throw new Error(data?.message || `Failed to deploy Neo4j container (status ${response.status})`);
      }
      
      if (data.success) {
        toast.dismiss(loadingToast);
        toast.success('Neo4j deployed successfully!');
        
        console.log('Neo4j deployment successful with data:', data);
        
        // Update the Neo4j configuration fields with the values from the response
        const updatedItems = [...configItems];
        
        // Find indexes of Neo4j fields
        const uriIndex = updatedItems.findIndex(item => item.key === 'neo4j_uri');
        const usernameIndex = updatedItems.findIndex(item => item.key === 'neo4j_username');
        const passwordIndex = updatedItems.findIndex(item => item.key === 'neo4j_password');
        
        // Update all fields at once if we have the data
        if (data.data) {
          if (uriIndex !== -1) {
            updatedItems[uriIndex].value = data.data.uri || 'bolt://localhost:7687';
          }
          
          if (usernameIndex !== -1) {
            updatedItems[usernameIndex].value = data.data.username || 'neo4j';
          }
          
          if (passwordIndex !== -1) {
            updatedItems[passwordIndex].value = data.data.password || 'password';
          }
          
          setConfigItems(updatedItems);
          
          // Also persist the updates to localStorage (except for password)
          const persistItems = updatedItems.map(item => {
            if (item.type === 'password') {
              return {...item, value: ''};
            }
            return item;
          });
          
          localStorage.setItem('setup_wizard_state', JSON.stringify({
            configItems: persistItems,
            step
          }));
        } else {
          throw new Error('Neo4j deployment succeeded but no configuration data was returned');
        }
      } else {
        throw new Error(data.message || 'Unknown error deploying Neo4j');
      }
    } catch (error) {
      console.error('Error deploying Neo4j:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to deploy Neo4j');
    } finally {
      setDeployingNeo4j(false);
    }
  };

  const handleSkip = () => {
    if (step < configItems.length - 1) {
      setStep(step + 1);
    } else {
      saveConfiguration();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      const newStep = step - 1;
      setStep(newStep);
      
      // Save step to localStorage
      const savedState = localStorage.getItem('setup_wizard_state');
      const stateObject = savedState ? JSON.parse(savedState) : {};
      localStorage.setItem('setup_wizard_state', JSON.stringify({
        ...stateObject,
        step: newStep
      }));
    }
  };

  const handleNext = () => {
    const currentItem = configItems[step];
    
    // If the current field is required and empty, don't proceed
    if (currentItem.required && !currentItem.value) {
      return;
    }
    
    if (step < configItems.length - 1) {
      const newStep = step + 1;
      setStep(newStep);
      
      // Save step to localStorage
      const savedState = localStorage.getItem('setup_wizard_state');
      const stateObject = savedState ? JSON.parse(savedState) : {};
      localStorage.setItem('setup_wizard_state', JSON.stringify({
        ...stateObject,
        step: newStep
      }));
    } else {
      saveConfiguration();
    }
  };

  const saveConfiguration = async () => {
    setLoading(true);
    
    try {
      // Filter out empty values for optional fields
      const configToSave = configItems.reduce((acc, item) => {
        if (item.value || item.required) {
          acc[item.key] = item.value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      // Show a loading toast
      toast.loading('Saving configuration...');
      
      // Save configuration via API
      const response = await fetch('/api/configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave),
      });
      
      if (response.ok) {
        // Configuration saved successfully
        toast.success('Configuration saved successfully!');
        setOpen(false);
        
        // Cache a flag in localStorage to prevent reopening the wizard
        localStorage.setItem('setup_completed', 'true');
        
        // Clear the wizard state from localStorage
        localStorage.removeItem('setup_wizard_state');
        
        // Wait a moment before reloading
        setTimeout(() => {
          // Reload the page to apply new configuration
          window.location.reload();
        }, 1500);
      } else {
        const data = await response.json();
        const errorMessage = data.message || 'Failed to save configuration';
        console.error('Failed to save configuration:', errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Error saving configuration');
    } finally {
      setLoading(false);
    }
  };

  const currentItem = configItems[step];
  const isLastStep = step === configItems.length - 1;
  const isFirstStep = step === 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Setup Wizard</DialogTitle>
          <DialogDescription>
            Configure your environment to use all features of the application.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${((step + 1) / configItems.length) * 100}%` }}></div>
            </div>
            <span className="ml-2 text-sm">{step + 1}/{configItems.length}</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              {currentItem.required ? (
                <AlertCircle className="h-5 w-5 text-destructive mt-1" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted mt-1" />
              )}
              <div className="space-y-1.5">
                <Label htmlFor={currentItem.key} className="text-base font-semibold">
                  {currentItem.name}
                  {currentItem.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <p className="text-sm text-muted-foreground">{currentItem.description}</p>
              </div>
            </div>

            {currentItem.key.startsWith('neo4j_') && (
              <div className="mb-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full flex items-center justify-center gap-2 mb-2"
                  onClick={handleDeployNeo4j}
                  disabled={loading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.9 4.5H4.1C2.94 4.5 2 5.44 2 6.6V15.4C2 16.56 2.94 17.5 4.1 17.5H8.5V19.5H15.5V17.5H19.9C21.06 17.5 22 16.56 22 15.4V6.6C22 5.44 21.06 4.5 19.9 4.5Z" 
                      fill="currentColor" opacity="0.4" />
                    <path d="M12 8.5L7 12L12 15.5L17 12L12 8.5Z" fill="currentColor" />
                  </svg>
                  Deploy Neo4j Docker
                </Button>
                <p className="text-xs text-muted-foreground mb-3">
                  Don't have Neo4j? Click to automatically deploy Neo4j v5.3 in Docker
                </p>
              </div>
            )}
            <Input
              id={currentItem.key}
              type={currentItem.type || 'text'}
              placeholder={currentItem.placeholder}
              value={currentItem.value}
              onChange={(e) => handleInputChange(step, e.target.value)}
              autoComplete="off"
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div>
            {!isFirstStep && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {!currentItem.required && (
              <Button variant="ghost" onClick={handleSkip} disabled={loading}>
                {isLastStep ? 'Skip & Finish' : 'Skip'}
              </Button>
            )}
            <Button onClick={handleNext} disabled={currentItem.required && !currentItem.value || loading}>
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : isLastStep ? (
                <span className="flex items-center">
                  <Check className="mr-1 h-4 w-4" />
                  Finish
                </span>
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}