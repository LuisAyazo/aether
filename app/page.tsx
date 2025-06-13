'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from './services/authService';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if there's a code parameter (email confirmation from Supabase)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Redirect to auth callback with the code
      router.replace(`/auth/callback?code=${code}`);
      return;
    }

    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user && (user.onboarding_completed !== true || user.usage_type === null)) {
        // Si no ha completado el onboarding (onboarding_completed no es true o usage_type es null), enviarlo allí.
        // Nota: Verificamos !== true para manejar casos donde onboarding_completed es null o false
        router.replace('/onboarding/select-usage');
      } else if (user) {
        // Si completó el onboarding (onboarding_completed es true y usage_type no es null),
        // enviarlo a crear una compañía. Desde allí puede navegar al dashboard si ya tiene una.
        // Esto cumple con "no enviarme al dashboard si no tengo compañía".
        router.replace('/create-company');
      } else {
        // Caso raro: autenticado pero sin datos de usuario.
        router.replace('/login');
      }
    } else {
      // Usuario no autenticado, redirigir a login.
      router.replace('/login');
    }
  }, [router]);

  // Renderizar algo mínimo o null mientras la redirección ocurre,
  // o un loader si la verificación tomara tiempo (aquí es síncrona).
  return null;
}
