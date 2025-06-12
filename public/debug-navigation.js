// Debug para verificar el problema de navegación
(function() {
  console.log('=== DEBUG NAVIGATION ===');
  
  // 1. Verificar el estado actual de la URL
  const currentUrl = window.location.href;
  const searchParams = new URLSearchParams(window.location.search);
  console.log('Current URL:', currentUrl);
  console.log('Search params:', Object.fromEntries(searchParams));
  
  // 2. Verificar sessionStorage
  const companyId = localStorage.getItem('activeCompanyId');
  if (companyId) {
    const storedSection = sessionStorage.getItem(`activeSection_${companyId}`);
    console.log('Stored section in sessionStorage:', storedSection);
  }
  
  // 3. Interceptar clicks en los botones del sidebar
  console.log('Setting up click interceptor...');
  
  // Esperar un poco para que el DOM esté listo
  setTimeout(() => {
    const sidebarButtons = document.querySelectorAll('button[class*="rounded-lg"]');
    console.log('Found sidebar buttons:', sidebarButtons.length);
    
    sidebarButtons.forEach((button, index) => {
      // Clonar el botón para remover listeners existentes
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // Agregar nuevo listener
      newButton.addEventListener('click', function(e) {
        console.log(`\n🔘 Button ${index} clicked!`);
        console.log('Button text:', this.innerText);
        console.log('Event propagation stopped?', e.defaultPrevented);
        console.log('URL before click:', window.location.href);
        
        // Esperar un poco y verificar si cambió la URL
        setTimeout(() => {
          console.log('URL after click:', window.location.href);
          const newParams = new URLSearchParams(window.location.search);
          console.log('New search params:', Object.fromEntries(newParams));
        }, 100);
      });
    });
    
    console.log('✅ Click interceptor installed!');
  }, 1000);
  
  // 4. Verificar si Next.js router está funcionando
  if (window.next && window.next.router) {
    console.log('Next.js router available:', window.next.router);
  }
  
  // 5. Función para navegar manualmente
  window.navigateToSection = function(section) {
    console.log(`\n🚀 Manually navigating to section: ${section}`);
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('section', section);
    const newUrl = `${window.location.pathname}?${currentParams.toString()}`;
    console.log('New URL:', newUrl);
    window.history.pushState({}, '', newUrl);
    window.location.href = newUrl; // Forzar navegación
  };
  
  console.log('\n💡 TIP: Use navigateToSection("team") to manually navigate');
})();
