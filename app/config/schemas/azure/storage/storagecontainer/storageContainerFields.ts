import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureStorageContainerFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Contenedor',
    type: 'text',
    required: true,
    placeholder: 'myblobcontainer',
    description: 'El nombre del contenedor de blobs. Debe ser único dentro de la cuenta de almacenamiento.'
  },
  {
    key: 'storage_account_name',
    label: 'Nombre de la Cuenta de Almacenamiento',
    type: 'text',
    required: true,
    placeholder: 'mystorageaccount',
    description: 'El nombre de la cuenta de almacenamiento Azure existente donde se creará el contenedor.'
  },
  // resource_group_name y location se infieren de la cuenta de almacenamiento, no son directos para el container.
  // Si se quisiera crear la cuenta de almacenamiento también, se añadirían aquí o en un recurso separado.
  {
    key: 'container_access_type',
    label: 'Nivel de Acceso Público',
    type: 'select',
    options: [
      { value: 'private', label: 'Privado (sin acceso anónimo)' },
      { value: 'blob', label: 'Blob (acceso de lectura anónimo para blobs)' },
      { value: 'container', label: 'Container (acceso de lectura anónimo para blobs y listado de contenedor)' },
    ],
    defaultValue: 'private',
    description: 'Especifica el nivel de acceso público para el contenedor.'
  },
  {
    key: 'metadata',
    label: 'Metadatos (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,department=IT',
    description: 'Metadatos personalizados para el contenedor.'
  },
  // Tags no son directamente aplicables a azurerm_storage_container, se aplican a la storage_account.
];
