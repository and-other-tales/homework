'use client';

import { useState } from "react";
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, GitFork, GitBranch, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description?: string;
  language?: string;
  stargazers_count: number;
  forks_count?: number;
  open_issues_count?: number;
  updated_at: string;
}

export default function GitHubPage() {
  const [repoUrl, setRepoUrl] = useState('');
  const [orgName, setOrgName] = useState('');
  const [datasetName, setDatasetName] = useState('');
  const [loadingRepo, setLoadingRepo] = useState(false);
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [processedRepos, setProcessedRepos] = useState<string[]>([]);

  // Handle repository URL submission
  const handleFetchRepository = async () => {
    if (!repoUrl.trim()) {
      toast.error('Please enter a repository URL');
      return;
    }
    
    setLoadingRepo(true);
    
    try {
      // Extract repo name from URL
      let repoName = repoUrl;
      
      // If it's a GitHub URL, extract the repo name
      if (repoUrl.includes('github.com')) {
        const urlParts = repoUrl.split('github.com/');
        if (urlParts.length > 1) {
          repoName = urlParts[1].replace(/\/$/, '');
        }
      }
      
      // Fetch repository data from the backend API
      const response = await fetch(`/api/github/repository?repo=${repoName}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch repository information');
      }
      const repoData = await response.json();
      setSelectedRepo(repoData);
      toast.success(`Repository ${repoData.name} fetched successfully`);
      
      // Generate dataset name from repo name
      setDatasetName(`${repoData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-dataset`);
    } catch (error) {
      console.error('Error fetching repository:', error);
      toast.error(error.message || 'Failed to fetch repository information');
    } finally {
      setLoadingRepo(false);
    }
  };

  // Handle organization name submission
  const handleFetchOrganization = async () => {
    if (!orgName.trim()) {
      toast.error('Please enter an organization name');
      return;
    }
    
    setLoadingOrg(true);
    
    try {
      // Fetch organization repositories from the backend API
      const response = await fetch(`/api/github/organization?org=${orgName}`);
      if (!response.ok) {
        throw new Error('Failed to fetch organization information');
      }
      const orgData = await response.json();
      
      toast.success(`Organization ${orgName} fetched successfully`);
      toast.info(`Found ${orgData.length} repositories in ${orgName}`);
      
      // Generate dataset name from org name
      setDatasetName(`${orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-dataset`);
    } catch (error) {
      console.error('Error fetching organization:', error);
      toast.error('Failed to fetch organization information');
    } finally {
      setLoadingOrg(false);
    }
  };

  // Handle dataset generation
  const handleGenerateDataset = async () => {
    if (!datasetName) {
      toast.error('Please enter a dataset name');
      return;
    }
    
    if (!selectedRepo && !orgName) {
      toast.error('Please fetch a repository or organization first');
      return;
    }
    
    try {
      // Determine source type and name
      const sourceType = selectedRepo ? 'repository' : 'organization';
      const sourceName = selectedRepo ? selectedRepo.full_name : orgName;
      
      const loadingToast = toast.loading(`Generating dataset from ${sourceType} ${sourceName}...`);
      
      // Call the API to generate dataset using fetch directly
      const response = await fetch('/api/datasets/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_type: sourceType,
          source_name: sourceName,
          dataset_name: datasetName,
          description: `Dataset generated from ${sourceType} ${sourceName}`,
        }),
      });
      
      // Parse response properly
      const data = await response.json();
      
      // Dismiss the loading toast
      toast.dismiss(loadingToast);
      
      if (data.success || data.task_id) {
        toast.success(`Dataset ${datasetName} creation started successfully`);
        
        // Add to processed repos
        setProcessedRepos(prev => [...prev, sourceName]);
        
        // Reset form
        setRepoUrl('');
        setOrgName('');
        setDatasetName('');
        setSelectedRepo(null);
      } else {
        toast.error(`Failed to create dataset: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating dataset:', error);
      toast.error('Failed to generate dataset');
      
      // Ensure all toasts are dismissed
      toast.dismiss();
    }
  };

  return (
    <PageLayout title="GitHub Integration">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Repository Scraper</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)" 
                  className="flex-1"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  disabled={loadingRepo}
                />
                <Button 
                  onClick={handleFetchRepository}
                  disabled={loadingRepo || !repoUrl.trim()}
                >
                  {loadingRepo ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Fetch Repository
                </Button>
              </div>
              
              {selectedRepo && (
                <div className="space-y-2 border rounded p-3">
                  <h3 className="font-medium">{selectedRepo.full_name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRepo.description}</p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <GitFork className="h-4 w-4" />
                    <span>{selectedRepo.forks_count || 0} forks</span>
                    
                    <GitBranch className="ml-4 h-4 w-4" />
                    <span>{selectedRepo.open_issues_count || 0} issues</span>
                    
                    <Star className="ml-4 h-4 w-4" />
                    <span>{selectedRepo.stargazers_count} stars</span>
                  </div>
                  
                  <div className="pt-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Dataset name"
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleGenerateDataset}>
                        Generate Dataset
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Repository History</CardTitle>
          </CardHeader>
          <CardContent>
            {processedRepos.length > 0 ? (
              <div className="space-y-2">
                {processedRepos.map((repo, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div className="text-sm font-medium">{repo}</div>
                    <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      Processed
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No repositories have been processed yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Scraper</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Enter GitHub organization name (e.g., microsoft)" 
                  className="flex-1"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  disabled={loadingOrg}
                />
                <Button 
                  onClick={handleFetchOrganization}
                  disabled={loadingOrg || !orgName.trim()}
                >
                  {loadingOrg ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Fetch Organization
                </Button>
              </div>
              
              {orgName && !loadingOrg && (
                <div className="pt-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Dataset name"
                      value={datasetName}
                      onChange={(e) => setDatasetName(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleGenerateDataset}>
                      Generate Dataset
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
