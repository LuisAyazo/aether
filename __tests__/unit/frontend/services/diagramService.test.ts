import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock navigation store first
const mockNavigationStore = {
  getState: vi.fn(() => ({
    activeWorkspace: { id: 'workspace-123' },
    activeCompany: { id: 'company-123' }
  }))
};

vi.mock('@/hooks/useNavigationStore', () => ({
  useNavigationStore: mockNavigationStore
}));

// Mock auth functions before any imports
vi.mock('@/services/authService', () => ({
  isAuthenticated: vi.fn(() => true),
  getAuthTokenAsync: vi.fn(() => Promise.resolve('test-token')),
  getAuthToken: vi.fn(() => 'test-token'),
  logoutUser: vi.fn(),
  getCurrentUser: vi.fn(() => ({ id: 'user-123', email: 'test@example.com' }))
}));

// Mock cache service
vi.mock('@/services/cacheService', () => ({
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
    clearAll: vi.fn()
  },
  CACHE_KEYS: {
    ENVIRONMENTS: (companyId: string) => `environments_${companyId}`,
    DIAGRAMS: (companyId: string, envId: string) => `diagrams_${companyId}_${envId}`,
    DIAGRAM: (companyId: string, envId: string, diagramId: string) => `diagram_${companyId}_${envId}_${diagramId}`
  },
  CACHE_TTL: {
    ENVIRONMENTS: 300000,
    DIAGRAMS: 300000,
    DIAGRAM: 300000
  }
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Now import the service after all mocks are set up
import * as diagramService from "../../../../app/services/diagramService";
import { cacheService } from "../../../../app/services/cacheService";

const mockCacheService = cacheService;

describe('diagramService', () => {
  const mockEnvironment: diagramService.Environment = {
    id: 'env-123',
    name: 'Production',
    description: 'Production environment',
    path: '/prod',
    is_active: true,
    diagrams: ['diagram-1', 'diagram-2'],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  const mockDiagram: diagramService.Diagram = {
    id: 'diagram-123',
    name: 'AWS Infrastructure',
    description: 'Main infrastructure diagram',
    path: '/infrastructure/aws',
    nodes: [
      {
        id: 'node-1',
        type: 'default',
        position: { x: 100, y: 100 },
        data: { label: 'EC2 Instance' }
      }
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'default'
      }
    ],
    viewport: { x: 0, y: 0, zoom: 1 },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    nodeGroups: {
      'group-1': {
        nodeIds: ['node-1', 'node-2'],
        dimensions: { width: 400, height: 300 },
        provider: 'aws',
        label: 'VPC'
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockEnvironment
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Environment operations', () => {
    describe('getEnvironments', () => {
      it('should fetch environments successfully', async () => {
        const mockEnvironments = [mockEnvironment];
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockEnvironments
        });

        const result = await diagramService.getEnvironments('company-123');

        expect(result).toEqual(mockEnvironments);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/companies/company-123/environments'),
          expect.objectContaining({
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            }
          })
        );
      });

      it('should return cached environments when available', async () => {
        const cachedEnvironments = [mockEnvironment];
        mockCacheService.get.mockReturnValue(cachedEnvironments);

        const result = await diagramService.getEnvironments('company-123');

        expect(result).toEqual(cachedEnvironments);
        expect(mockFetch).not.toHaveBeenCalled();
        expect(mockCacheService.get).toHaveBeenCalledWith(
          expect.stringContaining('company-123')
        );
      });

      it('should force refresh when requested', async () => {
        const cachedEnvironments = [mockEnvironment];
        mockCacheService.get.mockReturnValue(cachedEnvironments);

        const freshEnvironments = [{ ...mockEnvironment, name: 'Staging' }];
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => freshEnvironments
        });

        const result = await diagramService.getEnvironments('company-123', true);

        expect(result).toEqual(freshEnvironments);
        expect(mockFetch).toHaveBeenCalled();
      });

      it('should handle 401 unauthorized', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 401
        });

        const originalLocation = window.location.href;
        
        await expect(
          diagramService.getEnvironments('company-123')
        ).rejects.toThrow('Sesión expirada');

        expect(localStorage.removeItem).toHaveBeenCalledWith('token');
        // Restore location
        window.location.href = originalLocation;
      });

      it('should handle 404 not found', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404
        });

        await expect(
          diagramService.getEnvironments('company-123')
        ).rejects.toThrow('servicio para obtener ambientes no está disponible');
      });

      it('should throw error when companyId is invalid', async () => {
        await expect(
          diagramService.getEnvironments('')
        ).rejects.toThrow('ID de compañía no válido');
      });
    });

    describe('createEnvironment', () => {
      it('should create environment successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 201,
          json: async () => mockEnvironment
        });

        const newEnvironment = {
          name: 'Production',
          description: 'Production environment',
          path: '/prod'
        };

        const result = await diagramService.createEnvironment('company-123', newEnvironment);

        expect(result).toEqual(mockEnvironment);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/companies/company-123/environments'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify({
              ...newEnvironment,
              company_id: 'company-123'
            })
          })
        );
      });

      it('should handle creation errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 400,
          json: async () => ({ detail: 'Environment name already exists' })
        });

        await expect(
          diagramService.createEnvironment('company-123', { name: 'Prod' })
        ).rejects.toThrow('Environment name already exists');
      });
    });

    describe('updateEnvironment', () => {
      it('should update environment successfully', async () => {
        const updatedEnvironment = { ...mockEnvironment, name: 'Staging' };
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => updatedEnvironment
        });

        const updateData = {
          name: 'Staging',
          description: 'Staging environment',
          is_active: true
        };

        const result = await diagramService.updateEnvironment(
          'company-123',
          'env-123',
          updateData
        );

        expect(result).toEqual(updatedEnvironment);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/companies/company-123/environments/env-123'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData)
          })
        );
      });
    });

    describe('deleteEnvironment', () => {
      it('should delete environment successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 204
        });

        await diagramService.deleteEnvironment('company-123', 'env-123');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/companies/company-123/environments/env-123'),
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });
    });
  });

  describe('Diagram operations', () => {
    describe('getDiagramsByEnvironment', () => {
      it('should fetch diagrams successfully', async () => {
        const mockDiagrams = [mockDiagram];
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockDiagrams
        });

        const result = await diagramService.getDiagramsByEnvironment(
          'company-123',
          'env-123'
        );

        expect(result).toEqual(mockDiagrams);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/workspaces/workspace-123/diagrams?environment_id=env-123'),
          expect.objectContaining({
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer test-token'
            }
          })
        );
      });

      it('should return cached diagrams when available', async () => {
        const cachedDiagrams = [mockDiagram];
        mockCacheService.get.mockReturnValue(cachedDiagrams);

        const result = await diagramService.getDiagramsByEnvironment(
          'company-123',
          'env-123'
        );

        expect(result).toEqual(cachedDiagrams);
        expect(mockFetch).not.toHaveBeenCalled();
      });

      it('should handle no workspace selected', async () => {
        mockNavigationStore.getState.mockReturnValue({
          activeWorkspace: null as any,
          activeCompany: { id: 'company-123' }
        });

        await expect(
          diagramService.getDiagramsByEnvironment('company-123', 'env-123')
        ).rejects.toThrow('selecciona un workspace');
      });

      it('should handle 403 forbidden', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 403
        });

        await expect(
          diagramService.getDiagramsByEnvironment('company-123', 'env-123')
        ).rejects.toThrow('No tienes permiso para ver diagramas');
      });

      it('should return empty array for 404', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404
        });

        const result = await diagramService.getDiagramsByEnvironment(
          'company-123',
          'env-123'
        );

        expect(result).toEqual([]);
      });
    });

    describe('getDiagram', () => {
      it('should fetch single diagram successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockDiagram
        });

        const result = await diagramService.getDiagram(
          'company-123',
          'env-123',
          'diagram-123'
        );

        expect(result).toEqual(mockDiagram);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/workspaces/workspace-123/diagrams/diagram-123'),
          expect.any(Object)
        );
      });

      it('should validate parameters', async () => {
        await expect(
          diagramService.getDiagram('', 'env-123', 'diagram-123')
        ).rejects.toThrow('Parámetros inválidos');
      });

      it('should handle 404 not found', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 404
        });

        await expect(
          diagramService.getDiagram('company-123', 'env-123', 'diagram-123')
        ).rejects.toThrow('diagrama solicitado no se encuentra');
      });
    });

    describe('createDiagram', () => {
      it('should create diagram successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 201,
          json: async () => mockDiagram
        });

        const newDiagram = {
          name: 'AWS Infrastructure',
          description: 'Main infrastructure',
          nodes: mockDiagram.nodes,
          edges: mockDiagram.edges,
          viewport: mockDiagram.viewport
        };

        const result = await diagramService.createDiagram(
          'company-123',
          'env-123',
          newDiagram
        );

        expect(result).toEqual(mockDiagram);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/workspaces/workspace-123/diagrams'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              ...newDiagram,
              workspace_id: 'workspace-123',
              environment_id: 'env-123'
            })
          })
        );
      });

      it('should handle validation errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 422,
          json: async () => ({
            detail: [
              { loc: ['body', 'name'], msg: 'field required' }
            ]
          })
        });

        await expect(
          diagramService.createDiagram('company-123', 'env-123', {
            name: '',
            nodes: [],
            edges: []
          })
        ).rejects.toThrow('body.name: field required');
      });
    });

    describe('updateDiagram', () => {
      it('should update diagram successfully with node groups', async () => {
        const updatedDiagram = { 
          ...mockDiagram, 
          name: 'Updated Infrastructure' 
        };
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => updatedDiagram
        });

        const updateData = {
          name: 'Updated Infrastructure',
          nodes: mockDiagram.nodes,
          edges: mockDiagram.edges,
          nodeGroups: mockDiagram.nodeGroups
        };

        const result = await diagramService.updateDiagram(
          'company-123',
          'env-123',
          'diagram-123',
          updateData
        );

        expect(result).toEqual(updatedDiagram);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/workspaces/workspace-123/diagrams/diagram-123'),
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify(updateData)
          })
        );
      });

      it('should handle 403 forbidden', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 403
        });

        await expect(
          diagramService.updateDiagram(
            'company-123',
            'env-123',
            'diagram-123',
            { name: 'New Name' }
          )
        ).rejects.toThrow('No tienes permiso para actualizar');
      });
    });

    describe('deleteDiagram', () => {
      it('should delete diagram successfully', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          status: 204
        });

        await diagramService.deleteDiagram('company-123', 'env-123', 'diagram-123');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/workspaces/workspace-123/diagrams/diagram-123'),
          expect.objectContaining({
            method: 'DELETE'
          })
        );
      });

      it('should handle delete errors', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 403,
          json: async () => ({ detail: 'Permission denied' })
        });

        await expect(
          diagramService.deleteDiagram('company-123', 'env-123', 'diagram-123')
        ).rejects.toThrow('No tienes permiso para eliminar este diagrama.');
      });
    });

    describe('updateDiagramPaths', () => {
      it('should update diagram paths successfully', async () => {
        const updatedDiagrams = [mockDiagram];
        mockFetch.mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => updatedDiagrams
        });

        const result = await diagramService.updateDiagramPaths(
          'company-123',
          'env-123'
        );

        expect(result).toEqual(updatedDiagrams);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/diagrams/company-123/environments/env-123/diagrams/update-paths'),
          expect.objectContaining({
            method: 'POST'
          })
        );
      });

      it('should handle errors properly', async () => {
        mockFetch.mockResolvedValue({
          ok: false,
          status: 500,
          json: async () => ({ detail: 'Failed to update paths' })
        });

        await expect(
          diagramService.updateDiagramPaths('company-123', 'env-123')
        ).rejects.toThrow('Failed to update paths');
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        diagramService.getEnvironments('company-123')
      ).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(
        diagramService.getEnvironments('company-123')
      ).rejects.toThrow();
    });

    it('should cache data with correct TTL', async () => {
      const mockEnvironments = [mockEnvironment];
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockEnvironments
      });

      await diagramService.getEnvironments('company-123');

      expect(mockCacheService.set).toHaveBeenCalledWith(
        expect.any(String),
        mockEnvironments,
        expect.any(Number) // CACHE_TTL.ENVIRONMENTS
      );
    });
  });
});
