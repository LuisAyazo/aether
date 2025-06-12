// Debug script para verificar el estado del usuario
(function() {
  console.log('=== DEBUG USER STATE ===');
  
  // 1. Verificar localStorage
  console.log('1. LocalStorage:');
  console.log('- Token:', localStorage.getItem('token') ? 'Presente' : 'No encontrado');
  console.log('- User:', localStorage.getItem('user'));
  
  // 2. Verificar el store de navegación
  const stores = window.__ZUSTAND_DEVTOOLS_EXTENSION__?.connection?.stores;
  if (stores) {
    const navStore = stores.get('useNavigationStore')?.getState();
    console.log('\n2. Navigation Store:');
    console.log('- User:', navStore?.user);
    console.log('- User companies:', navStore?.userCompanies);
    console.log('- Active company:', navStore?.activeCompany);
  }
  
  // 3. Hacer llamada a /auth/me para verificar datos del backend
  const token = localStorage.getItem('token');
  if (token) {
    console.log('\n3. Fetching /auth/me...');
    fetch('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(r => r.json())
    .then(data => {
      console.log('Backend user data:', data);
      console.log('- onboarding_completed:', data.onboarding_completed);
      console.log('- usage_type:', data.usage_type);
    })
    .catch(err => console.error('Error fetching /auth/me:', err));
  }
  
  // 4. Verificar companies con role y memberCount
  if (token) {
    console.log('\n4. Fetching /companies...');
    fetch('/api/v1/companies', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(r => r.json())
    .then(data => {
      console.log('Companies response:', data);
      if (data.companies) {
        data.companies.forEach((c, i) => {
          console.log(`Company ${i}:`, {
            name: c.name,
            role: c.role,
            memberCount: c.memberCount
          });
        });
      }
    })
    .catch(err => console.error('Error fetching companies:', err));
  }
})();
