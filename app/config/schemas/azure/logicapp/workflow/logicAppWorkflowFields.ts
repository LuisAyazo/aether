import { FieldConfig } from "../../../../../types/resourceConfig";

export const azureLogicAppWorkflowFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Logic App Workflow',
    type: 'text',
    required: true,
    placeholder: 'mylogicappworkflow',
    description: 'El nombre del flujo de trabajo de Logic App. Debe ser único dentro del grupo de recursos.'
  },
  {
    key: 'resource_group_name',
    label: 'Nombre del Grupo de Recursos',
    type: 'text',
    required: true,
    placeholder: 'my-resource-group',
    description: 'El nombre del Grupo de Recursos donde se creará el Logic App.'
  },
  {
    key: 'location',
    label: 'Ubicación',
    type: 'text',
    required: true,
    placeholder: 'East US',
    description: 'La región de Azure donde se creará el Logic App.'
  },
  {
    key: 'logic_app_integration_account_id',
    label: 'ID de Cuenta de Integración (Opcional)',
    type: 'text',
    placeholder: '/subscriptions/.../integrationAccounts/myIntegrationAccount',
    description: 'El ID de la Cuenta de Integración de Logic App a asociar.'
  },
  {
    key: 'workflow_schema',
    label: 'Esquema del Workflow (URL)',
    type: 'text',
    placeholder: 'https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#',
    description: 'La URL del esquema para la definición del flujo de trabajo.'
  },
  {
    key: 'workflow_version',
    label: 'Versión del Workflow',
    type: 'text',
    placeholder: '1.0.0.0',
    description: 'La versión del flujo de trabajo.'
  },
  {
    key: 'parameters',
    label: 'Parámetros del Workflow (JSON)',
    type: 'textarea',
    placeholder: '{\n  "parameterName": {\n    "type": "String",\n    "value": "defaultValue"\n  }\n}',
    description: 'Parámetros para el flujo de trabajo en formato JSON.'
  },
  // La definición del flujo de trabajo (workflow_definition) es compleja y usualmente se gestiona como un archivo JSON separado.
  // Para este formulario, podríamos permitir pegar el JSON o referenciar un archivo.
  // Por simplicidad, no se incluye un campo directo para la definición completa aquí.
  {
    key: 'enabled',
    label: 'Habilitado',
    type: 'boolean',
    defaultValue: true,
    description: 'Indica si el Logic App Workflow está habilitado.'
  },
  {
    key: 'tags',
    label: 'Tags (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'environment=dev,department=automation',
    description: 'Tags para organizar el Logic App.'
  },
];
