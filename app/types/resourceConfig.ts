export type Provider = 'aws' | 'gcp' | 'azure' | 'generic';

export type ResourceType = string; // Permitir cualquier string, el mapeo se encargará

export interface FieldConfig {
  key?: string; // Field identifier for array-based configurations
  label: string;
  type: 'text' | 'select' | 'number' | 'boolean' | 'group';
  placeholder?: string;
  help?: string;
  description?: string; // Alternative to help text
  default?: any;
  defaultValue?: any; // Alternative to default
  min?: number;
  max?: number;
  required?: boolean;
  options?: Array<{
    value: string;
    label: string;
  }>;
  fields?: Record<string, FieldConfig> | FieldConfig[]; // Support both structures
}

export interface ResourceConfig {
  name: FieldConfig;
  [key: string]: FieldConfig;
}

export interface ProviderConfig {
  [resourceType: string]: ResourceConfig;
}

export interface ResourceFieldConfigs {
  [provider: string]: ProviderConfig;
}

export interface ResourceValues {
  name: string;
  [key: string]: any;
}

export interface ResourceTemplate {
  name: string;
  description: string;
  config: Record<string, any>;
}

export interface ResourceSchema {
  type: string;
  displayName: string;
  description: string;
  category: ResourceType;
  fields: any; // Allow flexible field configuration
  templates: Record<string, any>;
  documentation?: {
    description: string;
    examples?: string[];
  };
}

export interface ResourceConfigFormProps {
  provider: Provider;
  resourceType: ResourceType;
  values: ResourceValues;
  onChange: (values: ResourceValues) => void;
  fields?: FieldConfig[] | Record<string, FieldConfig>; // Dynamic fields from schema system
  isLoading?: boolean; // Loading state
  errors?: Record<string, string[] | undefined>; // For displaying validation errors
}

// Interface for generated code templates
export interface CodeTemplate {
  terraform: string;
  pulumi: string;
  ansible: string;
  cloudformation?: string;
  // Potentially add other IaC tools here
}
