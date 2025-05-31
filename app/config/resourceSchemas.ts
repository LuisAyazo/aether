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

import { gcpComputeInstanceSchema, GCPComputeInstanceConfig } from './schemas/gcp/compute/instance/instance';
import { gcpComputeDiskValidationSchema, GCPComputeDiskConfig } from './schemas/gcp/compute/disk/disk';
import { gcpComputeNetworkValidationSchema, GCPComputeNetworkConfig } from './schemas/gcp/compute/network/network';
import { gcpComputeFirewallValidationSchema, GCPComputeFirewallConfig } from './schemas/gcp/compute/firewall/firewall';
import { gcpComputeLoadBalancerValidationSchema, GCPComputeLoadBalancerConfig } from './schemas/gcp/compute/load-balancer/loadBalancer';
import { gcpComputeInstanceTemplateValidationSchema, GCPComputeInstanceTemplateConfig } from './schemas/gcp/compute/instance-template/instanceTemplate';
import { gcpComputeInstanceGroupValidationSchema, GCPComputeInstanceGroupConfig } from './schemas/gcp/compute/instance-group/instanceGroup';

// Placeholder simple para los esquemas Zod que aún no están definidos
const placeholderGcpResourceSchema = baseSchema.extend({
  resource_specific_field: z.string().optional(),
});

// Mapeo de esquemas ZOD por proveedor y tipo de recurso
export const resourceValidationSchemas = {
  gcp: {
    compute: {
      instance: gcpComputeInstanceSchema,
      disk: gcpComputeDiskValidationSchema,
      network: gcpComputeNetworkValidationSchema,
      firewall: gcpComputeFirewallValidationSchema,
      loadBalancer: gcpComputeLoadBalancerValidationSchema,
      instanceTemplate: gcpComputeInstanceTemplateValidationSchema,
      instanceGroup: gcpComputeInstanceGroupValidationSchema,
    },
    storage: gcpStorageSchema,
    sql: gcpSqlSchema,
  },
} as const;

// Tipos TypeScript generados a partir de los esquemas
export type GCPStorageConfig = z.infer<typeof gcpStorageSchema>;
export type GCPSqlConfig = z.infer<typeof gcpSqlSchema>;
// GCPComputeInstanceConfig ya se importa desde instance.ts
export type { GCPComputeDiskConfig }; // Exportar el tipo para que esté disponible
export type { GCPComputeNetworkConfig }; // Exportar el tipo para que esté disponible
export type { GCPComputeFirewallConfig }; // Exportar el tipo para que esté disponible
export type { GCPComputeLoadBalancerConfig }; // Exportar el tipo para que esté disponible
export type { GCPComputeInstanceTemplateConfig }; // Exportar el tipo para que esté disponible
export type { GCPComputeInstanceGroupConfig }; // Exportar el tipo para que esté disponible
// Definir otros tipos de config a medida que se creen sus esquemas Zod
// ...

