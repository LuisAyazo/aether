import { getAuthToken } from './authService';
import { cacheService, CACHE_KEYS, CACHE_TTL } from './cacheService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export interface Workspace {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  description?: string;
  settings?: Record<string, any>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceCreate {
  name: string;
  description?: string;
  is_default?: boolean;
}

export interface WorkspaceUpdate {
  name?: string;
  description?: string;
  is_default?: boolean;
}

class WorkspaceService {
  private getHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async listCompanyWorkspaces(companyId: string, forceRefresh: boolean = false): Promise<Workspace[]> {
    try {
      // Check cache first unless force refresh
      const cacheKey = CACHE_KEYS.WORKSPACES(companyId);
      if (!forceRefresh) {
        const cachedData = cacheService.get<Workspace[]>(cacheKey);
        if (cachedData) {
          console.log('📦 Workspaces loaded from cache');
          return cachedData;
        }
      }

      // Simple retry logic - only retry once if no token
      const token = getAuthToken();
      
      if (!token) {
        // Wait once for token
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryToken = getAuthToken();
        if (!retryToken) {
          throw new Error('No authentication token available');
        }
      }

      console.log('🔄 Fetching workspaces from API...');
      const response = await fetch(`${API_BASE_URL}/api/v1/workspaces?company_id=${companyId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the data
      cacheService.set(cacheKey, data, CACHE_TTL.WORKSPACES);
      
      return data;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw error;
    }
  }

  async getWorkspace(companyId: string, workspaceId: string): Promise<Workspace> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/workspaces/${workspaceId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workspace: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching workspace:', error);
      throw error;
    }
  }

  async createWorkspace(companyId: string, data: WorkspaceCreate): Promise<Workspace> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/workspaces`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ ...data, company_id: companyId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create workspace');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }

  async updateWorkspace(
    companyId: string, 
    workspaceId: string, 
    data: WorkspaceUpdate
  ): Promise<Workspace> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/workspaces/${workspaceId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update workspace');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw error;
    }
  }

  async deleteWorkspace(companyId: string, workspaceId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete workspace');
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw error;
    }
  }

  async setDefaultWorkspace(companyId: string, workspaceId: string): Promise<Workspace> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/workspaces/${workspaceId}/set-default`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to set default workspace');
      }

      return await response.json();
    } catch (error) {
      console.error('Error setting default workspace:', error);
      throw error;
    }
  }

  // Utility methods for local storage
  setCurrentWorkspace(workspaceId: string): void {
    localStorage.setItem('currentWorkspaceId', workspaceId);
  }

  getCurrentWorkspaceId(): string | null {
    return localStorage.getItem('currentWorkspaceId');
  }

  clearCurrentWorkspace(): void {
    localStorage.removeItem('currentWorkspaceId');
  }
}

export const workspaceService = new WorkspaceService();
