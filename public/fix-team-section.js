// Fix específico para la sección de Equipo
(function() {
  console.log('=== FIX TEAM SECTION ===');
  
  // 1. Verificar el estado actual
  const activeCompany = JSON.parse(localStorage.getItem('activeCompany') || '{}');
  const isPersonalSpace = activeCompany.name?.includes('Personal Space') || activeCompany.isPersonalSpace;
  
  console.log('Active Company:', activeCompany);
  console.log('Is Personal Space?', isPersonalSpace);
  
  if (isPersonalSpace) {
    console.log('⚠️ PROBLEMA: La sección de Equipo está deshabilitada para espacios personales');
    console.log('La compañía actual parece ser un espacio personal, por eso no funciona');
  }
  
  // 2. Función para ir directamente a la sección de equipo
  window.forceTeam = function() {
    console.log('🚀 Forzando navegación a Equipo...');
    window.location.href = '/dashboard?section=team';
  };
  
  // 3. Ver qué secciones están disponibles
  const currentSection = new URLSearchParams(window.location.search).get('section') || 'diagrams';
  console.log('Sección actual:', currentSection);
  
  // 4. Listar todas las secciones disponibles según el tipo de compañía
  if (isPersonalSpace) {
    console.log('\n📋 Secciones disponibles para Espacio Personal:');
    console.log('- diagrams (Diagramas)');
    console.log('- credentials (Credenciales)');
    console.log('- environments (Ambientes)');
    console.log('- deployments (Despliegues)');
    console.log('- settings (Configuración)');
    console.log('❌ team (Equipo) - NO DISPONIBLE EN ESPACIOS PERSONALES');
  } else {
    console.log('\n📋 Secciones disponibles para Compañía:');
    console.log('- diagrams (Diagramas)');
    console.log('- credentials (Credenciales)');
    console.log('- environments (Ambientes)');
    console.log('- deployments (Despliegues)');
    console.log('- settings (Ajustes Compañía)');
    console.log('- team (Equipo) ✅');
  }
  
  console.log('\n💡 Comandos disponibles:');
  console.log('forceTeam() - Intenta ir a la sección de Equipo');
  
  // 5. Si la compañía actual es personal, sugerir cambiar a una compañía real
  if (isPersonalSpace) {
    console.log('\n⚠️ Para acceder a la sección de Equipo, debes cambiar a una compañía (no espacio personal)');
    console.log('Usa el selector de compañías en el sidebar para cambiar');
  }
})();
