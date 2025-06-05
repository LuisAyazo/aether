import * as instanceDefinition from './instance';

// Define la estructura para la categoría 'rds' de AWS
export const awsRdsResources = {
  instance: { // Para RDS Instance
    schema: instanceDefinition.schema,
    fields: instanceDefinition.fields,
    templates: instanceDefinition.templates,
    defaults: instanceDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de RDS en el futuro
  // (ej. db_subnet_group, db_parameter_group, etc.)
};
