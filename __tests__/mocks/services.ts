import { vi } from 'vitest';

// Mock cache service
export const mockCacheService = {
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn()
};

// Mock singleton requests
export const mockSingletonRequests = {
  executeOnce: vi.fn((key, fn) => fn()),
  clear: vi.fn()
};

// Mock auth service functions
export const mockGetAuthToken = vi.fn();
export const mockLogoutUser = vi.fn();

// Set default return value for getAuthToken
mockGetAuthToken.mockReturnValue('test-token-1234567890abcdef');

// Apply mocks
vi.mock('@/services/cacheService', () => ({
  cacheService: mockCacheService,
  CACHE_KEYS: {
    DASHBOARD_DATA: 'dashboard_data',
    COMPANY_LIST: 'company_list',
    WORKSPACE_LIST: 'workspace_list'
  },
  CACHE_TTL: {
    DASHBOARD: 300000,
    SHORT: 60000,
    MEDIUM: 300000,
    LONG: 600000
  }
}));

vi.mock('@/utils/singletonRequests', () => ({
  singletonRequests: mockSingletonRequests
}));

vi.mock('@/services/authService', () => ({
  getAuthToken: mockGetAuthToken,
  logoutUser: mockLogoutUser
}));
