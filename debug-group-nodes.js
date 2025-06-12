// Script para depurar el estado de los nodos en grupos
// Ejecutar en la consola del navegador cuando esté en la página del diagrama

function debugGroupNodes() {
  // Obtener todos los nodos
  const allNodes = window.reactFlowInstance?.getNodes() || [];
  
  console.log('=== DEPURACIÓN DE NODOS EN GRUPOS ===');
  console.log(`Total de nodos: ${allNodes.length}`);
  
  // Filtrar nodos con parentId
  const nodesInGroups = allNodes.filter(n => n.parentId);
  console.log(`\nNodos dentro de grupos: ${nodesInGroups.length}`);
  
  // Analizar cada nodo en grupo
  nodesInGroups.forEach(node => {
    console.log(`\nNodo: ${node.id}`);
    console.log(`  Tipo: ${node.type}`);
    console.log(`  Parent: ${node.parentId}`);
    console.log(`  Hidden: ${node.hidden}`);
    console.log(`  Style:`, node.style);
    console.log(`  Position:`, node.position);
    console.log(`  Extent: ${node.extent}`);
    
    // Verificar si es visible en el DOM
    const domElement = document.querySelector(`[data-id="${node.id}"]`);
    if (domElement) {
      const computedStyle = window.getComputedStyle(domElement);
      console.log(`  DOM - Display: ${computedStyle.display}`);
      console.log(`  DOM - Visibility: ${computedStyle.visibility}`);
      console.log(`  DOM - Opacity: ${computedStyle.opacity}`);
    } else {
      console.log('  DOM: No encontrado');
    }
  });
  
  // Mostrar grupos
  const groups = allNodes.filter(n => n.type === 'group');
  console.log(`\n\nGrupos encontrados: ${groups.length}`);
  groups.forEach(group => {
    const childCount = allNodes.filter(n => n.parentId === group.id).length;
    console.log(`\nGrupo: ${group.id}`);
    console.log(`  Label: ${group.data?.label}`);
    console.log(`  Hijos: ${childCount}`);
    console.log(`  isMinimized: ${group.data?.isMinimized}`);
    console.log(`  isExpandedView: ${group.data?.isExpandedView}`);
  });
}

// Función para verificar visibilidad de nodos específicos
function checkNodeVisibility(nodeId) {
  const node = window.reactFlowInstance?.getNode(nodeId);
  if (!node) {
    console.log(`Nodo ${nodeId} no encontrado`);
    return;
  }
  
  console.log(`\n=== VERIFICANDO NODO: ${nodeId} ===`);
  console.log('Estado del nodo:', node);
  
  const domElement = document.querySelector(`[data-id="${nodeId}"]`);
  if (domElement) {
    console.log('Elemento DOM encontrado');
    console.log('  Classes:', domElement.className);
    console.log('  Style attribute:', domElement.getAttribute('style'));
    
    const rect = domElement.getBoundingClientRect();
    console.log('  Posición en pantalla:', rect);
    console.log('  Es visible:', rect.width > 0 && rect.height > 0);
  } else {
    console.log('Elemento DOM NO encontrado');
  }
}

// Función para forzar ocultación de nodos
function forceHideGroupNodes() {
  const allNodes = window.reactFlowInstance?.getNodes() || [];
  const nodesToHide = allNodes.filter(n => n.parentId);
  
  console.log(`Forzando ocultación de ${nodesToHide.length} nodos...`);
  
  window.reactFlowInstance?.setNodes(nodes => 
    nodes.map(node => {
      if (node.parentId) {
        return {
          ...node,
          hidden: true,
          style: {
            ...node.style,
            visibility: 'hidden',
            opacity: 0,
            pointerEvents: 'none',
            display: 'none'
          }
        };
      }
      return node;
    })
  );
  
  console.log('Ocultación completada');
}

// Hacer las funciones globales
window.debugGroupNodes = debugGroupNodes;
window.checkNodeVisibility = checkNodeVisibility;
window.forceHideGroupNodes = forceHideGroupNodes;

console.log('🔍 Script de depuración cargado. Funciones disponibles:');
console.log('  - debugGroupNodes(): Muestra información de todos los nodos en grupos');
console.log('  - checkNodeVisibility(nodeId): Verifica la visibilidad de un nodo específico');
console.log('  - forceHideGroupNodes(): Fuerza la ocultación de todos los nodos en grupos');
