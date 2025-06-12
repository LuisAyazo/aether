// Script para verificar qué está devolviendo el backend
(function() {
  console.log('🔍 Verificando edges del backend...');
  
  // Función para interceptar las respuestas del backend
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Clonar la respuesta para poder leerla
    const clonedResponse = response.clone();
    
    try {
      // Si es una respuesta de diagrama
      if (args[0].includes('/diagrams/') && !args[0].includes('/diagrams') && response.ok) {
        const data = await clonedResponse.json();
        
        console.log('📡 RESPUESTA DEL BACKEND - Diagrama:', {
          nombre: data.name,
          nodos: data.nodes?.length,
          edges: data.edges?.length
        });
        
        if (data.edges && data.edges.length > 0) {
          console.log('🔗 EDGES DEL BACKEND:');
          data.edges.forEach((edge, index) => {
            console.log(`Edge ${index + 1}:`, {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              sourceHandle: edge.sourceHandle || '❌ NO DEFINIDO',
              targetHandle: edge.targetHandle || '❌ NO DEFINIDO',
              data: edge.data
            });
          });
          
          // Verificar si algún edge tiene handles
          const edgesWithHandles = data.edges.filter(e => e.sourceHandle || e.targetHandle);
          if (edgesWithHandles.length === 0) {
            console.error('⚠️ NINGÚN EDGE TIENE HANDLES DEFINIDOS EN LA RESPUESTA DEL BACKEND');
            console.log('📌 Esto significa que el backend NO está guardando o devolviendo los handles');
          }
        }
      }
    } catch (e) {
      // Ignorar errores de parsing
    }
    
    return response;
  };
  
  console.log('✅ Interceptor de fetch activado. Recarga el diagrama para ver los datos del backend.');
  
  // También verificar qué se envía al guardar
  window.debugSaveData = function() {
    const reactFlowWrapper = document.querySelector('.react-flow');
    if (reactFlowWrapper && reactFlowWrapper.__reactFlowInstance) {
      const instance = reactFlowWrapper.__reactFlowInstance;
      const edges = instance.getEdges();
      
      console.log('💾 DATOS QUE SE ENVIARÍAN AL GUARDAR:');
      edges.forEach((edge, index) => {
        console.log(`Edge ${index + 1} para guardar:`, {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || '❌ NO DEFINIDO',
          targetHandle: edge.targetHandle || '❌ NO DEFINIDO',
          data: edge.data
        });
      });
    }
  };
  
  console.log('📌 Comandos disponibles:');
  console.log('- Recarga la página para ver qué devuelve el backend');
  console.log('- debugSaveData() para ver qué se enviaría al guardar');
})();
