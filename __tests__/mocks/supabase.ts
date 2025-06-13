import { vi } from 'vitest';

export const mockSupabaseUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {
    provider: 'email'
  },
  user_metadata: {
    name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const mockSupabaseSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  token_type: 'bearer',
  expires_in: 3600,
  user: mockSupabaseUser
};

// Export the mock client from the setup file
// This ensures consistency across all tests
import { supabase } from "../../app/lib/supabase";
export const mockSupabaseClient = supabase;
