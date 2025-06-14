export interface TestUser {
  email: string;
  password: string;
  name: string;
  type: 'new' | 'existing' | 'invited' | 'admin';
  companyName?: string;
  onboardingCompleted?: boolean;
  firstCompanyCreated?: boolean;
}

// Test users for different scenarios
export const testUsers: Record<string, TestUser> = {
  // New user - needs full onboarding
  newUser: {
    email: 'newuser@test.infraux.com',
    password: 'TestPassword123!',
    name: 'New Test User',
    type: 'new',
    onboardingCompleted: false,
    firstCompanyCreated: false
  },
  
  // Existing user with company
  existingUser: {
    email: 'existing@test.infraux.com',
    password: 'TestPassword123!',
    name: 'Existing User',
    type: 'existing',
    companyName: 'Test Company',
    onboardingCompleted: true,
    firstCompanyCreated: true
  },
  
  // Invited user (member of a company but didn't create it)
  invitedUser: {
    email: 'invited@test.infraux.com',
    password: 'TestPassword123!',
    name: 'Invited User',
    type: 'invited',
    companyName: 'Shared Company',
    onboardingCompleted: false,
    firstCompanyCreated: false
  },
  
  // Admin user
  adminUser: {
    email: 'admin@test.infraux.com',
    password: 'AdminPassword123!',
    name: 'Admin User',
    type: 'admin',
    companyName: 'Admin Company',
    onboardingCompleted: true,
    firstCompanyCreated: true
  }
};

// Invalid credentials for error testing
export const invalidCredentials = {
  wrongEmail: {
    email: 'nonexistent@test.infraux.com',
    password: 'AnyPassword123!'
  },
  wrongPassword: {
    email: testUsers.existingUser.email,
    password: 'WrongPassword123!'
  },
  invalidEmailFormat: {
    email: 'invalid-email-format',
    password: 'TestPassword123!'
  },
  emptyFields: {
    email: '',
    password: ''
  }
};

// OAuth test data
export const oauthTestData = {
  google: {
    email: 'google.user@test.infraux.com',
    name: 'Google Test User',
    provider: 'google'
  },
  github: {
    email: 'github.user@test.infraux.com',
    name: 'GitHub Test User',
    provider: 'github'
  }
};

// URL parameters for different scenarios
export const urlParams = {
  registered: { registered: 'true' },
  confirmed: { confirmed: 'true' },
  sessionExpired: { session_expired: 'true' },
  authError: { error: 'auth_failed' },
  unexpectedError: { error: 'unexpected' }
};