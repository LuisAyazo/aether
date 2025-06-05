import azureEventGridTopicResource from './topic/eventGridTopic';
// Importar otros recursos de Event Grid (ej. domain, system_topic, event_subscription) aquí si se añaden en el futuro.

// Agrupa todos los recursos de Azure Event Grid en un solo objeto.
const azureEventGridResources = {
  topic: azureEventGridTopicResource,
  // domain: azureEventGridDomainResource, // Ejemplo
};

export { azureEventGridResources }; // Exportación nombrada
