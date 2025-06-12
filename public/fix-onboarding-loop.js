// Script para arreglar el loop de onboarding
console.log('🔧 [FIX] Ejecutando fix para loop de onboarding...');

// Obtener el usuario actual
const userStr = localStorage.getItem('user');
if (userStr) {
  try {
    const user = JSON.parse(userStr);
    const userId = user._id || user.id;
    
    if (userId) {
      // Marcar onboarding como completado
      localStorage.setItem(`onboarding_completed_${userId}`, 'true');
      console.log('✅ [FIX] Onboarding marcado como completado para usuario:', userId);
      
      // Verificar estado
      const isCompleted = localStorage.getItem(`onboarding_completed_${userId}`);
      console.log('🔍 [FIX] Estado de onboarding:', isCompleted);
      
      // Recargar la página para aplicar los cambios
      console.log('🔄 [FIX] Recargando página en 2 segundos...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      console.error('❌ [FIX] No se pudo obtener el ID del usuario');
    }
  } catch (e) {
    console.error('❌ [FIX] Error al parsear usuario:', e);
  }
} else {
  console.error('❌ [FIX] No hay usuario en localStorage');
}

// Función para resetear onboarding (útil para testing)
window.resetOnboarding = function() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const userId = user._id || user.id;
      if (userId) {
        localStorage.removeItem(`onboarding_completed_${userId}`);
        console.log('🔄 [RESET] Onboarding reseteado para usuario:', userId);
      }
    } catch (e) {
      console.error('❌ [RESET] Error:', e);
    }
  }
}

console.log('💡 [FIX] Tip: Usa window.resetOnboarding() para resetear el estado del onboarding');
