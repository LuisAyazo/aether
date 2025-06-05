import azureServiceBusNamespaceResource from './namespace/serviceBusNamespace';
// Importar otros recursos de Service Bus (ej. queue, topic) aquí si se añaden en el futuro.

// Agrupa todos los recursos de Azure Service Bus en un solo objeto.
const azureServiceBusResources = {
  namespace: azureServiceBusNamespaceResource,
  // queue: azureServiceBusQueueResource, // Ejemplo
  // topic: azureServiceBusTopicResource, // Ejemplo
};

export { azureServiceBusResources }; // Exportación nombrada
