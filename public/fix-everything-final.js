// Script final para arreglar TODO sin joder la sesión
(async function() {
  console.log('=== FINAL FIX - NO BULLSHIT ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found');
    return;
  }
  
  try {
    // 1. Obtener datos correctos del usuario desde el backend
    console.log('1. Getting correct user data from backend...');
    const userResponse = await fetch('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const backendUserData = await userResponse.json();
    console.log('✅ Backend user data:', backendUserData);
    
    // 2. Actualizar el usuario en localStorage con los datos correctos del backend
    const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = {
      ...existingUser,
      ...backendUserData,
      _id: existingUser._id || existingUser.id || backendUserData.id,
      id: backendUserData.id || existingUser.id || existingUser._id,
      onboarding_completed: backendUserData.onboarding_completed // IMPORTANTE: usar el valor del backend
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('✅ User updated in localStorage with onboarding_completed:', updatedUser.onboarding_completed);
    
    // 3. Obtener las compañías con role y memberCount
    console.log('2. Getting companies with role and memberCount...');
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
    console.log('✅ Companies with role and memberCount:', companiesWithRoleAndCount);
    
    // 4. Guardar en sessionStorage para uso posterior
    sessionStorage.setItem('companiesWithRoleAndCount', JSON.stringify(companiesWithRoleAndCount));
    
    console.log('\n✅ EVERYTHING FIXED!');
    console.log('- User has onboarding_completed:', updatedUser.onboarding_completed);
    console.log('- Companies have role and memberCount');
    console.log('\n👉 Now just refresh the page manually (F5) or navigate to another section');
    console.log('The onboarding redirect should NOT happen anymore!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
