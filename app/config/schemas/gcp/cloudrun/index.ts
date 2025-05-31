import * as serviceDefinition from './service';

// Define la estructura para la categoría 'cloudrun'
// La clave 'service' aquí será el 'resourceType' que usaremos en mapResourceTypeToRegistry
// cuando la categoría sea 'cloudrun'.
export const gcpCloudRunResources = {
  service: {
    schema: serviceDefinition.schema,
    fields: serviceDefinition.fields,
    templates: serviceDefinition.templates,
    defaults: serviceDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de Cloud Run en el futuro
  // (ej. job, domain_mapping, etc.)
};
