import azureLogicAppWorkflowResource from './workflow/logicAppWorkflow';
// Importar otros recursos de Logic Apps aquí si se añaden en el futuro.

// Agrupa todos los recursos de Azure Logic Apps en un solo objeto.
const azureLogicAppResources = {
  workflow: azureLogicAppWorkflowResource,
  // Ejemplo: standard: azureLogicAppStandardResource,
};

export { azureLogicAppResources }; // Exportación nombrada
