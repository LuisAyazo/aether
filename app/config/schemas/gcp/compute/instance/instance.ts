import { z } from 'zod';
import { ResourceSchema } from '../../../../../types/resourceConfig';
import { instanceFields } from './instanceFields';

// Esquema para configuración de acceso (IP externa)
const accessConfigSchema = z.object({
  name: z.string().default('External NAT'),
  type: z.enum(['ONE_TO_ONE_NAT']).default('ONE_TO_ONE_NAT'),
  network_tier: z.enum(['PREMIUM', 'STANDARD']).default('PREMIUM'),
  nat_ip: z.string().optional(),
});

// Esquema para interfaces de red
const networkInterfaceSchema = z.object({
  network: z.string().default('default'),
  subnetwork: z.string().optional(),
  access_config: z.array(accessConfigSchema).optional(),
  alias_ip_range: z.array(z.object({
    ip_cidr_range: z.string(),
    subnetwork_range_name: z.string().optional(),
  })).optional(),
});

// Esquema para disco de arranque
const bootDiskSchema = z.object({
  auto_delete: z.boolean().default(true),
  device_name: z.string().optional(),
  initialize_params: z.object({
    disk_name: z.string().optional(),
    disk_size_gb: z.number().min(10).max(65536).default(20),
    disk_type: z.enum(['pd-standard', 'pd-ssd', 'pd-balanced']).default('pd-standard'),
    image: z.string().min(1, 'La imagen es requerida'),
    labels: z.record(z.string()).optional(),
  }),
  mode: z.enum(['read_write', 'read_only']).default('read_write'),
});

// Esquema para discos adicionales
const attachedDiskSchema = z.object({
  device_name: z.string().optional(),
  mode: z.enum(['read_write', 'read_only']).default('read_write'),
  source: z.string().min(1, 'El disco fuente es requerido'),
});

// Esquema para discos de scratch (temporales)
const scratchDiskSchema = z.object({
  interface: z.enum(['SCSI', 'NVME']).default('SCSI'),
});

// Esquema para cuenta de servicio
const serviceAccountSchema = z.object({
  email: z.string().optional(), // Puede ser un email o referencia a otra resource
  scopes: z.array(z.string()).default(['cloud-platform']),
}).optional();

// Esquema para configuración de service account (creación automática)
const createServiceAccountSchema = z.object({
  create: z.boolean().default(false),
  account_id: z.string().optional(),
  display_name: z.string().optional(),
}).optional();

// Esquema para metadatos
const metadataSchema = z.record(z.string()).optional();

// Esquema principal para GCP Compute Engine Instance
export const gcpComputeInstanceSchema = z.object({
  // Campos básicos requeridos
  name: z.string()
    .min(1, 'El nombre es requerido')
    .regex(/^[a-z]([-a-z0-9]*[a-z0-9])?$/, 'El nombre debe empezar con una letra minúscula y solo contener letras minúsculas, números y guiones'),
  
  machine_type: z.string().min(1, 'El tipo de máquina es requerido'),
  zone: z.string().min(1, 'La zona es requerida'),
  
  // Configuración de red (requerida)
  network_interfaces: z.array(networkInterfaceSchema).min(1, 'Al menos una interfaz de red es requerida'),
  
  // Configuración de discos
  boot_disk: bootDiskSchema,
  attached_disks: z.array(attachedDiskSchema).optional(),
  scratch_disks: z.array(scratchDiskSchema).optional(),
  
  // Configuración de seguridad y acceso
  service_account: serviceAccountSchema,
  create_service_account: createServiceAccountSchema,
  tags: z.array(z.string()).optional(),
  labels: z.record(z.string()).optional(),
  
  // Metadatos y scripts
  metadata: metadataSchema,
  metadata_startup_script: z.string().optional(),
  
  // Configuración avanzada
  can_ip_forward: z.boolean().default(false),
  deletion_protection: z.boolean().default(false),
  enable_display: z.boolean().default(false),
  
  // Configuración de recursos
  min_cpu_platform: z.string().optional(),
  
  // Configuración de scheduling
  scheduling: z.object({
    automatic_restart: z.boolean().default(true),
    on_host_maintenance: z.enum(['MIGRATE', 'TERMINATE']).default('MIGRATE'),
    preemptible: z.boolean().default(false),
  }).optional(),
  
  // Opciones avanzadas
  allow_stopping_for_update: z.boolean().default(true),
  desired_status: z.enum(['RUNNING', 'STOPPED']).default('RUNNING'),
  
  // Campos de proyecto y región (opcionales en el esquema, requeridos en la UI)
  project: z.string().optional(),
  description: z.string().optional(),
});

