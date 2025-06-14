# Script de Debug para el Flujo de Autenticación

## Problema
El usuario está siendo redirigido al login después de completar el onboarding, a pesar de tener todos los datos correctos en la base de datos.

## Script de Debug

Copia y pega este script en la consola del navegador cuando estés en la página de login:

```javascript
// Script de Debug del Flujo de Autenticación
(async function debugAuthFlow() {
  console.clear();
  console.log('%c🔍 DEBUG DE AUTENTICACIÓN INICIADO', 'color: #ff6b6b; font-size: 20px; font-weight: bold');
  console.log('=' .repeat(50));
  
  // 1. Verificar estado de localStorage
  console.group('📦 LocalStorage');
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  console.log('User:', user ? JSON.parse(user) : 'NO EXISTE');
  console.log('Token:', token ? '✅ Existe' : '❌ NO EXISTE');
  console.groupEnd();
  
  // 2. Verificar sesión de Supabase
  console.group('🔐 Sesión de Supabase');
  try {
    // Importar Supabase
    const { supabase } = await import('/app/lib/supabase.js');
    
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session:', session ? {
      user_id: session.user.id,
      email: session.user.email,
      expires_at: new Date(session.expires_at * 1000).toLocaleString()
    } : '❌ NO HAY SESIÓN');
    
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    console.log('Supabase User:', supabaseUser ? {
      id: supabaseUser.id,
      email: supabaseUser.email,
      created_at: supabaseUser.created_at
    } : '❌ NO HAY USUARIO');
  } catch (error) {
    console.error('Error verificando Supabase:', error);
  }
  console.groupEnd();
  
  // 3. Interceptar navegación
  console.group('🚦 Interceptando Navegación');
  
  // Guardar referencias originales
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  // Interceptar history.pushState
  history.pushState = function(...args) {
    console.log('%c[NAVIGATION] pushState', 'color: #4ecdc4', {
      url: args[2],
      from: window.location.pathname,
      stack: new Error().stack.split('\n').slice(2, 5).join('\n')
    });
    return originalPushState.apply(history, args);
  };
  
  // Interceptar history.replaceState
  history.replaceState = function(...args) {
    console.log('%c[NAVIGATION] replaceState', 'color: #4ecdc4', {
      url: args[2],
      from: window.location.pathname,
      stack: new Error().stack.split('\n').slice(2, 5).join('\n')
    });
    return originalReplaceState.apply(history, args);
  };
  
  // Interceptar window.location
  let locationDescriptor = Object.getOwnPropertyDescriptor(window, 'location');
  Object.defineProperty(window, 'location', {
    get: function() {
      return locationDescriptor.get.call(window);
    },
    set: function(value) {
      console.log('%c[NAVIGATION] window.location =', 'color: #ff6b6b', {
        url: value,
        from: window.location.pathname,
        stack: new Error().stack.split('\n').slice(2, 5).join('\n')
      });
      return locationDescriptor.set.call(window, value);
    }
  });
  
  console.log('✅ Navegación interceptada. Cualquier redirect será logueado.');
  console.groupEnd();
  
  // 4. Monitorear cambios en localStorage
  console.group('👁️ Monitoreando LocalStorage');
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;
  
  localStorage.setItem = function(key, value) {
    if (key === 'user' || key === 'token' || key.includes('supabase')) {
      console.log('%c[STORAGE] setItem', 'color: #f39c12', {
        key,
        value: value?.substring(0, 100) + '...',
        stack: new Error().stack.split('\n').slice(2, 4).join('\n')
      });
    }
    return originalSetItem.call(localStorage, key, value);
  };
  
  localStorage.removeItem = function(key) {
    if (key === 'user' || key === 'token' || key.includes('supabase')) {
      console.log('%c[STORAGE] removeItem', 'color: #e74c3c', {
        key,
        stack: new Error().stack.split('\n').slice(2, 4).join('\n')
      });
    }
    return originalRemoveItem.call(localStorage, key);
  };
  
  console.log('✅ LocalStorage monitoreado.');
  console.groupEnd();
  
  // 5. Función para navegar manualmente
  window.debugNavigate = function(path) {
    console.log(`%c🚀 Navegando manualmente a: ${path}`, 'color: #27ae60; font-size: 16px');
    window.location.href = path;
  };
  
  console.log('=' .repeat(50));
  console.log('%c✅ DEBUG ACTIVADO', 'color: #27ae60; font-size: 16px; font-weight: bold');
  console.log('');
  console.log('📝 INSTRUCCIONES:');
  console.log('1. Intenta hacer login normalmente');
  console.log('2. Observa los logs en la consola');
  console.log('3. Si quieres navegar manualmente, usa: debugNavigate("/dashboard")');
  console.log('');
  console.log('🔍 Los logs mostrarán:');
  console.log('   - Cambios en localStorage');
  console.log('   - Intentos de navegación');
  console.log('   - Stack traces para identificar qué código está causando los redirects');
  
})();
```

## Pasos para Diagnosticar

1. **Abre la consola del navegador** (F12 → Console)
2. **Copia y pega el script completo** en la consola
3. **Presiona Enter** para ejecutarlo
4. **Intenta hacer login** normalmente
5. **Observa los logs** que aparecen en la consola

## Qué Buscar en los Logs

1. **[NAVIGATION] replaceState o pushState a /login** - Esto indicará qué está causando el redirect
2. **[STORAGE] removeItem** - Si se está eliminando el usuario o token
3. **Stack traces** - Te mostrarán exactamente qué archivo y línea está causando el redirect

## Solución Temporal

Si necesitas acceder al dashboard mientras debugueamos:

```javascript
// En la consola, después de ejecutar el script de debug:
debugNavigate('/dashboard');
```

## Información Adicional para Compartir

Después de ejecutar el script y reproducir el problema, comparte:
1. Los logs que aparecen en la consola
2. El stack trace del redirect a /login
3. El estado de localStorage y Supabase que se muestra al inicio