// GCP Provider schemas and configurations
import { gcpComputeResources } from './compute'; // Importar el registro de compute consolidado

// export * from './storage';     // Para futuros recursos
// export * from './networking';  // Para futuros recursos
// export * from './database';    // Para futuros recursos
// export * from './functions';   // Para futuros recursos

// Registry of all GCP resource types
export const GCP_RESOURCE_REGISTRY = {
  compute: gcpComputeResources, // Usar el registro de compute consolidado
  // storage: { // Ejemplo para futuros recursos de storage
  //   bucket: {
  //     schema: () => import('./storage/bucket').then(m => m.schema()), // Asumiendo estructura similar
  //     fields: () => import('./storage/bucket').then(m => m.fields()),
  //     templates: () => import('./storage/bucket').then(m => m.templates()),
  //     defaults: () => import('./storage/bucket').then(m => m.defaults()),
  //   },
  // },
  // sql: { ... } // Ejemplo para futuros recursos SQL
} as const;

export type GCPResourceType = keyof typeof GCP_RESOURCE_REGISTRY;
// GCPComputeResourceType ahora se puede inferir del tipo de gcpComputeResources si es necesario,
// o los tipos individuales se pueden seguir exportando desde gcp/compute/index.ts
// export type GCPComputeResourceType = keyof typeof GCP_RESOURCE_REGISTRY.compute; // Esto seguirá funcionando
