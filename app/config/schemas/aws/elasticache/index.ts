import * as clusterDefinition from './cluster';

// Define la estructura para la categoría 'elasticache' de AWS
export const awsElasticacheResources = {
  cluster: { // Para ElastiCache Cluster
    schema: clusterDefinition.schema,
    fields: clusterDefinition.fields,
    templates: clusterDefinition.templates,
    defaults: clusterDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de ElastiCache en el futuro
  // (ej. subnet_group, parameter_group, replication_group para Redis cluster mode)
};
