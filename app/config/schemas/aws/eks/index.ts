import * as clusterDefinition from './cluster';

// Define la estructura para la categoría 'eks' de AWS
export const awsEksResources = {
  cluster: { // Para EKS Cluster
    schema: clusterDefinition.schema,
    fields: clusterDefinition.fields,
    templates: clusterDefinition.templates,
    defaults: clusterDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de EKS en el futuro
  // (ej. nodegroup, fargate_profile, addon, identity_provider_config, etc.)
};
