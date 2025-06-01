import { FieldConfig } from '@/app/types/resourceConfig';

export const azureKubernetesClusterFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Cluster AKS',
    type: 'text',
    required: true,
    placeholder: 'my-aks-cluster',
    description: 'El nombre del Cluster de Kubernetes (AKS).'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el cluster AKS.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el cluster AKS.'
  },
  {
    key: 'dns_prefix',
    label: 'Prefijo DNS',
    type: 'text',
    required: true,
    placeholder: 'myakscluster',
    description: 'Prefijo DNS para el FQDN del cluster. Debe ser único en la región.'
  },
  {
    key: 'kubernetes_version',
    label: 'Versión de Kubernetes',
    type: 'text',
    placeholder: '1.27.7', // Ejemplo, verificar versiones soportadas
    description: 'La versión de Kubernetes a usar para el cluster. Si se omite, se usa la última soportada.'
  },
  {
    key: 'default_node_pool',
    label: 'Pool de Nodos por Defecto',
    type: 'group',
    required: true,
    fields: [
      {
        key: 'name',
        label: 'Nombre del Pool de Nodos',
        type: 'text',
        required: true,
        defaultValue: 'default',
        placeholder: 'agentpool',
        description: 'Nombre para el pool de nodos por defecto.'
      },
      {
        key: 'node_count',
        label: 'Número de Nodos',
        type: 'number',
        required: true,
        min: 1,
        defaultValue: 2,
        description: 'El número de nodos en el pool por defecto.'
      },
      {
        key: 'vm_size',
        label: 'Tamaño de VM para Nodos',
        type: 'text',
        required: true,
        defaultValue: 'Standard_DS2_v2',
        placeholder: 'Standard_DS2_v2',
        description: 'El tamaño de las VMs para los nodos del pool.'
      },
      {
        key: 'os_disk_size_gb',
        label: 'Tamaño Disco SO (GB)',
        type: 'number',
        min: 30,
        placeholder: '128',
        description: 'Tamaño del disco del SO para cada nodo en GB.'
      },
      {
        key: 'vnet_subnet_id',
        label: 'ID de Subred para Nodos (Opcional)',
        type: 'text',
        placeholder: '/subscriptions/.../subnets/aks-subnet',
        description: 'ID de la subred donde se desplegarán los nodos. Si se omite, se crea una VNet.'
      }
    ]
  },
  {
    key: 'service_principal',
    label: 'Service Principal (Opcional)',
    type: 'group',
    description: 'Configuración del Service Principal si no se usa identidad gestionada.',
    fields: [
      {
        key: 'client_id',
        label: 'Client ID',
        type: 'text',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        description: 'El Client ID del Service Principal.'
      },
      {
        key: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        description: 'El Client Secret del Service Principal.'
      }
    ]
  },
  {
    key: 'network_profile',
    label: 'Perfil de Red (Opcional)',
    type: 'group',
    fields: [
        {
            key: 'network_plugin',
            label: 'Plugin de Red',
            type: 'select',
            options: [
                { value: 'azure', label: 'Azure CNI' },
                { value: 'kubenet', label: 'Kubenet' },
            ],
            defaultValue: 'azure',
            description: 'Plugin de red a utilizar.'
        },
        {
            key: 'service_cidr',
            label: 'CIDR de Servicios',
            type: 'text',
            placeholder: '10.0.0.0/16',
            description: 'Rango CIDR para los servicios de Kubernetes.'
        },
        {
            key: 'dns_service_ip',
            label: 'IP del Servicio DNS',
            type: 'text',
            placeholder: '10.0.0.10',
            description: 'IP para el servicio DNS de Kubernetes.'
        },
        {
            key: 'docker_bridge_cidr',
            label: 'CIDR del Puente Docker',
            type: 'text',
            placeholder: '172.17.0.1/16',
            description: 'Rango CIDR para el puente Docker.'
        }
    ]
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,app=aks-app',
    description: 'Tags para organizar el cluster AKS.'
  },
];
