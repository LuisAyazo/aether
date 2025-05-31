import * as appDefinition from './app';

// Define la estructura para la categoría 'appengine'
// La clave 'app' aquí será el 'resourceType' que usaremos en mapResourceTypeToRegistry
// cuando la categoría sea 'appengine'.
export const gcpAppEngineResources = {
  app: {
    schema: appDefinition.schema,
    fields: appDefinition.fields,
    templates: appDefinition.templates,
    defaults: appDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de App Engine en el futuro
  // (ej. app_service, app_version, etc.)
};
