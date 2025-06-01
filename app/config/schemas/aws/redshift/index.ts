import * as clusterDefinition from './cluster';

// Define la estructura para la categoría 'redshift' de AWS
export const awsRedshiftResources = {
  cluster: { // Para Redshift Cluster
    schema: clusterDefinition.schema,
    fields: clusterDefinition.fields,
    templates: clusterDefinition.templates,
    defaults: clusterDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de Redshift en el futuro
  // (ej. subnet_group, parameter_group, snapshot_schedule, etc.)
};
