'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from './services/authService'; // Asumiendo que authService está en ./services
import { Node } from 'reactflow';
import { NodeGroupData } from './components/nodes/NodeGroup';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getCurrentUser();
      if (user && user.usage_type === null) {
        // Si no ha completado el onboarding, enviarlo allí.
        router.replace('/onboarding/select-usage');
      } else if (user) { 
        // Si completó el onboarding (usage_type no es null),
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

  const filterGroupNodes = (nodes: Node[]): Node<NodeGroupData>[] => {
    // ... existing code ...
  };

  // Renderizar algo mínimo o null mientras la redirección ocurre,
  // o un loader si la verificación tomara tiempo (aquí es síncrona).
  return null; 
}
