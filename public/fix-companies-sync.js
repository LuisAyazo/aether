// Script para sincronizar las compañías con role y memberCount
(async function() {
  console.log('=== FIXING COMPANIES SYNC ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found');
    return;
  }
  
  try {
    // 1. Obtener compañías actualizadas
    console.log('1. Fetching companies with role and memberCount...');
    const response = await fetch('/api/v1/companies', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch companies');
    }
    
    const data = await response.json();
    console.log('Companies from backend:', data.companies);
    
    // 2. Actualizar el store
    const stores = window.__ZUSTAND_DEVTOOLS_EXTENSION__?.connection?.stores;
    if (stores) {
      const navStore = stores.get('useNavigationStore');
      if (navStore) {
        const state = navStore.getState();
        console.log('2. Current state:', {
          userCompanies: state.userCompanies,
          activeCompany: state.activeCompany
        });
        
        // Actualizar userCompanies
        console.log('3. Updating userCompanies in store...');
        navStore.setState({ userCompanies: data.companies });
        
        // Si hay una compañía activa, actualizarla también
        if (state.activeCompany) {
          const updatedActiveCompany = data.companies.find(
            c => c.id === state.activeCompany.id || c._id === state.activeCompany._id
          );
          
          if (updatedActiveCompany) {
            console.log('4. Updating activeCompany with role and memberCount...');
            navStore.setState({ activeCompany: updatedActiveCompany });
          }
        }
        
        // Verificar el estado actualizado
        const newState = navStore.getState();
        console.log('5. Updated state:', {
          userCompanies: newState.userCompanies,
          activeCompany: newState.activeCompany
        });
        
        // Forzar re-render
        console.log('6. Triggering re-render...');
        window.dispatchEvent(new Event('companiesUpdated'));
      }
    }
    
    console.log('✅ Companies sync completed!');
    console.log('You should now see:');
    console.log('- Your role badge in the sidebar');
    console.log('- Member count in the company selector');
    
  } catch (error) {
    console.error('Error syncing companies:', error);
  }
})();
