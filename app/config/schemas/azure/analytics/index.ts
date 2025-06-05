import azureSynapseWorkspaceResource from './synapseworkspace/synapseWorkspace';

// Agrupa todos los recursos de Azure Analytics en un solo objeto.
const azureAnalyticsResources = {
  synapseworkspace: azureSynapseWorkspaceResource,
  // Aquí se podrían añadir otros recursos de Azure Analytics en el futuro.
};

export { azureAnalyticsResources }; // Exportación nombrada
