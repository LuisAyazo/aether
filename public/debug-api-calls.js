// Debug script para rastrear llamadas a la API
(function() {
  console.log('🔍 API Call Debugger iniciado');
  
  // Interceptar fetch
  const originalFetch = window.fetch;
  let callCount = 0;
  const callMap = new Map();
  
  window.fetch = function(...args) {
    // Extraer la URL como string
    let urlString = '';
    if (typeof args[0] === 'string') {
      urlString = args[0];
    } else if (args[0] instanceof Request) {
      urlString = args[0].url;
    } else if (args[0] instanceof URL) {
      urlString = args[0].toString();
    }
    
    const stack = new Error().stack;
    
    // Solo rastrear llamadas a dashboard/initial-load
    if (urlString && urlString.includes('dashboard/initial-load')) {
      callCount++;
      const timestamp = new Date().toISOString();
      const callInfo = {
        url: urlString,
        timestamp,
        stack: stack.split('\n').slice(2, 10).join('\n'),
        callNumber: callCount
      };
      
      console.log(`🚨 API Call #${callCount} to dashboard/initial-load at ${timestamp}`);
      console.log('Stack trace:', callInfo.stack);
      
      // Guardar en el mapa para análisis
      callMap.set(callCount, callInfo);
      
      // Si hay más de 2 llamadas, es definitivamente un problema
      if (callCount > 2) {
        console.error('⚠️ MULTIPLE API CALLS DETECTED!');
        console.log('All calls:', Array.from(callMap.values()));
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Exponer función para ver el reporte
  window.apiCallReport = function() {
    console.log('📊 API Call Report:');
    console.log(`Total calls to dashboard/initial-load: ${callCount}`);
    console.log('Call details:', Array.from(callMap.values()));
  };
  
  // Auto-reporte después de 3 segundos
  setTimeout(() => {
    if (callCount > 0) {
      window.apiCallReport();
    }
  }, 3000);
})();
