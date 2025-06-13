import { Deployment } from "../../types/deployments";

export interface PlatformFormField {
  name: string;
  type: 'text' | 'select' | 'number' | 'boolean'; // Añadido boolean para futuros usos
  label: string;
  options?: { value: string | number; label: string }[];
  defaultValue?: string | number | boolean;
  required?: boolean;
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
}

export interface PlatformConfig {
  name: string;
  icon: string;
  color: string;
  provider: Deployment['provider']; // Para agrupar por proveedor
  platformType: Deployment['platform']; // Para identificar la plataforma específica
  yamlTemplate?: string;
  formFields: PlatformFormField[];
}
