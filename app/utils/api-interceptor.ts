import { logoutUser } from '../services/authService';

/**
 * Interceptor global para manejar errores de autenticación
 * Detecta tokens corruptos o expirados y redirige al login automáticamente
 */

// Mantener registro de si ya estamos manejando un error para evitar loops
let isHandlingAuthError = false;

/**
 * Wrapper para fetch que intercepta errores de autenticación
 */
export async function fetchWithAuthInterceptor(
  url: string,
  options?: RequestInit
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Si recibimos un 401, el token es inválido
    if (response.status === 401 && !isHandlingAuthError) {
      isHandlingAuthError = true;
      
      console.error('[Auth Interceptor] Token inválido detectado, limpiando sesión...');
      
      // Intentar obtener el detalle del error
      try {
        const errorData = await response.clone().json();
        console.error('[Auth Interceptor] Error details:', errorData);
        
        // Detectar errores específicos de token corrupto
        if (errorData.detail?.includes('JWT') || 
            errorData.detail?.includes('token') ||
            errorData.detail?.includes('Session')) {
          console.error('[Auth Interceptor] Token corrupto detectado');
        }
      } catch (e) {
        // Si no podemos parsear el error, continuar
      }
      
      // Limpiar toda la autenticación y redirigir
      setTimeout(() => {
        logoutUser();
        isHandlingAuthError = false;
      }, 100);
    }
    
    return response;
  } catch (error) {
    // Si es un error de red, relanzarlo
    throw error;
  }
}

/**
 * Crear un cliente fetch mejorado con reintentos y manejo de errores
 */
export function createApiClient(baseURL: string = '') {
  return {
    async get(endpoint: string, token?: string) {
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      return fetchWithAuthInterceptor(`${baseURL}${endpoint}`, {
        method: 'GET',
        headers,
      });
    },
    
    async post(endpoint: string, data: any, token?: string) {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      return fetchWithAuthInterceptor(`${baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
    },
    
    async put(endpoint: string, data: any, token?: string) {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      return fetchWithAuthInterceptor(`${baseURL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });
    },
    
    async delete(endpoint: string, token?: string) {
      const headers: HeadersInit = {
        'Accept': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      return fetchWithAuthInterceptor(`${baseURL}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
    },
  };
}

// Exportar una instancia por defecto
export const apiClient = createApiClient();
