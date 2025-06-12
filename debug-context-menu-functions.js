// Depuración de funciones del menú contextual
console.log('🔍 Debug: Context Menu Functions Monitor');

// Interceptar eventos del menú contextual
const originalDispatchEvent = window.dispatchEvent;
window.dispatchEvent = function(event) {
  if (event.type === 'nodeAction' || event.type === 'groupAction') {
    console.log('📢 Event dispatched:', event.type, event.detail);
  }
  return originalDispatchEvent.call(this, event);
};

// Monitorear clicks en el menú
document.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (button && button.textContent) {
    const text = button.textContent.trim();
    if (text.includes('Agrupar') || text.includes('Duplicar') || text.includes('Eliminar') || text.includes('Mover')) {
      console.log('🖱️ Menu button clicked:', text);
      
      // Verificar el estado actual
      const reactFlowInstance = window.reactFlowInstance;
      if (reactFlowInstance) {
        const selectedNodes = reactFlowInstance.getNodes().filter(n => n.selected);
        console.log('📊 Selected nodes:', selectedNodes.length, selectedNodes.map(n => ({
          id: n.id,
          type: n.type,
          label: n.data?.label
        })));
      }
    }
  }
});

// Log cuando se crea un grupo
const originalSetNodes = Node.prototype.appendChild;
Node.prototype.appendChild = function(...args) {
  const result = originalSetNodes.apply(this, args);
  if (this.id && this.id.includes('group-')) {
    console.log('✅ New group node created:', this.id);
  }
  return result;
};

console.log('✅ Context menu functions debugger active');
