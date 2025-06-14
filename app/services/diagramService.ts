// Servicio para la gestión de diagramas

import { API_BASE_URL } from '../config';
import { isAuthenticated, getAuthTokenAsync } from './authService';
import { cacheService, CACHE_KEYS, CACHE_TTL } from './cacheService';

export interface Node {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, unknown>;
  width?: number;
  height?: number;
  selected?: boolean;
  positionAbsolute?: {
    x: number;
    y: number;
  };
  dragging?: boolean;
  parentNode?: string;
  style?: Record<string, unknown>;
  // Nuevos campos para el manejo mejorado de grupos
  originalPosition?: {
    x: number;
    y: number;
  };
  relativeDimensions?: {
    width: number;
    height: number;
  };
  resizable?: boolean;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  label?: string;
  data?: Record<string, unknown>;
  style?: Record<string, unknown>;
  selected?: boolean;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Diagram {
  id: string;
  name: string;
  description?: string;
  path?: string; // Directory/path organization support (e.g., "devops/hub-and-spoke", "devops/pubsub")
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
  created_at: string;
  updated_at: string;
  isFolder?: boolean; // Añadido para distinguir diagramas de directorios
  // Nuevos campos para manejar relaciones y metadatos
  nodeGroups?: Record<string, {
    nodeIds: string[];
    dimensions?: { width: number; height: number };
    provider?: string;
    label?: string;
    isMinimized?: boolean;
    isCollapsed?: boolean;
    style?: Record<string, unknown>;
  }>;
  nodePositions?: Record<string, Record<string, { 
    relativePosition: { x: number, y: number },
    dimensions?: { width: number, height: number } 
  }>>;
}

export interface Environment {
  id: string;
  name: string;
  description?: string;
  path?: string; // Añadido para la ruta del directorio
  is_active: boolean;
  diagrams: string[];
  created_at: string;
  updated_at: string;
}

// Funciones relacionadas con ambientes
export const getEnvironments = async (workspaceId: string, forceRefresh: boolean = false): Promise<Environment[]> => {
  if (!isAuthenticated()) throw new Error('Usuario no autenticado');
  if (!workspaceId) {
    console.error('[getEnvironments] workspaceId es inválido');
    return [];
  }

  const cacheKey = CACHE_KEYS.ENVIRONMENTS(workspaceId);
  if (!forceRefresh) {
    const cachedData = cacheService.get<Environment[]>(cacheKey);
    if (cachedData) {
      console.log(`[getEnvironments] 📦 Usando cache para workspace ${workspaceId}`);
      return cachedData;
    }
  }

  const token = await getAuthTokenAsync();
  const url = `${API_BASE_URL}/v1/workspaces/${workspaceId}/environments`;
  console.log(`[getEnvironments] 🚚 Fetching desde ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getEnvironments] Error ${response.status}: ${errorText}`);
      throw new Error(`Error obteniendo ambientes: ${response.statusText}`);
    }

    const environments = await response.json();
    console.log(`[getEnvironments] ✅ Recibidos ${environments.length} ambientes`);
    cacheService.set(cacheKey, environments, CACHE_TTL.ENVIRONMENTS);
    return environments;
  } catch (error) {
    console.error('[getEnvironments] Excepción:', error);
    throw error;
  }
};

export const createEnvironment = async (workspaceId: string, environmentData: { name: string; description?: string; path?: string }): Promise<Environment> => {
  if (!isAuthenticated()) throw new Error('Usuario no autenticado');
  if (!workspaceId) throw new Error('Workspace ID es requerido para crear un ambiente');

  const token = await getAuthTokenAsync();
  const url = `${API_BASE_URL}/v1/workspaces/${workspaceId}/environments`;
  console.log(`[createEnvironment] 🚚 POST hacia ${url}`, environmentData);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        ...environmentData,
        workspace_id: workspaceId,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al crear ambiente' }));
      console.error('[createEnvironment] Error en respuesta:', errorData);
      throw new Error(errorData.detail || 'No se pudo crear el ambiente');
    }

    const newEnvironment = await response.json();
    console.log('[createEnvironment] ✅ Ambiente creado:', newEnvironment);

    // Invalidar cache para que la próxima llamada a getEnvironments traiga la lista actualizada
    const cacheKey = CACHE_KEYS.ENVIRONMENTS(workspaceId);
    cacheService.clear(cacheKey);
    console.log(`[createEnvironment] 🧹 Cache invalidado para ${cacheKey}`);

    return newEnvironment;
  } catch (error) {
    console.error('[createEnvironment] Excepción:', error);
    throw error;
  }
};

