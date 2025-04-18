'use client';

import { useState, useEffect } from 'react';
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, RefreshCw, Database } from 'lucide-react';
import { toast } from 'sonner';

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
    // Simulate download
    setTimeout(() => {
      setDownloadLoading(false);
      toast.success('Dataset downloaded successfully');
    }, 2000);
  };
  
  const handleUpdate = () => {
    setUpdateLoading(true);
    // Simulate update
    setTimeout(() => {
      setUpdateLoading(false);
      toast.success('Dataset updated successfully');
    }, 2000);
  };
  
  const handleDelete = () => {
    setDeleteLoading(true);
    // Simulate delete
    setTimeout(() => {
      setDeleteLoading(false);
      toast.success('Dataset deleted successfully');
    }, 2000);
  };
  
  return (
    <PageLayout title="Hugging Face Datasets">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Available Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold">langchain-docs</h3>
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">32 files</div>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">Documentation dataset created from LangChain repositories</p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloadLoading}>
                      {downloadLoading ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <Download className="mr-2 h-3 w-3" />}
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDelete} disabled={deleteLoading}>
                      {deleteLoading ? <RefreshCw className="mr-2 h-3 w-3 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3" />}
                      Delete
                    </Button>
                  </div>
                </div>
                {/* More dataset items would be here */}
              </div>
            )}
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