console.log('🔍 DIAGNÓSTICO COMPLETO DEL ESTADO DE COMPANIES');
console.log('================================================');

// 1. Verificar localStorage
console.log('\n1. LOCALSTORAGE:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('company') || key.includes('Company') || key.includes('navigation'))) {
    console.log(`   ${key} = ${localStorage.getItem(key)}`);
  }
}

// 2. Verificar sessionStorage
console.log('\n2. SESSIONSTORAGE:');
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (key.includes('company') || key.includes('Company'))) {
    console.log(`   ${key} = ${sessionStorage.getItem(key)}`);
  }
}

// 3. Verificar stores de Zustand
console.log('\n3. ZUSTAND STORES:');
const stores = ['navigation-store', 'company-store'];
stores.forEach(store => {
  const data = localStorage.getItem(store);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      console.log(`   ${store}:`, parsed);
    } catch (e) {
      console.log(`   ${store}: Error parsing`);
    }
  }
});

// 4. Verificar el estado actual de la aplicación
console.log('\n4. ESTADO ACTUAL DE LA APP:');
if (window.__NEXT_DATA__) {
  console.log('   Next.js data:', window.__NEXT_DATA__.props);
}

// 5. Limpiar TODO el estado relacionado con companies
console.log('\n5. LIMPIANDO TODO EL ESTADO...');

// Limpiar localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log(`   Removiendo localStorage: ${key}`);
  localStorage.removeItem(key);
});

// Limpiar sessionStorage
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key) {
    sessionKeysToRemove.push(key);
  }
}

sessionKeysToRemove.forEach(key => {
  console.log(`   Removiendo sessionStorage: ${key}`);
  sessionStorage.removeItem(key);
});

// Limpiar cookies relacionadas
document.cookie.split(";").forEach(function(c) { 
  const eqPos = c.indexOf("=");
  const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
  if (name.includes('company') || name.includes('Company')) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    console.log(`   Removiendo cookie: ${name}`);
  }
});

console.log('\n✅ ESTADO COMPLETAMENTE LIMPIADO');
console.log('🔄 Recargando en modo limpio...');

// Recargar completamente la aplicación
setTimeout(() => {
  window.location.href = window.location.origin + '/dashboard';
}, 1500);
