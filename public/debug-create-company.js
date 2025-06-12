// Debug script para create-company
console.log('🔍 [CREATE-COMPANY DEBUG] Script loaded');

// Interceptar fetch para ver las llamadas
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  if (url && typeof url === 'string' && url.includes('/companies')) {
    console.log('🚀 [CREATE-COMPANY DEBUG] Fetch intercepted:', {
      url,
      method: options?.method || 'GET',
      headers: options?.headers,
      body: options?.body
    });
  }
  
  return originalFetch.apply(this, args)
    .then(response => {
      if (url && typeof url === 'string' && url.includes('/companies')) {
        console.log('📥 [CREATE-COMPANY DEBUG] Response:', {
          url,
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });
        
        // Clone response to read body
        const clonedResponse = response.clone();
        clonedResponse.text().then(text => {
          try {
            const data = JSON.parse(text);
            console.log('📦 [CREATE-COMPANY DEBUG] Response data:', data);
          } catch (e) {
            console.log('📦 [CREATE-COMPANY DEBUG] Response text:', text);
          }
        });
      }
      return response;
    })
    .catch(error => {
      if (url && typeof url === 'string' && url.includes('/companies')) {
        console.error('❌ [CREATE-COMPANY DEBUG] Fetch error:', error);
      }
      throw error;
    });
};

// Monitor form submission
setTimeout(() => {
  const form = document.querySelector('form');
  if (form) {
    console.log('📝 [CREATE-COMPANY DEBUG] Form found, adding submit listener');
    form.addEventListener('submit', (e) => {
      console.log('📮 [CREATE-COMPANY DEBUG] Form submitted');
    });
  }
  
  // Monitor button state
  const button = document.querySelector('button[type="submit"]');
  if (button) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
          console.log('🔘 [CREATE-COMPANY DEBUG] Button disabled state:', button.disabled);
        }
      });
    });
    observer.observe(button, { attributes: true });
  }
}, 1000);
