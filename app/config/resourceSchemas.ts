import { z } from 'zod';
import { ResourceFieldConfigs, Provider, ResourceType } from '@/app/types/resourceConfig';

// Esquemas base para campos comunes
const baseSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  tags: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).optional(),
});

// Esquemas específicos para GCP Compute Engine
const gcpComputeSchema = baseSchema.extend({
  projectId: z.string().min(1, 'El ID del proyecto es requerido'),
  machineType: z.string().min(1, 'El tipo de máquina es requerido'),
  zone: z.string().min(1, 'La zona es requerida'),
  image: z.object({
    project: z.string().min(1, 'El proyecto de la imagen es requerido'),
    family: z.string().min(1, 'La familia de la imagen es requerida'),
  }),
  network: z.string().min(1, 'La red es requerida'),
  subnetwork: z.string().optional(),
  bootDisk: z.object({
    sizeGb: z.number().min(10).max(2000),
    type: z.enum(['pd-standard', 'pd-ssd', 'pd-balanced']),
    autoDelete: z.boolean().default(true),
  }),
  accessConfig: z.object({
    name: z.string().default('External NAT'),
    type: z.enum(['ONE_TO_ONE_NAT']).default('ONE_TO_ONE_NAT'),
  }).optional(),
  metadata: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).optional(),
  serviceAccount: z.object({
    email: z.string().email().optional(),
    scopes: z.array(z.string()).optional(),
  }).optional(),
});

// Esquemas específicos para GCP Cloud Storage
const gcpStorageSchema = baseSchema.extend({
  location: z.string().min(1, 'La ubicación es requerida'),
  storageClass: z.enum(['STANDARD', 'NEARLINE', 'COLDLINE', 'ARCHIVE']),
  versioning: z.boolean().default(false),
  lifecycleRules: z.array(z.object({
    action: z.object({
      type: z.enum(['Delete', 'SetStorageClass']),
      storageClass: z.string().optional(),
    }),
    condition: z.object({
      age: z.number().optional(),
      createdBefore: z.string().optional(),
      numNewerVersions: z.number().optional(),
    }),
  })).optional(),
});

// Esquemas específicos para GCP Cloud SQL
const gcpSqlSchema = baseSchema.extend({
  databaseVersion: z.string().min(1, 'La versión de la base de datos es requerida'),
  tier: z.string().min(1, 'El tier es requerido'),
  region: z.string().min(1, 'La región es requerida'),
  storage: z.object({
    sizeGb: z.number().min(10).max(10000),
    type: z.enum(['SSD', 'HDD']),
  }),
  backup: z.object({
    enabled: z.boolean(),
    startTime: z.string().optional(),
  }).optional(),
});

// Mapeo de esquemas por proveedor y tipo de recurso
export const resourceSchemas = {
  gcp: {
    compute: gcpComputeSchema,
    storage: gcpStorageSchema,
    sql: gcpSqlSchema,
  },
} as const;

// Tipos TypeScript generados a partir de los esquemas
export type GCPComputeConfig = z.infer<typeof gcpComputeSchema>;
export type GCPStorageConfig = z.infer<typeof gcpStorageSchema>;
export type GCPSqlConfig = z.infer<typeof gcpSqlSchema>;

