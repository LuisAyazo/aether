// Fix para la navegación del sidebar
(function() {
  console.log('=== FIX NAVIGATION SIDEBAR ===');
  
  // Encontrar el componente CompanySidebar y debuggear
  const checkForSidebar = setInterval(() => {
    // Buscar todos los botones del sidebar
    const sidebarButtons = document.querySelectorAll('nav button[class*="rounded-lg"]');
    
    if (sidebarButtons.length > 0) {
      clearInterval(checkForSidebar);
      console.log(`Found ${sidebarButtons.length} sidebar buttons`);
      
      // Para cada botón, agregar event listener manual
      sidebarButtons.forEach((button, index) => {
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
          // Remover listeners existentes clonando el botón
          const newButton = button.cloneNode(true);
          button.parentNode.replaceChild(newButton, button);
          
          // Agregar nuevo listener
          newButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`🎯 Navigating to section: ${section}`);
            
            // Actualizar URL
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.set('section', section);
            const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
            
            // Forzar navegación
            window.history.pushState({}, '', newUrl);
            window.location.href = newUrl;
          });
          
          console.log(`✅ Fixed navigation for: ${text} -> ${section}`);
        }
      });
    }
  }, 500);
  
  // Función helper para navegación manual
  window.goToSection = function(section) {
    console.log(`🚀 Manual navigation to: ${section}`);
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('section', section);
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    window.location.href = newUrl;
  };
  
  console.log('\n💡 Use goToSection("team") to navigate manually');
})();
