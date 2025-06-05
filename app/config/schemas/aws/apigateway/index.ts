import awsApiGatewayRestApiResource from './restApi';

// Agrupa todos los recursos de API Gateway en un solo objeto para facilitar su importación.
const awsApiGatewayResources = {
  restApi: awsApiGatewayRestApiResource,
  // Aquí se podrían añadir otros recursos de API Gateway en el futuro, 
  // como Stages, Deployments, Resources, Methods, Integrations, etc.
  // Ejemplo: stage: awsApiGatewayStageResource,
};

export default awsApiGatewayResources;
