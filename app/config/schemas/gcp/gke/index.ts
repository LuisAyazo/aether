import * as clusterDefinition from './cluster';

// Define la estructura para la categoría 'gke'
// La clave 'cluster' aquí será el 'resourceType' que usaremos en mapResourceTypeToRegistry
// cuando la categoría sea 'gke'.
export const gcpGkeResources = {
  cluster: {
    schema: clusterDefinition.schema,
    fields: clusterDefinition.fields,
    templates: clusterDefinition.templates,
    defaults: clusterDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de GKE en el futuro
  // (ej. node_pool, etc.)
};
