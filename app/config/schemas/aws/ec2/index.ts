import * as instanceDefinition from './instance';

// Define la estructura para la categoría 'ec2' de AWS
export const awsEc2Resources = {
  instance: { // Para EC2 Instance
    schema: instanceDefinition.schema,
    fields: instanceDefinition.fields,
    templates: instanceDefinition.templates,
    defaults: instanceDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de EC2 en el futuro
  // (ej. eip, security_group, etc.)
};
