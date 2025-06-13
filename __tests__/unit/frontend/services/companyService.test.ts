import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the store first
import '@/__tests__/mocks/stores';

// Mock the api module with inline definition
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

// Now import the service after mocks are set up
import {
  companyService,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  PERSONAL_SPACE_COMPANY_NAME_PREFIX,
  type Company,
  type CreateCompanyDTO,
  type UpdateCompanyDTO,
  type CompanyMember
} from "../../../../app/services/companyService";

// Import api to access the mocked functions
import { api as mockApi } from "../../../../app/lib/api";

describe('companyService', () => {
  const mockCompany: Company = {
    _id: 'company-123',
    id: 'company-123',
    name: 'Test Company',
    logo: 'https://example.com/logo.png',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    isPersonalSpace: false,
    role: 'owner',
    memberCount: 5
  };

  const mockCompanyMember: CompanyMember = {
    id: 'member-123',
    user_id: 'user-123',
    role: 'owner',
    joined_at: '2024-01-01T00:00:00Z',
    email: 'owner@example.com',
    name: 'John Doe'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCompanies', () => {
    it('should fetch companies successfully', async () => {
      const mockCompanies = [mockCompany];
      mockApi.get.mockResolvedValue({ companies: mockCompanies });

      const result = await companyService.getCompanies();

      expect(result).toEqual(mockCompanies);
      expect(mockApi.get).toHaveBeenCalledWith('/companies');
    });

    it('should handle empty companies response', async () => {
      mockApi.get.mockResolvedValue({ companies: null });

      const result = await companyService.getCompanies();

      expect(result).toEqual([]);
    });

    it('should handle errors', async () => {
      const error = new Error('Network error');
      mockApi.get.mockRejectedValue(error);

      await expect(companyService.getCompanies()).rejects.toThrow('Network error');
    });

    it('should work with standalone function export', async () => {
      mockApi.get.mockResolvedValue({ companies: [mockCompany] });

      const result = await getCompanies();

      expect(result).toEqual([mockCompany]);
    });
  });

  describe('getCompany', () => {
    it('should fetch single company successfully', async () => {
      mockApi.get.mockResolvedValue(mockCompany);

      const result = await companyService.getCompany('company-123');

      expect(result).toEqual(mockCompany);
      expect(mockApi.get).toHaveBeenCalledWith('/companies/company-123');
    });

    it('should handle not found error', async () => {
      mockApi.get.mockRejectedValue(new Error('Company not found'));

      await expect(
        companyService.getCompany('non-existent')
      ).rejects.toThrow('Company not found');
    });
  });

  describe('createCompany', () => {
    it('should create company successfully', async () => {
      const createData: CreateCompanyDTO = {
        name: 'New Company',
        logo: 'https://example.com/new-logo.png'
      };

      mockApi.post.mockResolvedValue(mockCompany);

      const result = await companyService.createCompany(createData);

      expect(result).toEqual(mockCompany);
      expect(mockApi.post).toHaveBeenCalledWith('/companies', createData);
    });

    it('should create company without logo', async () => {
      const createData: CreateCompanyDTO = {
        name: 'New Company'
      };

      mockApi.post.mockResolvedValue({ ...mockCompany, logo: undefined });

      const result = await companyService.createCompany(createData);

      expect(result.logo).toBeUndefined();
      expect(mockApi.post).toHaveBeenCalledWith('/companies', createData);
    });

    it('should work with standalone function export', async () => {
      const createData: CreateCompanyDTO = { name: 'Test' };
      mockApi.post.mockResolvedValue(mockCompany);

      const result = await createCompany(createData);

      expect(result).toEqual(mockCompany);
    });

    it('should handle validation errors', async () => {
      mockApi.post.mockRejectedValue(new Error('Name already exists'));

      await expect(
        companyService.createCompany({ name: 'Duplicate' })
      ).rejects.toThrow('Name already exists');
    });
  });

  describe('updateCompany', () => {
    it('should update company successfully', async () => {
      const updateData: UpdateCompanyDTO = {
        name: 'Updated Company',
        logo: 'https://example.com/updated-logo.png'
      };

      const updatedCompany = { ...mockCompany, ...updateData };
      mockApi.patch.mockResolvedValue(updatedCompany);

      const result = await companyService.updateCompany('company-123', updateData);

      expect(result).toEqual(updatedCompany);
      expect(mockApi.patch).toHaveBeenCalledWith('/companies/company-123', updateData);
    });

    it('should update only name', async () => {
      const updateData: UpdateCompanyDTO = { name: 'New Name' };
      mockApi.patch.mockResolvedValue({ ...mockCompany, name: 'New Name' });

      const result = await companyService.updateCompany('company-123', updateData);

      expect(result.name).toBe('New Name');
    });

    it('should work with standalone function export', async () => {
      const updateData: UpdateCompanyDTO = { name: 'Test' };
      mockApi.patch.mockResolvedValue(mockCompany);

      const result = await updateCompany('company-123', updateData);

      expect(result).toEqual(mockCompany);
    });
  });

  describe('deleteCompany', () => {
    it('should delete company successfully', async () => {
      mockApi.delete.mockResolvedValue(undefined);

      await companyService.deleteCompany('company-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/companies/company-123');
    });

    it('should handle deletion errors', async () => {
      mockApi.delete.mockRejectedValue(new Error('Cannot delete personal space'));

      await expect(
        companyService.deleteCompany('personal-space-id')
      ).rejects.toThrow('Cannot delete personal space');
    });

    it('should work with standalone function export', async () => {
      mockApi.delete.mockResolvedValue(undefined);

      await deleteCompany('company-123');

      expect(mockApi.delete).toHaveBeenCalledWith('/companies/company-123');
    });
  });

  describe('Company member management', () => {
    describe('inviteUserToCompany', () => {
      it('should invite user successfully', async () => {
        mockApi.post.mockResolvedValue(undefined);

        await companyService.inviteUserToCompany(
          'company-123',
          'newuser@example.com',
          'member'
        );

        expect(mockApi.post).toHaveBeenCalledWith(
          '/companies/company-123/invitations',
          { email: 'newuser@example.com', role: 'member' }
        );
      });

      it('should handle invalid email', async () => {
        mockApi.post.mockRejectedValue(new Error('Invalid email'));

        await expect(
          companyService.inviteUserToCompany('company-123', 'invalid', 'member')
        ).rejects.toThrow('Invalid email');
      });

      it('should handle permission errors', async () => {
        mockApi.post.mockRejectedValue(new Error('Not authorized'));

        await expect(
          companyService.inviteUserToCompany('company-123', 'user@test.com', 'admin')
        ).rejects.toThrow('Not authorized');
      });
    });

    describe('removeUserFromCompany', () => {
      it('should remove user successfully', async () => {
        mockApi.delete.mockResolvedValue(undefined);

        await companyService.removeUserFromCompany('company-123', 'user-456');

        expect(mockApi.delete).toHaveBeenCalledWith(
          '/companies/company-123/members/user-456'
        );
      });

      it('should handle owner removal error', async () => {
        mockApi.delete.mockRejectedValue(new Error('Cannot remove owner'));

        await expect(
          companyService.removeUserFromCompany('company-123', 'owner-id')
        ).rejects.toThrow('Cannot remove owner');
      });
    });

    describe('getCompanyMembers', () => {
      it('should fetch company members successfully', async () => {
        const mockMembers = [mockCompanyMember];
        mockApi.get.mockResolvedValue(mockMembers);

        const result = await companyService.getCompanyMembers('company-123');

        expect(result).toEqual(mockMembers);
        expect(mockApi.get).toHaveBeenCalledWith('/companies/company-123/members');
      });

      it('should handle non-array response', async () => {
        mockApi.get.mockResolvedValue({ members: [mockCompanyMember] });

        const result = await companyService.getCompanyMembers('company-123');

        expect(result).toEqual([]);
      });

      it('should handle empty members list', async () => {
        mockApi.get.mockResolvedValue([]);

        const result = await companyService.getCompanyMembers('company-123');

        expect(result).toEqual([]);
      });
    });

    describe('updateUserRole', () => {
      it('should update user role successfully', async () => {
        mockApi.put.mockResolvedValue(undefined);

        await companyService.updateUserRole('company-123', 'user-456', 'admin');

        expect(mockApi.put).toHaveBeenCalledWith(
          '/companies/company-123/members/user-456/role',
          { role: 'admin' }
        );
      });

      it('should handle invalid role', async () => {
        mockApi.put.mockRejectedValue(new Error('Invalid role'));

        await expect(
          companyService.updateUserRole('company-123', 'user-456', 'invalid')
        ).rejects.toThrow('Invalid role');
      });

      it('should handle permission errors', async () => {
        mockApi.put.mockRejectedValue(new Error('Only owners can change roles'));

        await expect(
          companyService.updateUserRole('company-123', 'user-456', 'owner')
        ).rejects.toThrow('Only owners can change roles');
      });
    });
  });

  describe('Personal space handling', () => {
    it('should identify personal space by name prefix', () => {
      const personalSpaceCompany: Company = {
        ...mockCompany,
        name: `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}John Doe`,
        isPersonalSpace: true
      };

      expect(personalSpaceCompany.name).toContain(PERSONAL_SPACE_COMPANY_NAME_PREFIX);
      expect(personalSpaceCompany.isPersonalSpace).toBe(true);
    });

    it('should handle personal space in company list', async () => {
      const companies = [
        mockCompany,
        {
          ...mockCompany,
          _id: 'personal-123',
          id: 'personal-123',
          name: `${PERSONAL_SPACE_COMPANY_NAME_PREFIX}User`,
          isPersonalSpace: true
        }
      ];

      mockApi.get.mockResolvedValue({ companies });

      const result = await companyService.getCompanies();

      expect(result).toHaveLength(2);
      expect(result[1].isPersonalSpace).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should log errors to console', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Test error');
      mockApi.get.mockRejectedValue(error);

      await expect(companyService.getCompanies()).rejects.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching companies:',
        error
      );

      consoleErrorSpy.mockRestore();
    });

    it('should propagate errors correctly', async () => {
      const customError = new Error('Custom API error');
      mockApi.post.mockRejectedValue(customError);

      try {
        await companyService.createCompany({ name: 'Test' });
      } catch (error) {
        expect(error).toBe(customError);
      }
    });
  });
});
