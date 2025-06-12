import { api } from '@/app/lib/api';
import { type Company } from '@/app/stores/companyStore';

// Re-export Company type from store
export { type Company } from '@/app/stores/companyStore';

// Constant for personal space naming
export const PERSONAL_SPACE_COMPANY_NAME_PREFIX = 'Personal Space - ';

export interface CreateCompanyDTO {
  name: string;
  logo?: string;
}

export interface UpdateCompanyDTO {
  name?: string;
  logo?: string;
}

export interface CompanyMember {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  email?: string;
  name?: string;
}

export interface InviteUserDTO {
  email: string;
  role: 'admin' | 'member';
}

class CompanyService {
  async getCompanies(): Promise<Company[]> {
    try {
      const response = await api.get('/companies');
      return response.companies || [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  async getCompany(id: string): Promise<Company> {
    try {
      const response = await api.get(`/companies/${id}`);
      return response;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  async createCompany(data: CreateCompanyDTO): Promise<Company> {
    try {
      const response = await api.post('/companies', data);
      return response;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  async updateCompany(id: string, data: UpdateCompanyDTO): Promise<Company> {
    try {
      const response = await api.patch(`/companies/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  async deleteCompany(id: string): Promise<void> {
    try {
      await api.delete(`/companies/${id}`);
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  async inviteUserToCompany(companyId: string, email: string, role: string): Promise<void> {
    try {
      await api.post(`/companies/${companyId}/invitations`, { email, role });
    } catch (error) {
      console.error('Error inviting user:', error);
      throw error;
    }
  }

  async removeUserFromCompany(companyId: string, userId: string): Promise<void> {
    try {
      await api.delete(`/companies/${companyId}/members/${userId}`);
    } catch (error) {
      console.error('Error removing user:', error);
      throw error;
    }
  }

  async getCompanyMembers(companyId: string): Promise<CompanyMember[]> {
    try {
      const response = await api.get(`/companies/${companyId}/members`)
      // El backend ahora devuelve un array directamente
      return Array.isArray(response) ? response : []
    } catch (error) {
      console.error('Error fetching company members:', error)
      throw error
    }
  }

  async updateUserRole(companyId: string, userId: string, role: string): Promise<void> {
    try {
      await api.put(`/companies/${companyId}/members/${userId}/role`, { role });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }
}

export const companyService = new CompanyService();

// Export individual functions for backward compatibility
export const getCompanies = () => companyService.getCompanies();
export const createCompany = (data: CreateCompanyDTO) => companyService.createCompany(data);
export const updateCompany = (id: string, data: UpdateCompanyDTO) => companyService.updateCompany(id, data);
export const deleteCompany = (id: string) => companyService.deleteCompany(id);
