// Script de debug para analizar el comportamiento de los nodos grupo
(function() {
  console.log('🔍 Debug Group Nodes - Script iniciado');
  
  // Función para obtener todos los nodos grupo
  function getGroupNodes() {
    const groupNodes = document.querySelectorAll('.react-flow__node-group');
    return Array.from(groupNodes);
  }
  
  // Función para analizar un nodo grupo
  function analyzeGroupNode(node) {
    const nodeId = node.getAttribute('data-id');
    const rect = node.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(node);
    const isMinimized = node.querySelector('[data-minimized="true"]') !== null;
    
    // Obtener dimensiones del estilo inline
    const inlineWidth = node.style.width;
    const inlineHeight = node.style.height;
    
    // Obtener transform
    const transform = node.style.transform;
    
    // Verificar si hay elementos invisibles pero interactivos
    const invisibleInteractive = [];
    node.querySelectorAll('*').forEach(child => {
      const childStyle = window.getComputedStyle(child);
      const opacity = parseFloat(childStyle.opacity);
      const visibility = childStyle.visibility;
      const pointerEvents = childStyle.pointerEvents;
      
      if ((opacity === 0 || visibility === 'hidden') && pointerEvents !== 'none') {
        invisibleInteractive.push({
          element: child,
          className: child.className,
          opacity,
          visibility,
          pointerEvents,
          rect: child.getBoundingClientRect()
        });
      }
    });
    
    return {
      nodeId,
      isMinimized,
      dimensions: {
        inline: { width: inlineWidth, height: inlineHeight },
        boundingRect: { width: rect.width, height: rect.height },
        computed: { 
          width: computedStyle.width, 
          height: computedStyle.height,
          minWidth: computedStyle.minWidth,
          minHeight: computedStyle.minHeight,
          maxWidth: computedStyle.maxWidth,
          maxHeight: computedStyle.maxHeight
        }
      },
      position: {
        transform,
        rect: { x: rect.x, y: rect.y },
        zIndex: computedStyle.zIndex
      },
      visibility: {
        opacity: computedStyle.opacity,
        visibility: computedStyle.visibility,
        pointerEvents: computedStyle.pointerEvents,
        overflow: computedStyle.overflow
      },
      invisibleInteractive,
      element: node
    };
  }
  
  // Función para detectar superposiciones
  function detectOverlaps(nodes) {
    const overlaps = [];
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const rect1 = nodes[i].element.getBoundingClientRect();
        const rect2 = nodes[j].element.getBoundingClientRect();
        
        // Verificar si hay superposición
        if (!(rect1.right < rect2.left || 
              rect2.right < rect1.left || 
              rect1.bottom < rect2.top || 
              rect2.bottom < rect1.top)) {
          overlaps.push({
            node1: nodes[i].nodeId,
            node2: nodes[j].nodeId,
            rect1: { x: rect1.x, y: rect1.y, width: rect1.width, height: rect1.height },
            rect2: { x: rect2.x, y: rect2.y, width: rect2.width, height: rect2.height }
          });
        }
      }
    }
    
    return overlaps;
  }
  
  // Función principal de análisis
  function runAnalysis() {
    console.clear();
    console.log('🔍 === ANÁLISIS DE NODOS GRUPO ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const groupNodes = getGroupNodes();
    console.log(`\n📊 Total de nodos grupo encontrados: ${groupNodes.length}`);
    
    const analyses = groupNodes.map(analyzeGroupNode);
    
    // Mostrar análisis de cada nodo
    analyses.forEach((analysis, index) => {
      console.log(`\n📦 Nodo ${index + 1}: ${analysis.nodeId}`);
      console.log('Estado:', analysis.isMinimized ? '🔽 MINIMIZADO' : '🔼 EXPANDIDO');
      console.log('Dimensiones:');
      console.table(analysis.dimensions);
      console.log('Posición:', analysis.position);
      console.log('Visibilidad:', analysis.visibility);
      
      if (analysis.invisibleInteractive.length > 0) {
        console.warn(`⚠️ ${analysis.invisibleInteractive.length} elementos invisibles pero interactivos encontrados:`);
        analysis.invisibleInteractive.forEach(item => {
          console.log('  - Elemento:', item.className || 'sin clase');
          console.log('    Rect:', item.rect);
          console.log('    Props:', { opacity: item.opacity, visibility: item.visibility, pointerEvents: item.pointerEvents });
        });
      }
    });
    
    // Detectar superposiciones
    const overlaps = detectOverlaps(analyses);
    if (overlaps.length > 0) {
      console.log('\n⚠️ SUPERPOSICIONES DETECTADAS:');
      overlaps.forEach(overlap => {
        console.log(`- ${overlap.node1} se superpone con ${overlap.node2}`);
        console.log('  Rect1:', overlap.rect1);
        console.log('  Rect2:', overlap.rect2);
      });
    }
    
    // Mostrar problema específico de siluetas
    const minimizedNodes = analyses.filter(a => a.isMinimized);
    if (minimizedNodes.length > 0) {
      console.log('\n🔍 ANÁLISIS DE NODOS MINIMIZADOS:');
      minimizedNodes.forEach(node => {
        const expectedWidth = 280; // MINIMIZED_WIDTH
        const expectedHeight = 48; // MINIMIZED_HEIGHT
        const actualWidth = parseFloat(node.dimensions.inline.width) || node.dimensions.boundingRect.width;
        const actualHeight = parseFloat(node.dimensions.inline.height) || node.dimensions.boundingRect.height;
        
        if (Math.abs(actualWidth - expectedWidth) > 1 || Math.abs(actualHeight - expectedHeight) > 1) {
          console.error(`❌ Nodo ${node.nodeId}: Dimensiones incorrectas al minimizar`);
          console.log(`  Esperado: ${expectedWidth}x${expectedHeight}`);
          console.log(`  Actual: ${actualWidth}x${actualHeight}`);
        }
      });
    }
    
    return analyses;
  }
  
  // Monitor de cambios en tiempo real
  let observer = null;
  
  function startMonitoring() {
    console.log('👁️ Iniciando monitoreo en tiempo real...');
    
    // Observer para detectar cambios
    observer = new MutationObserver((mutations) => {
      let shouldAnalyze = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes') {
          if (mutation.attributeName === 'style' || 
              mutation.attributeName === 'class' ||
              mutation.attributeName === 'data-minimized') {
            shouldAnalyze = true;
          }
        }
      });
      
      if (shouldAnalyze) {
        console.log('🔄 Cambio detectado, re-analizando...');
        runAnalysis();
      }
    });
    
    // Observar todos los nodos grupo
    const groupNodes = getGroupNodes();
    groupNodes.forEach(node => {
      observer.observe(node, {
        attributes: true,
        attributeFilter: ['style', 'class', 'data-minimized'],
        subtree: true
      });
    });
  }
  
  function stopMonitoring() {
    if (observer) {
      observer.disconnect();
      console.log('🛑 Monitoreo detenido');
    }
  }
  
  // Ejecutar análisis inicial
  const initialAnalysis = runAnalysis();
  
  // Exponer funciones globales para debug
  window.debugGroupNodes = {
    analyze: runAnalysis,
    startMonitoring,
    stopMonitoring,
    getGroupNodes,
    analyzeNode: (nodeId) => {
      const node = document.querySelector(`[data-id="${nodeId}"]`);
      if (node) {
        return analyzeGroupNode(node);
      }
      return null;
    },
    // Función para forzar dimensiones correctas
    fixMinimizedDimensions: () => {
      const nodes = getGroupNodes();
      nodes.forEach(node => {
        const isMinimized = node.querySelector('[data-minimized="true"]') !== null;
        if (isMinimized) {
          node.style.width = '280px';
          node.style.height = '48px';
          console.log(`✅ Corregidas dimensiones de ${node.getAttribute('data-id')}`);
        }
      });
    },
    // Función para mostrar/ocultar siluetas
    highlightBounds: (show = true) => {
      const nodes = getGroupNodes();
      nodes.forEach(node => {
        if (show) {
          node.style.outline = '2px dashed red';
          node.style.outlineOffset = '2px';
        } else {
          node.style.outline = '';
          node.style.outlineOffset = '';
        }
      });
    }
  };
  
  console.log('\n📌 Funciones disponibles:');
  console.log('- debugGroupNodes.analyze() - Ejecutar análisis completo');
  console.log('- debugGroupNodes.startMonitoring() - Iniciar monitoreo en tiempo real');
  console.log('- debugGroupNodes.stopMonitoring() - Detener monitoreo');
  console.log('- debugGroupNodes.analyzeNode(nodeId) - Analizar un nodo específico');
  console.log('- debugGroupNodes.fixMinimizedDimensions() - Corregir dimensiones de nodos minimizados');
  console.log('- debugGroupNodes.highlightBounds(true/false) - Mostrar/ocultar límites de nodos');
  
})();
