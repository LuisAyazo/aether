// Servicio para manejar la autenticación de usuarios

export interface User { // Exportar la interfaz
  _id: string;
  id?: string; // Para compatibilidad, ya que a veces se usa id
  email: string;
  name: string;
  auth_provider?: 'email' | 'google' | 'github'; // Añadido
  usage_type?: 'personal' | 'company' | null; // Añadido
  avatar_url?: string; // Añadido para el avatar del usuario
}

export interface AuthResponse { // Exportar también si se usa externamente
  access_token: string;
  token_type: string;
  user: User;
}

// Utilizamos una URL de API con un valor por defecto
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('API URL:', API_URL); // Para debugging

export async function registerUser(name: string, email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/register`, { // Añadido v1
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Error ${response.status}: ${response.statusText}` }));
      throw new Error(errorData.detail || 'Error al registrar usuario');
    }

    return response.json();
  } catch (error) {
    // Captura errores de red como "Failed to fetch"
    if (error instanceof Error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión o contacta al administrador.');
      }
      throw error;
    }
    throw new Error('Error desconocido al registrar usuario');
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const formData = new URLSearchParams();
    formData.append('username', email); // FastAPI OAuth2 espera 'username', aunque sea un email
    formData.append('password', password);

    const response = await fetch(`${API_URL}/api/v1/auth/login`, { // Añadido v1
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `Error ${response.status}: ${response.statusText}` }));
      throw new Error(errorData.detail || 'Error al iniciar sesión');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Captura errores de red como "Failed to fetch"
    if (error instanceof Error) {
      if (error.message === 'Failed to fetch') {
        throw new Error('No se pudo conectar con el servidor. Por favor, verifica tu conexión o contacta al administrador.');
      }
      throw error;
    }
    throw new Error('Error desconocido al iniciar sesión');
  }
}

export function saveAuthData(authResponse: AuthResponse) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', authResponse.access_token);
    localStorage.setItem('user', JSON.stringify(authResponse.user));
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const userData = localStorage.getItem('user');
    if (userData) {
      return JSON.parse(userData);
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function logoutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

export async function fetchAndUpdateCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) {
    console.warn("fetchAndUpdateCurrentUser: No token found, cannot update user.");
    // Opcionalmente, podríamos redirigir a login si no hay token
    // Ejemplo: if (typeof window !== 'undefined') window.location.href = '/login';
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json', // Aunque GET no tiene body, es buena práctica
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        detail: `Error ${response.status} ${response.statusText || 'fetching user data'}` 
      }));
      console.error("fetchAndUpdateCurrentUser: Error fetching user data:", errorData.detail);
      if (response.status === 401 && typeof window !== 'undefined') {
        logoutUser(); // Limpiar datos de sesión inválida
        // Podríamos forzar una redirección a login aquí si es necesario
        // window.location.href = '/login'; 
      }
      return null; 
    }

    const updatedUser: User = await response.json();
    
    if (updatedUser && (updatedUser._id || updatedUser.id)) { // Verificar _id o id
      // Asegurar que el id principal sea _id si ambos existen, o usar el que esté disponible
      const finalUserId = updatedUser._id || updatedUser.id;
      if (!finalUserId) {
        console.error("fetchAndUpdateCurrentUser: Fetched user data is missing a valid ID.", updatedUser);
        return null;
      }
      const userToStore = { ...updatedUser, _id: finalUserId, id: finalUserId };


      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userToStore));
      }
      console.log("fetchAndUpdateCurrentUser: User data updated in localStorage.", userToStore);
      return userToStore;
    } else {
      console.error("fetchAndUpdateCurrentUser: Fetched user data is invalid or missing ID.", updatedUser);
      return null;
    }
  } catch (error) {
    console.error("fetchAndUpdateCurrentUser: Network or other error:", error);
    // Captura errores de red como "Failed to fetch"
    if (error instanceof Error && error.message === 'Failed to fetch') {
        // Podríamos lanzar un error más específico o manejarlo
        console.error('No se pudo conectar con el servidor para actualizar el usuario.');
    }
    return null;
  }
}
