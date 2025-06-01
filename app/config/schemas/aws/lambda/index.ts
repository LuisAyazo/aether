import * as functionDefinition from './function';

// Define la estructura para la categoría 'lambda' de AWS
export const awsLambdaResources = {
  function: { // Para Lambda Function
    schema: functionDefinition.schema,
    fields: functionDefinition.fields,
    templates: functionDefinition.templates,
    defaults: functionDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de Lambda en el futuro
  // (ej. layer_version, event_source_mapping, etc.)
};
