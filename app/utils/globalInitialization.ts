/**
 * Global initialization state to prevent multiple initializations
 * This is necessary to handle React StrictMode double rendering
 */

interface GlobalInitState {
  isInitializing: boolean;
  isInitialized: boolean;
  lastInitTime: number;
}

// Global state outside of React to survive re-renders
const globalInitState: GlobalInitState = {
  isInitializing: false,
  isInitialized: false,
  lastInitTime: 0
};

export function canInitialize(): boolean {
  const now = Date.now();
  
  // If already initializing, don't start another
  if (globalInitState.isInitializing) {
    console.log('[GlobalInit] Already initializing, skipping');
    return false;
  }
  
  // If initialized recently (within 5 seconds), skip
  if (globalInitState.isInitialized && (now - globalInitState.lastInitTime) < 5000) {
    console.log('[GlobalInit] Recently initialized, skipping');
    return false;
  }
  
  return true;
}

export function markInitializing(): void {
  globalInitState.isInitializing = true;
  console.log('[GlobalInit] Marked as initializing');
}

export function markInitialized(): void {
  globalInitState.isInitializing = false;
  globalInitState.isInitialized = true;
  globalInitState.lastInitTime = Date.now();
  console.log('[GlobalInit] Marked as initialized');
}

export function resetInitialization(): void {
  globalInitState.isInitializing = false;
  globalInitState.isInitialized = false;
  globalInitState.lastInitTime = 0;
  console.log('[GlobalInit] Reset initialization state');
}
