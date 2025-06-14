// Debug helper para rastrear el flujo de autenticación
export class AuthDebugger {
  private static logs: Array<{
    timestamp: string;
    component: string;
    action: string;
    data: any;
    stack?: string;
  }> = [];

  static log(component: string, action: string, data: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      component,
      action,
      data,
      stack: new Error().stack?.split('\n').slice(2, 4).join('\n')
    };
    
    this.logs.push(entry);
    
    // Mantener solo los últimos 50 logs
    if (this.logs.length > 50) {
      this.logs.shift();
    }
    
    // Log en consola con formato especial
    console.log(
      `%c[AUTH-DEBUG] ${component}%c ${action}`,
      'color: #ff6b6b; font-weight: bold',
      'color: #4ecdc4',
      data
    );
  }

  static getLogs() {
    return this.logs;
  }

  static clear() {
    this.logs = [];
  }

  static printSummary() {
    console.group('🔍 Auth Flow Summary');
    this.logs.forEach((log, index) => {
      console.log(
        `${index + 1}. [${log.timestamp.split('T')[1].split('.')[0]}] ${log.component} → ${log.action}`,
        log.data
      );
    });
    console.groupEnd();
  }

  static findRedirectToLogin() {
    return this.logs.filter(log => 
      log.action.includes('redirect') && 
      (log.data?.path === '/login' || log.data?.url?.includes('/login'))
    );
  }
}

// Interceptar router.push y router.replace
export function interceptRouter(router: any) {
  const originalPush = router.push.bind(router);
  const originalReplace = router.replace.bind(router);

  router.push = function(path: string, ...args: any[]) {
    AuthDebugger.log('Router', 'push', { path, from: window.location.pathname });
    
    // Si es redirect a login, mostrar el stack trace
    if (path === '/login' || path.startsWith('/login?')) {
      console.error('🚨 Redirect to login detected!');
      console.trace();
      AuthDebugger.printSummary();
    }
    
    return originalPush(path, ...args);
  };

  router.replace = function(path: string, ...args: any[]) {
    AuthDebugger.log('Router', 'replace', { path, from: window.location.pathname });
    
    // Si es redirect a login, mostrar el stack trace
    if (path === '/login' || path.startsWith('/login?')) {
      console.error('🚨 Redirect to login detected!');
      console.trace();
      AuthDebugger.printSummary();
    }
    
    return originalReplace(path, ...args);
  };

  return router;
}

// Helper para verificar el estado de autenticación
export async function checkAuthState() {
  const { supabase } = await import('./supabase');
  const { getCurrentUser } = await import('../services/authService');
  
  const localUser = getCurrentUser();
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user: supabaseUser } } = await supabase.auth.getUser();
  
  const state = {
    hasLocalUser: !!localUser,
    localUserData: localUser ? {
      id: localUser._id,
      email: localUser.email,
      onboarding_completed: localUser.onboarding_completed,
      usage_type: localUser.usage_type
    } : null,
    hasSession: !!session,
    sessionUserId: session?.user?.id,
    hasSupabaseUser: !!supabaseUser,
    supabaseUserId: supabaseUser?.id,
    localStorage: {
      user: !!localStorage.getItem('user'),
      token: !!localStorage.getItem('token')
    }
  };
  
  AuthDebugger.log('AuthState', 'check', state);
  
  return state;
}