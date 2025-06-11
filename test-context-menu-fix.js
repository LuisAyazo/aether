// Test de las funciones del menú contextual con fix
console.log('🔧 Testing Context Menu Functions Fix');

// Simular un click en agrupar con nodos preseleccionados
setTimeout(() => {
  console.log('📍 Step 1: Selecting nodes for grouping');
  
  // Buscar nodos de recursos
  const reactFlowEl = document.querySelector('.react-flow');
  if (reactFlowEl && reactFlowEl.__reactFlow) {
    const nodes = reactFlowEl.__reactFlow.getNodes();
    const resourceNodes = nodes.filter(n => 
      !['areaNode', 'noteNode', 'textNode', 'group'].includes(n.type)
    );
    
    if (resourceNodes.length >= 2) {
      // Seleccionar los primeros 2 nodos
      reactFlowEl.__reactFlow.setNodes(nodes.map(n => ({
        ...n,
        selected: resourceNodes.slice(0, 2).some(rn => rn.id === n.id)
      })));
      
      console.log('✅ Selected 2 resource nodes');
      
      // Esperar un poco y luego simular right-click
      setTimeout(() => {
        console.log('📍 Step 2: Triggering context menu');
        
        // Disparar evento de menú contextual
        const event = new CustomEvent('showMultipleSelectionMenu', {
          detail: {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
            selectedNodes: resourceNodes.slice(0, 2),
            selectedNodesCount: 2
          }
        });
        window.dispatchEvent(event);
        
        console.log('✅ Context menu should be visible');
        
        // Buscar y hacer click en el botón de agrupar
        setTimeout(() => {
          const groupButton = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent?.includes('Agrupar Seleccionados')
          );
          
          if (groupButton) {
            console.log('📍 Step 3: Clicking group button');
            groupButton.click();
            console.log('✅ Group button clicked');
          } else {
            console.log('❌ Group button not found');
          }
        }, 500);
      }, 1000);
    } else {
      console.log('❌ Not enough resource nodes found');
    }
  }
}, 2000);

console.log('✅ Context menu fix test initialized');