export const updateEnvironment = async (workspaceId: string, environmentId: string, environmentData: Partial<Environment>): Promise<Environment> => {
  if (!isAuthenticated()) throw new Error('Usuario no autenticado');
  if (!workspaceId || !environmentId) throw new Error('Workspace ID y Environment ID son requeridos');

  const token = await getAuthTokenAsync();
  const url = `${API_BASE_URL}/v1/workspaces/${workspaceId}/environments/${environmentId}`;
  console.log(`[updateEnvironment] 🚚 PUT hacia ${url}`, environmentData);

  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(environmentData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al actualizar' }));
    console.error('[updateEnvironment] Error en respuesta:', errorData);
    throw new Error(errorData.detail || 'Error actualizando ambiente');
  }

  const updatedEnvironment = await response.json();
  console.log('[updateEnvironment] ✅ Ambiente actualizado:', updatedEnvironment);

  // Invalidar cache
  cacheService.clear(CACHE_KEYS.ENVIRONMENTS(workspaceId));
  
  return updatedEnvironment;
};

export const deleteEnvironment = async (workspaceId: string, environmentId: string): Promise<void> => {
  if (!isAuthenticated()) throw new Error('Usuario no autenticado');
  if (!workspaceId || !environmentId) throw new Error('Workspace ID y Environment ID son requeridos');

  const token = await getAuthTokenAsync();
  const url = `${API_BASE_URL}/v1/workspaces/${workspaceId}/environments/${environmentId}`;
  console.log(`[deleteEnvironment] 🚚 DELETE hacia ${url}`);

  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Error desconocido al eliminar' }));
    console.error('[deleteEnvironment] Error en respuesta:', errorData);
    throw new Error(errorData.detail || 'Error eliminando ambiente');
  }

  console.log('[deleteEnvironment] ✅ Ambiente eliminado');
  // Invalidar cache
  cacheService.clear(CACHE_KEYS.ENVIRONMENTS(workspaceId));
};

