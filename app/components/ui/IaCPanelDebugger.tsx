// Script para inyectar depurador del panel IaC
export default function IaCPanelDebugger() {
  return (
    <script
      id="iac-panel-debugger"
      dangerouslySetInnerHTML={{
        __html: `
        console.log('IaC Panel Debugger activado');
        
        // Función para abrir manualmente el panel desde la consola para pruebas
        window.openIaCPanel = (nodeId) => {
          console.log('Intentando abrir panel IaC para nodo:', nodeId);
          
          const event = new CustomEvent('openIaCPanel', {
            detail: {
              nodeId: nodeId || document.querySelector('[data-provider="aws"]')?.getAttribute('data-id'),
              resourceData: {
                label: 'Test Resource',
                provider: 'aws',
                resourceType: 'ec2'
              }
            }
          });
          
          window.dispatchEvent(event);
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

        // Función para verificar si el portal existe
        window.checkPortal = () => {
          const portal = document.getElementById('iac-template-portal');
          console.log('Portal element exists:', !!portal);
          if (portal) {
            console.log('Portal element:', portal);
            console.log('Portal children:', portal.children);
          }
        };

        // Función para verificar eventos registrados
        window.checkEventListeners = () => {
          const events = ['openIaCPanel', 'nodeAction', 'nodeGroupFocus'];
          events.forEach(eventName => {
            console.log(\`Event listeners for \${eventName}:\`, 
              window.getEventListeners ? window.getEventListeners(window, eventName) : 'getEventListeners not available'
            );
          });
        };

        // Sobreescribir original ReactDOM.createPortal para depuración
        const originalCreatePortal = window.ReactDOM && window.ReactDOM.createPortal;
        if (originalCreatePortal) {
          window.ReactDOM.createPortal = function() {
            console.log('ReactDOM.createPortal llamado con:', arguments);
            return originalCreatePortal.apply(this, arguments);
          };
        }

        // Verificar estado inicial
        console.log('Estado inicial del depurador:');
        window.checkPortal();
        window.checkZIndex();
        `
      }}
    />
  );
}