// Configuración de campos para la UI
export const resourceFieldConfigs: ResourceFieldConfigs = {
  gcp: {
    compute: {
      name: {
        label: 'Nombre de la instancia',
        type: 'text',
        placeholder: 'mi-instancia',
        help: 'El nombre de la instancia de Compute Engine',
      },
      projectId: {
        label: 'ID del Proyecto',
        type: 'text',
        placeholder: 'mi-proyecto',
        help: 'El ID del proyecto de GCP',
      },
      machineType: {
        label: 'Tipo de máquina',
        type: 'select',
        options: [
          { value: 'e2-micro', label: 'e2-micro (2 vCPU, 1 GB)' },
          { value: 'e2-small', label: 'e2-small (2 vCPU, 2 GB)' },
          { value: 'e2-medium', label: 'e2-medium (2 vCPU, 4 GB)' },
          { value: 'n1-standard-1', label: 'n1-standard-1 (1 vCPU, 3.75 GB)' },
          { value: 'n1-standard-2', label: 'n1-standard-2 (2 vCPU, 7.5 GB)' },
          { value: 'n1-standard-4', label: 'n1-standard-4 (4 vCPU, 15 GB)' },
        ],
        help: 'El tipo de máquina para la instancia',
      },
      zone: {
        label: 'Zona',
        type: 'select',
        options: [
          { value: 'us-central1-a', label: 'us-central1-a (Iowa)' },
          { value: 'us-central1-b', label: 'us-central1-b (Iowa)' },
          { value: 'us-central1-c', label: 'us-central1-c (Iowa)' },
          { value: 'us-east1-b', label: 'us-east1-b (South Carolina)' },
          { value: 'us-east1-c', label: 'us-east1-c (South Carolina)' },
          { value: 'us-east1-d', label: 'us-east1-d (South Carolina)' },
        ],
        help: 'La zona donde se desplegará la instancia',
      },
      image: {
        label: 'Imagen',
        type: 'group',
        fields: {
          project: {
            label: 'Proyecto de la imagen',
            type: 'select',
            options: [
              { value: 'debian-cloud', label: 'Debian Cloud' },
              { value: 'ubuntu-os-cloud', label: 'Ubuntu OS Cloud' },
              { value: 'centos-cloud', label: 'CentOS Cloud' },
            ],
            help: 'El proyecto que contiene la imagen',
          },
          family: {
            label: 'Familia de la imagen',
            type: 'select',
            options: [
              { value: 'debian-10', label: 'Debian 10' },
              { value: 'debian-11', label: 'Debian 11' },
              { value: 'ubuntu-2004-lts', label: 'Ubuntu 20.04 LTS' },
              { value: 'ubuntu-2204-lts', label: 'Ubuntu 22.04 LTS' },
              { value: 'centos-7', label: 'CentOS 7' },
              { value: 'centos-8', label: 'CentOS 8' },
            ],
            help: 'La familia de la imagen del sistema operativo',
          },
        },
      },
      network: {
        label: 'Red',
        type: 'select',
        options: [
          { value: 'default', label: 'Red por defecto' },
          { value: 'custom-network', label: 'Red personalizada' },
        ],
        help: 'La red a la que se conectará la instancia',
      },
      bootDisk: {
        label: 'Disco de arranque',
        type: 'group',
        fields: {
          sizeGb: {
            label: 'Tamaño (GB)',
            type: 'number',
            min: 10,
            max: 2000,
            default: 50,
            help: 'Tamaño del disco en gigabytes',
          },
          type: {
            label: 'Tipo de disco',
            type: 'select',
            options: [
              { value: 'pd-standard', label: 'Standard Persistent Disk' },
              { value: 'pd-ssd', label: 'SSD Persistent Disk' },
              { value: 'pd-balanced', label: 'Balanced Persistent Disk' },
            ],
            help: 'Tipo de disco persistente',
          },
          autoDelete: {
            label: 'Eliminar automáticamente',
            type: 'boolean',
            default: true,
            help: 'Eliminar el disco cuando se elimine la instancia',
          },
        },
      },
      accessConfig: {
        label: 'Configuración de acceso',
        type: 'group',
        fields: {
          name: {
            label: 'Nombre',
            type: 'text',
            default: 'External NAT',
            help: 'Nombre de la configuración de acceso',
          },
          type: {
            label: 'Tipo',
            type: 'select',
            options: [
              { value: 'ONE_TO_ONE_NAT', label: 'NAT 1:1' },
            ],
            default: 'ONE_TO_ONE_NAT',
            help: 'Tipo de configuración de acceso',
          },
        },
      },
      metadata: {
        label: 'Metadatos',
        type: 'group',
        fields: {
          startupScript: {
            label: 'Script de inicio',
            type: 'text',
            placeholder: '#!/bin/bash\napt update && apt install -y nginx',
            help: 'Script que se ejecutará al iniciar la instancia',
          },
        },
      },
    },
    storage: {
      name: {
        label: 'Nombre del bucket',
        type: 'text',
        placeholder: 'mi-bucket',
        help: 'El nombre del bucket de Cloud Storage',
      },
      location: {
        label: 'Ubicación',
        type: 'select',
        options: [
          { value: 'US', label: 'United States' },
          { value: 'EU', label: 'Europe' },
          { value: 'ASIA', label: 'Asia' },
        ],
        help: 'La ubicación del bucket',
      },
      storageClass: {
        label: 'Clase de almacenamiento',
        type: 'select',
        options: [
          { value: 'STANDARD', label: 'Standard' },
          { value: 'NEARLINE', label: 'Nearline' },
          { value: 'COLDLINE', label: 'Coldline' },
          { value: 'ARCHIVE', label: 'Archive' },
        ],
        help: 'La clase de almacenamiento del bucket',
      },
    },
    sql: {
      name: {
        label: 'Nombre de la instancia',
        type: 'text',
        placeholder: 'mi-instancia-sql',
        help: 'El nombre de la instancia de Cloud SQL',
      },
      databaseVersion: {
        label: 'Versión de la base de datos',
        type: 'select',
        options: [
          { value: 'MYSQL_8_0', label: 'MySQL 8.0' },
          { value: 'POSTGRES_13', label: 'PostgreSQL 13' },
          { value: 'SQLSERVER_2019_STANDARD', label: 'SQL Server 2019 Standard' },
        ],
        help: 'La versión de la base de datos',
      },
      tier: {
        label: 'Tier',
        type: 'select',
        options: [
          { value: 'db-f1-micro', label: 'db-f1-micro' },
          { value: 'db-g1-small', label: 'db-g1-small' },
          { value: 'db-n1-standard-1', label: 'db-n1-standard-1' },
        ],
        help: 'El tier de la instancia',
      },
    },
  },
}; 