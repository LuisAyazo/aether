import * as bucketDefinition from './bucket';
import * as filestoreInstanceDefinition from './filestoreInstance'; // Importar la definición de Filestore Instance

// Define la estructura para la categoría 'storage'
export const gcpStorageResources = {
  bucket: { // Para Cloud Storage Bucket
    schema: bucketDefinition.schema,
    fields: bucketDefinition.fields,
    templates: bucketDefinition.templates,
    defaults: bucketDefinition.defaults,
  },
  filestoreInstance: { // Para Filestore Instance
    schema: filestoreInstanceDefinition.schema,
    fields: filestoreInstanceDefinition.fields,
    templates: filestoreInstanceDefinition.templates,
    defaults: filestoreInstanceDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de Storage en el futuro
  // (ej. bucket_iam_member, etc.)
};
