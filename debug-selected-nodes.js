// Depurar el estado de selectedNodes
console.log('🔍 Debug: Selected Nodes Monitor');

// Interceptar cambios en la selección
let lastSelectedCount = 0;
setInterval(() => {
  const reactFlowEl = document.querySelector('.react-flow');
  if (reactFlowEl && reactFlowEl.__reactFlow) {
    const nodes = reactFlowEl.__reactFlow.getNodes();
    const selectedNodes = nodes.filter(n => n.selected);
    
    if (selectedNodes.length !== lastSelectedCount) {
      console.log('📊 Selection changed:', {
        count: selectedNodes.length,
        nodes: selectedNodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.data?.label
        }))
      });
      lastSelectedCount = selectedNodes.length;
    }
  }
}, 500);

// Interceptar clicks en botones del menú para ver el estado
document.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (button && button.textContent && 
      (button.textContent.includes('Agrupar') || 
       button.textContent.includes('Duplicar') || 
       button.textContent.includes('Eliminar'))) {
    
    console.log('🖱️ Menu button clicked:', button.textContent);
    
    // Buscar el estado actual de ReactFlow
    const reactFlowEl = document.querySelector('.react-flow');
    if (reactFlowEl && reactFlowEl.__reactFlow) {
      const nodes = reactFlowEl.__reactFlow.getNodes();
      const selectedNodes = nodes.filter(n => n.selected);
      console.log('📌 Selected at click time:', selectedNodes);
    }
  }
});

console.log('✅ Selected nodes debugger active');
