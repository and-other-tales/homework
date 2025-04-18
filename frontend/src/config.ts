/**
 * Application Configuration
 * This file contains configuration for the frontend application.
 */

// Default API URL based on environment
const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Configuration object
export const config = {
  // API configuration
  api: {
    /**
     * Base URL for the backend API
     * Can be overridden by setting NEXT_PUBLIC_API_URL environment variable
     * 
     * For HTTPS with self-signed certificates in development, set this to https://localhost:8080
     * and set nodeRejectUnauthorized to false to allow self-signed certificates.
     */
    baseUrl: DEFAULT_API_URL,
    
    /**
     * Whether to reject unauthorized SSL certificates (self-signed, expired, etc.)
     * Default: true (reject in production for security)
     * Set to false only in development when using self-signed certificates
     */
    nodeRejectUnauthorized: process.env.NODE_ENV === 'production',
    
    /**
     * Timeout for API requests in milliseconds
     */
    timeout: 30000, // 30 seconds
  },
  
  // Feature flags
  features: {
    /**
     * Enable human-in-loop features
     */
    enableHumanInLoop: true,
    
    /**
     * Enable knowledge graph features
     */
    enableKnowledgeGraph: true,
  },
  
  // UI configuration
  ui: {
    /**
     * Default theme (light or dark)
     */
    theme: 'light',
    
    /**
     * Refresh interval for dashboard in milliseconds
     */
    dashboardRefreshInterval: 15000, // 15 seconds
  },
};

// Helper function to detect HTTPS API and update configuration
export function detectHttpsMode(): boolean {
  const isHttps = window.location.protocol === 'https:' || 
                 config.api.baseUrl.startsWith('https://');
                 
  // If we're using HTTPS but didn't configure node to accept self-signed certs, this will remind developers
  if (isHttps && process.env.NODE_ENV === 'development') {
    console.info('HTTPS mode detected. In development, you may need to handle self-signed certificates.');
  }
  
  return isHttps;
}

// Helper function to get API URL with proper protocol
export function getApiUrl(path: string = ''): string {
  const baseUrl = config.api.baseUrl.endsWith('/') 
    ? config.api.baseUrl.slice(0, -1) 
    : config.api.baseUrl;
    
  const formattedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${formattedPath}`;
}

export default config;