'use client';

import { useState } from 'react';
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, RefreshCw, Database } from 'lucide-react';
import { toast } from 'sonner';

// Metadata needs to be in a separate layout file for client components

export default function HuggingFacePage() {
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Simulate data loading on mount
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleDownload = () => {
    setDownloadLoading(true);
    toast.loading('Downloading dataset...');
    
    setTimeout(() => {
      setDownloadLoading(false);
      toast.success('Dataset downloaded successfully');
    }, 1500);
  };
  
  const handleUpdate = () => {
    setUpdateLoading(true);
    toast.loading('Updating dataset...');
    
    setTimeout(() => {
      setUpdateLoading(false);
      toast.success('Dataset updated successfully');
    }, 1500);
  };
  
  const handleDelete = () => {
    setDeleteLoading(true);
    toast.loading('Deleting dataset...');
    
    setTimeout(() => {
      setDeleteLoading(false);
      toast.success('Dataset deleted successfully');
    }, 1500);
  };
  
  return (
    <PageLayout title="Hugging Face Datasets">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Loading datasets...</span>
                </div>
              ) : (
                <div className="rounded-md border p-4">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-medium">example-dataset</h3>
                      <p className="text-sm text-muted-foreground">Created: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDownload}
                        disabled={downloadLoading}
                      >
                        {downloadLoading ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleUpdate}
                        disabled={updateLoading}
                      >
                        {updateLoading ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Update
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                      >
                        {deleteLoading ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">Dataset created using GitHub repository data.</p>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <div className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">124 downloads</div>
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">32 files</div>
                  </div>
                </div>
              )
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dataset Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-md bg-muted p-4 text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Total Datasets</div>
              </div>
              <div className="rounded-md bg-muted p-4 text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Total Files</div>
              </div>
              <div className="rounded-md bg-muted p-4 text-center">
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">Total Downloads</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}