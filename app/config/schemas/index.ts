// Main resource schemas registry
export * from './gcp';
export * from './aws';     // Para futuro
// export * from './azure';   // Para futuro

import { GCP_RESOURCE_REGISTRY } from './gcp';
import { AWS_RESOURCE_REGISTRY } from './aws'; // Importar AWS

// Global resource registry
export const RESOURCE_REGISTRY = {
  gcp: GCP_RESOURCE_REGISTRY,
  aws: AWS_RESOURCE_REGISTRY,     // Para futuro
  // azure: AZURE_RESOURCE_REGISTRY, // Para futuro
} as const;

export type SupportedProvider = keyof typeof RESOURCE_REGISTRY;

// Helper function to get resource configuration dynamically
export async function getResourceConfig(
  provider: SupportedProvider,
  category: string,
  resourceType: string
) {
  const providerRegistry = RESOURCE_REGISTRY[provider];
  
  if (!providerRegistry || !(category in providerRegistry)) {
    throw new Error(`Provider "${provider}" or category "${category}" not found`);
  }
  
  const categoryRegistry = (providerRegistry as any)[category];
  
  if (!(resourceType in categoryRegistry)) {
    throw new Error(`Resource type "${resourceType}" not found in "${provider}/${category}"`);
  }
  
  const resourceDefinition = categoryRegistry[resourceType];
  
  if (!resourceDefinition || 
      typeof resourceDefinition.schema !== 'function' ||
      typeof resourceDefinition.fields !== 'function' ||
      typeof resourceDefinition.templates !== 'function' ||
      typeof resourceDefinition.defaults !== 'function') {
    throw new Error(`Resource definition for "${provider}/${category}/${resourceType}" is invalid.`);
  }
  
  // Return the definition object containing the functions, not their resolved values yet.
  // The caller (IaCTemplatePanel) will be responsible for calling these functions.
  return {
    schema: resourceDefinition.schema,     // () => Promise<ZodSchema>
    fields: resourceDefinition.fields,     // () => Promise<FieldConfig[]>
    templates: resourceDefinition.templates, // (configValues) => Promise<CodeTemplate> OR () => Promise<ResourceTemplate[]>
    defaults: resourceDefinition.defaults,   // () => Promise<Partial<ResourceValues>>
  };
}

// Helper function to validate resource configuration
export async function validateResourceConfig(
  provider: SupportedProvider,
  category: string,
  resourceType: string,
  config: any
) {
  // Get the definition which contains the schema function
  const resourceDefinition = await getResourceConfig(provider, category, resourceType);
  // Call the schema function to get the actual Zod schema
  const schema = await resourceDefinition.schema();
  return schema.parse(config);
}
