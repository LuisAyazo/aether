import * as groupDefinition from './group';

// Define la estructura para la categoría 'autoscaling' de AWS
export const awsAutoscalingResources = {
  group: { // Para Auto Scaling Group
    schema: groupDefinition.schema,
    fields: groupDefinition.fields,
    templates: groupDefinition.templates,
    defaults: groupDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de Auto Scaling en el futuro
  // (ej. launch_configuration, policy, etc.)
};
