// Azure Provider schemas and configurations
import { azureComputeResources } from './compute'; 
// Importar otras categorías de Azure a medida que se añadan
import { azureStorageResources } from './storage';
import { azureDatabaseResources } from './database';
import { azureNetworkingResources } from './networking';
import { azureFunctionsResources } from './functions';

// Registry of all Azure resource categories and their types
export const AZURE_RESOURCE_REGISTRY = {
  compute: azureComputeResources,
  storage: azureStorageResources,
  database: azureDatabaseResources,
  networking: azureNetworkingResources,
  functions: azureFunctionsResources,
  // ... otras categorías de Azure
} as const;

// Tipo para las categorías de recursos de Azure (ej. 'compute', 'storage')
export type AzureResourceCategory = keyof typeof AZURE_RESOURCE_REGISTRY;

// Ejemplo: Tipo para los tipos de recursos dentro de una categoría específica de Azure
// export type AzureComputeResourceType = keyof typeof AZURE_RESOURCE_REGISTRY.compute;
