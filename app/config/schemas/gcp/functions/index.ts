import * as functionDefinition from './function';

// Define la estructura para la categoría 'functions'
// La clave 'function' aquí será el 'resourceType' que usaremos en mapResourceTypeToRegistry
// cuando la categoría sea 'functions'.
export const gcpFunctionsResources = {
  function: {
    schema: functionDefinition.schema,
    fields: functionDefinition.fields,
    templates: functionDefinition.templates,
    defaults: functionDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos relacionados con Functions en el futuro
};
