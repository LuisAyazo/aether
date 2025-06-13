import { FieldConfig } from "../../../../types/resourceConfig";

export const gkeClusterFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Cluster',
    type: 'text',
    required: true,
    placeholder: 'my-gke-cluster',
    description: 'El nombre único para tu cluster de GKE.'
  },
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    required: true,
    placeholder: 'gcp-project-id',
    description: 'ID del proyecto de Google Cloud donde se creará el cluster.'
  },
  {
    key: 'location', // GKE puede ser zonal o regional
    label: 'Ubicación (Zona o Región)',
    type: 'text',
    required: true,
    placeholder: 'us-central1-a (zonal) o us-central1 (regional)',
    description: 'La zona o región donde se desplegará el cluster de GKE.'
  },
  {
    key: 'initialNodeCount',
    label: 'Número Inicial de Nodos (por Pool)',
    type: 'number',
    min: 1,
    required: true,
    defaultValue: 1,
    description: 'Número de nodos para el pool de nodos inicial.'
  },
  {
    key: 'nodeMachineType',
    label: 'Tipo de Máquina del Nodo',
    type: 'select',
    required: true,
    defaultValue: 'e2-medium',
    options: [
      { value: 'e2-small', label: 'e2-small (2 vCPU, 2GB RAM)' },
      { value: 'e2-medium', label: 'e2-medium (2 vCPU, 4GB RAM)' },
      { value: 'e2-standard-2', label: 'e2-standard-2 (2 vCPU, 8GB RAM)' },
      { value: 'n1-standard-1', label: 'n1-standard-1 (1 vCPU, 3.75GB RAM)' },
      { value: 'n1-standard-2', label: 'n1-standard-2 (2 vCPU, 7.5GB RAM)' },
    ],
    description: 'El tipo de máquina para los nodos en el pool de nodos inicial.'
  },
  {
    key: 'network',
    label: 'Red VPC',
    type: 'text',
    placeholder: 'default',
    description: 'Nombre de la red VPC a la que se conectará el cluster. Por defecto, "default".'
  },
  {
    key: 'subnetwork',
    label: 'Subred VPC',
    type: 'text',
    placeholder: 'default',
    description: 'Nombre de la subred VPC. Si la red es auto-mode, esto es opcional.'
  },
  {
    key: 'enableAutopilot',
    label: 'Habilitar GKE Autopilot',
    type: 'boolean',
    defaultValue: false,
    description: 'Si se habilita, GKE gestionará la infraestructura del cluster.'
  },
];
