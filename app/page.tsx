'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from './services/authService';
import { AuthDebugger, interceptRouter, checkAuthState } from './lib/auth-debug';

export default function HomePage() {
  const router = interceptRouter(useRouter());

  useEffect(() => {
    const checkAuth = async () => {
      AuthDebugger.log('HomePage', 'start', { pathname: window.location.pathname });
      
      // Verificar estado de autenticación completo
      const authState = await checkAuthState();
      // Check if there's a code parameter (email confirmation from Supabase)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        // Redirect to auth callback with the code
        AuthDebugger.log('HomePage', 'redirect-callback', { reason: 'has-code', code });
        router.replace(`/auth/callback?code=${code}`);
        return;
      }

      if (isAuthenticated()) {
        const user = getCurrentUser();
        AuthDebugger.log('HomePage', 'authenticated', {
          hasUser: !!user,
          userData: user ? {
            id: user._id,
            email: user.email,
            onboarding_completed: user.onboarding_completed,
            usage_type: user.usage_type
          } : null
        });
        
        if (user && (user.onboarding_completed !== true || user.usage_type === null)) {
          // Si no ha completado el onboarding (onboarding_completed no es true o usage_type es null), enviarlo allí.
          // Nota: Verificamos !== true para manejar casos donde onboarding_completed es null o false
          AuthDebugger.log('HomePage', 'redirect-onboarding', {
            reason: 'incomplete-onboarding',
            onboarding_completed: user.onboarding_completed,
            usage_type: user.usage_type
          });
          router.replace('/onboarding/select-usage');
        } else if (user) {
          // Si completó el onboarding, ir al dashboard
          // El dashboard se encargará de verificar si tiene compañías y redirigir si es necesario
          AuthDebugger.log('HomePage', 'redirect-dashboard', { reason: 'onboarding-complete' });
          router.replace('/dashboard');
        } else {
          // Caso raro: autenticado pero sin datos de usuario.
          AuthDebugger.log('HomePage', 'redirect-login', { reason: 'no-user-data' });
          router.replace('/login');
        }
      } else {
        // Usuario no autenticado, redirigir a login.
        AuthDebugger.log('HomePage', 'redirect-login', { reason: 'not-authenticated' });
        router.replace('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  // Renderizar algo mínimo o null mientras la redirección ocurre,
  // o un loader si la verificación tomara tiempo (aquí es síncrona).
  return null;
}
