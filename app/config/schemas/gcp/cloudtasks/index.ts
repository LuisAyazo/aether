import gcpCloudTasksQueueResource from './queue';

// Agrupa todos los recursos de Cloud Tasks en un solo objeto para facilitar su importación.
const gcpCloudTasksResources = {
  queue: gcpCloudTasksQueueResource,
  // Aquí se podrían añadir otros recursos de Cloud Tasks en el futuro.
};

export default gcpCloudTasksResources;
