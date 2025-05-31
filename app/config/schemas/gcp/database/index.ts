import * as instanceDefinition from './instance';
import * as datasetDefinition from './dataset'; // Importar la definición de dataset
import * as firestoreDatabaseDefinition from './firestoreDatabase'; // Importar la definición de Firestore Database

// Define la estructura para la categoría 'database'
export const gcpDatabaseResources = {
  instance: { // Para Cloud SQL Instance
    schema: instanceDefinition.schema,
    fields: instanceDefinition.fields,
    templates: instanceDefinition.templates,
    defaults: instanceDefinition.defaults,
  },
  dataset: { // Para BigQuery Dataset
    schema: datasetDefinition.schema,
    fields: datasetDefinition.fields,
    templates: datasetDefinition.templates,
    defaults: datasetDefinition.defaults,
  },
  firestoreDatabase: { // Para Firestore Database
    schema: firestoreDatabaseDefinition.schema,
    fields: firestoreDatabaseDefinition.fields,
    templates: firestoreDatabaseDefinition.templates,
    defaults: firestoreDatabaseDefinition.defaults,
  },
  // Aquí se podrían añadir otros tipos de recursos de base de datos en el futuro
  // (ej. Spanner, Bigtable, etc.)
};
