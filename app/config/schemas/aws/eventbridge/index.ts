import awsEventBridgeRuleResource from './rule';

// Agrupa todos los recursos de EventBridge en un solo objeto para facilitar su importación.
const awsEventBridgeResources = {
  rule: awsEventBridgeRuleResource,
  // Aquí se podrían añadir otros recursos de EventBridge en el futuro, como 'target', 'bus', etc.
  // Ejemplo: target: awsEventBridgeTargetResource,
};

export default awsEventBridgeResources;
