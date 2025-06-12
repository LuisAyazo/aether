// Script simple para forzar navegación a la sección de Equipo
(function() {
  console.log('=== FORCE TEAM NAVIGATION ===');
  
  // Función directa para ir a la sección de Equipo
  window.goToTeam = function() {
    console.log('🚀 Navigating to Team section...');
    window.location.href = '/dashboard?section=team';
  };
  
  // Función para verificar qué está pasando
  window.checkTeamSection = function() {
    const url = new URL(window.location.href);
    const section = url.searchParams.get('section');
    console.log('Current section in URL:', section);
    
    // Ver si el contenido de team está renderizado
    const hasTeamContent = document.body.innerHTML.includes('Configuración del Equipo') || 
                          document.body.innerHTML.includes('Gestión de miembros');
    console.log('Team content found in page?', hasTeamContent);
    
    // Ver todas las secciones renderizadas
    const sections = ['diagrams', 'credentials', 'environments', 'deployments', 'settings', 'team'];
    sections.forEach(s => {
      const element = document.querySelector(`[data-section="${s}"]`);
      console.log(`Section ${s} element:`, element);
    });
  };
  
  // Auto-check al cargar
  setTimeout(() => {
    checkTeamSection();
  }, 1000);
  
  console.log('\n💡 Usa estos comandos:');
  console.log('goToTeam() - Ir directamente a la sección de Equipo');
  console.log('checkTeamSection() - Verificar el estado actual');
})();
