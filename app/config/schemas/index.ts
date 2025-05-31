// Main resource schemas registry
export * from './gcp';
// export * from './aws';     // Para futuro
// export * from './azure';   // Para futuro

import { GCP_RESOURCE_REGISTRY } from './gcp';

// Global resource registry
export const RESOURCE_REGISTRY = {
  gcp: GCP_RESOURCE_REGISTRY,
  // aws: AWS_RESOURCE_REGISTRY,     // Para futuro
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
  
  const resourceConfig = categoryRegistry[resourceType];
  
  // Load all resource configuration parts
  const [schema, fields, templates, defaults] = await Promise.all([
    resourceConfig.schema(),
    resourceConfig.fields(),
    resourceConfig.templates(),
    resourceConfig.defaults(),
  ]);
  
  return {
    schema,
    fields,
    templates,
    defaults,
  };
}

// Helper function to validate resource configuration
export async function validateResourceConfig(
  provider: SupportedProvider,
  category: string,
  resourceType: string,
  config: any
) {
  const { schema } = await getResourceConfig(provider, category, resourceType);
  return schema.parse(config);
}
