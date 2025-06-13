import { vi, beforeAll, afterAll, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import React from 'react';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
process.env.NEXT_PUBLIC_USE_BACKEND_AUTH = 'false';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;

// Mock fetch
global.fetch = vi.fn() as any;

// Create storage stores outside to allow resetting
let localStore: Record<string, string> = {};
let sessionStore: Record<string, string> = {};

// Mock localStorage with actual storage
const localStorageMock = {
  getItem: vi.fn((key: string) => localStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStore[key];
  }),
  clear: vi.fn(() => {
    localStore = {};
  }),
  key: vi.fn((index: number) => {
    const keys = Object.keys(localStore);
    return keys[index] || null;
  }),
  get length() {
    return Object.keys(localStore).length;
  },
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage with actual storage
const sessionStorageMock = {
  getItem: vi.fn((key: string) => sessionStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStore[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStore[key];
  }),
  clear: vi.fn(() => {
    sessionStore = {};
  }),
  key: vi.fn((index: number) => {
    const keys = Object.keys(sessionStore);
    return keys[index] || null;
  }),
  get length() {
    return Object.keys(sessionStore).length;
  },
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next/image
vi.mock('next/image', () => ({
  default: (props: any) => {
    return React.createElement('img', props);
  },
}));

// Mock reactflow
vi.mock('reactflow', () => ({
  ReactFlow: vi.fn(() => null),
  Controls: vi.fn(() => null),
  MiniMap: vi.fn(() => null),
  Background: vi.fn(() => null),
  BackgroundVariant: { Dots: 'dots', Lines: 'lines', Cross: 'cross' },
  useNodesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  useEdgesState: vi.fn(() => [[], vi.fn(), vi.fn()]),
  useReactFlow: vi.fn(() => ({
    getNodes: vi.fn(() => []),
    getEdges: vi.fn(() => []),
    setNodes: vi.fn(),
    setEdges: vi.fn(),
    addNodes: vi.fn(),
    addEdges: vi.fn(),
    deleteElements: vi.fn(),
    fitView: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    setCenter: vi.fn(),
    getIntersectingNodes: vi.fn(() => []),
  })),
  addEdge: vi.fn((edge) => edge),
  applyNodeChanges: vi.fn((changes, nodes) => nodes),
  applyEdgeChanges: vi.fn((changes, edges) => edges),
  MarkerType: {
    Arrow: 'arrow',
    ArrowClosed: 'arrowclosed',
  },
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
  Handle: vi.fn(() => null),
  EdgeLabelRenderer: vi.fn(({ children }) => children),
  BaseEdge: vi.fn(() => null),
  getBezierPath: vi.fn(() => ['M 0 0 L 100 100', 50, 50]),
  getStraightPath: vi.fn(() => ['M 0 0 L 100 100', 50, 50]),
  getSimpleBezierPath: vi.fn(() => ['M 0 0 L 100 100', 50, 50]),
  getSmoothStepPath: vi.fn(() => ['M 0 0 L 100 100', 50, 50]),
}));

// No longer needed - using relative imports instead of aliases

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Search: vi.fn(() => null),
  Check: vi.fn(() => null),
  ChevronDown: vi.fn(() => null),
  ChevronUp: vi.fn(() => null),
  ChevronsUpDown: vi.fn(() => null),
  X: vi.fn(() => null),
  Plus: vi.fn(() => null),
  Minus: vi.fn(() => null),
  Edit: vi.fn(() => null),
  Trash: vi.fn(() => null),
  Save: vi.fn(() => null),
  Copy: vi.fn(() => null),
  Download: vi.fn(() => null),
  Upload: vi.fn(() => null),
  Settings: vi.fn(() => null),
  User: vi.fn(() => null),
  LogOut: vi.fn(() => null),
  Menu: vi.fn(() => null),
  Home: vi.fn(() => null),
  Folder: vi.fn(() => null),
  File: vi.fn(() => null),
  FileText: vi.fn(() => null),
  Image: vi.fn(() => null),
  Video: vi.fn(() => null),
  Music: vi.fn(() => null),
  Archive: vi.fn(() => null),
  Loader2: vi.fn(() => null),
}));

