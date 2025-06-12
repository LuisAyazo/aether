console.log('🔧 Arreglando company actual...');

// Limpiar toda referencia a la company anterior
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key.includes('currentCompany') || 
    key.includes('selectedCompany') ||
    key.includes('activeCompany') ||
    key === 'companyId' ||
    key.includes('d0de07b8-c73a-4262-9b5b-2cae53389c74') // ID de "hola mundo cruel"
  )) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log(`Removiendo: ${key} = ${localStorage.getItem(key)}`);
  localStorage.removeItem(key);
});

// Lo mismo para sessionStorage
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (
    key.includes('currentCompany') || 
    key.includes('selectedCompany') ||
    key.includes('activeCompany') ||
    key === 'companyId' ||
    key.includes('d0de07b8-c73a-4262-9b5b-2cae53389c74')
  )) {
    sessionKeysToRemove.push(key);
  }
}

sessionKeysToRemove.forEach(key => {
  console.log(`Removiendo de session: ${key} = ${sessionStorage.getItem(key)}`);
  sessionStorage.removeItem(key);
});

// Buscar en todos los stores de Zustand
if (window.localStorage.getItem('company-store')) {
  console.log('Limpiando company-store...');
  localStorage.removeItem('company-store');
}

console.log('✅ Referencias a company anterior limpiadas.');
console.log('🔄 Recargando página para seleccionar una company válida...');

// Recargar
setTimeout(() => {
  window.location.href = '/dashboard';
}, 1000);
