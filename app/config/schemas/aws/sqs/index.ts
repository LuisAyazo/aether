import awsSqsQueueResource from './queue';

// Agrupa todos los recursos de SQS en un solo objeto para facilitar su importación.
const awsSqsResources = {
  queue: awsSqsQueueResource,
  // Aquí se podrían añadir otros recursos de SQS en el futuro si es necesario.
};

export default awsSqsResources;
