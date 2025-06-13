import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as authService from "../../../../app/services/authService";
import { mockSupabaseClient, mockSupabaseUser, mockSupabaseSession } from '../../../mocks/supabase';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock company store
vi.mock('../../../../app/stores/companyStore', () => ({
  useCompanyStore: {
    getState: () => ({
      reset: vi.fn()
    })
  }
}));

describe('authService', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Reset localStorage
    localStorage.clear();
    
    // Setup default mock responses
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null
    });
    
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });
    
    mockSupabaseClient.auth.signOut.mockResolvedValue({
      error: null
    });
    
    // Mock fetch by default to succeed
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('registerUser', () => {
    it('should register a user successfully with Supabase', async () => {
      const mockData = {
        user: mockSupabaseUser,
        session: mockSupabaseSession
      };
      
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await authService.registerUser('Test User', 'test@example.com', 'password123');

      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'Test User'
          }
        }
      });

      expect(result.user).toMatchObject({
        _id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      });
    });

    it('should handle registration errors', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already exists' }
      });

      await expect(authService.registerUser('Test User', 'test@example.com', 'password123'))
        .rejects.toThrow('User already exists');
    });

    it('should use backend auth when NEXT_PUBLIC_USE_BACKEND_AUTH is true', async () => {
      process.env.NEXT_PUBLIC_USE_BACKEND_AUTH = 'true';
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          user: { id: '123', email: 'test@example.com', name: 'Test User' }
        })
      });

      await authService.registerUser('Test User', 'test@example.com', 'password123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: 'Test User', email: 'test@example.com', password: 'password123' })
        })
      );

      delete process.env.NEXT_PUBLIC_USE_BACKEND_AUTH;
    });
  });

  describe('loginUser', () => {
    it('should login a user successfully with Supabase', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: mockSupabaseUser,
          session: mockSupabaseSession
        },
        error: null
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Test User',
          onboarding_completed: true,
          company_id: 'company-123'
        })
      });

      const result = await authService.loginUser('test@example.com', 'password123');

      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toMatchObject({
        access_token: 'test-access-token',
        token_type: 'bearer',
        user: {
          _id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User'
        }
      });
    });

    it('should handle login errors', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      await expect(authService.loginUser('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should handle network errors gracefully', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(new Error('Failed to fetch'));

      await expect(authService.loginUser('test@example.com', 'password123'))
        .rejects.toThrow('No se pudo conectar con el servidor');
    });
  });

  describe('saveAuthData', () => {
    it('should save user data to localStorage', () => {
      const authResponse: authService.AuthResponse = {
        access_token: 'test-token',
        token_type: 'bearer',
        user: {
          _id: '123',
          email: 'test@example.com',
          name: 'Test User'
        }
      };

      authService.saveAuthData(authResponse);

      const savedUser = localStorage.getItem('user');
      expect(savedUser).toBeTruthy();
      expect(JSON.parse(savedUser!)).toEqual(authResponse.user);
    });
  });

  describe('getAuthToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      expect(authService.getAuthToken()).toBe('test-token');
    });

    it('should return null if no token exists', () => {
      expect(authService.getAuthToken()).toBeNull();
    });
  });

  describe('getAuthTokenAsync', () => {
    it('should return token from Supabase session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSupabaseSession }
      });

      const token = await authService.getAuthTokenAsync();
      expect(token).toBe('test-access-token');
    });

    it('should fallback to localStorage if no Supabase session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null }
      });
      
      localStorage.setItem('token', 'fallback-token');
      const token = await authService.getAuthTokenAsync();
      expect(token).toBe('fallback-token');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      const user = {
        _id: '123',
        email: 'test@example.com',
        name: 'Test User'
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      expect(authService.getCurrentUser()).toEqual(user);
    });

    it('should return null if no user in localStorage', () => {
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('getCurrentUserAsync', () => {
    it('should return user from Supabase with backend profile', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser }
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSupabaseSession }
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Updated User',
          company_id: 'company-123',
          onboarding_completed: true
        })
      });

      const user = await authService.getCurrentUserAsync();
      
      expect(user).toMatchObject({
        _id: 'test-user-id',
        email: 'test@example.com',
        name: 'Updated User',
        company_id: 'company-123',
        onboarding_completed: true
      });
    });

    it('should fallback to localStorage if Supabase fails', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null }
      });

      const localUser = {
        _id: '123',
        email: 'test@example.com',
        name: 'Local User'
      };
      
      localStorage.setItem('user', JSON.stringify(localUser));
      
      const user = await authService.getCurrentUserAsync();
      expect(user).toEqual(localUser);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if token exists', () => {
      localStorage.setItem('token', 'test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return true if user exists', () => {
      localStorage.setItem('user', JSON.stringify({ _id: '123' }));
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false if neither token nor user exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('isAuthenticatedAsync', () => {
    it('should return true if Supabase session exists', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSupabaseSession }
      });

      expect(await authService.isAuthenticatedAsync()).toBe(true);
    });

    it('should return false if no Supabase session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      expect(await authService.isAuthenticatedAsync()).toBe(false);
    });
  });

  describe('logoutUser', () => {
    it('should sign out from Supabase and redirect to login', async () => {
      // Mock window.location.href
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true
      });

      // Ensure the mock is properly set up
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      await authService.logoutUser();

      // Check that signOut was called
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      
      // Check redirect happened
      expect(window.location.href).toBe('/login?session_expired=true');
    });
  });

  describe('fetchAndUpdateCurrentUser', () => {
    it('should fetch and update user data', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSupabaseSession }
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser }
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Updated User',
          company_id: 'new-company',
          onboarding_completed: true
        })
      });

      const user = await authService.fetchAndUpdateCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/auth/me'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-access-token'
          })
        })
      );

      expect(user).toMatchObject({
        _id: 'test-user-id',
        email: 'test@example.com',
        name: 'Updated User',
        company_id: 'new-company',
        onboarding_completed: true
      });

      // Check it was saved to localStorage
      const savedUser = localStorage.getItem('user');
      expect(savedUser).toBeTruthy();
      const parsedUser = JSON.parse(savedUser!);
      // Remove undefined fields for comparison
      Object.keys(parsedUser).forEach(key => {
        if (parsedUser[key] === undefined) {
          delete parsedUser[key];
        }
      });
      expect(parsedUser).toMatchObject({
        _id: 'test-user-id',
        email: 'test@example.com',
        name: 'Updated User',
        company_id: 'new-company',
        onboarding_completed: true
      });
    });

    it('should handle 401 errors by logging out', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSupabaseSession }
      });

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser }
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401
      });

      // Mock window.location.href for logout
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true
      });

      const user = await authService.fetchAndUpdateCurrentUser();

      // Check that logout was called (by checking redirect)
      expect(window.location.href).toBe('/login?session_expired=true');
      expect(user).toBeNull();
    });
  });

  describe('Social Login', () => {
    it('should initiate Google login', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({ error: null });

      await authService.loginWithGoogle();

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback')
        }
      });
    });

    it('should initiate GitHub login', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({ error: null });

      await authService.loginWithGitHub();

      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: expect.stringContaining('/auth/callback')
        }
      });
    });

    it('should handle OAuth errors', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        error: { message: 'OAuth error' }
      });

      await expect(authService.loginWithGoogle()).rejects.toThrow('OAuth error');
    });
  });

  describe('Session Management', () => {
    it('should refresh session successfully', async () => {
      const newSession = { ...mockSupabaseSession, access_token: 'new-token' };
      
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null
      });

      const session = await authService.refreshSession();
      
      expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled();
      expect(session?.access_token).toBe('new-token');
    });

    it('should handle refresh errors', async () => {
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh failed' }
      });

      const session = await authService.refreshSession();
      expect(session).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should set up auth state change listener', () => {
      const callback = vi.fn();
      const unsubscribe = vi.fn();
      
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({ unsubscribe });

      authService.onAuthStateChange(callback);

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(callback);
    });
  });
});
