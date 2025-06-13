import { vi } from 'vitest';

// Mock Company type that matches the store definition
export interface Company {
  _id: string;
  id: string;
  name: string;
  logo?: string;
  role: 'owner' | 'admin' | 'member';
  memberCount?: number;
  slug?: string;
  plan?: 'starter' | 'professional' | 'team' | 'enterprise';
  isPersonalSpace?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Mock the companyStore module
vi.mock('@/stores/companyStore', () => ({
  Company: {} as any, // Type export
  useCompanyStore: vi.fn(() => ({
    companies: [],
    currentCompany: null,
    loading: false,
    error: null,
    setCurrentCompany: vi.fn(),
    fetchCompanies: vi.fn(),
    createCompany: vi.fn(),
    updateCompany: vi.fn(),
    deleteCompany: vi.fn(),
    reset: vi.fn()
  }))
}));