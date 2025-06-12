// Servicio para manejar la autenticación de usuarios con Supabase
import { supabase } from '@/app/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  _id: string;
  id?: string; // Para compatibilidad
  email: string;
  name: string;
  auth_provider?: 'email' | 'google' | 'github';
  usage_type?: 'personal' | 'company' | null;
  avatar_url?: string;
  workspace_id?: string;
  company_id?: string;
  onboarding_completed?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  refresh_token?: string;
}

// Backward compatibility - still use API URL for non-auth endpoints
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
console.log('API URL:', API_URL);

// Convert Supabase user to our User interface
function convertSupabaseUser(supabaseUser: SupabaseUser, profile?: any): User {
  // Validate auth provider
  const provider = supabaseUser.app_metadata?.provider || 'email';
  const validProviders = ['email', 'google', 'github'];
  const authProvider = validProviders.includes(provider) ? provider as 'email' | 'google' | 'github' : 'email';
  
  return {
    _id: supabaseUser.id,
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: profile?.name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '',
    auth_provider: authProvider,
    avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url,
    workspace_id: profile?.workspace_id,
    company_id: profile?.company_id,
    onboarding_completed: profile?.onboarding_completed || false
  };
}

export async function registerUser(name: string, email: string, password: string) {
  try {
    // First check if we should use the backend API (for backward compatibility)
    const useBackendAuth = process.env.NEXT_PUBLIC_USE_BACKEND_AUTH === 'true';
    
    if (useBackendAuth) {
      // Legacy backend registration
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
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
    }

    // Supabase registration
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('No se pudo crear el usuario');
    }

    // Call backend to create user profile and company
    const token = data.session?.access_token;
    if (token) {
      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          email, 
          password: 'supabase-managed' // Backend won't use this
        }),
      });

      if (!response.ok) {
        console.error('Error creating backend profile:', await response.text());
      }
    }

    return {
      user: convertSupabaseUser(data.user),
      session: data.session
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al registrar usuario');
  }
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    // Check if we should use the backend API (for backward compatibility)
    const useBackendAuth = process.env.NEXT_PUBLIC_USE_BACKEND_AUTH === 'true';
    
    if (useBackendAuth) {
      // Legacy backend login
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
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
    }

    // Supabase login
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Error al iniciar sesión');
    }

    // Get user profile from backend
    let profile = null;
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });
      
      if (response.ok) {
        profile = await response.json();
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }

    const user = convertSupabaseUser(data.user, profile);

    return {
      access_token: data.session.access_token,
      token_type: 'bearer',
      user: user,
      refresh_token: data.session.refresh_token
    };
  } catch (error) {
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
    // Supabase handles session storage automatically
    // But we still store user data for quick access
    localStorage.setItem('user', JSON.stringify(authResponse.user));
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    // Try to get from Supabase session
    const session = supabase.auth.getSession();
    session.then(({ data }) => {
      if (data.session) {
        return data.session.access_token;
      }
    });

    // Fallback to localStorage for backward compatibility
    return localStorage.getItem('token');
  }
  return null;
}

export async function getAuthTokenAsync(): Promise<string | null> {
  if (typeof window !== 'undefined') {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      return session.access_token;
    }
    
    // Fallback to localStorage for backward compatibility
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

export async function getCurrentUserAsync(): Promise<User | null> {
  if (typeof window !== 'undefined') {
    // Get from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Try to get profile from backend
      const token = await getAuthTokenAsync();
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const profile = await response.json();
            return convertSupabaseUser(user, profile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      }
      
      return convertSupabaseUser(user);
    }
    
    // Fallback to localStorage
    return getCurrentUser();
  }
  return null;
}

export function isAuthenticated(): boolean {
  // Quick check using localStorage
  return !!getAuthToken() || !!getCurrentUser();
}

export async function isAuthenticatedAsync(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

export async function logoutUser() {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
  } catch (err) {
    console.error('Error during logout:', err);
  }
  
  // Clear all authentication data
  if (typeof window !== 'undefined') {
    // Clear only auth-related data from localStorage
    const keysToRemove = ['token', 'user', 'access_token', 'refresh_token'];
    
    // Also clear cache keys and company-related keys
    const allKeys = Object.keys(localStorage);
    const cacheAndAuthKeys = allKeys.filter(key => 
      keysToRemove.includes(key) || 
      key.startsWith('cache_') || 
      key.startsWith('dashboard_') ||
      key.startsWith('supabase.auth.') ||
      key.startsWith('company') ||
      key.startsWith('lastCompany') ||
      key.startsWith('currentCompany')
    );
    
    cacheAndAuthKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear sessionStorage completely (it's session-specific anyway)
    sessionStorage.clear();
    
    // Clear cookies
    if (document.cookie && document.cookie.length > 0) {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    }
    
    // Reset company store
    const { useCompanyStore } = await import('@/app/stores/companyStore');
    useCompanyStore.getState().reset();
    
    // Redirect to login
    window.location.href = '/login?session_expired=true';
  }
}

export async function fetchAndUpdateCurrentUser(): Promise<User | null> {
  try {
    // Get current Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn("fetchAndUpdateCurrentUser: No session found");
      return null;
    }

    // Get user from Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("fetchAndUpdateCurrentUser: No user found");
      return null;
    }

    // Fetch updated profile from backend
    let profile = null;
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        profile = await response.json();
      } else if (response.status === 401) {
        console.error("fetchAndUpdateCurrentUser: Unauthorized, logging out");
        await logoutUser();
        return null;
      }
    } catch (error) {
      console.error("fetchAndUpdateCurrentUser: Error fetching profile:", error);
    }

    const updatedUser = convertSupabaseUser(user, profile);
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    console.log("fetchAndUpdateCurrentUser: User data updated", updatedUser);
    return updatedUser;
  } catch (error) {
    console.error("fetchAndUpdateCurrentUser: Error:", error);
    return null;
  }
}

// Social login helpers
export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    throw new Error(error.message);
  }
}

export async function loginWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) {
    throw new Error(error.message);
  }
}

// Session management
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.error('Error refreshing session:', error);
    return null;
  }
  return data.session;
}

// Listen to auth state changes
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange(callback);
}
