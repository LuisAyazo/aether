import { FieldConfig } from '@/app/types/resourceConfig';

export const gcpWorkflowsWorkflowFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Nombre del Workflow',
    type: 'text',
    required: true,
    placeholder: 'my-workflow',
    description: 'El nombre del workflow. Debe ser único dentro del proyecto y la región.'
  },
  {
    key: 'project',
    label: 'ID del Proyecto GCP',
    type: 'text',
    placeholder: 'gcp-project-id',
    description: 'El ID del proyecto GCP donde se creará el workflow. Si se omite, se usa el del proveedor.'
  },
  {
    key: 'region',
    label: 'Región',
    type: 'text',
    required: true,
    placeholder: 'us-central1',
    description: 'La región donde se desplegará el workflow (ej. us-central1).'
  },
  {
    key: 'description',
    label: 'Descripción',
    type: 'textarea',
    placeholder: 'Descripción de mi workflow.',
    description: 'Una descripción para el workflow.'
  },
  {
    key: 'service_account',
    label: 'Cuenta de Servicio (Email o uniqueId)',
    type: 'text',
    placeholder: 'my-service-account@my-project.iam.gserviceaccount.com',
    description: 'La cuenta de servicio que usará el workflow para la autenticación. Si se omite, usa la cuenta de servicio por defecto de Compute Engine.'
  },
  {
    key: 'source_contents',
    label: 'Contenido Fuente del Workflow (YAML)',
    type: 'textarea',
    required: true,
    placeholder: `# Ejemplo de workflow simple:\n# main:\n#   steps:\n#     - init:\n#         assign:\n#           - project_id: \${sys.get_env("GOOGLE_CLOUD_PROJECT_ID")}\n#     - log_project_id:\n#         call: sys.log\n#         args:\n#           text: \${"Current project ID: " + project_id}\n#           severity: "INFO"\n#     - final_step:\n#         return: "Workflow completado"`,
    description: 'El código fuente del workflow en formato YAML.'
  },
  {
    key: 'labels',
    label: 'Labels (formato: clave1=valor1,clave2=valor2)',
    type: 'textarea',
    placeholder: 'env=dev,team=orchestration',
    description: 'Labels para organizar el workflow.'
  },
  {
    key: 'user_env_vars',
    label: 'Variables de Entorno de Usuario (formato: CLAVE1=VALOR1,CLAVE2=VALOR2)',
    type: 'textarea',
    placeholder: 'API_ENDPOINT=https://api.example.com,TIMEOUT_SECONDS=30',
    description: 'Variables de entorno definidas por el usuario para el workflow.'
  },
  // call_log_level y crypto_key_name son otras opciones que podrían añadirse.
];
