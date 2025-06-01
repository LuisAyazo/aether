import azureLinuxFunctionAppResource from './linuxfunctionapp/linuxFunctionApp';

// Agrupa todos los recursos de Azure Functions en un solo objeto.
const azureFunctionsResources = {
  linuxfunctionapp: azureLinuxFunctionAppResource,
  // Aquí se podrían añadir otros tipos de Function Apps (ej. Windows) en el futuro.
};

export { azureFunctionsResources }; // Exportación nombrada
