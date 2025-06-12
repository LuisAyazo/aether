import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { companyService } from '@/app/services/companyService';

export interface Company {
  _id: string; // MongoDB style ID used in existing code
  id: string;   // Also support 'id' for compatibility
  name: string;
  logo?: string;
  role: 'owner' | 'admin' | 'member';
  memberCount?: number;
  slug?: string; // Used in some parts of the code
  plan?: 'starter' | 'professional' | 'team' | 'enterprise'; // Plan type aligned with pricing
  isPersonalSpace?: boolean; // Flag for personal spaces
  createdAt: Date;
  updatedAt: Date;
}

interface CreateCompanyDTO {
  name: string;
  logo?: string;
}

interface CompanyStore {
  companies: Company[];
  currentCompany: Company | null;
  loading: boolean;
  error: string | null;
  setCurrentCompany: (company: Company) => Promise<void>;
  fetchCompanies: () => Promise<void>;
  createCompany: (data: CreateCompanyDTO) => Promise<Company>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  reset: () => void;
}

export const useCompanyStore = create<CompanyStore>()(
  persist(
    (set, get) => {
      // Exponer el método reset globalmente para limpieza de emergencia
      if (typeof window !== 'undefined') {
        (window as any).__COMPANY_STORE_RESET__ = () => {
          set({
            companies: [],
            currentCompany: null,
            loading: false,
            error: null
          });
        };
      }
      
      return {
        companies: [],
        currentCompany: null,
        loading: false,
        error: null,
      
        setCurrentCompany: async (company) => {
          set({ currentCompany: company });
          
          // Update localStorage for workspace persistence
          const currentWorkspaceId = localStorage.getItem(`currentWorkspace_${company.id}`);
          if (currentWorkspaceId) {
            localStorage.setItem('lastWorkspaceId', currentWorkspaceId);
          }
          
          // Emit event for other components
          window.dispatchEvent(new CustomEvent('companyChanged', { detail: company }));
        },
        
        fetchCompanies: async () => {
          set({ loading: true, error: null });
          try {
            const companies = await companyService.getCompanies();
            set({ companies, loading: false });
            
            // Set current company if not set
            const current = get().currentCompany;
            if (!current && companies.length > 0) {
              const savedCompanyId = localStorage.getItem('lastCompanyId');
              const savedCompany = companies.find(c => c.id === savedCompanyId);
              set({ currentCompany: savedCompany || companies[0] });
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch companies',
              loading: false 
            });
            throw error;
          }
        },
        
        createCompany: async (data) => {
          set({ loading: true, error: null });
          try {
            const company = await companyService.createCompany(data);
            set(state => ({ 
              companies: [...state.companies, company],
              currentCompany: company,
              loading: false
            }));
            
            // Save as last used company
            localStorage.setItem('lastCompanyId', company.id);
            
            return company;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create company',
              loading: false 
            });
            throw error;
          }
        },
        
        updateCompany: async (id, data) => {
          set({ loading: true, error: null });
          try {
            const updatedCompany = await companyService.updateCompany(id, data);
            set(state => ({
              companies: state.companies.map(c => 
                c.id === id ? { ...c, ...updatedCompany } : c
              ),
              currentCompany: state.currentCompany?.id === id 
                ? { ...state.currentCompany, ...updatedCompany }
                : state.currentCompany,
              loading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update company',
              loading: false 
            });
            throw error;
          }
        },
        
        deleteCompany: async (id) => {
          set({ loading: true, error: null });
          try {
            await companyService.deleteCompany(id);
            set(state => {
              const companies = state.companies.filter(c => c.id !== id);
              const needsNewCurrent = state.currentCompany?.id === id;
              
              return {
                companies,
                currentCompany: needsNewCurrent ? companies[0] || null : state.currentCompany,
                loading: false
              };
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete company',
              loading: false 
            });
            throw error;
          }
        },
        
        reset: () => {
          set({
            companies: [],
            currentCompany: null,
            loading: false,
            error: null
          });
          // Clear persisted state
          localStorage.removeItem('company-storage');
          localStorage.removeItem('lastCompanyId');
        }
      };
    },
    {
      name: 'company-storage',
      partialize: (state) => ({ 
        currentCompany: state.currentCompany 
      })
    }
  )
);
