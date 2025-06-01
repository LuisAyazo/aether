import azureRedisCacheResource from './rediscache/redisCache';

// Agrupa todos los recursos de Azure Cache en un solo objeto.
const azureCacheResources = {
  rediscache: azureRedisCacheResource,
  // Aquí se podrían añadir otros recursos de Azure Cache en el futuro.
};

export { azureCacheResources }; // Exportación nombrada
