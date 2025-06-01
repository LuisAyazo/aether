import * as tableDefinition from './table';

// Define la estructura para la categoría 'dynamodb' de AWS
export const awsDynamodbResources = {
  table: { // Para DynamoDB Table
    schema: tableDefinition.schema,
    fields: tableDefinition.fields,
    templates: tableDefinition.templates,
    defaults: tableDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de DynamoDB en el futuro
};
