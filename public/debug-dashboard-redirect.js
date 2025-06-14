// Script de debug para el problema de redirección al login
console.log('🔍 [DASHBOARD DEBUG] Script loaded');

// Interceptar router.push para ver todas las redirecciones
const originalPush = window.history.pushState;
window.history.pushState = function(...args) {
    console.log('🚀 [DASHBOARD DEBUG] pushState called:', {
        url: args[2],
        state: args[0],
        title: args[1],
        stack: new Error().stack
    });
    return originalPush.apply(window.history, args);
};

// Monitorear cambios en localStorage
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    if (key === 'user' || key === 'token') {
        console.log('💾 [DASHBOARD DEBUG] localStorage.setItem:', key, value);
    }
    return originalSetItem.apply(localStorage, arguments);
};

const originalRemoveItem = localStorage.removeItem;
localStorage.removeItem = function(key) {
    if (key === 'user' || key === 'token') {
        console.log('🗑️ [DASHBOARD DEBUG] localStorage.removeItem:', key);
        console.trace('Remove item stack trace');
    }
    return originalRemoveItem.apply(localStorage, arguments);
};

// Verificar estado actual
console.log('📊 [DASHBOARD DEBUG] Current state:', {
    pathname: window.location.pathname,
    user: localStorage.getItem('user'),
    token: localStorage.getItem('token'),
    hasUser: !!localStorage.getItem('user'),
    hasToken: !!localStorage.getItem('token')
});

// Monitorear cambios de URL
let lastUrl = window.location.href;
setInterval(() => {
    if (window.location.href !== lastUrl) {
        console.log('🔄 [DASHBOARD DEBUG] URL changed:', {
            from: lastUrl,
            to: window.location.href,
            timestamp: new Date().toISOString()
        });
        lastUrl = window.location.href;
        
        // Si cambió a /login, mostrar por qué
        if (window.location.pathname === '/login') {
            console.error('❌ [DASHBOARD DEBUG] Redirected to login!', {
                user: localStorage.getItem('user'),
                token: localStorage.getItem('token'),
                pathname: window.location.pathname
            });
        }
    }
}, 100);

// Interceptar fetch para ver llamadas a /auth/me
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('/auth/me')) {
        console.log('🌐 [DASHBOARD DEBUG] Fetch to /auth/me:', {
            url,
            headers: args[1]?.headers
        });
        
        return originalFetch.apply(window, args).then(response => {
            const clonedResponse = response.clone();
            clonedResponse.json().then(data => {
                console.log('📥 [DASHBOARD DEBUG] /auth/me response:', {
                    status: response.status,
                    ok: response.ok,
                    data
                });
            }).catch(() => {
                console.log('📥 [DASHBOARD DEBUG] /auth/me response (non-JSON):', {
                    status: response.status,
                    ok: response.ok
                });
            });
            return response;
        });
    }
    return originalFetch.apply(window, args);
};

console.log('✅ [DASHBOARD DEBUG] Debug hooks installed');