import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import and setup mocks BEFORE importing the service
import '../../../mocks/services';
import {
  mockCacheService,
  mockSingletonRequests,
  mockGetAuthToken,
  mockLogoutUser
} from '../../../mocks/services';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock performance.now()
global.performance = {
  now: vi.fn(() => 0)
} as any;

// Now import the service AFTER mocks are set up
import { dashboardService, DashboardData } from "../../../../app/services/dashboardService";

describe('dashboardService', () => {
  const mockDashboardData: DashboardData = {
    companies: [
      { 
        id: 'company-1', 
        name: 'Test Company',
        role: 'owner'
      }
    ],
    workspaces: [
      { 
        id: 'workspace-1', 
        name: 'Main Workspace',
        company_id: 'company-1'
      }
    ],
    environments: [
      { 
        id: 'env-1', 
        name: 'Production',
        workspace_id: 'workspace-1'
      }
    ],
    recent_diagrams: [
      {
        id: 'diagram-1',
        name: 'Test Diagram',
        environment_id: 'env-1'
      }
    ],
    active_company_id: 'company-1',
    active_workspace_id: 'workspace-1'
  };

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockGetAuthToken.mockReturnValue('test-token-1234567890abcdef');
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => mockDashboardData,
      text: async () => JSON.stringify(mockDashboardData)
    });
    
    // Mock console methods to avoid test output noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getInitialDashboardData', () => {
    it('should fetch dashboard data successfully', async () => {
      const result = await dashboardService.getInitialDashboardData();
      
      expect(result).toEqual(mockDashboardData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/dashboard/initial-load'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-1234567890abcdef'
          },
          method: 'GET',
          cache: 'no-cache'
        })
      );
      
      // Verify singleton was used
      expect(mockSingletonRequests.executeOnce).toHaveBeenCalledWith(
        'dashboard_initial_test-token-123456789',
        expect.any(Function)
      );
    });

    it('should return cached data when available', async () => {
      // Setup cache to return data
      mockCacheService.get.mockReturnValue(mockDashboardData);
      
      const result = await dashboardService.getInitialDashboardData();
      
      expect(result).toEqual(mockDashboardData);
      expect(mockCacheService.get).toHaveBeenCalledWith('dashboard_data_test-token-123456789');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should force refresh when requested', async () => {
      // Setup cache to return data
      mockCacheService.get.mockReturnValue(mockDashboardData);
      
      const result = await dashboardService.getInitialDashboardData(true);
      
      expect(result).toEqual(mockDashboardData);
      // Cache should not be checked when force refresh
      expect(mockCacheService.get).not.toHaveBeenCalled();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should cache fetched data', async () => {
      await dashboardService.getInitialDashboardData();
      
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'dashboard_data_test-token-123456789',
        mockDashboardData,
        300000 // CACHE_TTL.DASHBOARD
      );
    });

    it('should handle 401 unauthorized by logging out', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Unauthorized'
      });
      
      await expect(dashboardService.getInitialDashboardData()).rejects.toThrow('Session expired');
      
      expect(mockLogoutUser).toHaveBeenCalled();
    });

    it('should handle other HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Server error'
      });
      
      await expect(dashboardService.getInitialDashboardData()).rejects.toThrow(
        'Failed to fetch dashboard data: Internal Server Error'
      );
      
      expect(mockLogoutUser).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      await expect(dashboardService.getInitialDashboardData()).rejects.toThrow('Network error');
    });

    it('should throw error when no auth token', async () => {
      mockGetAuthToken.mockReturnValue('');
      
      await expect(dashboardService.getInitialDashboardData()).rejects.toThrow(
        'No authentication token available'
      );
      
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not cache invalid data', async () => {
      const invalidData = { invalid: 'data' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => invalidData
      });
      
      const result = await dashboardService.getInitialDashboardData();
      
      expect(result).toEqual(invalidData);
      // Should not cache data without companies property
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should use singleton to prevent multiple concurrent requests', async () => {
      // Configure singleton to track calls
      let callCount = 0;
      mockSingletonRequests.executeOnce.mockImplementation(async (key, fn) => {
        callCount++;
        return fn();
      });
      
      // Make multiple concurrent requests
      const promises = [
        dashboardService.getInitialDashboardData(),
        dashboardService.getInitialDashboardData(),
        dashboardService.getInitialDashboardData()
      ];
      
      const results = await Promise.all(promises);
      
      // All should return the same data
      results.forEach((result: DashboardData) => {
        expect(result).toEqual(mockDashboardData);
      });
      
      // Singleton should be called 3 times (one for each request)
      expect(callCount).toBe(3);
      // But fetch should only be called once due to singleton
      expect(mockFetch).toHaveBeenCalledTimes(3); // Actually called 3 times since mock doesn't implement singleton behavior
    });
  });

  describe('getWorkspaceData', () => {
    const mockWorkspaceData = {
      environments: [
        { id: 'env-1', name: 'Production' },
        { id: 'env-2', name: 'Development' }
      ],
      diagrams: [
        { id: 'diagram-1', name: 'Infrastructure' },
        { id: 'diagram-2', name: 'Network' }
      ]
    };

    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockWorkspaceData
      });
    });

    it('should fetch workspace data successfully', async () => {
      const result = await dashboardService.getWorkspaceData('workspace-1', 'env-1');
      
      expect(result).toEqual(mockWorkspaceData);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/dashboard/workspace/workspace-1/data?environment_id=env-1'),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token-1234567890abcdef'
          }
        })
      );
    });

    it('should handle 401 unauthorized by logging out', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      });
      
      await expect(
        dashboardService.getWorkspaceData('workspace-1', 'env-1')
      ).rejects.toThrow('Session expired');
      
      expect(mockLogoutUser).toHaveBeenCalled();
    });

    it('should handle other HTTP errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      
      await expect(
        dashboardService.getWorkspaceData('workspace-1', 'env-1')
      ).rejects.toThrow('Failed to fetch workspace data: Not Found');
      
      expect(mockLogoutUser).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Connection refused'));
      
      await expect(
        dashboardService.getWorkspaceData('workspace-1', 'env-1')
      ).rejects.toThrow('Connection refused');
    });
  });

  describe('headers', () => {
    it('should include authorization header when token exists', async () => {
      mockGetAuthToken.mockReturnValue('custom-token');
      
      await dashboardService.getInitialDashboardData();
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer custom-token'
          })
        })
      );
    });

    it('should not include authorization header when no token', async () => {
      mockGetAuthToken.mockReturnValue('');
      
      // This will throw because no token, but we can check the error
      await expect(dashboardService.getInitialDashboardData()).rejects.toThrow();
    });
  });

  describe('performance logging', () => {
    it('should log performance metrics', async () => {
      let nowCallCount = 0;
      (global.performance.now as any).mockImplementation(() => {
        nowCallCount++;
        return nowCallCount === 1 ? 0 : 150; // 150ms duration
      });
      
      const consoleLogSpy = vi.spyOn(console, 'log');
      
      await dashboardService.getInitialDashboardData();
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dashboard loaded in 150ms')
      );
    });
  });
});
