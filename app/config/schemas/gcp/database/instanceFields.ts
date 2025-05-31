import { FieldConfig } from '@/app/types/resourceConfig';

export const gcpSqlInstanceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre de la Instancia',
    type: 'text',
    required: true,
    placeholder: 'my-sql-instance',
    description: 'El nombre único para tu instancia de Cloud SQL.'
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
    description: 'La región donde se desplegará la instancia de Cloud SQL.',
    options: [
      { value: 'us-central1', label: 'us-central1 (Iowa)' },
      { value: 'us-east1', label: 'us-east1 (South Carolina)' },
      { value: 'us-east4', label: 'us-east4 (Northern Virginia)' },
      { value: 'us-west1', label: 'us-west1 (Oregon)' },
      { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
      { value: 'europe-west2', label: 'europe-west2 (London)' },
      { value: 'asia-east1', label: 'asia-east1 (Taiwan)' },
      { value: 'asia-northeast1', label: 'asia-northeast1 (Tokyo)' },
      { value: 'australia-southeast1', label: 'australia-southeast1 (Sydney)' },
    ],
    defaultValue: 'us-central1'
  },
  {
    key: 'database_version',
    label: 'Versión de Base de Datos',
    type: 'select',
    required: true,
    description: 'El tipo y versión del motor de base de datos.',
    options: [
      { value: 'MYSQL_8_0', label: 'MySQL 8.0' },
      { value: 'MYSQL_5_7', label: 'MySQL 5.7' },
      { value: 'POSTGRES_15', label: 'PostgreSQL 15' },
      { value: 'POSTGRES_14', label: 'PostgreSQL 14' },
      { value: 'POSTGRES_13', label: 'PostgreSQL 13' },
      { value: 'SQLSERVER_2019_STANDARD', label: 'SQL Server 2019 Standard' },
      { value: 'SQLSERVER_2019_ENTERPRISE', label: 'SQL Server 2019 Enterprise' },
    ],
    defaultValue: 'MYSQL_8_0'
  },
  {
    key: 'tier',
    label: 'Tipo de Máquina (Tier)',
    type: 'select', // Podría ser un text input para más flexibilidad
    required: true,
    description: 'La configuración de la máquina para la instancia (CPU, RAM).',
    options: [
      // MySQL/PostgreSQL
      { value: 'db-f1-micro', label: 'db-f1-micro (1 vCPU, 0.6GB RAM)' },
      { value: 'db-g1-small', label: 'db-g1-small (1 vCPU, 1.7GB RAM)' },
      { value: 'db-n1-standard-1', label: 'db-n1-standard-1 (1 vCPU, 3.75GB RAM)' },
      { value: 'db-n1-standard-2', label: 'db-n1-standard-2 (2 vCPU, 7.5GB RAM)' },
      { value: 'db-n1-highmem-2', label: 'db-n1-highmem-2 (2 vCPU, 13GB RAM)' },
      // SQL Server
      { value: 'db-custom-2-7680', label: 'SQL Server: 2 vCPU, 7.5GB RAM (custom)' },
    ],
    defaultValue: 'db-f1-micro'
  },
  {
    key: 'storage_size_gb',
    label: 'Tamaño de Almacenamiento (GB)',
    type: 'number',
    min: 10,
    required: true,
    defaultValue: 10,
    description: 'La cantidad de almacenamiento en GB.'
  },
  {
    key: 'storage_auto_increase',
    label: 'Incremento Automático de Almacenamiento',
    type: 'boolean',
    defaultValue: true,
    description: 'Habilitar el incremento automático del tamaño de almacenamiento.'
  },
  {
    key: 'availability_type',
    label: 'Tipo de Disponibilidad',
    type: 'select',
    options: [
      { value: 'ZONAL', label: 'Zonal (Una sola zona)' },
      { value: 'REGIONAL', label: 'Regional (Alta disponibilidad)' },
    ],
    defaultValue: 'ZONAL',
    description: 'Configuración de disponibilidad de la instancia.'
  },
  {
    key: 'backup_enabled',
    label: 'Habilitar Backups',
    type: 'boolean',
    defaultValue: true,
    description: 'Habilitar backups automáticos.'
  },
  {
    key: 'backup_start_time',
    label: 'Hora de Inicio de Backup (HH:MM)',
    type: 'text',
    placeholder: '03:00',
    description: 'Hora UTC para iniciar backups automáticos (si están habilitados).'
  },
];