// Funciones relacionadas con diagramas asociados a ambientes
export const getDiagramsByEnvironment = async (companyId: string, environmentId: string, forceRefresh: boolean = false): Promise<Diagram[]> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = await getAuthTokenAsync();
  try {
    // Get current workspace from the navigation store
    const navStore = (await import('../stores/useNavigationStore')).useNavigationStore.getState();
    const currentWorkspaceId = navStore.activeWorkspace?.id;
    
    if (!currentWorkspaceId) {
      console.error('No workspace selected in store');
      throw new Error('Por favor selecciona un workspace antes de acceder a los diagramas.');
    }

    // Check cache first unless force refresh
    const cacheKey = CACHE_KEYS.DIAGRAMS(companyId, environmentId);
    if (!forceRefresh) {
      const cachedData = cacheService.get<Diagram[]>(cacheKey);
      if (cachedData) {
        console.log('📦 Diagrams loaded from cache');
        return cachedData;
      }
    }

    console.log(`Obteniendo diagramas para workspace: ${currentWorkspaceId}, ambiente: ${environmentId}`);
    
    // Use the new workspace-based route with environment filter
    // Note: diagrams router is mounted at /api, not /api/v1
    const response = await fetch(`${API_BASE_URL}/workspaces/${currentWorkspaceId}/diagrams?environment_id=${environmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true';
        throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
      }
      if (response.status === 403) {
        throw new Error('No tienes permiso para ver diagramas en este workspace.');
      }
      if (response.status === 404) {
        console.log('No se encontraron diagramas en el servidor.');
        return []; 
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error obteniendo diagramas');
    }

    const backendDiagrams = await response.json();
    console.log(`Recibidos ${backendDiagrams.length} diagramas del backend`);
    
    // Cache the data
    cacheService.set(cacheKey, backendDiagrams, CACHE_TTL.DIAGRAMS);
    
    return backendDiagrams;
  } catch (error) {
    console.error('Error en getDiagramsByEnvironment:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('No se pudieron obtener los diagramas. Por favor, inténtelo de nuevo.');
  }
};

export const getDiagram = async (companyId: string, environmentId: string, diagramId: string, forceRefresh: boolean = false): Promise<Diagram> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  if (!companyId || !environmentId || !diagramId) {
    throw new Error('Parámetros inválidos: Se requieren companyId, environmentId y diagramId');
  }

  const token = await getAuthTokenAsync();
  
  try {
    // Get current workspace from the navigation store
    const navStore = (await import('../stores/useNavigationStore')).useNavigationStore.getState();
    const currentWorkspaceId = navStore.activeWorkspace?.id;
    
    if (!currentWorkspaceId) {
      console.error('No workspace selected in store');
      throw new Error('Por favor selecciona un workspace antes de acceder a los diagramas.');
    }

    // Check cache first unless force refresh
    const cacheKey = CACHE_KEYS.DIAGRAM(companyId, environmentId, diagramId);
    if (!forceRefresh) {
      const cachedData = cacheService.get<Diagram>(cacheKey);
      if (cachedData) {
        console.log('📦 Diagram loaded from cache');
        return cachedData;
      }
    }

    console.log(`Obteniendo diagrama: workspace ${currentWorkspaceId}, diagrama ${diagramId}`);
    
    // Use the new workspace-based route
    // Note: diagrams router is mounted at /api, not /api/v1
    const response = await fetch(`${API_BASE_URL}/workspaces/${currentWorkspaceId}/diagrams/${diagramId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true';
        throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
      }
      if (response.status === 403) {
        throw new Error('No tienes permiso para ver este diagrama. Verifica que el workspace correcto esté seleccionado.');
      }
      if (response.status === 404) {
        throw new Error('El diagrama solicitado no se encuentra en la base de datos.');
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error obteniendo diagrama');
    }

    return await response.json() as Diagram;
  } catch (error: unknown) {
    console.error('Error en getDiagram:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('No se pudo obtener el diagrama. Por favor, vuelve a intentarlo.');
  }
};

export const createDiagram = async (companyId: string, environmentId: string, diagramData: { name: string; description?: string; path?: string; nodes: Node[]; edges: Edge[]; viewport?: Viewport }): Promise<Diagram> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = await getAuthTokenAsync();
  
  try {
    // Get current workspace from the navigation store
    const navStore = (await import('../stores/useNavigationStore')).useNavigationStore.getState();
    const currentWorkspaceId = navStore.activeWorkspace?.id;
    
    if (!currentWorkspaceId) {
      console.error('No workspace selected in store');
      throw new Error('Por favor selecciona un workspace antes de crear diagramas.');
    }

    console.log(`Intentando crear diagrama para workspace ${currentWorkspaceId}, ambiente ${environmentId}`);
    
    const diagramPayload = {
      ...diagramData,
      workspace_id: currentWorkspaceId,
      environment_id: environmentId
    };
    
    // Use the new workspace-based route
    // Note: diagrams router is mounted at /api, not /api/v1
    const response = await fetch(`${API_BASE_URL}/workspaces/${currentWorkspaceId}/diagrams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(diagramPayload)
    });

    if (response.status === 404) {
      console.error('El endpoint para crear diagramas no está disponible en el backend');
      throw new Error('El servicio para crear diagramas no está disponible en el backend. Contacta al administrador del sistema.');
    }

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true';
        throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
      }
      if (response.status === 403) {
        throw new Error('No tienes permiso para crear diagramas en este workspace.');
      }
      let errorMessage = 'Error creando diagrama';
      try {
        const errorData = await response.json();
        console.error('Error al crear diagrama:', errorData);
        if (typeof errorData === 'object' && errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((err: Record<string, any>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              if (typeof err === 'object' && err.msg) {
                return `${err.loc ? (err.loc as string[]).join('.') + ': ' : ''}${err.msg}`;
              }
              return String(err);
            }).join(', ');
            errorMessage = errorMessages;
          } else {
            errorMessage = errorData.detail;
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
      } catch (parseError) {
        console.error('Error al parsear respuesta de error:', parseError);
        errorMessage = `Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Diagrama creado exitosamente:', data);
    return data as Diagram;
  } catch (error: unknown) {
    console.error('Error en createDiagram:', error);
    if (error instanceof Error) {
      throw error;
    }
    const unknownError = error as { message?: string; detail?: string | Array<Record<string, unknown>> };
    let errorMessage = 'Error desconocido al crear el diagrama';
    if (typeof unknownError?.detail === 'string') {
      errorMessage = unknownError.detail;
    } else if (Array.isArray(unknownError?.detail) && unknownError.detail.length > 0) {
      const firstError = unknownError.detail[0] as { msg?: string };
      errorMessage = firstError?.msg || errorMessage;
    } else if (unknownError?.message) {
      errorMessage = unknownError.message;
    }
    throw new Error(errorMessage);
  }
};

export const updateDiagram = async (
  companyId: string,
  environmentId: string,
  diagramId: string,
  diagramData: Partial<Diagram>
): Promise<Diagram> => {
  const token = await getAuthTokenAsync();
  if (!token) {
    throw new Error('No estás autenticado');
  }

  // Get current workspace from the navigation store
  const navStore = (await import('../stores/useNavigationStore')).useNavigationStore.getState();
  const currentWorkspaceId = navStore.activeWorkspace?.id;
  
  if (!currentWorkspaceId) {
    console.error('No workspace selected in store');
    throw new Error('Por favor selecciona un workspace antes de actualizar diagramas.');
  }

  console.log('🔍 [DIAGRAM SERVICE] Sending diagram update request:', {
    workspaceId: currentWorkspaceId,
    diagramId,
    nodesCount: diagramData.nodes?.length || 0,
    edgesCount: diagramData.edges?.length || 0,
    hasNodeGroups: !!diagramData.nodeGroups,
    nodeGroupsKeys: diagramData.nodeGroups ? Object.keys(diagramData.nodeGroups) : [],
    requestData: diagramData
  });

  try {
    // Use the new workspace-based route
    // Note: diagrams router is mounted at /api, not /api/v1
    const response = await fetch(
      `${API_BASE_URL}/workspaces/${currentWorkspaceId}/diagrams/${diagramId}`, 
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(diagramData)
      }
    );

    console.log('🔍 [DIAGRAM SERVICE] Response status:', response.status);

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true';
        throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
      }
      if (response.status === 403) {
        throw new Error('No tienes permiso para actualizar este diagrama.');
      }
      let errorMessage = 'Error actualizando diagrama';
      try {
        const errorData = await response.json();
        console.log('🔍 [DIAGRAM SERVICE] Error response data:', errorData);
        errorMessage = errorData.detail || errorData.message || (errorData as Record<string, string>).error || errorMessage;
      } catch (parseErr) {
        console.error('Error parsing error response:', parseErr);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('🔍 [DIAGRAM SERVICE] Success response data:', data);
    return data as Diagram;
  } catch (error) {
    console.error('🔍 [DIAGRAM SERVICE] Error en updateDiagram:', error);
    if (error instanceof Error) {
      throw error;
    }
    const unknownError = error as { message?: string; detail?: string | Record<string, unknown> | Array<Record<string, unknown>> };
    let errorMessage = 'Error desconocido al actualizar el diagrama';
    if (typeof unknownError?.detail === 'string') {
      errorMessage = unknownError.detail;
    } else if (unknownError?.message) {
      errorMessage = unknownError.message;
    }
    throw new Error(errorMessage);
  }
};

