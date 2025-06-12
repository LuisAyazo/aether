import { useEffect, useRef } from 'react';
import { useNavigationStore } from './useNavigationStore';

/**
 * Hook personalizado para manejar la carga inicial del dashboard
 * Usa un approach más simple para prevenir múltiples llamadas
 */
export function useDashboardData() {
  const isInitialized = useRef(false);
  const user = useNavigationStore(state => state.user);
  const dataLoading = useNavigationStore(state => state.dataLoading);
  const activeCompany = useNavigationStore(state => state.activeCompany);
  const fetchInitialUser = useNavigationStore(state => state.fetchInitialUser);

  useEffect(() => {
    // Solo ejecutar si no se ha inicializado y no hay una compañía activa
    if (!isInitialized.current && !activeCompany) {
      isInitialized.current = true;
      console.log('[useDashboardData] Initializing dashboard...');
      fetchInitialUser();
    }
  }, [activeCompany, fetchInitialUser]);

  return {
    user,
    dataLoading,
    activeCompany
  };
}
