// Script de emergencia para forzar la carga
(async function() {
  console.log('=== FORCE LOAD - EMERGENCY FIX ===');
  
  // 1. Verificar qué hay en localStorage
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  console.log('Current localStorage state:');
  console.log('- Token exists:', !!token);
  console.log('- User:', user ? JSON.parse(user) : null);
  
  if (!token) {
    console.error('NO TOKEN! Redirecting to login...');
    window.location.href = '/login';
    return;
  }
  
  // 2. Si el usuario no tiene onboarding_completed, agregarlo
  if (user) {
    const userObj = JSON.parse(user);
    if (!userObj.hasOwnProperty('onboarding_completed')) {
      console.log('Adding onboarding_completed: true to user');
      userObj.onboarding_completed = true;
      localStorage.setItem('user', JSON.stringify(userObj));
    }
  }
  
  // 3. Verificar el pathname actual
  const currentPath = window.location.pathname;
  console.log('Current path:', currentPath);
  
  // 4. Si estamos en una ruta protegida, navegar al dashboard
  if (currentPath !== '/dashboard') {
    console.log('Navigating to dashboard...');
    window.location.href = '/dashboard';
  } else {
    // 5. Si ya estamos en dashboard pero está cargando, forzar reload
    console.log('Already on dashboard, forcing reload...');
    window.location.reload();
  }
})();
