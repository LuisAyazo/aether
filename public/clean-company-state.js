(function() {
  console.log('🧹 Company state cleaner script loaded');
  
  // Función para limpiar TODO lo relacionado con compañías
  function cleanCompanyState() {
    console.log('🔍 Cleaning all company-related state...');
    
    // Lista de todas las claves posibles relacionadas con compañías
    const keysToCheck = [
      'company-storage',
      'lastCompanyId', 
      'currentCompany',
      'selectedCompany',
      'activeCompany',
      'company_state',
      'previousUserId'
    ];
    
    // También buscar claves que contengan estos términos
    const patterns = [
      'company',
      'Company', 
      'workspace',
      'Workspace',
      'activeSection'
    ];
    
    const keysToRemove = new Set();
    
    // Agregar claves exactas
    keysToCheck.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        keysToRemove.add(key);
      }
    });
    
    // Buscar claves por patrones
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        for (const pattern of patterns) {
          if (key.includes(pattern)) {
            keysToRemove.add(key);
            break;
          }
        }
      }
    }
    
    // También limpiar sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        for (const pattern of patterns) {
          if (key.includes(pattern)) {
            keysToRemove.add(`session:${key}`);
            break;
          }
        }
      }
    }
    
    console.log('🗑️ Keys to remove:', Array.from(keysToRemove));
    
    // Remover de localStorage
    keysToRemove.forEach(key => {
      if (!key.startsWith('session:')) {
        localStorage.removeItem(key);
      }
    });
    
    // Remover de sessionStorage
    keysToRemove.forEach(key => {
      if (key.startsWith('session:')) {
        const actualKey = key.replace('session:', '');
        sessionStorage.removeItem(actualKey);
      }
    });
    
    // Forzar reset del store si está disponible
    if (window.__COMPANY_STORE_RESET__) {
      console.log('🔄 Calling store reset...');
      window.__COMPANY_STORE_RESET__();
    }
    
    console.log('✅ Company state cleaned');
  }
  
  // Limpiar inmediatamente
  cleanCompanyState();
  
  // Exponer función global para uso manual
  window.cleanCompanyState = cleanCompanyState;
  
  // También verificar cambios de usuario
  let lastUserId = null;
  
  function checkUser() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        const currentUserId = user._id || user.id;
        
        if (lastUserId && lastUserId !== currentUserId) {
          console.log('🚨 User change detected! Cleaning company state...');
          cleanCompanyState();
          // Forzar reload después de limpiar
          setTimeout(() => {
            window.location.reload();
          }, 100);
        }
        
        lastUserId = currentUserId;
      } catch (e) {
        console.error('Error checking user:', e);
      }
    }
  }
  
  // Verificar cada segundo
  setInterval(checkUser, 1000);
  
  // También al cambiar el storage
  window.addEventListener('storage', (e) => {
    if (e.key === 'user') {
      checkUser();
    }
  });
  
})();
