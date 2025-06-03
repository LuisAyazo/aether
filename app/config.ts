// Configuración global de la aplicación

// URL base de la API - asegurarse de que tenga el formato correcto con http/https
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// URL base para todos los endpoints de la API
export const API_BASE_URL = `${API_URL}/api`;

// Otras configuraciones globales
export const APP_NAME = 'InfraUX';
export const APP_VERSION = '1.0.0';

// Configuración de entornos
export const ENVIRONMENTS = {
  DEV: 'dev',
  QA: 'qa',
  PROD: 'prod'
};

// Configuración para proveedores cloud
export const CLOUD_PROVIDERS = {
  AWS: 'aws',
  GCP: 'gcp',
  AZURE: 'azure'
};

// Otras configuraciones
export const APP_CONFIG = {
  DEFAULT_ENVIRONMENT: ENVIRONMENTS.DEV,
  DEFAULT_PROVIDER: CLOUD_PROVIDERS.AWS,
  AUTO_SAVE_INTERVAL: 5000, // 5 segundos
};

// Tipos para configuraciones
export interface EnvironmentSetting {
  enabled: boolean;
  description: string;
}

export interface Credential {
  id: string;
  name: string;
  provider: 'aws' | 'gcp' | 'azure';
  key: string;
  secret: string;
  region?: string;
  project?: string;
  createdAt: Date;
}

export interface Settings {
  credentials: Credential[];
  defaultEnvironment: 'dev' | 'qa' | 'prod';
  environmentSettings: {
    dev: EnvironmentSetting;
    qa: EnvironmentSetting;
    prod: EnvironmentSetting;
  };
  [key: string]: any;
}

// Interfaz para la compañía
export interface Company {
  id: string;
  name: string;
  description?: string;
  settings?: Settings;
  createdAt: Date;
  updatedAt: Date;
}

// Configuración por defecto para nuevas compañías
export const DEFAULT_COMPANY_SETTINGS: Settings = {
  credentials: [],
  defaultEnvironment: 'dev',
  environmentSettings: {
    dev: { enabled: true, description: 'Entorno de desarrollo' },
    qa: { enabled: true, description: 'Entorno de pruebas' },
    prod: { enabled: true, description: 'Entorno de producción' }
  }
};

// Configuración para el editor de diagramas
export const FLOW_EDITOR_CONFIG = {
  snapToGrid: true,
  snapGrid: [10, 10],
  defaultZoom: 0.8,
  minZoom: 0.1,
  maxZoom: 2,
  connectionLineStyle: { stroke: '#555' }
};
