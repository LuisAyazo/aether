/**
 * Tracker global para prevenir llamadas duplicadas a la API
 */
class ApiCallTracker {
  private activeCalls: Map<string, Promise<any>> = new Map();
  private completedCalls: Set<string> = new Set();

  /**
   * Ejecuta una llamada solo si no está ya en progreso o completada
   */
  async executeOnce<T>(
    key: string, 
    fn: () => Promise<T>,
    options: { 
      allowRetry?: boolean; 
      ttl?: number;
    } = {}
  ): Promise<T> {
    const { allowRetry = false, ttl = 60000 } = options; // TTL default: 1 minuto
    
    console.log(`[ApiCallTracker] executeOnce called for key: ${key}`, {
      isActive: this.activeCalls.has(key),
      isCompleted: this.completedCalls.has(key),
      allowRetry
    });

    // Si ya está completa y no permitimos retry, retornar undefined
    if (this.completedCalls.has(key) && !allowRetry) {
      console.log(`[ApiCallTracker] Call already completed for key: ${key}, skipping`);
      throw new Error('Call already completed');
    }

    // Si ya hay una llamada activa, retornar esa promesa
    const activeCall = this.activeCalls.get(key);
    if (activeCall) {
      console.log(`[ApiCallTracker] Returning existing promise for key: ${key}`);
      return activeCall;
    }

    // Crear nueva llamada
    console.log(`[ApiCallTracker] Creating new call for key: ${key}`);
    const promise = fn()
      .then(result => {
        // Marcar como completada
        this.completedCalls.add(key);
        this.activeCalls.delete(key);
        
        // Auto-limpiar después del TTL
        if (ttl > 0) {
          setTimeout(() => {
            this.completedCalls.delete(key);
            console.log(`[ApiCallTracker] TTL expired, cleared completed status for key: ${key}`);
          }, ttl);
        }
        
        return result;
      })
      .catch(error => {
        // En caso de error, limpiar para permitir reintentos
        this.activeCalls.delete(key);
        throw error;
      });

    this.activeCalls.set(key, promise);
    return promise;
  }

  /**
   * Limpia el estado para una key específica
   */
  clear(key: string) {
    this.activeCalls.delete(key);
    this.completedCalls.delete(key);
  }

  /**
   * Limpia todo el estado
   */
  clearAll() {
    this.activeCalls.clear();
    this.completedCalls.clear();
  }
}

export const apiCallTracker = new ApiCallTracker();
