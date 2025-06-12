// debug-selection-area.js
// Script para debuguear el comportamiento del área seleccionada

console.log('🔍 Debug de área seleccionada iniciado');

// Función para calcular el bounding box de los nodos seleccionados
function getSelectionBoundingBox() {
  const selectedNodes = document.querySelectorAll('.react-flow__node.selected');
  if (selectedNodes.length === 0) return null;
  
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  
  selectedNodes.forEach(node => {
    const rect = node.getBoundingClientRect();
    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxX = Math.max(maxX, rect.right);
    maxY = Math.max(maxY, rect.bottom);
  });
  
  return {
    left: minX,
    top: minY,
    right: maxX,
    bottom: maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

// Visualizar el área de selección
let selectionOverlay = null;

function updateSelectionOverlay() {
  const bbox = getSelectionBoundingBox();
  
  if (!bbox) {
    if (selectionOverlay) {
      selectionOverlay.remove();
      selectionOverlay = null;
    }
    return;
  }
  
  if (!selectionOverlay) {
    selectionOverlay = document.createElement('div');
    selectionOverlay.id = 'debug-selection-area';
    selectionOverlay.style.cssText = `
      position: fixed;
      border: 2px dashed red;
      background: rgba(255, 0, 0, 0.1);
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(selectionOverlay);
  }
  
  selectionOverlay.style.left = bbox.left + 'px';
  selectionOverlay.style.top = bbox.top + 'px';
  selectionOverlay.style.width = bbox.width + 'px';
  selectionOverlay.style.height = bbox.height + 'px';
}

// Interceptar clicks derechos
document.addEventListener('contextmenu', (e) => {
  const bbox = getSelectionBoundingBox();
  if (!bbox) return;
  
  const clickX = e.clientX;
  const clickY = e.clientY;
  
  const insideSelection = clickX >= bbox.left && 
                         clickX <= bbox.right && 
                         clickY >= bbox.top && 
                         clickY <= bbox.bottom;
  
  console.log('📍 Right click:', {
    position: { x: clickX, y: clickY },
    selectionArea: bbox,
    insideSelection,
    target: e.target.className || e.target.tagName
  });
  
  // Cambiar color del overlay según el click
  if (selectionOverlay) {
    selectionOverlay.style.borderColor = insideSelection ? 'green' : 'red';
    selectionOverlay.style.backgroundColor = insideSelection ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)';
  }
}, true);

// Actualizar overlay cada 100ms
setInterval(updateSelectionOverlay, 100);

// Observar el tamaño del menú contextual cuando aparezca
const menuObserver = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.style?.position === 'fixed') {
        // Esperar un frame para que el menú se renderice completamente
        requestAnimationFrame(() => {
          const rect = node.getBoundingClientRect();
          console.log('📏 Context menu dimensions:', {
            width: rect.width,
            height: rect.height,
            position: { x: parseFloat(node.style.left), y: parseFloat(node.style.top) },
            windowHeight: window.innerHeight,
            spaceBelow: window.innerHeight - parseFloat(node.style.top),
            menuFitsBelow: rect.height <= (window.innerHeight - parseFloat(node.style.top))
          });
        });
      }
    });
  });
});

menuObserver.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('🎯 Debug activo:');
console.log('- El área de selección se muestra con borde rojo punteado');
console.log('- Verde = click dentro del área, Rojo = click fuera');
console.log('- Revisa los logs para ver las dimensiones del menú');
