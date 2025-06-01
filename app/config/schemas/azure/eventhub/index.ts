import azureEventHubNamespaceResource from './namespace/eventHubNamespace';
// Importar otros recursos de Event Hubs (ej. eventhub, consumer_group) aquí si se añaden en el futuro.

// Agrupa todos los recursos de Azure Event Hubs en un solo objeto.
const azureEventHubResources = {
  namespace: azureEventHubNamespaceResource,
  // eventhub: azureEventHubResource, // Ejemplo
};

export { azureEventHubResources }; // Exportación nombrada