export type GCPComputeInstanceConfig = z.infer<typeof gcpComputeInstanceSchema>;

// Valores por defecto para una nueva instancia
export const defaultGCPComputeInstanceConfig: Partial<GCPComputeInstanceConfig> = {
  name: 'my-instance',
  machine_type: 'n2-standard-2',
  zone: 'us-central1-a',
  network_interfaces: [{
    network: 'default',
    access_config: [{
      name: 'External NAT',
      type: 'ONE_TO_ONE_NAT',
      network_tier: 'PREMIUM',
    }],
  }],
  boot_disk: {
    auto_delete: true,
    initialize_params: {
      disk_size_gb: 20,
      disk_type: 'pd-standard',
      image: 'debian-cloud/debian-11',
    },
    mode: 'read_write',
  },
  service_account: {
    scopes: ['cloud-platform'],
  },
  create_service_account: {
    create: true,
    account_id: 'my-custom-sa',
    display_name: 'Custom SA for VM Instance',
  },
  tags: ['foo', 'bar'],
  metadata: {
    foo: 'bar',
  },
  metadata_startup_script: 'echo hi > /test.txt',
  scratch_disks: [{
    interface: 'NVME',
  }],
  labels: {
    my_label: 'value',
  },
  can_ip_forward: false,
  deletion_protection: false,
  scheduling: {
    automatic_restart: true,
    on_host_maintenance: 'MIGRATE',
    preemptible: false,
  },
  allow_stopping_for_update: true,
  desired_status: 'RUNNING',
};

// Constantes para opciones predefinidas
export const GCP_REGIONS = [
  'us-central1-a', 'us-central1-b', 'us-central1-c', 'us-central1-f',
  'us-east1-a', 'us-east1-b', 'us-east1-c', 'us-east1-d',
  'us-west1-a', 'us-west1-b', 'us-west1-c',
  'europe-west1-a', 'europe-west1-b', 'europe-west1-c', 'europe-west1-d',
  'asia-east1-a', 'asia-east1-b', 'asia-east1-c'
] as const;

export const GCP_MACHINE_TYPES = [
  // General purpose
  'e2-micro', 'e2-small', 'e2-medium', 'e2-standard-2', 'e2-standard-4',
  'n1-standard-1', 'n1-standard-2', 'n1-standard-4', 'n1-standard-8',
  'n2-standard-2', 'n2-standard-4', 'n2-standard-8', 'n2-standard-16',
  // Compute optimized
  'c2-standard-4', 'c2-standard-8', 'c2-standard-16',
  // Memory optimized
  'n2-highmem-2', 'n2-highmem-4', 'n2-highmem-8',
  'm1-ultramem-40', 'm1-ultramem-80', 'm1-ultramem-160',
  // Custom
  'custom-1-1024', 'custom-2-2048', 'custom-4-4096'
] as const;

export const GCP_DISK_TYPES = [
  'pd-standard', 'pd-ssd', 'pd-balanced'
] as const;

export const GCP_BOOT_IMAGES = [
  'debian-cloud/debian-11',
  'debian-cloud/debian-10',
  'ubuntu-os-cloud/ubuntu-2004-lts',
  'ubuntu-os-cloud/ubuntu-2204-lts',
  'centos-cloud/centos-7',
  'rhel-cloud/rhel-8',
  'windows-cloud/windows-2019',
  'windows-cloud/windows-2022'
] as const;

// Schema principal del recurso
export const gcpComputeInstanceResourceSchema: ResourceSchema = {
  type: 'gcp_compute_instance',
  displayName: 'Compute Engine Instance',
  description: 'Google Cloud Platform virtual machine instance',
  category: 'compute',
  fields: instanceFields,
  templates: [],
  documentation: {
    description: 'Create and manage virtual machine instances in Google Cloud',
    examples: [
      'Web server instance',
      'Database server',
      'Application server with load balancer'
    ]
  }
};