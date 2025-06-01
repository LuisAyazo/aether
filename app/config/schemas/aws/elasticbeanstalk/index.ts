import * as environmentDefinition from './environment';

// Define la estructura para la categoría 'elasticbeanstalk' de AWS
export const awsElasticbeanstalkResources = {
  environment: { // Para Elastic Beanstalk Environment
    schema: environmentDefinition.schema,
    fields: environmentDefinition.fields,
    templates: environmentDefinition.templates,
    defaults: environmentDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de Elastic Beanstalk en el futuro
  // (ej. application, application_version, configuration_template, etc.)
};