export const deleteDiagram = async (companyId: string, environmentId: string, diagramId: string): Promise<void> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = await getAuthTokenAsync();
  
  // Get current workspace from the navigation store
  const navStore = (await import('../stores/useNavigationStore')).useNavigationStore.getState();
  const currentWorkspaceId = navStore.activeWorkspace?.id;
  
  if (!currentWorkspaceId) {
    console.error('No workspace selected in store');
    throw new Error('Por favor selecciona un workspace antes de eliminar diagramas.');
  }

  try {
    console.log(`Intentando eliminar diagrama: workspace ${currentWorkspaceId}, diagrama ${diagramId}`);
    
    // Use the new workspace-based route
    // Note: diagrams router is mounted at /api, not /api/v1
    const response = await fetch(`${API_BASE_URL}/workspaces/${currentWorkspaceId}/diagrams/${diagramId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true';
        throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
      }
      if (response.status === 403) {
        throw new Error('No tienes permiso para eliminar este diagrama.');
      }
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      console.error('Error eliminando diagrama:', errorData);
      throw new Error(errorData.detail || 'Error eliminando diagrama');
    }
    
    console.log('Diagrama eliminado exitosamente del backend');
  } catch (error: unknown) {
    console.error('Error en deleteDiagram:', error);
    throw error;
  }
};

export async function updateDiagramPaths(companyId: string, environmentId: string): Promise<Diagram[]> {
  try {
    const token = await getAuthTokenAsync();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(
      `${API_BASE_URL}/diagrams/${companyId}/environments/${environmentId}/diagrams/update-paths`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?session_expired=true';
        throw new Error('Sesión expirada o inválida. Por favor, inicie sesión nuevamente.');
      }
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update diagram paths');
    }

    return await response.json();
  } catch (error: unknown) {
    console.error('Error updating diagram paths:', error);
    if (error instanceof Error) {
      throw error;
    }
    const unknownError = error as { message?: string; detail?: string | Array<Record<string, unknown>> };
    let errorMessage = 'Error desconocido al actualizar las rutas del diagrama';
     if (typeof unknownError?.detail === 'string') {
      errorMessage = unknownError.detail;
    } else if (Array.isArray(unknownError?.detail) && unknownError.detail.length > 0) {
        const firstError = unknownError.detail[0] as { msg?: string };
        errorMessage = firstError?.msg || errorMessage;
    } else if (unknownError?.message) {
      errorMessage = unknownError.message;
    }
    throw new Error(errorMessage);
  }
}
