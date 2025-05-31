import * as instanceDefinition from './instance';

// Define la estructura para la categoría 'cache'
// La clave 'instance' aquí será el 'resourceType' que usaremos en mapResourceTypeToRegistry
// cuando la categoría sea 'cache'.
export const gcpCacheResources = {
  instance: { // Para Memorystore Instance
    schema: instanceDefinition.schema,
    fields: instanceDefinition.fields,
    templates: instanceDefinition.templates,
    defaults: instanceDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de caché en el futuro
};
