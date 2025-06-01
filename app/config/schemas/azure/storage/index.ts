import azureStorageContainerResource from './storagecontainer/storageContainer';
import azureStorageShareResource from './storageshare/storageShare';

// Agrupa todos los recursos de Azure Storage en un solo objeto.
const azureStorageResources = {
  storagecontainer: azureStorageContainerResource,
  storageshare: azureStorageShareResource,
  // Aquí se podrían añadir otros recursos de Azure Storage en el futuro,
  // por ejemplo: storageaccount, queue, table, etc.
};

export { azureStorageResources }; // Exportación nombrada
