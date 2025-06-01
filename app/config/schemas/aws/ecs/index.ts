import * as serviceDefinition from './service';

// Define la estructura para la categoría 'ecs' de AWS
export const awsEcsResources = {
  service: { // Para ECS Service
    schema: serviceDefinition.schema,
    fields: serviceDefinition.fields,
    templates: serviceDefinition.templates,
    defaults: serviceDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de ECS en el futuro
  // (ej. cluster, task_definition, capacity_provider, etc.)
};
