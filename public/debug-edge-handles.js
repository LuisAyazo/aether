// Debug script para verificar handles de edges
(function() {
  console.log('🔍 Edge Handles Debugger iniciado');
  
  // Función para capturar eventos de React Flow
  let edgeCreationCount = 0;
  const edgeCreationLog = [];
  
  // Interceptar eventos personalizados de creación de edges
  const originalDispatchEvent = EventTarget.prototype.dispatchEvent;
  EventTarget.prototype.dispatchEvent = function(event) {
    if (event.type === 'reactflow__connectionstart' || event.type === 'reactflow__connectionend') {
      console.log(`📍 ReactFlow event: ${event.type}`, event);
    }
    return originalDispatchEvent.call(this, event);
  };
  
  // Función para verificar handles en el DOM
  window.debugHandles = function() {
    console.log('🔍 Verificando handles en el DOM...');
    
    // Buscar todos los handles
    const handles = document.querySelectorAll('.react-flow__handle');
    console.log(`📍 Total handles encontrados: ${handles.length}`);
    
    // Agrupar por nodo
    const handlesByNode = {};
    handles.forEach(handle => {
      const nodeElement = handle.closest('.react-flow__node');
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-id');
        if (!handlesByNode[nodeId]) {
          handlesByNode[nodeId] = [];
        }
        
        const handleInfo = {
          id: handle.id || 'no-id',
          type: handle.classList.contains('react-flow__handle-top') ? 'top' :
                handle.classList.contains('react-flow__handle-bottom') ? 'bottom' :
                handle.classList.contains('react-flow__handle-left') ? 'left' :
                handle.classList.contains('react-flow__handle-right') ? 'right' : 'unknown',
          position: handle.getAttribute('data-handlepos') || 'unknown',
          isSource: handle.classList.contains('source'),
          isTarget: handle.classList.contains('target'),
          element: handle
        };
        
        handlesByNode[nodeId].push(handleInfo);
      }
    });
    
    console.log('📊 Handles por nodo:', handlesByNode);
    return handlesByNode;
  };
  
  // Función para verificar edges
  window.debugEdges = function() {
    console.log('🔍 Verificando edges...');
    
    // Buscar todos los edges en el DOM
    const edges = document.querySelectorAll('.react-flow__edge');
    console.log(`📍 Total edges encontrados: ${edges.length}`);
    
    const edgeInfo = [];
    edges.forEach((edge, index) => {
      const pathElement = edge.querySelector('path');
      const edgeId = edge.getAttribute('id') || `edge-${index}`;
      
      // Intentar extraer información del edge desde el path
      const d = pathElement?.getAttribute('d');
      
      // Extraer información del ID del edge
      // Formato esperado: reactflow__edge-sourceId__sourceHandle-targetId__targetHandle
      // o reactflow__edge-sourceId-targetId (sin handles)
      let sourceInfo = 'unknown';
      let targetInfo = 'unknown';
      let sourceHandle = null;
      let targetHandle = null;
      
      if (edgeId.includes('reactflow__edge-')) {
        // Remover el prefijo
        const edgeData = edgeId.replace('reactflow__edge-', '');
        
        // El formato es: source__sourceHandle-target__targetHandle
        // Necesitamos dividir por el último guión que separa source de target
        const parts = edgeData.split('-');
        
        if (parts.length >= 2) {
          // Reconstruir las partes considerando que los IDs pueden contener guiones
          let sourcePart = '';
          let targetPart = '';
          let foundSeparator = false;
          
          // Buscar desde el final hacia atrás para encontrar el separador correcto
          for (let i = parts.length - 1; i >= 0; i--) {
            if (!foundSeparator && parts[i].includes('__')) {
              // Esta parte contiene un handle, es el target
              targetPart = parts.slice(i).join('-');
              sourcePart = parts.slice(0, i).join('-');
              foundSeparator = true;
              break;
            }
          }
          
          // Si no encontramos un separador con handle, usar la última parte como target
          if (!foundSeparator) {
            targetPart = parts[parts.length - 1];
            sourcePart = parts.slice(0, -1).join('-');
          }
          
          // Extraer source y su handle
          if (sourcePart.includes('__')) {
            const [sid, shandle] = sourcePart.split('__');
            sourceInfo = sid;
            sourceHandle = shandle;
          } else {
            sourceInfo = sourcePart;
          }
          
          // Extraer target y su handle
          if (targetPart.includes('__')) {
            const [tid, thandle] = targetPart.split('__');
            targetInfo = tid;
            targetHandle = thandle;
          } else {
            targetInfo = targetPart;
          }
        }
      }
      
      edgeInfo.push({
        id: edgeId,
        source: sourceInfo,
        sourceHandle: sourceHandle,
        target: targetInfo,
        targetHandle: targetHandle,
        path: d ? d.substring(0, 50) + '...' : 'no-path',
        classes: edge.className,
        element: edge
      });
    });
    
    console.log('📊 Información detallada de edges:');
    edgeInfo.forEach(edge => {
      console.log(`  Edge: ${edge.source}${edge.sourceHandle ? '__' + edge.sourceHandle : ''} → ${edge.target}${edge.targetHandle ? '__' + edge.targetHandle : ''}`);
    });
    
    return edgeInfo;
  };
  
  // Función para rastrear la creación de edges
  window.trackEdgeCreation = function() {
    console.log('🎯 Iniciando rastreo de creación de edges...');
    
    // Observar cambios en el DOM para detectar nuevos edges
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.classList && node.classList.contains('react-flow__edge')) {
            edgeCreationCount++;
            const timestamp = new Date().toISOString();
            console.log(`🆕 Nuevo edge detectado #${edgeCreationCount} at ${timestamp}`);
            
            // Intentar capturar el stack trace
            const stack = new Error().stack;
            edgeCreationLog.push({
              count: edgeCreationCount,
              timestamp,
              element: node,
              stack: stack.split('\n').slice(2, 7).join('\n')
            });
          }
        });
      });
    });
    
    const container = document.querySelector('.react-flow');
    if (container) {
      observer.observe(container, {
        childList: true,
        subtree: true
      });
      console.log('✅ Observer activo en .react-flow');
    } else {
      console.log('❌ No se encontró .react-flow container');
    }
  };
  
  // Función para obtener el estado actual de React Flow
  window.getReactFlowState = function() {
    console.log('🔍 Intentando obtener el estado de React Flow...');
    
    // Buscar el componente React Flow en el DOM
    const reactFlowElement = document.querySelector('.react-flow');
    if (!reactFlowElement) {
      console.log('❌ No se encontró elemento React Flow');
      return null;
    }
    
    // Intentar acceder a las props de React (esto puede no funcionar en producción)
    const reactInternalKey = Object.keys(reactFlowElement).find(key => key.startsWith('__react'));
    if (reactInternalKey) {
      const reactInternal = reactFlowElement[reactInternalKey];
      console.log('📊 React Internal:', reactInternal);
      
      // Intentar encontrar edges en el state
      let currentFiber = reactInternal.return;
      while (currentFiber) {
        if (currentFiber.memoizedState && currentFiber.memoizedState.edges) {
          console.log('✅ Edges encontrados:', currentFiber.memoizedState.edges);
          return currentFiber.memoizedState.edges;
        }
        currentFiber = currentFiber.return;
      }
    }
    
    console.log('❌ No se pudo acceder al estado interno de React');
    return null;
  };
  
  // Función para obtener edges desde React Flow Store
  window.getEdgesFromStore = function() {
    console.log('🔍 Intentando obtener edges desde el store...');
    
    // Buscar el store en window (si está expuesto para debug)
    if (window.__REACT_FLOW_STORE__) {
      const state = window.__REACT_FLOW_STORE__.getState();
      if (state && state.edges) {
        return state.edges;
      }
    }
    
    // Intentar obtener desde React DevTools
    const reactFlowElement = document.querySelector('.react-flow');
    if (reactFlowElement && reactFlowElement._reactInternalFiber) {
      let fiber = reactFlowElement._reactInternalFiber;
      while (fiber) {
        if (fiber.memoizedProps && fiber.memoizedProps.edges) {
          return fiber.memoizedProps.edges;
        }
        fiber = fiber.return;
      }
    }
    
    return null;
  };
  
  // Función para generar reporte completo
  window.edgeHandleReport = function() {
    console.log('📊 REPORTE COMPLETO DE EDGES Y HANDLES');
    console.log('=====================================');
    
    console.log('\n1. HANDLES EN EL DOM:');
    const handles = window.debugHandles();
    
    console.log('\n2. EDGES EN EL DOM:');
    const edges = window.debugEdges();
    
    // Obtener datos del backend si están disponibles
    const backendEdges = window.__DEBUG_BACKEND_EDGES__ || [];
    const convertedEdges = window.__DEBUG_CONVERTED_EDGES__ || [];
    
    if (backendEdges.length > 0) {
      console.log('\n3. EDGES DEL BACKEND (DATOS ORIGINALES):');
      backendEdges.forEach((edge, index) => {
        console.log(`\nBackend Edge ${index + 1}:`);
        console.log(`  ID: ${edge.id}`);
        console.log(`  Source: ${edge.source} (handle: ${edge.sourceHandle || 'NONE'})`);
        console.log(`  Target: ${edge.target} (handle: ${edge.targetHandle || 'NONE'})`);
        console.log(`  Type: ${edge.type || 'default'}`);
        console.log(`  Data:`, edge.data || {});
      });
    }
    
    if (convertedEdges.length > 0) {
      console.log('\n4. EDGES CONVERTIDOS (PARA REACT FLOW):');
      convertedEdges.forEach((edge, index) => {
        console.log(`\nConverted Edge ${index + 1}:`);
        console.log(`  ID: ${edge.id}`);
        console.log(`  Source: ${edge.source} (handle: ${edge.sourceHandle || 'NONE'})`);
        console.log(`  Target: ${edge.target} (handle: ${edge.targetHandle || 'NONE'})`);
        console.log(`  Type: ${edge.type || 'default'}`);
        console.log(`  Style:`, edge.style || {});
      });
    }
    
    console.log('\n5. ANÁLISIS DETALLADO DE EDGES EN DOM:');
    edges.forEach((edge, index) => {
      console.log(`\nDOM Edge ${index + 1}:`);
      console.log(`  ID: ${edge.id}`);
      console.log(`  Source: ${edge.source} (handle: ${edge.sourceHandle || 'none'})`);
      console.log(`  Target: ${edge.target} (handle: ${edge.targetHandle || 'none'})`);
    });
    
    console.log('\n6. HISTORIAL DE CREACIÓN DE EDGES:');
    console.log(edgeCreationLog);
    
    console.log('\n7. ESTADO DE REACT FLOW:');
    const reactFlowEdges = window.getReactFlowState() || window.getEdgesFromStore();
    
    if (reactFlowEdges) {
      console.log('\n8. EDGES EN EL ESTADO:');
      reactFlowEdges.forEach(edge => {
        console.log(`Edge ${edge.id}:`, {
          source: edge.source,
          sourceHandle: edge.sourceHandle || 'NO HANDLE',
          target: edge.target,
          targetHandle: edge.targetHandle || 'NO HANDLE',
          type: edge.type,
          data: edge.data
        });
      });
    }
    
    // Comparar backend vs DOM
    console.log('\n9. COMPARACIÓN BACKEND vs DOM:');
    if (backendEdges.length > 0 && edges.length > 0) {
      console.log(`Backend edges: ${backendEdges.length}`);
      console.log(`DOM edges: ${edges.length}`);
      
      backendEdges.forEach((backendEdge, i) => {
        console.log(`\nComparando edge ${i + 1}:`);
        console.log(`  Backend - sourceHandle: ${backendEdge.sourceHandle || 'NONE'}, targetHandle: ${backendEdge.targetHandle || 'NONE'}`);
        
        const domEdge = edges.find(e => 
          e.source === backendEdge.source && 
          e.target === backendEdge.target
        );
        
        if (domEdge) {
          console.log(`  DOM     - sourceHandle: ${domEdge.sourceHandle || 'NONE'}, targetHandle: ${domEdge.targetHandle || 'NONE'}`);
          
          const sourceMatch = (backendEdge.sourceHandle || null) === (domEdge.sourceHandle || null);
          const targetMatch = (backendEdge.targetHandle || null) === (domEdge.targetHandle || null);
          
          console.log(`  Source Handle: ${sourceMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
          console.log(`  Target Handle: ${targetMatch ? '✅ MATCH' : '❌ MISMATCH'}`);
        } else {
          console.log(`  DOM edge not found!`);
        }
      });
    }
    
    // Verificación de consistencia con handles disponibles
    console.log('\n10. VERIFICACIÓN DE HANDLES DISPONIBLES:');
    if (edges.length > 0 && Object.keys(handles).length > 0) {
      edges.forEach(edge => {
        console.log(`\nVerificando edge: ${edge.source} → ${edge.target}`);
        
        // Verificar si el source node tiene el handle esperado
        if (handles[edge.source]) {
          const sourceHandles = handles[edge.source];
          const hasSourceHandle = sourceHandles.some(h => h.id === edge.sourceHandle);
          console.log(`  Source handle '${edge.sourceHandle}': ${hasSourceHandle ? '✅ EXISTE' : '❌ NO EXISTE'}`);
          if (!hasSourceHandle) {
            console.log(`    Handles disponibles en ${edge.source}:`, sourceHandles.map(h => h.id));
          }
        }
        
        // Verificar si el target node tiene el handle esperado
        if (handles[edge.target]) {
          const targetHandles = handles[edge.target];
          const hasTargetHandle = targetHandles.some(h => h.id === edge.targetHandle);
          console.log(`  Target handle '${edge.targetHandle}': ${hasTargetHandle ? '✅ EXISTE' : '❌ NO EXISTE'}`);
          if (!hasTargetHandle) {
            console.log(`    Handles disponibles en ${edge.target}:`, targetHandles.map(h => h.id));
          }
        }
      });
    }
  };
  
  // Auto-iniciar el tracking después de 2 segundos
  setTimeout(() => {
    window.trackEdgeCreation();
    console.log('🎯 Para generar un reporte completo, ejecuta: window.edgeHandleReport()');
  }, 2000);
})();
