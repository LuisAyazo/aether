// Script para limpiar la autenticación y forzar nuevo login
// Ejecutar en la consola del navegador

console.log('🧹 Limpiando autenticación...');

// Limpiar todo el localStorage
localStorage.clear();

// Limpiar sessionStorage
sessionStorage.clear();

// Limpiar cookies (si las hay)
document.cookie.split(";").forEach((c) => {
  document.cookie = c
    .replace(/^ +/, "")
    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});

console.log('✅ Autenticación limpiada');
console.log('🔄 Redirigiendo al login...');

// Redirigir al login
window.location.href = '/login';
