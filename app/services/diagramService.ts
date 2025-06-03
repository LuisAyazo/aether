// Servicio para la gestión de diagramas

import { API_BASE_URL } from '../config';
import { isAuthenticated } from './authService';

export interface Node {
  id: string;
  type: string;
  position: {
    x: number;
    y: number;
  };
  data: any;
  width?: number;
  height?: number;
  selected?: boolean;
  positionAbsolute?: {
    x: number;
    y: number;
  };
  dragging?: boolean;
  parentNode?: string;
  style?: any;
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
  data?: any;
  style?: any;
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
  // Nuevos campos para manejar relaciones y metadatos
  nodeGroups?: Record<string, {
    nodeIds: string[];
    dimensions?: { width: number; height: number };
    provider?: string;
    label?: string;
    isMinimized?: boolean;
    isCollapsed?: boolean;
    style?: Record<string, any>;
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
  is_active: boolean;
  diagrams: string[];
  created_at: string;
  updated_at: string;
}

// Funciones relacionadas con ambientes
export const getEnvironments = async (companyId: string): Promise<Environment[]> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar que companyId no sea undefined o null
  if (!companyId) {
    console.error('Error: companyId es undefined o null en getEnvironments');
    throw new Error('ID de compañía no válido en getEnvironments');
  }

  const token = localStorage.getItem('token');
  // API_BASE_URL es http://localhost:8000/api
  // El backend espera /api/v1/companies/...
  const correctApiUrl = `${API_BASE_URL}/v1/companies/${companyId}/environments`;
  
  try {
    const response = await fetch(correctApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Si el error es 404, el endpoint no existe en el backend
    if (response.status === 404) {
      console.error('El endpoint para obtener ambientes no está disponible en el backend');
      throw new Error('El servicio para obtener ambientes no está disponible. Contacta al administrador del sistema.');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error obteniendo ambientes');
    }

    // Devolver los ambientes del backend
    const backendEnvironments = await response.json();
    console.log(`Recibidos ${backendEnvironments.length} ambientes del backend`);
    return backendEnvironments;
  } catch (error) {
    console.error('Error en getEnvironments:', error);
    throw error;
  }
};

export const createEnvironment = async (companyId: string, environmentData: { name: string; description?: string; category?: string }): Promise<Environment> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = localStorage.getItem('token');
  
  try {
    console.log(`Intentando crear ambiente para compañía ${companyId}:`, environmentData);
    
    // Crear el ambiente usando el endpoint del backend
    // API_BASE_URL es http://localhost:8000/api
    // El backend espera /api/v1/companies/...
    const correctApiUrl = `${API_BASE_URL}/v1/companies/${companyId}/environments`;
    console.log('URL para crear ambiente:', correctApiUrl); // Log para depurar URL
    const response = await fetch(correctApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...environmentData,
        is_active: true,
        diagrams: []
      })
    });

    if (response.status === 404) {
      console.error('El endpoint para crear ambientes no está disponible en el backend');
      throw new Error('El servicio para crear ambientes no está disponible en el backend. Contacta al administrador del sistema.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      console.error('Error al crear ambiente:', errorData);
      throw new Error(errorData.detail || 'Error creando ambiente');
    }

    const data = await response.json();
    console.log('Ambiente creado exitosamente:', data);
    return data;
  } catch (error: any) {
    console.error('Error en createEnvironment:', error);
    throw error;
  }
};

export const updateEnvironment = async (companyId: string, environmentId: string, environmentData: { name: string; description?: string; is_active: boolean }): Promise<Environment> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = localStorage.getItem('token');
  // API_BASE_URL es http://localhost:8000/api
  // El backend espera /api/v1/companies/...
  const correctApiUrl = `${API_BASE_URL}/v1/companies/${companyId}/environments/${environmentId}`;
  const response = await fetch(correctApiUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(environmentData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error actualizando ambiente');
  }

  return await response.json();
};

export const deleteEnvironment = async (companyId: string, environmentId: string): Promise<void> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = localStorage.getItem('token');
  // API_BASE_URL es http://localhost:8000/api
  // El backend espera /api/v1/companies/...
  const correctApiUrl = `${API_BASE_URL}/v1/companies/${companyId}/environments/${environmentId}`;
  const response = await fetch(correctApiUrl, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Error eliminando ambiente');
  }
};

