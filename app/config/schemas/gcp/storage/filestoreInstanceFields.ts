import { FieldConfig } from '@/app/types/resourceConfig';

export const gcpFilestoreInstanceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Instancia',
    type: 'text',
    required: true,
    placeholder: 'my-filestore-instance',
    description: 'El nombre único para tu instancia de Filestore.'
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
    key: 'zone', // Filestore es zonal
    label: 'Zona',
    type: 'select',
    required: true,
    description: 'La zona donde se desplegará la instancia de Filestore.',
    options: [
      { value: 'us-central1-a', label: 'us-central1-a' },
      { value: 'us-central1-b', label: 'us-central1-b' },
      { value: 'us-east1-b', label: 'us-east1-b' },
      { value: 'europe-west1-b', label: 'europe-west1-b' },
      // Añadir más zonas según sea necesario
    ],
    defaultValue: 'us-central1-a'
  },
  {
    key: 'tier',
    label: 'Nivel de Servicio',
    type: 'select',
    required: true,
    options: [
      { value: 'STANDARD', label: 'Estándar (HDD)' },
      { value: 'PREMIUM', label: 'Premium (SSD)' },
      { value: 'HIGH_SCALE_SSD', label: 'SSD de Alta Escala' },
      { value: 'ENTERPRISE', label: 'Enterprise (con snapshots, etc.)' }, 
      // BASIC_HDD y BASIC_SSD son tiers más antiguos
    ],
    defaultValue: 'STANDARD',
    description: 'El nivel de rendimiento y características de la instancia.'
  },
  {
    key: 'file_share_capacity_gb',
    label: 'Capacidad del Recurso Compartido (GB)',
    type: 'number',
    required: true,
    min: 1024, // Mínimo 1TB para Standard/Premium
    defaultValue: 1024,
    description: 'La capacidad del recurso compartido de archivos en GB (mínimo 1024 para Standard/Premium).'
  },
  {
    key: 'file_share_name',
    label: 'Nombre del Recurso Compartido',
    type: 'text',
    required: true,
    defaultValue: 'vol1',
    description: 'El nombre del recurso compartido de archivos NFS.'
  },
  {
    key: 'network',
    label: 'Red VPC',
    type: 'text',
    required: true,
    placeholder: 'default',
    description: 'El nombre de la red VPC a la que se conectará la instancia.'
  },
];
