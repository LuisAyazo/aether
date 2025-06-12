// debug-context-menu-flow.js
// Debug completo del flujo del menú contextual

console.log('🔍 Debug de flujo del menú contextual iniciado');

// Interceptar TODOS los eventos relacionados
const events = [
  'contextmenu',
  'showContextMenu', 
  'showMultipleSelectionMenu',
  'emptySelection'
];

// Estado del menú
let menuState = {
  visible: false,
  lastEvent: null,
  blockingElement: null
};

// Interceptar cada evento
events.forEach(eventName => {
  // Captura en fase de captura
  window.addEventListener(eventName, (e) => {
    console.log(`📥 [CAPTURE] ${eventName} en:`, e.target.className || e.target.tagName, {
      defaultPrevented: e.defaultPrevented,
      propagationStopped: e.propagationStopped,
      detail: e.detail || null
    });
  }, true);
  
  // Captura en fase de burbuja
  window.addEventListener(eventName, (e) => {
    console.log(`📤 [BUBBLE] ${eventName} en:`, e.target.className || e.target.tagName, {
      defaultPrevented: e.defaultPrevented,
      propagationStopped: e.propagationStopped,
      detail: e.detail || null
    });
  }, false);
});

// Interceptar el store de Zustand para ver cambios en el menú
const originalSetState = window.useEditorStore?.setState;
if (originalSetState) {
  window.useEditorStore.setState = function(...args) {
    const result = originalSetState.apply(this, args);
    const state = window.useEditorStore.getState();
    
    if (state.contextMenu?.visible !== menuState.visible) {
      menuState.visible = state.contextMenu?.visible || false;
      console.log('🎯 [STORE] Cambio en contextMenu:', {
        visible: menuState.visible,
        x: state.contextMenu?.x,
        y: state.contextMenu?.y,
        nodeId: state.contextMenu?.nodeId,
        isPane: state.contextMenu?.isPane
      });
    }
    
    return result;
  };
}

// Monitorear el DOM para ver si el menú se renderiza
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === 1) {
        // Buscar el menú contextual
        if (node.style?.position === 'fixed' && node.style?.zIndex === '1000') {
          console.log('✅ [DOM] Menú contextual RENDERIZADO:', {
            width: node.offsetWidth,
            height: node.offsetHeight,
            left: node.style.left,
            top: node.style.top,
            childrenCount: node.children.length
          });
        }
      }
    });
    
    mutation.removedNodes.forEach((node) => {
      if (node.nodeType === 1 && node.style?.position === 'fixed' && node.style?.zIndex === '1000') {
        console.log('❌ [DOM] Menú contextual REMOVIDO');
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Test manual: disparar el evento directamente
window.testMultipleSelectionMenu = function() {
  console.log('🧪 Disparando evento showMultipleSelectionMenu manualmente...');
  const event = new CustomEvent('showMultipleSelectionMenu', {
    detail: {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      selectedNodes: [],
      selectedNodesCount: 2
    }
  });
  window.dispatchEvent(event);
};

// Verificar qué elementos están bloqueando
document.addEventListener('contextmenu', (e) => {
  const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
  console.log('🎯 Elementos en el punto del click:', elementsAtPoint.map(el => ({
    tag: el.tagName,
    class: el.className,
    id: el.id,
    zIndex: window.getComputedStyle(el).zIndex,
    pointerEvents: window.getComputedStyle(el).pointerEvents
  })));
}, true);

console.log('📋 Comandos disponibles:');
console.log('- testMultipleSelectionMenu() - Dispara el evento manualmente');
console.log('- Observa los logs para ver el flujo completo de eventos');
