/**
 * Singleton para manejar requests únicos y prevenir múltiples llamadas concurrentes
 */

class SingletonRequestManager {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  async executeOnce<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Si ya hay una request pendiente, retornar esa promesa
    const pending = this.pendingRequests.get(key);
    if (pending) {
      console.log(`[SingletonRequest] Returning existing promise for key: ${key}`);
      return pending;
    }

    // Crear nueva promesa y guardarla
    console.log(`[SingletonRequest] Creating new request for key: ${key}`);
    const promise = requestFn()
      .then(result => {
        // Limpiar después de completar
        this.pendingRequests.delete(key);
        return result;
      })
      .catch(error => {
        // Limpiar también en caso de error
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(key?: string) {
    if (key) {
      this.pendingRequests.delete(key);
    } else {
      this.pendingRequests.clear();
    }
  }
}

export const singletonRequests = new SingletonRequestManager();
