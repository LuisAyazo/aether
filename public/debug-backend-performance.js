// Script para analizar el rendimiento del backend
(function() {
  console.log('🔍 Analizador de Rendimiento del Backend iniciado');
  
  // Contador de llamadas HTTP
  const httpCalls = {
    total: 0,
    byEndpoint: {},
    duplicates: {},
    startTime: Date.now()
  };
  
  // Interceptar fetch
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    const method = args[1]?.method || 'GET';
    
    // Incrementar contadores
    httpCalls.total++;
    const endpoint = url.split('?')[0]; // Sin query params
    const key = `${method} ${endpoint}`;
    
    if (!httpCalls.byEndpoint[key]) {
      httpCalls.byEndpoint[key] = 0;
    }
    httpCalls.byEndpoint[key]++;
    
    // Detectar duplicados
    if (httpCalls.byEndpoint[key] > 1) {
      if (!httpCalls.duplicates[key]) {
        httpCalls.duplicates[key] = 1;
      }
      httpCalls.duplicates[key]++;
    }
    
    // Log en tiempo real
    console.log(`📡 ${method} ${endpoint} (llamada #${httpCalls.byEndpoint[key]})`);
    
    // Ejecutar la llamada original
    const startTime = Date.now();
    const response = await originalFetch.apply(this, args);
    const duration = Date.now() - startTime;
    
    // Log de duración
    if (duration > 100) {
      console.warn(`⚠️ Llamada lenta: ${key} tomó ${duration}ms`);
    }
    
    return response;
  };
  
  // Función para mostrar reporte
  window.performanceReport = function() {
    const totalTime = Date.now() - httpCalls.startTime;
    console.clear();
    console.log('📊 === REPORTE DE RENDIMIENTO ===');
    console.log(`⏱️ Tiempo total: ${totalTime}ms`);
    console.log(`📡 Total de llamadas HTTP: ${httpCalls.total}`);
    
    console.log('\n🔗 Llamadas por endpoint:');
    Object.entries(httpCalls.byEndpoint)
      .sort((a, b) => b[1] - a[1])
      .forEach(([endpoint, count]) => {
        const icon = count > 1 ? '⚠️' : '✅';
        console.log(`${icon} ${endpoint}: ${count} llamada${count > 1 ? 's' : ''}`);
      });
    
    const duplicateCount = Object.keys(httpCalls.duplicates).length;
    if (duplicateCount > 0) {
      console.log('\n❌ LLAMADAS DUPLICADAS DETECTADAS:');
      Object.entries(httpCalls.duplicates).forEach(([endpoint, count]) => {
        console.log(`- ${endpoint}: repetida ${count} veces adicionales`);
      });
      
      console.log('\n💡 OPTIMIZACIONES SUGERIDAS:');
      console.log('1. Implementar caché de autenticación en el backend');
      console.log('2. Usar un middleware para evitar verificaciones repetidas');
      console.log('3. Combinar múltiples queries en una sola llamada');
      console.log('4. Implementar GraphQL o endpoints compuestos');
    }
    
    return httpCalls;
  };
  
  // Función para resetear contadores
  window.resetPerformanceTracking = function() {
    httpCalls.total = 0;
    httpCalls.byEndpoint = {};
    httpCalls.duplicates = {};
    httpCalls.startTime = Date.now();
    console.log('✅ Contadores de rendimiento reseteados');
  };
  
  // Monitorear cambios de ruta
  let currentPath = window.location.pathname;
  setInterval(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      console.log(`📍 Navegación detectada: ${currentPath}`);
      console.log(`📊 Llamadas HTTP hasta ahora: ${httpCalls.total}`);
    }
  }, 1000);
  
  console.log('✅ Monitoreo de rendimiento activado');
  console.log('📌 Comandos disponibles:');
  console.log('- performanceReport() - Ver reporte completo');
  console.log('- resetPerformanceTracking() - Resetear contadores');
  
  // Auto-reporte cada 30 segundos
  setInterval(() => {
    if (httpCalls.total > 0) {
      console.log(`\n📊 Auto-reporte: ${httpCalls.total} llamadas HTTP en ${Math.round((Date.now() - httpCalls.startTime) / 1000)}s`);
    }
  }, 30000);
})();
