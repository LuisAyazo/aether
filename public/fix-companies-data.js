// Script definitivo para arreglar los datos de las compañías
(async function() {
  console.log('=== FIXING COMPANIES DATA ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found');
    return;
  }
  
  try {
    // 1. Obtener las compañías del endpoint correcto que sí incluye role y memberCount
    console.log('1. Fetching companies from /api/v1/companies...');
    const companiesResponse = await fetch('/api/v1/companies', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!companiesResponse.ok) {
      throw new Error('Failed to fetch companies');
    }
    
    const companiesData = await companiesResponse.json();
    const companiesWithRoleAndCount = companiesData.companies;
    console.log('Companies with role and memberCount:', companiesWithRoleAndCount);
    
    // 2. Obtener el navigation store
    const stores = window.__ZUSTAND_DEVTOOLS_EXTENSION__?.connection?.stores;
    if (!stores) {
      console.error('No Zustand stores found');
      return;
    }
    
    const navStore = stores.get('useNavigationStore');
    if (!navStore) {
      console.error('Navigation store not found');
      return;
    }
    
    const currentState = navStore.getState();
    console.log('2. Current navigation store state:', {
      userCompanies: currentState.userCompanies,
      activeCompany: currentState.activeCompany
    });
    
    // 3. Actualizar las compañías con los datos correctos
    console.log('3. Updating userCompanies with role and memberCount...');
    navStore.setState({ userCompanies: companiesWithRoleAndCount });
    
    // 4. Si hay una compañía activa, actualizarla con los datos completos
    if (currentState.activeCompany) {
      const activeCompanyId = currentState.activeCompany._id || currentState.activeCompany.id;
      const updatedActiveCompany = companiesWithRoleAndCount.find(
        c => c._id === activeCompanyId || c.id === activeCompanyId
      );
      
      if (updatedActiveCompany) {
        console.log('4. Updating activeCompany with complete data:', updatedActiveCompany);
        navStore.setState({ activeCompany: updatedActiveCompany });
      }
    }
    
    // 5. Verificar el estado final
    const finalState = navStore.getState();
    console.log('5. Final state:', {
      userCompanies: finalState.userCompanies,
      activeCompany: finalState.activeCompany,
      activeCompanyRole: finalState.activeCompany?.role,
      activeCompanyMemberCount: finalState.activeCompany?.memberCount
    });
    
    // 6. Limpiar caché del dashboard para futuras cargas
    console.log('6. Clearing dashboard cache...');
    const cacheKeys = Object.keys(localStorage).filter(key => key.includes('dashboard'));
    cacheKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed cache: ${key}`);
    });
    
    console.log('✅ Companies data fixed successfully!');
    console.log('You should now see:');
    console.log('- Role badge showing "Propietario" in the sidebar');
    console.log('- "3 miembros" in the company selector');
    
    // 7. Opcional: Recargar la página para asegurar que todo se actualice
    const shouldReload = confirm('¿Deseas recargar la página para aplicar todos los cambios?');
    if (shouldReload) {
      location.reload();
    }
    
  } catch (error) {
    console.error('Error fixing companies data:', error);
  }
})();