// Funciones relacionadas con diagramas asociados a ambientes
export const getDiagramsByEnvironment = async (companyId: string, environmentId: string): Promise<Diagram[]> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar companyId es válido
  if (!companyId || companyId === 'undefined') {
    console.error('Error: companyId es undefined o inválido en getDiagramsByEnvironment');
    throw new Error('ID de compañía no válido. Por favor, vuelve a la página principal y selecciona una compañía.');
  }

  const token = localStorage.getItem('token');
  try {
    console.log(`Obteniendo diagramas para compañía: ${companyId}, ambiente: ${environmentId}`);
    const response = await fetch(`${API_BASE_URL}/diagrams/${companyId}/environments/${environmentId}/diagrams`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('No se encontraron diagramas en el servidor.');
        throw new Error('El endpoint para obtener diagramas no está disponible en el backend. Contacta al administrador.');
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error obteniendo diagramas');
    }

    const backendDiagrams = await response.json();
    console.log(`Recibidos ${backendDiagrams.length} diagramas del backend`);
    return backendDiagrams;
  } catch (error) {
    console.error('Error en getDiagramsByEnvironment:', error);
    throw new Error('No se pudieron obtener los diagramas. Por favor, inténtelo de nuevo.');
  }
};

export const getDiagram = async (companyId: string, environmentId: string, diagramId: string): Promise<Diagram> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar IDs
  if (!companyId || !environmentId || !diagramId) {
    throw new Error('Parámetros inválidos: Se requieren companyId, environmentId y diagramId');
  }

  const token = localStorage.getItem('token');
  
  try {
    console.log(`Obteniendo diagrama: compañía ${companyId}, ambiente ${environmentId}, diagrama ${diagramId}`);
    const response = await fetch(`${API_BASE_URL}/diagrams/${companyId}/environments/${environmentId}/diagrams/${diagramId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('El diagrama solicitado no se encuentra en la base de datos.');
      }
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error obteniendo diagrama');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error en getDiagram:', error);
    throw new Error('No se pudo obtener el diagrama. Por favor, vuelve a intentarlo.');
  }
};

export const createDiagram = async (companyId: string, environmentId: string, diagramData: { name: string; description?: string; path?: string; nodes: Node[]; edges: Edge[]; viewport?: Viewport }): Promise<Diagram> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = localStorage.getItem('token');
  
  try {
    console.log(`Intentando crear diagrama para compañía ${companyId}, ambiente ${environmentId}`);
    
    // Incluir company_id y environment_id en el payload según el esquema DiagramCreate del backend
    const diagramPayload = {
      ...diagramData,
      company_id: companyId,
      environment_id: environmentId
    };
    
    // Crear el diagrama usando el endpoint del backend
    const response = await fetch(`${API_BASE_URL}/diagrams/${companyId}/environments/${environmentId}/diagrams`, {
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
      let errorMessage = 'Error creando diagrama';
      try {
        const errorData = await response.json();
        console.error('Error al crear diagrama:', errorData);
        if (typeof errorData === 'object' && errorData.detail) {
          // Si detail es un array de objetos de error (como en validaciones de Pydantic)
          if (Array.isArray(errorData.detail)) {
            const errorMessages = errorData.detail.map((err: any) => {
              if (typeof err === 'object' && err.msg) {
                return `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`;
              }
              return err.toString();
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
    return data;
  } catch (error: any) {
    console.error('Error en createDiagram:', error);
    // Si el error ya es una instancia de Error con un mensaje personalizado, lo relanzamos
    if (error instanceof Error) {
      throw error;
    }
    // Si no, creamos un nuevo error con un mensaje más descriptivo
    throw new Error(error?.message || 'Error desconocido al crear el diagrama');
  }
};

export const updateDiagram = async (
  companyId: string,
  environmentId: string,
  diagramId: string,
  diagramData: Partial<Diagram>
): Promise<Diagram> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No estás autenticado');
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/diagrams/${companyId}/environments/${environmentId}/diagrams/${diagramId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(diagramData)
      }
    );

    if (!response.ok) {
      let errorMessage = 'Error actualizando diagrama';
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en updateDiagram:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al actualizar el diagrama');
  }
};

export const deleteDiagram = async (companyId: string, environmentId: string, diagramId: string): Promise<void> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = localStorage.getItem('token');
  try {
    console.log(`Intentando eliminar diagrama: compañía ${companyId}, ambiente ${environmentId}, diagrama ${diagramId}`);
    const response = await fetch(`${API_BASE_URL}/diagrams/${companyId}/environments/${environmentId}/diagrams/${diagramId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      console.error('Error eliminando diagrama:', errorData);
      throw new Error(errorData.detail || 'Error eliminando diagrama');
    }
    
    console.log('Diagrama eliminado exitosamente del backend');
  } catch (error: any) {
    console.error('Error en deleteDiagram:', error);
    throw error;
  }
};

export async function updateDiagramPaths(companyId: string, environmentId: string): Promise<Diagram[]> {
  try {
    const token = localStorage.getItem('token');
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
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update diagram paths');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating diagram paths:', error);
    throw error;
  }
}