// Configuración de campos para la UI (esto parece estar bien estructurado)
export const resourceFieldConfigs: ResourceFieldConfigs = {
  gcp: {
    // Ya no necesitamos la entrada genérica 'compute' aquí si todo se maneja por tipo específico
    // compute: { ... } // Considerar eliminar esta sección genérica si no se usa
    instance: {
      name: {
        label: 'Nombre de la instancia',
        type: 'text',
        required: true,
        placeholder: 'my-instance',
        help: 'Nombre único para la instancia',
      },
      machine_type: {
        label: 'Tipo de máquina',
        type: 'select',
        required: true,
        options: [
          { value: 'e2-micro', label: 'e2-micro (2 vCPU compartidos, 1 GB RAM)' },
          { value: 'e2-small', label: 'e2-small (2 vCPU compartidos, 2 GB RAM)' },
          { value: 'e2-medium', label: 'e2-medium (1 vCPU, 4 GB RAM)' },
          { value: 'e2-standard-2', label: 'e2-standard-2 (2 vCPU, 8 GB RAM)' },
          { value: 'n2-standard-2', label: 'n2-standard-2 (2 vCPU, 8 GB RAM)' },
        ],
        help: 'Define la cantidad de CPU y memoria para la instancia',
      },
      zone: {
        label: 'Zona',
        type: 'select',
        required: true,
        options: [
          { value: 'us-central1-a', label: 'us-central1-a (Iowa)' },
          { value: 'us-central1-b', label: 'us-central1-b (Iowa)' },
          { value: 'us-east1-b', label: 'us-east1-b (South Carolina)' },
          { value: 'europe-west1-b', label: 'europe-west1-b (Belgium)' },
        ],
        help: 'Zona donde se desplegará la instancia',
      },
      image: {
        label: 'Imagen del SO',
        type: 'group',
        required: true,
        fields: {
          project: {
            label: 'Proyecto de la imagen',
            type: 'text',
            required: true,
            default: 'debian-cloud',
            help: 'El proyecto que contiene la imagen',
          },
          family: {
            label: 'Familia de la imagen',
            type: 'select',
            required: true,
            options: [
              { value: 'debian-11', label: 'Debian 11' },
              { value: 'ubuntu-2004-lts', label: 'Ubuntu 20.04 LTS' },
              { value: 'ubuntu-2204-lts', label: 'Ubuntu 22.04 LTS' },
              { value: 'centos-7', label: 'CentOS 7' },
            ],
            help: 'La familia de la imagen del sistema operativo',
          },
        },
      },
      network: {
        label: 'Red',
        type: 'select',
        required: true,
        options: [
          { value: 'default', label: 'Red por defecto' },
          { value: 'custom-network', label: 'Red personalizada' },
        ],
        help: 'La red a la que se conectará la instancia',
      },
    },
    disk: {
      name: {
        label: 'Nombre del disco',
        type: 'text',
        required: true,
        placeholder: 'my-disk',
        help: 'Nombre único para el disco',
      },
      zone: {
        label: 'Zona',
        type: 'select',
        required: true,
        options: [
          { value: 'us-central1-a', label: 'us-central1-a' },
          { value: 'us-central1-b', label: 'us-central1-b' },
          { value: 'us-east1-b', label: 'us-east1-b' },
        ],
        help: 'Zona donde se creará el disco',
      },
      size: {
        label: 'Tamaño (GB)',
        type: 'number',
        required: true,
        min: 10,
        max: 65536,
        default: 100,
        help: 'Tamaño del disco en gigabytes',
      },
      type: {
        label: 'Tipo de disco',
        type: 'select',
        options: [
          { value: 'pd-standard', label: 'Standard HDD' },
          { value: 'pd-ssd', label: 'SSD' },
          { value: 'pd-balanced', label: 'Balanced SSD' },
        ],
        help: 'Tipo de almacenamiento del disco',
      },
    },
    network: {
      name: {
        label: 'Nombre de la red',
        type: 'text',
        required: true,
        placeholder: 'my-network',
        help: 'Nombre único para la red VPC',
      },
      auto_create_subnetworks: {
        label: 'Crear subredes automáticamente',
        type: 'boolean',
        default: false,
        help: 'Si se crean subredes automáticamente en cada región',
      },
      routing_mode: {
        label: 'Modo de enrutamiento',
        type: 'select',
        options: [
          { value: 'REGIONAL', label: 'Regional' },
          { value: 'GLOBAL', label: 'Global' },
        ],
        help: 'Modo de enrutamiento para la red',
      },
    },
    firewall: {
      name: {
        label: 'Nombre de la regla',
        type: 'text',
        required: true,
        placeholder: 'allow-http',
        help: 'Nombre único para la regla de firewall',
      },
      network: {
        label: 'Red',
        type: 'text',
        required: true,
        default: 'default',
        help: 'Nombre de la red VPC',
      },
      direction: {
        label: 'Dirección',
        type: 'select',
        options: [
          { value: 'INGRESS', label: 'Entrada (INGRESS)' },
          { value: 'EGRESS', label: 'Salida (EGRESS)' },
        ],
        help: 'Dirección del tráfico',
      },
      priority: {
        label: 'Prioridad',
        type: 'number',
        min: 0,
        max: 65535,
        default: 1000,
        help: 'Prioridad de la regla (0-65535)',
      },
    },
    loadBalancer: {
      name: {
        label: 'Nombre del load balancer',
        type: 'text',
        required: true,
        placeholder: 'my-lb',
        help: 'Nombre único para el load balancer',
      },
      region: {
        label: 'Región',
        type: 'select',
        required: true,
        options: [
          { value: 'us-central1', label: 'us-central1' },
          { value: 'us-east1', label: 'us-east1' },
          { value: 'europe-west1', label: 'europe-west1' },
        ],
        help: 'Región donde se desplegará el load balancer',
      },
      backend_service: {
        label: 'Servicio backend',
        type: 'text',
        required: true,
        placeholder: 'my-backend-service',
        help: 'Nombre del servicio backend',
      },
    },
    instanceTemplate: {
      name: {
        label: 'Nombre del template',
        type: 'text',
        required: true,
        placeholder: 'web-server-template',
        help: 'Nombre único para el template de instancia',
      },
      machine_type: {
        label: 'Tipo de máquina',
        type: 'select',
        required: true,
        options: [
          { value: 'e2-micro', label: 'e2-micro' },
          { value: 'e2-small', label: 'e2-small' },
          { value: 'e2-medium', label: 'e2-medium' },
          { value: 'e2-standard-2', label: 'e2-standard-2' },
        ],
        help: 'Tipo de máquina para las instancias',
      },
      region: {
        label: 'Región',
        type: 'select',
        required: true,
        options: [
          { value: 'us-central1', label: 'us-central1' },
          { value: 'us-east1', label: 'us-east1' },
          { value: 'europe-west1', label: 'europe-west1' },
        ],
        help: 'Región para el template',
      },
    },
    instanceGroup: {
      name: {
        label: 'Nombre del grupo',
        type: 'text',
        required: true,
        placeholder: 'web-server-group',
        help: 'Nombre único para el grupo de instancias',
      },
      base_instance_name: {
        label: 'Nombre base de instancias',
        type: 'text',
        required: true,
        placeholder: 'web-server',
        help: 'Nombre base para las instancias creadas',
      },
      target_size: {
        label: 'Tamaño objetivo',
        type: 'number',
        required: true,
        min: 1,
        max: 1000,
        default: 3,
        help: 'Número objetivo de instancias en el grupo',
      },
      zone: {
        label: 'Zona',
        type: 'select',
        options: [
          { value: 'us-central1-a', label: 'us-central1-a' },
          { value: 'us-central1-b', label: 'us-central1-b' },
          { value: 'us-east1-b', label: 'us-east1-b' },
        ],
        help: 'Zona para grupos zonales (opcional para grupos regionales)',
      },
    },
    storage: {
      name: {
        label: 'Nombre del bucket',
        type: 'text',
        required: true,
        placeholder: 'mi-bucket',
        help: 'El nombre del bucket de Cloud Storage',
      },
      location: {
        label: 'Ubicación',
        type: 'select',
        required: true,
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
        required: true,
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
