import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { dashboardService } from '@/app/services/dashboardService';

const server = setupServer(
  rest.get('/api/v1/dashboard/initial-load', (req, res, ctx) => {
    return res(
      ctx.json({
        companies: [{ _id: 'test-1', name: 'Test Company' }],
        workspaces: [{ id: 'ws-1', name: 'Main Workspace' }],
        environments: [{ id: 'env-1', name: 'Production' }],
        recent_diagrams: [
          { id: 'diag-1', name: 'API Architecture', nodes: [], edges: [] }
        ],
        active_company_id: 'test-1',
        active_workspace_id: 'ws-1'
      })
    );
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('Dashboard API Integration', () => {
  it('fetches initial dashboard data with caching', async () => {
    // First call - should hit the API
    const data1 = await dashboardService.getInitialDashboardData();
    expect(data1.companies).toHaveLength(1);
    expect(data1.companies[0].name).toBe('Test Company');
    
    // Second call - should use cache
    const data2 = await dashboardService.getInitialDashboardData();
    expect(data2).toEqual(data1);
    
    // Force refresh - should hit API again
    const data3 = await dashboardService.getInitialDashboardData(true);
    expect(data3).toEqual(data1);
  });

  it('handles API errors gracefully', async () => {
    server.use(
      rest.get('/api/v1/dashboard/initial-load', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }));
      })
    );

    await expect(dashboardService.getInitialDashboardData(true)).rejects.toThrow();
  });
});