// Mock cmdk
vi.mock('cmdk', () => {
  const Command = vi.fn(({ children, ...props }) => React.createElement('div', props, children));
  Command.displayName = 'Command';
  Command.Input = vi.fn(({ children, ...props }) => React.createElement('input', props, children));
  Command.Input.displayName = 'CommandInput';
  Command.List = vi.fn(({ children, ...props }) => React.createElement('div', props, children));
  Command.List.displayName = 'CommandList';
  Command.Empty = vi.fn(({ children, ...props }) => React.createElement('div', props, children));
  Command.Empty.displayName = 'CommandEmpty';
  Command.Group = vi.fn(({ children, ...props }) => React.createElement('div', props, children));
  Command.Group.displayName = 'CommandGroup';
  Command.Item = vi.fn(({ children, ...props }) => React.createElement('div', props, children));
  Command.Item.displayName = 'CommandItem';
  Command.Separator = vi.fn(() => React.createElement('hr'));
  Command.Separator.displayName = 'CommandSeparator';
  
  return {
    Command,
  };
});

// Mock @radix-ui components
vi.mock('@radix-ui/react-dialog', () => ({
  Root: vi.fn(({ children }) => children),
  Trigger: vi.fn(({ children }) => children),
  Portal: vi.fn(({ children }) => children),
  Overlay: vi.fn(({ children }) => children),
  Content: vi.fn(({ children }) => children),
  Title: vi.fn(({ children }) => children),
  Description: vi.fn(({ children }) => children),
  Close: vi.fn(({ children }) => children),
}));

vi.mock('@radix-ui/react-popover', () => ({
  Root: vi.fn(({ children }) => children),
  Trigger: vi.fn(({ children }) => children),
  Portal: vi.fn(({ children }) => children),
  Content: vi.fn(({ children }) => children),
}));

// Mock Supabase client
vi.mock('../app/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      refreshSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOAuth: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// Mock API client
vi.mock('../app/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock cache service
vi.mock('../app/services/cacheService', () => ({
  CACHE_KEYS: {
    DASHBOARD_DATA: 'dashboard_data',
    WORKSPACE_DATA: 'workspace_data',
    DIAGRAMS: 'diagrams',
    ENVIRONMENTS: vi.fn((companyId: string) => `environments_${companyId}`),
    COMPANIES: 'companies',
  },
  CACHE_TTL: {
    DASHBOARD: 5 * 60 * 1000, // 5 minutes
    DIAGRAMS: 10 * 60 * 1000, // 10 minutes
    ENVIRONMENTS: 15 * 60 * 1000, // 15 minutes
    COMPANIES: 30 * 60 * 1000, // 30 minutes
  },
  cacheService: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
  default: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
}));

// Import mock implementations
import * as authServiceMock from './mocks/authServiceMock';

// Mock auth service with implementations
vi.mock('../app/services/authService', () => authServiceMock);

// Mock dashboard service
vi.mock('../app/services/dashboardService', () => ({
  dashboardService: {
    getInitialDashboardData: vi.fn(),
    getWorkspaceData: vi.fn(),
  },
}));

// Mock company store
vi.mock('../app/stores/companyStore', () => ({
  useCompanyStore: vi.fn(),
}));

// Mock company service
vi.mock('../app/services/companyService', () => ({
  companyService: {
    getCompanies: vi.fn(),
    getCompany: vi.fn(),
    createCompany: vi.fn(),
    updateCompany: vi.fn(),
    deleteCompany: vi.fn(),
    selectCompany: vi.fn(),
    getCompanyMembers: vi.fn(),
    inviteMember: vi.fn(),
    removeMember: vi.fn(),
    updateMemberRole: vi.fn(),
  },
}));

// Mock diagram service
vi.mock('../app/services/diagramService', () => ({
  getEnvironments: vi.fn(),
  createEnvironment: vi.fn(),
  updateEnvironment: vi.fn(),
  deleteEnvironment: vi.fn(),
  getDiagramsByEnvironment: vi.fn(),
  getDiagram: vi.fn(),
  createDiagram: vi.fn(),
  updateDiagram: vi.fn(),
  deleteDiagram: vi.fn(),
  updateDiagramPaths: vi.fn(),
}));

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Warning: An invalid form control') ||
       args[0].includes('Warning: Failed prop type') ||
       args[0].includes('Warning: React does not recognize') ||
       args[0].includes('Warning: Unknown event handler property'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  // Clear the actual storage
  localStore = {};
  sessionStore = {};
  // Clear the mock calls
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});
