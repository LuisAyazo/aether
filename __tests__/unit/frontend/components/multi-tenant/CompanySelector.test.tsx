import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CompanySelector } from "../../../../../app/components/multi-tenant/CompanySelector";
import { useCompanyStore } from "../../../../../app/stores/companyStore";
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock company store
vi.mock('../../../../../app/stores/companyStore', () => ({
  useCompanyStore: vi.fn()
}));

// Mock UI components
vi.mock('../../../../../app/components/ui/command', () => ({
  Command: ({ children }: any) => <div data-testid="command">{children}</div>,
  CommandEmpty: ({ children }: any) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ children, heading }: any) => (
    <div data-testid="command-group">
      {heading && <div data-testid="command-group-heading">{heading}</div>}
      {children}
    </div>
  ),
  CommandInput: ({ placeholder, value, onValueChange }: any) => (
    <input
      data-testid="command-input"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  ),
  CommandItem: ({ children, onSelect, value }: any) => (
    <div
      data-testid={`command-item-${value}`}
      onClick={() => onSelect?.()}
      role="option"
    >
      {children}
    </div>
  ),
  CommandList: ({ children }: any) => <div data-testid="command-list">{children}</div>,
  CommandSeparator: () => <hr data-testid="command-separator" />
}));

vi.mock('../../../../../app/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open}>
      {children}
    </div>
  ),
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
  PopoverTrigger: ({ children, asChild }: any) => (
    <div data-testid="popover-trigger">{children}</div>
  )
}));

vi.mock('../../../../../app/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => (
    <div data-testid="avatar" className={className}>{children}</div>
  ),
  AvatarImage: ({ src, alt }: any) => (
    <img data-testid="avatar-image" src={src} alt={alt} />
  ),
  AvatarFallback: ({ children }: any) => (
    <div data-testid="avatar-fallback">{children}</div>
  )
}));

// Mock data
const mockCompanies = [
  {
    _id: 'company-1',
    id: 'company-1',
    name: 'Acme Corp',
    logo: 'https://example.com/acme-logo.png',
    role: 'owner' as const,
    slug: 'acme-corp',
    memberCount: 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: 'company-2',
    id: 'company-2',
    name: 'Beta Inc',
    logo: undefined,
    role: 'admin' as const,
    slug: 'beta-inc',
    memberCount: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    _id: 'company-3',
    id: 'company-3',
    name: 'Gamma LLC',
    role: 'member' as const,
    memberCount: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }
];

