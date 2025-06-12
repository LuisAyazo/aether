// Script para escapar del estado "Cargando..." SIN tocar localStorage
(function() {
  console.log('=== ESCAPE LOADING - NO localStorage ===');
  
  // Solo verificar que tengamos un token
  const hasToken = !!localStorage.getItem('token');
  
  if (!hasToken) {
    console.error('No token! Going to login...');
    window.location.href = '/login';
    return;
  }
  
  console.log('Token exists, forcing navigation...');
  
  // Navegar directamente - el código ya no verifica onboarding desde localStorage
  const currentPath = window.location.pathname;
  console.log('Current path:', currentPath);
  
  if (currentPath === '/dashboard') {
    // Si ya estamos en dashboard, navegar a otra ruta y volver
    console.log('Already on dashboard, navigating away and back...');
    window.location.href = '/dashboard?section=settings';
  } else {
    // Ir al dashboard
    console.log('Going to dashboard...');
    window.location.href = '/dashboard';
  }
})();
