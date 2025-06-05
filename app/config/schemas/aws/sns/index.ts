import awsSnsTopicResource from './topic';

// Agrupa todos los recursos de SNS en un solo objeto para facilitar su importación.
const awsSnsResources = {
  topic: awsSnsTopicResource,
  // Aquí se podrían añadir otros recursos de SNS en el futuro, como subscriptions, etc.
  // Ejemplo: subscription: awsSnsSubscriptionResource,
};

export default awsSnsResources;
