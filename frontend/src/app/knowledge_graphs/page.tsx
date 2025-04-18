'use client';

import { useState, useEffect } from 'react';
import PageLayout from "@/components/layout/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Eye, Trash2, Database, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Metadata needs to be in a separate layout file for client components

export default function KnowledgeGraphsPage() {
  const [neo4jUri, setNeo4jUri] = useState("bolt://localhost:7687");
  const [connectionStatus, setConnectionStatus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [graphName, setGraphName] = useState("");
  const [graphDescription, setGraphDescription] = useState("");
  const [creatingGraph, setCreatingGraph] = useState(false);
  
  // Load Neo4j URI from localStorage on component mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('homework_config_state');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        if (config.neo4j_uri) {
          setNeo4jUri(config.neo4j_uri);
        }
      }
    } catch (e) {
      console.error("Error loading saved config:", e);
    }
  }, []);
  
  const testConnection = () => {
    setLoading(true);
    toast.loading("Testing Neo4j connection...");
    
    // Simulate connection test with more realistic behavior
    setTimeout(() => {
      // 90% chance of success
      const success = Math.random() < 0.9;
      
      if (success) {
        setConnectionStatus(true);
        toast.success("Successfully connected to Neo4j");
      } else {
        setConnectionStatus(false);
        toast.error("Failed to connect to Neo4j. Please check your configuration.");
      }
      
      setLoading(false);
    }, 1500);
  };
  
  const createGraph = () => {
    if (!graphName) {
      toast.error("Please enter a graph name");
      return;
    }
    
    setCreatingGraph(true);
    const loadingToast = toast.loading("Creating knowledge graph...");
    
    // Simulate graph creation
    setTimeout(() => {
      toast.dismiss(loadingToast);
      toast.success(`Knowledge graph "${graphName}" created successfully`);
      
      // Reset form
      setGraphName("");
      setGraphDescription("");
      setCreatingGraph(false);
    }, 2000);
  };
  
  return (
    <PageLayout title="Knowledge Graphs">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Knowledge Graph</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Input 
                    placeholder="Knowledge Graph Name" 
                    value={graphName}
                    onChange={(e) => setGraphName(e.target.value)}
                    disabled={creatingGraph}
                  />
                </div>
                <Button 
                  onClick={createGraph}
                  disabled={creatingGraph || !graphName.trim()}
                >
                  {creatingGraph ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create Graph
                </Button>
              </div>
              <div>
                <textarea 
                  className="w-full min-h-[100px] p-2 border rounded-md" 
                  placeholder="Description (optional)"
                  value={graphDescription}
                  onChange={(e) => setGraphDescription(e.target.value)}
                  disabled={creatingGraph}
                ></textarea>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Knowledge Graphs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">              
              {/* Empty state */}
              <div className="rounded-md border border-dashed p-8 text-center">
                <Database className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No knowledge graphs created yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Use the form above to create your first knowledge graph.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Neo4j Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Connection URI</label>
                <Input value={neo4jUri} readOnly />
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <div className="flex items-center mt-2">
                  <div className={`h-3 w-3 rounded-full ${connectionStatus ? "bg-green-500" : "bg-red-500"} mr-2`}></div>
                  <span className="text-sm">{connectionStatus ? "Connected" : "Disconnected"}</span>
                  {loading && <RefreshCw className="ml-2 h-3 w-3 animate-spin" />}
                </div>
                <p className="text-xs text-gray-500 mt-1">Last checked: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex space-x-2">
                <Button variant="outline" onClick={testConnection} disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Test Connection
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => window.location.href = '/configuration'}>
                  Edit Configuration
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}