// Script para sincronizar el usuario correctamente
(async function() {
  console.log('=== FIXING USER SYNC ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found');
    return;
  }
  
  try {
    // 1. Obtener datos actualizados del usuario
    console.log('1. Fetching updated user data...');
    const userResponse = await fetch('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await userResponse.json();
    console.log('User data from backend:', userData);
    
    // 2. Actualizar localStorage con la estructura correcta
    const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = {
      ...existingUser,
      ...userData,
      _id: existingUser._id || userData.id, // Mantener _id para compatibilidad
      id: userData.id || existingUser.id
    };
    
    console.log('2. Updating localStorage...');
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // 3. Actualizar el store si está disponible
    const stores = window.__ZUSTAND_DEVTOOLS_EXTENSION__?.connection?.stores;
    if (stores) {
      const navStore = stores.get('useNavigationStore');
      if (navStore) {
        console.log('3. Updating navigation store...');
        navStore.setState({ user: updatedUser });
        
        // Forzar recarga de datos
        const state = navStore.getState();
        if (state.fetchInitialUser) {
          console.log('4. Triggering fetchInitialUser...');
          await state.fetchInitialUser();
        }
      }
    }
    
    console.log('✅ User sync completed!');
    console.log('Updated user:', updatedUser);
    
    // 4. Verificar si necesita reload
    if (updatedUser.onboarding_completed && window.location.pathname.includes('onboarding')) {
      console.log('5. Redirecting to dashboard...');
      window.location.href = '/dashboard';
    }
    
  } catch (error) {
    console.error('Error syncing user:', error);
  }
})();
