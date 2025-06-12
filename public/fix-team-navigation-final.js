// Script para arreglar la navegación a la sección de Equipo
(function() {
  console.log('=== FIX TEAM NAVIGATION ===');
  
  // 1. Verificar el estado actual
  window.checkTeam = function() {
    const url = new URL(window.location.href);
    const section = url.searchParams.get('section');
    console.log('Current section in URL:', section);
    
    // Buscar el contenido de Team
    const teamTitle = document.querySelector('h1')?.textContent;
    console.log('Page title:', teamTitle);
    
    // Ver si hay contenido de Team
    const hasTeamContent = document.body.textContent.includes('Configuración del Equipo') ||
                          document.body.textContent.includes('Potencia tu Equipo');
    console.log('Team content found:', hasTeamContent);
    
    // Buscar elementos específicos de Team
    const teamElements = document.querySelectorAll('[class*="team"], [class*="Team"]');
    console.log('Team-related elements:', teamElements.length);
  };
  
  // 2. Forzar navegación a Team
  window.goTeam = function() {
    console.log('🚀 Forcing navigation to Team section...');
    
    // Primero actualizar la URL
    const url = new URL(window.location.href);
    url.searchParams.set('section', 'team');
    
    // Método 1: Navegar con router.push
    if (window.next?.router) {
      console.log('Using Next.js router...');
      window.next.router.push(url.toString());
    } else {
      // Método 2: Cambiar la URL directamente
      console.log('Using direct navigation...');
      window.location.href = url.toString();
    }
  };
  
  // 3. Simular click en el botón de Equipo
  window.clickTeam = function() {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.includes('Equipo')) {
        console.log('Found Team button, clicking...');
        button.click();
        return true;
      }
    }
    console.log('Team button not found');
    return false;
  };
  
  // 4. Verificar componentes React
  window.checkReact = function() {
    // Buscar el componente TeamSettingsPage
    const reactFiber = document.querySelector('[class*="container"]')?._reactFiber$;
    if (reactFiber) {
      console.log('React fiber found:', reactFiber);
      console.log('Component type:', reactFiber.elementType?.name);
    }
    
    // Ver si hay errores en consola
    const originalError = console.error;
    console.error = function(...args) {
      console.log('🔴 Console error:', ...args);
      originalError.apply(console, args);
    };
  };
  
  // Auto-diagnóstico
  setTimeout(() => {
    console.log('\n📊 Initial check:');
    checkTeam();
  }, 500);
  
  console.log('\n💡 Comandos disponibles:');
  console.log('checkTeam() - Verificar estado actual');
  console.log('goTeam() - Ir directamente a Team');
  console.log('clickTeam() - Simular click en botón');
  console.log('checkReact() - Verificar componentes React');
})();
