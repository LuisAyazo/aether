// Script de debug para analizar problemas con edges y handles
(function() {
  console.log('🔍 Debug Edges & Handles - Script iniciado');
  
  // Función para obtener todos los edges
  function getAllEdges() {
    const reactFlowInstance = document.querySelector('.react-flow')?.reactFlowInstance;
    if (reactFlowInstance) {
      return reactFlowInstance.getEdges();
    }
    // Fallback: buscar en el DOM
    const edges = document.querySelectorAll('.react-flow__edge');
    return Array.from(edges).map(edge => ({
      id: edge.getAttribute('data-testid')?.replace('rf__edge-', ''),
      element: edge
    }));
  }
  
  // Función para obtener todos los handles
  function getAllHandles() {
    const handles = document.querySelectorAll('.react-flow__handle');
    return Array.from(handles).map(handle => ({
      id: handle.getAttribute('data-id'),
      nodeId: handle.getAttribute('data-nodeid'),
      handleId: handle.getAttribute('data-handleid'),
      position: handle.getAttribute('data-handlepos'),
      type: handle.classList.contains('source') ? 'source' : 'target',
      rect: handle.getBoundingClientRect(),
      style: window.getComputedStyle(handle),
      visible: window.getComputedStyle(handle).opacity !== '0'
    }));
  }
  
  // Función para analizar conexiones
  function analyzeConnections() {
    console.log('\n📊 === ANÁLISIS DE CONEXIONES ===');
    
    // Intentar obtener instancia de ReactFlow
    const reactFlowWrapper = document.querySelector('.react-flow');
    if (reactFlowWrapper && reactFlowWrapper.__reactFlowInstance) {
      const instance = reactFlowWrapper.__reactFlowInstance;
      const edges = instance.getEdges();
      const nodes = instance.getNodes();
      
      console.log('\n🔗 EDGES desde ReactFlow:');
      edges.forEach(edge => {
        console.log(`Edge ${edge.id}:`, {
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || 'NO DEFINIDO',
          targetHandle: edge.targetHandle || 'NO DEFINIDO',
          data: edge.data,
          type: edge.type,
          style: edge.style
        });
        
        // Verificar si los nodos tienen los handles especificados
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode) {
          console.log(`  Source Node (${sourceNode.id}):`, {
            type: sourceNode.type,
            handles: getAllHandlesForNode(sourceNode.id)
          });
        }
        
        if (targetNode) {
          console.log(`  Target Node (${targetNode.id}):`, {
            type: targetNode.type,
            handles: getAllHandlesForNode(targetNode.id)
          });
        }
      });
    }
    
    // Análisis de handles en el DOM
    const handles = getAllHandles();
    console.log('\n🎯 HANDLES en el DOM:');
    const handlesByNode = {};
    handles.forEach(handle => {
      if (!handlesByNode[handle.nodeId]) {
        handlesByNode[handle.nodeId] = [];
      }
      handlesByNode[handle.nodeId].push(handle);
    });
    
    Object.entries(handlesByNode).forEach(([nodeId, nodeHandles]) => {
      console.log(`\nNodo ${nodeId}:`);
      nodeHandles.forEach(handle => {
        console.log(`  - ${handle.type} handle: "${handle.handleId}" en posición ${handle.position}`, {
          visible: handle.visible,
          opacity: handle.style.opacity,
          pointerEvents: handle.style.pointerEvents
        });
      });
    });
  }
  
  // Obtener handles para un nodo específico
  function getAllHandlesForNode(nodeId) {
    const handles = document.querySelectorAll(`[data-nodeid="${nodeId}"]`);
    return Array.from(handles).map(h => ({
      id: h.getAttribute('data-handleid'),
      position: h.getAttribute('data-handlepos'),
      type: h.classList.contains('source') ? 'source' : 'target'
    }));
  }
  
  // Monitor de eventos de conexión
  function monitorConnections() {
    console.log('\n👁️ Monitoreando eventos de conexión...');
    
    // Interceptar eventos de ReactFlow
    const reactFlowWrapper = document.querySelector('.react-flow');
    if (reactFlowWrapper) {
      // Escuchar eventos de conexión
      reactFlowWrapper.addEventListener('reactflow-connectionstart', (e) => {
        console.log('🟢 CONNECTION START:', e.detail);
      });
      
      reactFlowWrapper.addEventListener('reactflow-connectionend', (e) => {
        console.log('🔴 CONNECTION END:', e.detail);
      });
      
      reactFlowWrapper.addEventListener('reactflow-connect', (e) => {
        console.log('🔗 NEW CONNECTION:', e.detail);
      });
    }
    
    // Monitor de clics en handles
    document.addEventListener('mousedown', (e) => {
      const handle = e.target.closest('.react-flow__handle');
      if (handle) {
        console.log('🎯 HANDLE CLICKED:', {
          nodeId: handle.getAttribute('data-nodeid'),
          handleId: handle.getAttribute('data-handleid'),
          position: handle.getAttribute('data-handlepos'),
          type: handle.classList.contains('source') ? 'source' : 'target'
        });
      }
    }, true);
  }
  
  // Función para probar guardar y cargar
  async function testSaveLoad() {
    console.log('\n🧪 === TEST DE GUARDAR/CARGAR ===');
    
    const reactFlowWrapper = document.querySelector('.react-flow');
    if (reactFlowWrapper && reactFlowWrapper.__reactFlowInstance) {
      const instance = reactFlowWrapper.__reactFlowInstance;
      const currentEdges = instance.getEdges();
      
      console.log('📤 Edges antes de guardar:');
      currentEdges.forEach(edge => {
        console.log(`- ${edge.id}: ${edge.source}[${edge.sourceHandle || 'default'}] -> ${edge.target}[${edge.targetHandle || 'default'}]`);
      });
      
      // Simular guardado
      const savedData = {
        edges: currentEdges.map(e => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          type: e.type,
          data: e.data,
          style: e.style
        }))
      };
      
      console.log('\n💾 Datos guardados:', JSON.stringify(savedData, null, 2));
      
      // Verificar qué se envía al backend
      console.log('\n📡 Para verificar en el backend:');
      console.log('1. Revisa los logs del servidor cuando se guarda');
      console.log('2. Verifica que sourceHandle y targetHandle se están guardando en la base de datos');
      console.log('3. Confirma que estos valores se devuelven al cargar el diagrama');
    }
  }
  
  // Función principal
  function runFullAnalysis() {
    console.clear();
    console.log('🔍 === ANÁLISIS COMPLETO DE EDGES Y HANDLES ===');
    console.log('Timestamp:', new Date().toISOString());
    
    analyzeConnections();
    
    // Buscar problemas comunes
    console.log('\n⚠️ PROBLEMAS COMUNES A VERIFICAR:');
    console.log('1. ¿Los edges tienen sourceHandle/targetHandle definidos?');
    console.log('2. ¿Los handles tienen IDs únicos y consistentes?');
    console.log('3. ¿Los handles están visibles (opacity > 0) cuando se necesitan?');
    console.log('4. ¿El backend está guardando/devolviendo sourceHandle y targetHandle?');
    
    return {
      edges: getAllEdges(),
      handles: getAllHandles()
    };
  }
  
  // Exponer funciones globales
  window.debugEdgesHandles = {
    analyze: runFullAnalysis,
    connections: analyzeConnections,
    monitor: monitorConnections,
    testSaveLoad: testSaveLoad,
    // Función para crear una conexión manual de prueba
    createTestConnection: (sourceId, targetId, sourceHandle, targetHandle) => {
      const reactFlowWrapper = document.querySelector('.react-flow');
      if (reactFlowWrapper && reactFlowWrapper.__reactFlowInstance) {
        const instance = reactFlowWrapper.__reactFlowInstance;
        const newEdge = {
          id: `test-edge-${Date.now()}`,
          source: sourceId,
          target: targetId,
          sourceHandle: sourceHandle,
          targetHandle: targetHandle,
          type: 'default',
          data: { edgeKind: 'connects_to' }
        };
        
        console.log('🔗 Creando edge de prueba:', newEdge);
        instance.addEdges([newEdge]);
        
        // Verificar inmediatamente
        setTimeout(() => {
          const edges = instance.getEdges();
          const created = edges.find(e => e.id === newEdge.id);
          console.log('✅ Edge creado:', created);
        }, 100);
      }
    }
  };
  
  // Ejecutar análisis inicial
  runFullAnalysis();
  
  console.log('\n📌 Comandos disponibles:');
  console.log('- debugEdgesHandles.analyze() - Análisis completo');
  console.log('- debugEdgesHandles.connections() - Solo conexiones');
  console.log('- debugEdgesHandles.monitor() - Iniciar monitoreo de eventos');
  console.log('- debugEdgesHandles.testSaveLoad() - Probar guardar/cargar');
  console.log('- debugEdgesHandles.createTestConnection(sourceId, targetId, sourceHandle, targetHandle) - Crear conexión de prueba');
  
})();
