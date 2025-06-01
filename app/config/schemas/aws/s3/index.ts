import * as bucketDefinition from './bucket';

// Define la estructura para la categoría 's3' de AWS
export const awsS3Resources = {
  bucket: { // Para S3 Bucket
    schema: bucketDefinition.schema,
    fields: bucketDefinition.fields,
    templates: bucketDefinition.templates,
    defaults: bucketDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de S3 en el futuro
  // (ej. bucket_policy, bucket_object, etc.)
};
