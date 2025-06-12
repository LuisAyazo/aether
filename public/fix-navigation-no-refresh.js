// Fix navegación sin refresh completo
(function() {
  console.log('=== FIX NAVIGATION WITHOUT REFRESH ===');
  
  // Función para cambiar sección sin recargar la página
  window.changeSection = function(section) {
    console.log(`🎯 Changing to section: ${section}`);
    
    // Actualizar URL sin recargar
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('section', section);
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    window.history.pushState({}, '', newUrl);
    
    // Disparar evento popstate para que React Router detecte el cambio
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    
    // También intentar llamar directamente a la función de cambio de sección
    const dashboard = document.querySelector('[data-section-handler]');
    if (dashboard && dashboard.__reactInternalInstance) {
      console.log('Found React component, trying direct call...');
    }
    
    // Forzar re-render del componente
    const event = new Event('hashchange');
    window.dispatchEvent(event);
    
    console.log(`✅ Section changed to: ${section}`);
  };
  
  // Esperar a que el DOM esté listo
  const fixButtons = () => {
    // Buscar todos los botones del sidebar
    const buttons = document.querySelectorAll('nav button');
    console.log(`Found ${buttons.length} nav buttons`);
    
    buttons.forEach((button) => {
      const text = button.textContent?.trim() || '';
      
      // Mapear texto a sección
      let section = '';
      if (text.includes('Diagramas')) section = 'diagrams';
      else if (text.includes('Credenciales')) section = 'credentials';
      else if (text.includes('Ambientes')) section = 'environments';
      else if (text.includes('Despliegues')) section = 'deployments';
      else if (text.includes('Configuración') || text.includes('Ajustes')) section = 'settings';
      else if (text.includes('Equipo')) section = 'team';
      
      if (section) {
        // Clonar el botón para remover event listeners existentes
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Agregar nuevo event listener
        newButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log(`🔘 Button clicked: ${text} -> ${section}`);
          
          // Cambiar sección sin refresh
          changeSection(section);
          
          // Forzar actualización del estado interno del sidebar
          setTimeout(() => {
            // Buscar el componente de React y forzar actualización
            const sidebarElement = newButton.closest('[class*="CompanySidebar"]') || newButton.closest('nav');
            if (sidebarElement) {
              // Disparar evento personalizado
              const event = new CustomEvent('sectionChange', { detail: { section } });
              sidebarElement.dispatchEvent(event);
            }
          }, 100);
        });
        
        console.log(`✅ Fixed button: ${text} -> ${section}`);
      }
    });
  };
  
  // Ejecutar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixButtons);
  } else {
    setTimeout(fixButtons, 500);
  }
  
  // También monitorear cambios en la URL
  let lastSection = new URLSearchParams(window.location.search).get('section') || 'diagrams';
  
  setInterval(() => {
    const currentSection = new URLSearchParams(window.location.search).get('section') || 'diagrams';
    if (currentSection !== lastSection) {
      console.log(`📍 Section changed from ${lastSection} to ${currentSection}`);
      lastSection = currentSection;
      
      // Forzar actualización del componente Dashboard
      const dashboardElement = document.querySelector('[class*="DashboardPage"]');
      if (dashboardElement) {
        const event = new CustomEvent('sectionUpdate', { detail: { section: currentSection } });
        dashboardElement.dispatchEvent(event);
      }
    }
  }, 100);
  
  console.log('\n💡 Use changeSection("team") to change section without refresh');
})();
