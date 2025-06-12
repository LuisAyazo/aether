// Script final para arreglar los datos de las compañías
(async function() {
  console.log('=== FIXING COMPANIES - FINAL VERSION ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('No token found');
    return;
  }
  
  try {
    // 1. Obtener las compañías con role y memberCount
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
    console.log('✅ Companies fetched:', companiesWithRoleAndCount);
    
    // 2. Intentar múltiples formas de acceder al store
    console.log('2. Accessing navigation store...');
    
    // Método 1: Zustand DevTools
    let navStore = null;
    if (window.__ZUSTAND_DEVTOOLS_EXTENSION__?.connection?.stores) {
      navStore = window.__ZUSTAND_DEVTOOLS_EXTENSION__.connection.stores.get('useNavigationStore');
    }
    
    // Método 2: Buscar en window
    if (!navStore) {
      // Buscar todas las propiedades de window que puedan contener el store
      for (const key in window) {
        if (key.includes('zustand') || key.includes('store') || key.includes('navigation')) {
          console.log('Found potential store key:', key);
        }
      }
    }
    
    // Método 3: Acceso directo a React Fiber (más complejo pero funcional)
    if (!navStore) {
      console.log('Trying React Fiber method...');
      const reactRoot = document.getElementById('__next') || document.getElementById('root');
      if (reactRoot && reactRoot._reactRootContainer) {
        console.log('Found React root');
      }
    }
    
    // Si encontramos el store, actualizar
    if (navStore) {
      const currentState = navStore.getState();
      console.log('Current state:', currentState);
      
      // Actualizar compañías
      navStore.setState({ userCompanies: companiesWithRoleAndCount });
      
      // Actualizar compañía activa
      if (currentState.activeCompany) {
        const activeCompanyId = currentState.activeCompany._id || currentState.activeCompany.id;
        const updatedActiveCompany = companiesWithRoleAndCount.find(
          c => c._id === activeCompanyId || c.id === activeCompanyId
        );
        
        if (updatedActiveCompany) {
          navStore.setState({ activeCompany: updatedActiveCompany });
        }
      }
      
      console.log('✅ Store updated successfully!');
    } else {
      console.warn('⚠️ Could not access navigation store directly');
      console.log('Alternative solution: Forcing a reload with cache cleared...');
      
      // Limpiar todo el caché relacionado
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('dashboard') || key.includes('cache') || key.includes('company'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Removed: ${key}`);
      });
      
      // Guardar las compañías actualizadas temporalmente
      sessionStorage.setItem('companiesWithRoleAndCount', JSON.stringify(companiesWithRoleAndCount));
      
      console.log('✅ Cache cleared and companies saved to sessionStorage');
      console.log('🔄 Reloading page to apply changes...');
      
      setTimeout(() => {
        location.reload();
      }, 1000);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    
    // Plan B: Inyectar un script en el contexto de la página
    console.log('Trying Plan B: Script injection...');
    
    const scriptContent = `
      // Buscar el store en el contexto de React
      const checkStores = () => {
        const stores = window.__ZUSTAND_DEVTOOLS_EXTENSION__?.connection?.stores;
        if (stores) {
          const navStore = stores.get('useNavigationStore');
          if (navStore) {
            console.log('Found store via injected script!');
            // Los datos están en sessionStorage
            const companiesData = sessionStorage.getItem('companiesWithRoleAndCount');
            if (companiesData) {
              const companies = JSON.parse(companiesData);
              navStore.setState({ userCompanies: companies });
              console.log('Store updated via injected script!');
              sessionStorage.removeItem('companiesWithRoleAndCount');
            }
          }
        }
      };
      
      // Intentar varias veces
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        checkStores();
        if (attempts > 10) {
          clearInterval(interval);
        }
      }, 500);
    `;
    
    const script = document.createElement('script');
    script.textContent = scriptContent;
    document.head.appendChild(script);
  }
})();
