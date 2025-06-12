console.log('🧹 Limpiando caché de company...');

// Limpiar localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('company') || key.includes('Company'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log(`Removiendo: ${key}`);
  localStorage.removeItem(key);
});

// Limpiar sessionStorage
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (key.includes('company') || key.includes('Company'))) {
    sessionKeysToRemove.push(key);
  }
}

sessionKeysToRemove.forEach(key => {
  console.log(`Removiendo de session: ${key}`);
  sessionStorage.removeItem(key);
});

console.log('✅ Caché limpiado. Recargando página...');

// Recargar la página en 1 segundo
setTimeout(() => {
  window.location.reload();
}, 1000);
