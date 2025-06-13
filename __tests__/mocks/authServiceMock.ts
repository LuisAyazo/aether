import { vi } from 'vitest';

// Create individual mock functions
export const registerUser = vi.fn().mockResolvedValue({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' }
  },
  session: {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token'
  }
});

export const loginUser = vi.fn().mockResolvedValue({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: { name: 'Test User' }
  },
  session: {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token'
  }
});

export const saveAuthData = vi.fn();

export const getAuthToken = vi.fn().mockReturnValue('test-token');

export const getAuthTokenAsync = vi.fn().mockResolvedValue('test-access-token');

export const getCurrentUser = vi.fn().mockReturnValue({
  _id: '123',
  email: 'test@example.com',
  name: 'Test User'
});

export const getCurrentUserAsync = vi.fn().mockResolvedValue({
  _id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  user_metadata: { name: 'Test User' },
  app_metadata: {}
});

export const isAuthenticated = vi.fn().mockReturnValue(true);

export const isAuthenticatedAsync = vi.fn().mockResolvedValue(true);

export const logoutUser = vi.fn().mockResolvedValue(undefined);

export const fetchAndUpdateCurrentUser = vi.fn().mockResolvedValue({
  _id: 'test-user-id',
  email: 'test@example.com',
  name: 'Updated User',
  company_id: 'new-company',
  onboarding_completed: true
});

export const loginWithGoogle = vi.fn().mockResolvedValue(undefined);

export const loginWithGitHub = vi.fn().mockResolvedValue(undefined);

export const refreshSession = vi.fn().mockResolvedValue({
  session: {
    access_token: 'new-token',
    refresh_token: 'new-refresh-token'
  }
});

export const onAuthStateChange = vi.fn().mockReturnValue({
  data: { subscription: { unsubscribe: vi.fn() } }
});

// Export as default object
export default {
  registerUser,
  loginUser,
  saveAuthData,
  getAuthToken,
  getAuthTokenAsync,
  getCurrentUser,
  getCurrentUserAsync,
  isAuthenticated,
  isAuthenticatedAsync,
  logoutUser,
  fetchAndUpdateCurrentUser,
  loginWithGoogle,
  loginWithGitHub,
  refreshSession,
  onAuthStateChange
};

// Also export as named export for compatibility
export const mockAuthService = {
  registerUser,
  loginUser,
  saveAuthData,
  getAuthToken,
  getAuthTokenAsync,
  getCurrentUser,
  getCurrentUserAsync,
  isAuthenticated,
  isAuthenticatedAsync,
  logoutUser,
  fetchAndUpdateCurrentUser,
  loginWithGoogle,
  loginWithGitHub,
  refreshSession,
  onAuthStateChange
};