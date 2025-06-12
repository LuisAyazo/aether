// Script para diagnosticar problemas con la sección de Equipo
(function() {
  console.log('=== DIAGNOSE TEAM SECTION ===');
  
  // 1. Buscar el botón de Equipo
  const findTeamButton = () => {
    const buttons = document.querySelectorAll('button');
    for (const button of buttons) {
      if (button.textContent?.includes('Equipo')) {
        return button;
      }
    }
    return null;
  };
  
  // 2. Verificar estado actual
  window.checkTeamState = function() {
    console.log('\n📊 Estado actual:');
    
    // URL actual
    const url = new URL(window.location.href);
    const section = url.searchParams.get('section');
    console.log('URL section:', section);
    
    // Botón de Equipo
    const teamButton = findTeamButton();
    if (teamButton) {
      console.log('✅ Botón de Equipo encontrado');
      // Ver si está activo
      const isActive = teamButton.className.includes('bg-orange') || 
                      teamButton.className.includes('border-orange');
      console.log('¿Está activo?', isActive);
      
      // Ver eventos del botón
      const events = teamButton._reactProps || teamButton.__reactEventHandlers || {};
      console.log('Eventos del botón:', events);
    } else {
      console.log('❌ Botón de Equipo NO encontrado');
    }
    
    // Contenido de Team
    const teamContent = document.body.innerHTML.includes('Configuración del Equipo') ||
                       document.body.innerHTML.includes('Potencia tu Equipo');
    console.log('¿Contenido de Team visible?', teamContent);
  };
  
  // 3. Simular click en el botón
  window.clickTeamButton = function() {
    const teamButton = findTeamButton();
    if (teamButton) {
      console.log('🖱️ Simulando click en botón de Equipo...');
      teamButton.click();
      
      // Verificar después del click
      setTimeout(() => {
        checkTeamState();
      }, 500);
    } else {
      console.log('❌ No se puede hacer click - botón no encontrado');
    }
  };
  
  // 4. Forzar navegación directa
  window.forceTeamSection = function() {
    console.log('🚀 Forzando navegación a sección de Equipo...');
    
    // Método 1: Cambiar URL y recargar
    const newUrl = '/dashboard?section=team';
    if (window.location.search !== '?section=team') {
      window.location.href = newUrl;
    } else {
      console.log('Ya estás en section=team, pero parece que no se renderiza');
      // Forzar recarga
      window.location.reload();
    }
  };
  
  // 5. Verificar React Router
  window.checkReactRouter = function() {
    // Buscar el router de Next.js
    const router = window.next?.router;
    if (router) {
      console.log('Next.js router encontrado:', router);
      console.log('Ruta actual:', router.pathname);
      console.log('Query actual:', router.query);
    }
  };
  
  // Auto-diagnóstico inicial
  setTimeout(() => {
    console.log('\n🔍 Diagnóstico inicial:');
    checkTeamState();
  }, 1000);
  
  console.log('\n💡 Comandos disponibles:');
  console.log('checkTeamState() - Ver estado actual');
  console.log('clickTeamButton() - Simular click en el botón');
  console.log('forceTeamSection() - Forzar navegación directa');
  console.log('checkReactRouter() - Ver estado del router');
})();
