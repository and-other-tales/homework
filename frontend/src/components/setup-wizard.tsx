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
import { AlertCircle, X, Check } from 'lucide-react';
import { simpleApiClient } from '@/lib/api-client';

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
    const checkEnvironment = async () => {
      try {
        // Try to get server status
        const response = await simpleApiClient.getStatus();
        
        // If there are missing configs in the response, open the wizard
        if (response.success && response.data?.missing_configs) {
          const missingConfigs = response.data.missing_configs as string[];
          
          if (missingConfigs.length > 0) {
            // Mark the items that are missing as required
            setConfigItems(prev => 
              prev.map(item => ({
                ...item,
                required: missingConfigs.includes(item.key) || item.required
              }))
            );
            setOpen(true);
          }
        } else if (!response.success) {
          // If we can't connect to the server, we should show the setup wizard
          setOpen(true);
        }
      } catch (error) {
        console.error('Failed to check environment:', error);
        // If we can't connect at all, show the setup wizard
        setOpen(true);
      }
    };

    checkEnvironment();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    const updatedItems = [...configItems];
    updatedItems[index].value = value;
    setConfigItems(updatedItems);
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
      setStep(step - 1);
    }
  };

  const handleNext = () => {
    const currentItem = configItems[step];
    
    // If the current field is required and empty, don't proceed
    if (currentItem.required && !currentItem.value) {
      return;
    }
    
    if (step < configItems.length - 1) {
      setStep(step + 1);
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
        setOpen(false);
        
        // Reload the page to apply new configuration
        window.location.reload();
      } else {
        const data = await response.json();
        console.error('Failed to save configuration:', data.message);
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
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