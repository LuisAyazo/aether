// Azure Provider schemas and configurations
import { azureComputeResources } from './compute'; 
import { azureStorageResources } from './storage';
import { azureDatabaseResources } from './database'; 
import { azureNetworkingResources } from './networking';
import { azureFunctionsResources } from './functions';
import { azureCacheResources } from './cache';
import { azureAnalyticsResources } from './analytics';
import { azureApiManagementResources } from './apimanagement';
import { azureServiceBusResources } from './servicebus';
import { azureEventGridResources } from './eventgrid';
import { azureLogicAppResources } from './logicapp';
import { azureEventHubResources } from './eventhub';
// Importar otras categorías de Azure a medida que se añaden

// Registry of all Azure resource categories and their types
export const AZURE_RESOURCE_REGISTRY = {
  compute: azureComputeResources,
  storage: azureStorageResources,
  database: azureDatabaseResources, 
  networking: azureNetworkingResources,
  functions: azureFunctionsResources,
  cache: azureCacheResources,
  analytics: azureAnalyticsResources,
  apimanagement: azureApiManagementResources,
  servicebus: azureServiceBusResources,
  eventgrid: azureEventGridResources,
  logicapp: azureLogicAppResources,
  eventhub: azureEventHubResources,
  // ... otras categorías de Azure
} as const;

// Tipo para las categorías de recursos de Azure (ej. 'compute', 'storage')
export type AzureResourceCategory = keyof typeof AZURE_RESOURCE_REGISTRY;

// Ejemplo: Tipo para los tipos de recursos dentro de una categoría específica de Azure
// export type AzureComputeResourceType = keyof typeof AZURE_RESOURCE_REGISTRY.compute;
