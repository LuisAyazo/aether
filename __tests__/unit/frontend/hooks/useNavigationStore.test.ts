import { renderHook, act } from '@testing-library/react';
import { useNavigationStore } from "../../../../app/stores/useNavigationStore";
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Los mocks ya están configurados en setup.ts
// Solo necesitamos obtener las funciones mockeadas
const authService = vi.mocked(await import("../../../../app/services/authService"));
const dashboardService = vi.mocked(await import("../../../../app/services/dashboardService"));

describe('useNavigationStore', () => {
  beforeEach(() => {
    // Reset store state
    useNavigationStore.setState({
      user: null,
      activeCompany: null,
      environments: [],
      diagrams: [],
      dataLoading: false
    });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useNavigationStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.activeCompany).toBeNull();
    expect(result.current.environments).toEqual([]);
    expect(result.current.dataLoading).toBe(false);
  });

  it('loads dashboard data successfully', async () => {
    const mockUser = {
      _id: 'user-1',
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    };

    const mockDashboardData = {
      companies: [{
        _id: '1',
        id: '1',
        name: 'Test Company',
        role: 'owner' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }],
      workspaces: [{ id: 'ws-1', name: 'Main Workspace' }],
      environments: [{ id: 'env-1', name: 'Production' }],
      recent_diagrams: [],
      active_company_id: '1',
      active_workspace_id: 'ws-1'
    };

    // Mock getCurrentUser para devolver un usuario
    authService.getCurrentUser.mockReturnValue(mockUser);
    dashboardService.dashboardService.getInitialDashboardData.mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useNavigationStore());
    
    await act(async () => {
      result.current.fetchInitialUser();
    });

    await vi.waitFor(() => {
      expect(result.current.dataLoading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.activeCompany).toEqual(mockDashboardData.companies[0]);
      expect(result.current.environments).toEqual(mockDashboardData.environments);
    });
  });

  it('handles environment change', async () => {
    const { result } = renderHook(() => useNavigationStore());
    
    // Set initial state
    act(() => {
      useNavigationStore.setState({
        activeCompany: { 
          _id: '1', 
          id: '1',
          name: 'Test Company',
          role: 'owner' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        environments: [
          { 
            id: 'env-1', 
            name: 'Production',
            is_active: true,
            diagrams: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          { 
            id: 'env-2', 
            name: 'Development',
            is_active: true,
            diagrams: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      });
    });

    await act(async () => {
      await result.current.handleEnvironmentChange('env-2');
    });

    expect(result.current.selectedEnvironment).toBe('env-2');
  });
});
