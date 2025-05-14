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
  nodes: Node[];
  edges: Edge[];
  viewport?: Viewport;
  created_at: string;
  updated_at: string;
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
  
  try {
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/environments`, {
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

export const createEnvironment = async (companyId: string, environmentData: { name: string; description?: string }): Promise<Environment> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = localStorage.getItem('token');
  
  try {
    console.log(`Intentando crear ambiente para compañía ${companyId}:`, environmentData);
    
    // Crear el ambiente usando el endpoint del backend
    const response = await fetch(`${API_BASE_URL}/companies/${companyId}/environments`, {
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
  const response = await fetch(`${API_BASE_URL}/companies/${companyId}/environments/${environmentId}`, {
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
  const response = await fetch(`${API_BASE_URL}/companies/${companyId}/environments/${environmentId}`, {
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

export const createDiagram = async (companyId: string, environmentId: string, diagramData: { name: string; description?: string; nodes: Node[]; edges: Edge[]; viewport?: Viewport }): Promise<Diagram> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = localStorage.getItem('token');
  
  try {
    console.log(`Intentando crear diagrama para compañía ${companyId}, ambiente ${environmentId}`);
    
    // Crear el diagrama usando el endpoint del backend
    const response = await fetch(`${API_BASE_URL}/diagrams/${companyId}/environments/${environmentId}/diagrams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(diagramData)
    });

    if (response.status === 404) {
      console.error('El endpoint para crear diagramas no está disponible en el backend');
      throw new Error('El servicio para crear diagramas no está disponible en el backend. Contacta al administrador del sistema.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      console.error('Error al crear diagrama:', errorData);
      throw new Error(errorData.detail || 'Error creando diagrama');
    }

    const data = await response.json();
    console.log('Diagrama creado exitosamente:', data);
    return data;
  } catch (error: any) {
    console.error('Error en createDiagram:', error);
    throw error;
  }
};

export const updateDiagram = async (companyId: string, environmentId: string, diagramId: string, diagramData: { name: string; description?: string; nodes: Node[]; edges: Edge[]; viewport?: Viewport }): Promise<Diagram> => {
  if (!isAuthenticated()) {
    throw new Error('Usuario no autenticado');
  }

  const token = localStorage.getItem('token');
  
  try {
    console.log(`Intentando actualizar diagrama: compañía ${companyId}, ambiente ${environmentId}, diagrama ${diagramId}`);
    const response = await fetch(`${API_BASE_URL}/diagrams/${companyId}/environments/${environmentId}/diagrams/${diagramId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(diagramData)
    });

    if (response.status === 404) {
      console.error('El endpoint para actualizar diagramas no está disponible en el backend');
      throw new Error('El servicio para actualizar diagramas no está disponible en el backend. Contacta al administrador del sistema.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      console.error('Error al actualizar diagrama:', errorData);
      throw new Error(errorData.detail || 'Error actualizando diagrama');
    }

    const data = await response.json();
    console.log('Diagrama actualizado exitosamente:', data);
    return data;
  } catch (error: any) {
    console.error('Error en updateDiagram:', error);
    throw error;
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

    if (response.status === 404) {
      console.error('El endpoint para eliminar diagramas no está disponible en el backend');
      throw new Error('El servicio para eliminar diagramas no está disponible en el backend. Contacta al administrador del sistema.');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
      throw new Error(errorData.detail || 'Error eliminando diagrama');
    }
    
    console.log('Diagrama eliminado exitosamente del backend');
  } catch (error: any) {
    console.error('Error en deleteDiagram:', error);
    throw error;
  }
};