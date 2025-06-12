// Debug específico para la navegación a la sección de Equipo
(function() {
  console.log('=== DEBUG TEAM NAVIGATION ===');
  
  // 1. Verificar si la sección team está en la URL
  const params = new URLSearchParams(window.location.search);
  const currentSection = params.get('section');
  console.log('Current section in URL:', currentSection);
  
  // 2. Verificar el estado interno del dashboard
  const checkDashboardState = () => {
    // Buscar todos los elementos que podrían ser el contenido de team
    const teamContent = document.querySelector('[class*="TeamSettingsPage"]');
    const diagramsContent = document.querySelector('[class*="FlowEditor"]');
    
    console.log('Team content visible?', !!teamContent);
    console.log('Diagrams content visible?', !!diagramsContent);
    
    // Verificar qué sección está activa según el contenido visible
    if (teamContent) {
      console.log('✅ Team section is rendered');
    } else {
      console.log('❌ Team section is NOT rendered');
    }
  };
  
  // 3. Función para forzar navegación a team
  window.forceTeamNavigation = function() {
    console.log('🚀 Forcing navigation to team section...');
    
    // Método 1: Actualizar URL directamente
    const newUrl = `${window.location.pathname}?section=team`;
    window.history.pushState({}, '', newUrl);
    
    // Método 2: Disparar evento para que Next.js detecte el cambio
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    
    // Método 3: Recargar con la nueva URL
    setTimeout(() => {
      if (params.get('section') !== 'team') {
        console.log('URL not updated, forcing reload...');
        window.location.href = newUrl;
      }
    }, 1000);
  };
  
  // 4. Interceptar clicks en el botón de Equipo
  const interceptTeamButton = () => {
    const buttons = document.querySelectorAll('button');
    let teamButton = null;
    
    buttons.forEach(button => {
      if (button.textContent?.includes('Equipo')) {
        teamButton = button;
        console.log('Found team button:', button);
        
        // Clonar para remover listeners existentes
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Agregar nuevo listener
        newButton.addEventListener('click', (e) => {
          console.log('🔘 Team button clicked!');
          e.preventDefault();
          e.stopPropagation();
          forceTeamNavigation();
        });
      }
    });
    
    if (!teamButton) {
      console.log('❌ Team button not found');
    }
  };
  
  // 5. Verificar el estado cada segundo
  setInterval(() => {
    const currentParams = new URLSearchParams(window.location.search);
    const section = currentParams.get('section');
    
    if (section === 'team') {
      console.log('📍 URL shows team section');
      checkDashboardState();
    }
  }, 1000);
  
  // Ejecutar después de que el DOM esté listo
  setTimeout(() => {
    interceptTeamButton();
    checkDashboardState();
  }, 1000);
  
  console.log('\n💡 Commands:');
  console.log('forceTeamNavigation() - Force navigation to team section');
})();
