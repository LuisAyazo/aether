import azureApiManagementServiceResource from './service/apiManagementService';

// Agrupa todos los recursos de Azure API Management en un solo objeto.
const azureApiManagementResources = {
  service: azureApiManagementServiceResource,
  // Aquí se podrían añadir otros sub-recursos de API Management en el futuro (ej. api, product, etc.)
};

export { azureApiManagementResources }; // Exportación nombrada
