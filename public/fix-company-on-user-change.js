(function() {
  console.log('🔧 Company state fix on user change script loaded');
  
  // Monitor auth state changes
  let previousUserId = localStorage.getItem('previousUserId');
  
  function checkUserChange() {
    const userData = localStorage.getItem('user');
    if (!userData) return;
    
    try {
      const user = JSON.parse(userData);
      const currentUserId = user._id || user.id;
      
      if (previousUserId && previousUserId !== currentUserId) {
        console.log('🚨 User changed detected!', {
          previousUser: previousUserId,
          currentUser: currentUserId
        });
        
        // Clear company-related data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('company') || 
            key.includes('Company') ||
            key.includes('workspace') ||
            key.includes('lastCompany') ||
            key === 'company-storage'
          )) {
            keysToRemove.push(key);
          }
        }
        
        console.log('🗑️ Removing company-related keys:', keysToRemove);
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Force reload to ensure clean state
        console.log('🔄 Reloading page for clean state...');
        window.location.reload();
      }
      
      // Update previous user
      localStorage.setItem('previousUserId', currentUserId);
      
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  // Check on load
  checkUserChange();
  
  // Monitor storage changes
  window.addEventListener('storage', (e) => {
    if (e.key === 'user') {
      checkUserChange();
    }
  });
  
  // Also check periodically
  setInterval(checkUserChange, 1000);
  
})();
