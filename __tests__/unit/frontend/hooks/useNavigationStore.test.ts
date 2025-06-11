import { renderHook, act } from '@testing-library/react';
import { useNavigationStore } from '@/app/hooks/useNavigationStore';
import { vi } from 'vitest';
import * as dashboardService from '@/app/services/dashboardService';

vi.mock('@/app/services/dashboardService');

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
    const mockDashboardData = {
      companies: [{ _id: '1', name: 'Test Company' }],
      workspaces: [{ id: 'ws-1', name: 'Main Workspace' }],
      environments: [{ id: 'env-1', name: 'Production' }],
      recent_diagrams: [],
      active_company_id: '1',
      active_workspace_id: 'ws-1'
    };

    vi.mocked(dashboardService.dashboardService.getInitialDashboardData).mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useNavigationStore());
    
    await act(async () => {
      result.current.fetchInitialUser();
    });

    await vi.waitFor(() => {
      expect(result.current.dataLoading).toBe(false);
      expect(result.current.activeCompany).toEqual(mockDashboardData.companies[0]);
      expect(result.current.environments).toEqual(mockDashboardData.environments);
    });
  });

  it('handles environment change', async () => {
    const { result } = renderHook(() => useNavigationStore());
    
    // Set initial state
    act(() => {
      useNavigationStore.setState({
        activeCompany: { _id: '1', name: 'Test Company' },
        environments: [
          { id: 'env-1', name: 'Production' },
          { id: 'env-2', name: 'Development' }
        ]
      });
    });

    await act(async () => {
      await result.current.handleEnvironmentChange('env-2');
    });

    expect(result.current.selectedEnvironment).toBe('env-2');
  });
});
