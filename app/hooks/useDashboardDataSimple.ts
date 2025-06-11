import { useEffect, useRef } from 'react';
import { useNavigationStore } from './useNavigationStore';
import { usePathname } from 'next/navigation';

// Flag global para prevenir múltiples inicializaciones
declare global {
  interface Window {
    __dashboardInitialized?: boolean;
    __dashboardInitializing?: boolean;
    __dashboardInitPath?: string;
  }
}

/**
 * Versión simplificada del hook para depuración
 */
export function useDashboardDataSimple() {
  const user = useNavigationStore(state => state.user);
  const dataLoading = useNavigationStore(state => state.dataLoading);
  const activeCompany = useNavigationStore(state => state.activeCompany);
  const fetchInitialUser = useNavigationStore(state => state.fetchInitialUser);
  const pathname = usePathname();
  
  // Usar ref local para este componente
  const hasInitialized = useRef(false);
  const lastPathname = useRef(pathname);

  useEffect(() => {
    // Si cambió la ruta (sin contar parámetros), resetear los flags
    if (lastPathname.current !== pathname) {
      console.log('[useDashboardDataSimple] Ruta cambió, reseteando flags', {
        from: lastPathname.current,
        to: pathname
      });
      window.__dashboardInitialized = false;
      window.__dashboardInitializing = false;
      hasInitialized.current = false;
      lastPathname.current = pathname;
    }

    console.log('[useDashboardDataSimple] Effect running', {
      hasUser: !!user,
      dataLoading,
      hasActiveCompany: !!activeCompany,
      hasInitialized: hasInitialized.current,
      windowInitialized: window.__dashboardInitialized,
      windowInitializing: window.__dashboardInitializing,
      pathname,
      timestamp: new Date().toISOString()
    });
    
    // Si ya tenemos datos completos, marcar como inicializado
    if (user && activeCompany && !window.__dashboardInitialized) {
      console.log('[useDashboardDataSimple] Datos completos detectados, marcando como inicializado');
      window.__dashboardInitialized = true;
      window.__dashboardInitializing = false;
      return;
    }
    
    // Prevenir múltiples inicializaciones usando window flags
    if (window.__dashboardInitialized || window.__dashboardInitializing) {
      console.log('[useDashboardDataSimple] Dashboard ya inicializado o inicializándose, saltando');
      return;
    }
    
    if (!hasInitialized.current && pathname === '/dashboard') {
      hasInitialized.current = true;
      window.__dashboardInitializing = true;
      window.__dashboardInitPath = pathname;
      
      console.log('[useDashboardDataSimple] Iniciando fetchInitialUser (única vez)');
      fetchInitialUser();
    }
    
    // Cleanup
    return () => {
      console.log('[useDashboardDataSimple] Componente desmontándose');
    };
  }, [pathname, user, activeCompany, fetchInitialUser]); // Agregar dependencias necesarias

  return {
    user,
    dataLoading,
    activeCompany
  };
}
