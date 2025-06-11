import { useEffect } from 'react';
import { useNavigationStore } from './useNavigationStore';

/**
 * Versión simplificada del hook para depuración
 */
export function useDashboardDataSimple() {
  const user = useNavigationStore(state => state.user);
  const dataLoading = useNavigationStore(state => state.dataLoading);
  const activeCompany = useNavigationStore(state => state.activeCompany);
  const fetchInitialUser = useNavigationStore(state => state.fetchInitialUser);

  useEffect(() => {
    console.log('[useDashboardDataSimple] Effect running', {
      hasUser: !!user,
      dataLoading,
      hasActiveCompany: !!activeCompany
    });
    
    // Llamar fetchInitialUser solo una vez
    fetchInitialUser();
  }, []); // Solo al montar

  return {
    user,
    dataLoading,
    activeCompany
  };
}
