import { FieldConfig } from "../../../../types/resourceConfig";

export const gcpMemorystoreInstanceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Instancia',
    type: 'text',
    required: true,
    placeholder: 'my-redis-instance',
    description: 'El nombre único para tu instancia de Memorystore.'
  },
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    required: true,
    placeholder: 'gcp-project-id',
    description: 'ID del proyecto de Google Cloud donde se creará la instancia.'
  },
  {
    key: 'region',
    label: 'Región',
    type: 'select',
    required: true,
    description: 'La región donde se desplegará la instancia de Memorystore.',
    options: [
      { value: 'us-central1', label: 'us-central1 (Iowa)' },
      { value: 'us-east1', label: 'us-east1 (South Carolina)' },
      { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
      // Añadir más regiones según sea necesario
    ],
    defaultValue: 'us-central1'
  },
  {
    key: 'tier',
    label: 'Nivel de Servicio',
    type: 'select',
    required: true,
    options: [
      { value: 'BASIC', label: 'Básico (Instancia independiente)' },
      { value: 'STANDARD_HA', label: 'Estándar HA (Alta Disponibilidad)' },
    ],
    defaultValue: 'BASIC',
    description: 'El nivel de servicio de la instancia (Básico o Estándar HA para Redis).'
  },
  {
    key: 'memory_size_gb',
    label: 'Tamaño de Memoria (GB)',
    type: 'number',
    required: true,
    min: 1,
    max: 300, // El máximo puede variar según el tier y tipo
    defaultValue: 1,
    description: 'La capacidad de memoria de la instancia en GB.'
  },
  {
    key: 'redis_version',
    label: 'Versión de Redis',
    type: 'select',
    options: [
      { value: 'REDIS_7_2', label: 'Redis 7.2 (Predeterminado)' },
      { value: 'REDIS_7_0', label: 'Redis 7.0' },
      { value: 'REDIS_6_X', label: 'Redis 6.x' },
      { value: 'REDIS_5_0', label: 'Redis 5.0' },
      { value: 'REDIS_4_0', label: 'Redis 4.0' },
      { value: 'REDIS_3_2', label: 'Redis 3.2' },
    ],
    defaultValue: 'REDIS_7_2',
    description: 'La versión de Redis para la instancia.'
  },
  {
    key: 'connect_mode',
    label: 'Modo de Conexión',
    type: 'select',
    options: [
      { value: 'DIRECT_PEERING', label: 'Direct Peering' },
      { value: 'PRIVATE_SERVICE_ACCESS', label: 'Private Service Access' },
    ],
    defaultValue: 'DIRECT_PEERING',
    description: 'Modo de conexión de red para la instancia.'
  },
  {
    key: 'authorized_network',
    label: 'Red Autorizada',
    type: 'text',
    placeholder: 'projects/PROJECT_ID/global/networks/VPC_NAME',
    description: 'La red VPC autorizada para conectarse a la instancia (requerido para Direct Peering).'
  },
];