describe('CompanySelector', () => {
  let user: ReturnType<typeof userEvent.setup>;
  let mockRouter: any;
  let mockCompanyStore: any;

  beforeEach(() => {
    user = userEvent.setup();
    
    mockRouter = {
      push: vi.fn()
    };
    vi.mocked(useRouter).mockReturnValue(mockRouter);

    mockCompanyStore = {
      companies: mockCompanies,
      currentCompany: mockCompanies[0],
      setCurrentCompany: vi.fn().mockResolvedValue(undefined),
      loading: false,
      fetchCompanies: vi.fn().mockResolvedValue(undefined)
    };
    vi.mocked(useCompanyStore).mockReturnValue(mockCompanyStore);

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn((key) => {
        if (key === 'lastWorkspace_company-1') return 'workspace-123';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render with current company', () => {
      render(<CompanySelector />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      // Use getAllByText since the company name appears multiple times
      const companyNames = screen.getAllByText('Acme Corp');
      expect(companyNames.length).toBeGreaterThan(0);
      // Get the avatar fallback from the trigger
      const trigger = screen.getByRole('combobox');
      const avatarFallback = trigger.querySelector('[data-testid="avatar-fallback"]');
      expect(avatarFallback).toHaveTextContent('AC');
    });

    it('should render without current company', () => {
      mockCompanyStore.currentCompany = null;
      render(<CompanySelector />);

      expect(screen.getByText('Select company...')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockCompanyStore.loading = true;
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      fireEvent.click(trigger);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Company list', () => {
    it('should show all companies when opened', async () => {
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByTestId('command-item-Acme Corp')).toBeInTheDocument();
      expect(screen.getByTestId('command-item-Beta Inc')).toBeInTheDocument();
      expect(screen.getByTestId('command-item-Gamma LLC')).toBeInTheDocument();
    });

    it('should show company details', async () => {
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Check for company details
      expect(screen.getByText('acme-corp')).toBeInTheDocument();
      expect(screen.getByText('• 10 members')).toBeInTheDocument();
      expect(screen.getByText('owner')).toBeInTheDocument();
    });

    it('should show role badges with correct colors', async () => {
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const ownerBadge = screen.getByText('owner');
      expect(ownerBadge).toHaveClass('bg-purple-100');

      const adminBadge = screen.getByText('admin');
      expect(adminBadge).toHaveClass('bg-blue-100');

      const memberBadge = screen.getByText('member');
      expect(memberBadge).toHaveClass('bg-gray-100');
    });
  });

  describe('Search functionality', () => {
    it('should filter companies based on search', async () => {
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const searchInput = screen.getByTestId('command-input');
      await user.type(searchInput, 'beta');

      expect(screen.queryByTestId('command-item-Acme Corp')).not.toBeInTheDocument();
      expect(screen.getByTestId('command-item-Beta Inc')).toBeInTheDocument();
      expect(screen.queryByTestId('command-item-Gamma LLC')).not.toBeInTheDocument();
    });

    it('should show empty state when no matches', async () => {
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const searchInput = screen.getByTestId('command-input');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No company found.')).toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const searchInput = screen.getByTestId('command-input');
      await user.type(searchInput, 'ACME');

      expect(screen.getByTestId('command-item-Acme Corp')).toBeInTheDocument();
    });
  });

  describe('Company selection', () => {
    it('should select a company and navigate', async () => {
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const betaCompany = screen.getByTestId('command-item-Beta Inc');
      await user.click(betaCompany);

      expect(mockCompanyStore.setCurrentCompany).toHaveBeenCalledWith(mockCompanies[1]);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/company/company-2/workspace/default');
        expect(toast.success).toHaveBeenCalledWith('Switched to Beta Inc');
      });
    });

    it('should use stored workspace ID for navigation', async () => {
      // Update localStorage mock for this specific test
      window.localStorage.getItem = vi.fn((key) => {
        if (key === 'lastWorkspace_company-2') return 'workspace-456';
        if (key === 'lastWorkspace_company-1') return 'workspace-123';
        return null;
      });

      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const betaCompany = screen.getByTestId('command-item-Beta Inc');
      await user.click(betaCompany);

      // Wait for all async operations to complete
      await waitFor(() => {
        expect(mockCompanyStore.setCurrentCompany).toHaveBeenCalledWith(mockCompanies[1]);
        expect(mockRouter.push).toHaveBeenCalled();
      });

      // Verify localStorage was checked for the correct key
      expect(window.localStorage.getItem).toHaveBeenCalledWith('lastWorkspace_company-2');

      // Check for navigation with the stored workspace ID
      expect(mockRouter.push).toHaveBeenCalledWith('/company/company-2/workspace/workspace-456');
    });

    it('should handle selection errors', async () => {
      mockCompanyStore.setCurrentCompany.mockRejectedValue(new Error('Failed'));

      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const betaCompany = screen.getByTestId('command-item-Beta Inc');
      await user.click(betaCompany);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to switch company');
      });

      consoleError.mockRestore();
    });

    it('should show check mark for current company', async () => {
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const acmeItem = screen.getByTestId('command-item-Acme Corp');
      const checkMark = acmeItem.querySelector('.opacity-100');
      expect(checkMark).toBeInTheDocument();
    });
  });

  describe('Create company', () => {
    it('should navigate to create company page', async () => {
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const createButton = screen.getByText('Create New Company');
      await user.click(createButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/create-company');
    });
  });

  describe('Keyboard shortcuts', () => {
    it('should toggle open with Cmd+K', async () => {
      render(<CompanySelector />);

      // Open with Cmd+K
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('popover')).toHaveAttribute('data-open', 'true');
      });

      // Close with Cmd+K
      fireEvent.keyDown(document, { key: 'k', metaKey: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('popover')).toHaveAttribute('data-open', 'false');
      });
    });

    it('should work with Ctrl+K', async () => {
      render(<CompanySelector />);

      fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
      
      await waitFor(() => {
        expect(screen.getByTestId('popover')).toHaveAttribute('data-open', 'true');
      });
    });

    it('should prevent default behavior', async () => {
      const { act } = await import('@testing-library/react');
      
      render(<CompanySelector />);

      await act(async () => {
        const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
        event.preventDefault = vi.fn();
        
        document.dispatchEvent(event);

        expect(event.preventDefault).toHaveBeenCalled();
      });
    });
  });

  describe('Company initials', () => {
    it('should generate correct initials', async () => {
      render(<CompanySelector />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // Find all avatar fallbacks
      const avatarFallbacks = screen.getAllByTestId('avatar-fallback');
      
      // First one is in the trigger, others are in the list
      expect(avatarFallbacks[1]).toHaveTextContent('AC'); // Acme Corp
      expect(avatarFallbacks[2]).toHaveTextContent('BI'); // Beta Inc
      expect(avatarFallbacks[3]).toHaveTextContent('GL'); // Gamma LLC
    });

    it('should handle single word names', () => {
      mockCompanyStore.companies = [{
        ...mockCompanies[0],
        name: 'SingleWord'
      }];
      mockCompanyStore.currentCompany = mockCompanyStore.companies[0];

      render(<CompanySelector />);

      // Get the avatar fallback from the trigger button
      const trigger = screen.getByRole('combobox');
      const avatarFallback = trigger.querySelector('[data-testid="avatar-fallback"]');
      expect(avatarFallback).toHaveTextContent('S');
    });
  });

  describe('Lifecycle', () => {
    it('should fetch companies on mount', () => {
      render(<CompanySelector />);

      expect(mockCompanyStore.fetchCompanies).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch error', async () => {
      mockCompanyStore.fetchCompanies.mockRejectedValue(new Error('Network error'));

      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<CompanySelector />);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load companies');
      });

      consoleError.mockRestore();
    });

    it('should cleanup keyboard listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(<CompanySelector />);
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Avatar handling', () => {
    it('should show company logo when available', async () => {
      render(<CompanySelector />);

      // Since there are multiple avatar images, get the first one (in the trigger)
      const trigger = screen.getByRole('combobox');
      const avatarImage = trigger.querySelector('[data-testid="avatar-image"]');
      expect(avatarImage).toHaveAttribute('src', 'https://example.com/acme-logo.png');
      expect(avatarImage).toHaveAttribute('alt', 'Acme Corp');
    });

    it('should show initials when logo is not available', async () => {
      mockCompanyStore.currentCompany = mockCompanies[1]; // Beta Inc has no logo

      render(<CompanySelector />);

      // Since there are multiple avatars, we need to be more specific
      const trigger = screen.getByRole('combobox');
      const avatarFallback = trigger.querySelector('[data-testid="avatar-fallback"]');
      expect(avatarFallback).toHaveTextContent('BI');
    });
  });
});
