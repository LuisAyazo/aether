// GCP Provider schemas and configurations
import { gcpComputeResources } from './compute'; // Importar el registro de compute consolidado
import { gcpAppEngineResources } from './appengine'; // Importar el registro de appengine
import { gcpGkeResources } from './gke'; // Importar el registro de GKE
import { gcpCloudRunResources } from './cloudrun'; // Importar el registro de Cloud Run
import { gcpFunctionsResources } from './functions'; // Importar el registro de Functions
import { gcpStorageResources } from './storage'; // Importar el registro de Storage
import { gcpDatabaseResources } from './database'; // Importar el registro de Database
import { gcpCacheResources } from './cache'; // Importar el registro de Cache
import gcpCloudTasksResources from './cloudtasks'; // Importar el registro de Cloud Tasks
import gcpWorkflowsResources from './workflows'; // Importar el registro de Workflows
import gcpEventarcResources from './eventarc'; // Importar el registro de Eventarc

// export * from './networking';  // Para futuros recursos

// Registry of all GCP resource types
export const GCP_RESOURCE_REGISTRY = {
  compute: gcpComputeResources, // Usar el registro de compute consolidado
  appengine: gcpAppEngineResources, // Añadir el registro de appengine
  gke: gcpGkeResources, // Añadir el registro de GKE
  cloudrun: gcpCloudRunResources, // Añadir el registro de Cloud Run
  functions: gcpFunctionsResources, // Añadir el registro de Functions
  storage: gcpStorageResources, // Añadir el registro de Storage
  database: gcpDatabaseResources, // Añadir el registro de Database
  cache: gcpCacheResources, // Añadir el registro de Cache
  cloudtasks: gcpCloudTasksResources, // Añadir Cloud Tasks al registro
  workflows: gcpWorkflowsResources, // Añadir Workflows al registro
  eventarc: gcpEventarcResources, // Añadir Eventarc al registro
  // networking: { ... } // Ejemplo para futuros recursos de Networking
} as const;

export type GCPResourceType = keyof typeof GCP_RESOURCE_REGISTRY;
// GCPComputeResourceType ahora se puede inferir del tipo de gcpComputeResources si es necesario,
// o los tipos individuales se pueden seguir exportando desde gcp/compute/index.ts
// export type GCPComputeResourceType = keyof typeof GCP_RESOURCE_REGISTRY.compute; // Esto seguirá funcionando
