import { getAuthToken, logoutUser } from './authService';
import { cacheService, CACHE_KEYS, CACHE_TTL } from './cacheService';
import { singletonRequests } from '../utils/singletonRequests';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DashboardData {
  companies: any[];
  workspaces: any[];
  environments: any[];
  recent_diagrams: any[];
  active_company_id?: string;
  active_workspace_id?: string;
}

class DashboardService {
  private getHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getInitialDashboardData(forceRefresh: boolean = false): Promise<DashboardData> {
    // Create a unique cache key per user
    const token = getAuthToken();
    if (!token) {
      console.error('[DashboardService] No authentication token available');
      throw new Error('No authentication token available');
    }
    
    const cacheKey = `${CACHE_KEYS.DASHBOARD_DATA}_${token.substring(0, 20)}`;
    const requestKey = `dashboard_initial_${token.substring(0, 20)}`;
    
    // Log stack trace to identify caller
    console.log('[DashboardService] getInitialDashboardData called', { 
      forceRefresh, 
      cacheKey,
      requestKey,
      stack: new Error().stack?.split('\n').slice(2, 5).join('\n')
    });
    
    try {
      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cachedData = cacheService.get<DashboardData>(cacheKey);
        if (cachedData) {
          console.log('📦 Dashboard data loaded from cache');
          return cachedData;
        }
      }

      // Use singleton to prevent multiple concurrent requests
      return await singletonRequests.executeOnce(requestKey, async () => {
        console.log('🚀 Loading dashboard data with single RPC call...');
        const startTime = performance.now();
        
        const headers = this.getHeaders();
        console.log('[DashboardService] Request headers:', headers);
        
        const response = await fetch(`${API_BASE_URL}/api/v1/dashboard/initial-load`, {
          headers,
          method: 'GET',
          // Add cache control to prevent browser caching issues
          cache: 'no-cache',
        });

        console.log('[DashboardService] Response status:', response.status);

        if (!response.ok) {
          // Handle 401 Unauthorized - token expired
          if (response.status === 401) {
            console.error('[DashboardService] 401 Unauthorized - Token expired, logging out...');
            await logoutUser();
            throw new Error('Session expired');
          }
          
          const errorText = await response.text();
          console.error('[DashboardService] Error response:', errorText);
          throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
        }

        const data = await response.json();
        
        const endTime = performance.now();
        console.log(`✅ Dashboard loaded in ${(endTime - startTime).toFixed(0)}ms`);
        console.log('[DashboardService] Data received:', data);
        
        // Cache the data only if valid
        if (data && data.companies) {
          cacheService.set(cacheKey, data, CACHE_TTL.DASHBOARD);
        }
        
        return data;
      });
    } catch (error) {
      console.error('[DashboardService] Error fetching dashboard data:', error);
      throw error;
    }
  }

  async getWorkspaceData(
    workspaceId: string, 
    environmentId: string
  ): Promise<{ environments: any[], diagrams: any[] }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/dashboard/workspace/${workspaceId}/data?environment_id=${environmentId}`, 
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        // Handle 401 Unauthorized - token expired
        if (response.status === 401) {
          console.error('[DashboardService] 401 Unauthorized - Token expired, logging out...');
          await logoutUser();
          throw new Error('Session expired');
        }
        
        throw new Error(`Failed to fetch workspace data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching workspace data:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
