(function() {
  console.log('🚨 EMERGENCY FIX: Limpiando todo el estado...');
  
  // 1. Limpiar TODO localStorage
  console.log('🗑️ Limpiando localStorage...');
  localStorage.clear();
  
  // 2. Limpiar TODO sessionStorage
  console.log('🗑️ Limpiando sessionStorage...');
  sessionStorage.clear();
  
  // 3. Limpiar cookies
  console.log('🗑️ Limpiando cookies...');
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // 4. Limpiar IndexedDB
  console.log('🗑️ Limpiando IndexedDB...');
  if ('indexedDB' in window) {
    indexedDB.databases().then(databases => {
      databases.forEach(db => {
        indexedDB.deleteDatabase(db.name);
      });
    });
  }
  
  // 5. Resetear stores si existen
  console.log('🔄 Reseteando stores...');
  if (window.__COMPANY_STORE_RESET__) {
    window.__COMPANY_STORE_RESET__();
  }
  
  // 6. Mensaje final
  console.log('✅ Estado limpiado completamente');
  console.log('🔄 Recargando la página en 2 segundos...');
  
  // 7. Recargar después de un delay
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
  
})();
