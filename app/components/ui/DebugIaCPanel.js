// Este archivo es para facilitar la depuración del panel IaCTemplatePanel
console.log('Archivo de depuración para el panel IaC cargado');

// Función para abrir manualmente el panel desde la consola para pruebas
window.openIaCPanel = (nodeId) => {
  console.log('Intentando abrir panel IaC para nodo:', nodeId);
  
  const event = new CustomEvent('nodeAction', {
    detail: {
      action: 'openIaCPanel',
      nodeId: nodeId || document.querySelector('[data-provider="aws"]')?.getAttribute('data-id')
    }
  });
  
  document.dispatchEvent(event);
  console.log('Evento enviado para abrir panel');
};

// Función para verificar z-index de elementos
window.checkZIndex = () => {
  const elements = document.querySelectorAll('*');
  const highZIndex = Array.from(elements)
    .map(el => ({
      element: el,
      zIndex: parseInt(window.getComputedStyle(el).zIndex) || 0
    }))
    .filter(item => item.zIndex > 1000)
    .sort((a, b) => b.zIndex - a.zIndex);
  
  console.log('Elementos con z-index alto:', highZIndex.slice(0, 10));
};

// Llamar la siguiente línea en la consola para probar: window.openIaCPanel()
