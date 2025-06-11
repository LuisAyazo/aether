import { logoutUser } from '@/app/services/authService';

/**
 * Global API interceptor to handle common error scenarios
 */
export class ApiInterceptor {
  private static instance: ApiInterceptor;
  private originalFetch: typeof fetch;

  private constructor() {
    this.originalFetch = window.fetch.bind(window);
    this.setupInterceptor();
  }

  static getInstance(): ApiInterceptor {
    if (!ApiInterceptor.instance) {
      ApiInterceptor.instance = new ApiInterceptor();
    }
    return ApiInterceptor.instance;
  }

  private setupInterceptor() {
    // Override global fetch
    window.fetch = async (...args: Parameters<typeof fetch>): Promise<Response> => {
      try {
        const response = await this.originalFetch(...args);
        
        // Check for 401 Unauthorized
        if (response.status === 401) {
          console.error('[ApiInterceptor] 401 Unauthorized detected, logging out...');
          
          // Get the URL for better logging
          let url = '';
          if (typeof args[0] === 'string') {
            url = args[0];
          } else if (args[0] instanceof Request) {
            url = args[0].url;
          } else if (args[0] instanceof URL) {
            url = args[0].toString();
          }
          console.error('[ApiInterceptor] Failed URL:', url);
          
          // Trigger logout which will redirect to login
          await logoutUser();
          
          // Return the response anyway (logoutUser will redirect)
          return response;
        }
        
        return response;
      } catch (error) {
        // Re-throw network errors
        throw error;
      }
    };
  }

  // Method to restore original fetch if needed
  restore() {
    window.fetch = this.originalFetch;
  }
}

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  ApiInterceptor.getInstance();
}
