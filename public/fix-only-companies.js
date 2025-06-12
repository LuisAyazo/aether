// Script para arreglar SOLO las compañías sin joder el resto
(async function() {
  console.log('=== FIXING ONLY COMPANIES - NO BULLSHIT ===');
  
  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('user');
  
  if (!token || !currentUser) {
    console.error('No token or user found');
    return;
  }
  
  try {
    // 1. Primero asegurar que el usuario tenga onboarding_completed
    console.log('1. Ensuring user has onboarding_completed...');
    const userObj = JSON.parse(currentUser);
    
    // Obtener datos actualizados del usuario desde el backend
    const meResponse = await fetch('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (meResponse.ok) {
      const meData = await meResponse.json();
      // Combinar datos existentes con los del backend
      const updatedUser = {
        ...userObj,
        ...meData,
        _id: userObj._id || userObj.id || meData.id,
        id: meData.id || userObj.id || userObj._id
      };
      
      // Guardar usuario actualizado
      localStorage.setItem('user', JSON.stringify(updatedUser));
      console.log('✅ User updated with backend data:', updatedUser);
    }
    
    // 2. Ahora obtener las compañías con role y memberCount
    console.log('2. Fetching companies with role and memberCount...');
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
    console.log('✅ Companies fetched:', companiesWithRoleAndCount);
    
    // 3. Guardar las compañías en sessionStorage para que se usen en el próximo refresh
    sessionStorage.setItem('updatedCompanies', JSON.stringify(companiesWithRoleAndCount));
    
    // 4. Intentar actualizar el store si está disponible
    if (window.useNavigationStore) {
      console.log('Found useNavigationStore directly!');
      const state = window.useNavigationStore.getState();
      window.useNavigationStore.setState({ 
        userCompanies: companiesWithRoleAndCount,
        activeCompany: companiesWithRoleAndCount[0] // Asegurar que haya una activa
      });
      console.log('✅ Store updated directly!');
    } else {
      console.log('⚠️ Store not directly accessible');
      console.log('The updated companies are saved in sessionStorage');
      console.log('They will be loaded on next page interaction');
    }
    
    // 5. Emitir evento para que los componentes se actualicen
    window.dispatchEvent(new CustomEvent('companiesUpdated', { 
      detail: { companies: companiesWithRoleAndCount } 
    }));
    
    console.log('✅ Done! Companies should now show role and memberCount');
    console.log('If you still don\'t see the changes, just navigate to another section and back');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
