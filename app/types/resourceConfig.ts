export type Provider = 'aws' | 'gcp' | 'azure' | 'generic';

export type ResourceType = 'compute' | 'storage' | 'sql' | 'function' | 'database' | 'network' | 'generic';

export interface FieldConfig {
  label: string;
  type: 'text' | 'select' | 'number' | 'boolean' | 'group';
  placeholder?: string;
  help?: string;
  default?: any;
  min?: number;
  max?: number;
  options?: Array<{
    value: string;
    label: string;
  }>;
  fields?: Record<string, FieldConfig>;
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

export interface ResourceConfigFormProps {
  provider: Provider;
  resourceType: ResourceType;
  values: ResourceValues;
  onChange: (values: ResourceValues) => void;
} 