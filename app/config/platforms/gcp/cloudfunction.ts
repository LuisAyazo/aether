import { PlatformConfig } from '../types';

export const cloudfunctionPlatformConfig: PlatformConfig = {
  provider: 'gcp',
  platformType: 'cloud-function',
  name: 'Google Cloud Function', 
  icon: '⚡', 
  color: 'text-yellow-500',
  formFields: [
    { name: 'runtime', type: 'select', label: 'Runtime', options: [ { value: 'nodejs18', label: 'Node.js 18' }, { value: 'nodejs20', label: 'Node.js 20' }, { value: 'python39', label: 'Python 3.9' }, { value: 'python310', label: 'Python 3.10' }, { value: 'go119', label: 'Go 1.19' }, { value: 'java11', label: 'Java 11' } ], defaultValue: 'nodejs18', required: true },
    { name: 'entryPoint', type: 'text', label: 'Punto de Entrada', defaultValue: 'handler', required: true, help: "Nombre de la función exportada en tu código." },
    { name: 'memory', type: 'select', label: 'Memoria Asignada', options: [ { value: '128MB', label: '128 MB' }, { value: '256MB', label: '256 MB' }, { value: '512MB', label: '512 MB' }, { value: '1024MB', label: '1 GB' }, { value: '2048MB', label: '2 GB' } ], defaultValue: '256MB', required: true },
    { name: 'timeout', type: 'number', label: 'Timeout (segundos)', defaultValue: 60, min: 1, max: 540, required: true },
    { name: 'minInstances', type: 'number', label: 'Mínimo de Instancias (Opcional)', defaultValue: 0, min: 0, help: "Número mínimo de instancias en ejecución." },
    { name: 'maxInstances', type: 'number', label: 'Máximo de Instancias (Opcional)', defaultValue: 100, min: 0, help: "Número máximo de instancias. 0 para ilimitado por defecto." },
    { name: 'triggerType', type: 'select', label: 'Tipo de Disparador', options: [ {value: 'HTTP', label: 'HTTP'}, {value: 'EVENT', label: 'Evento (Pub/Sub, Storage, etc.)'}], defaultValue: 'HTTP', required: true }
  ],
  yamlTemplate: `# gcloud functions deploy {{function_name}} --gen2 \\
#   --runtime={{runtime}} \\
#   --region={{region}} \\
#   --source=. \\ # Asume que el código está en el directorio actual del despliegue
#   --entry-point={{entryPoint}} \\
#   --trigger-http # O --trigger-event, --trigger-topic, etc. \\
#   --allow-unauthenticated # Para funciones HTTP públicas \\
#   --min-instances={{minInstances}} \\
#   --max-instances={{maxInstances}} \\
#   --timeout={{timeout}}s \\
#   --memory={{memory}} \\
#   # Las variables de entorno se pueden pasar con --set-env-vars KEY1=VALUE1,KEY2=VALUE2

# Representación conceptual en un formato similar a YAML (no es un archivo de despliegue directo para gcloud)
# Esto es más para visualización y para que el usuario entienda la configuración.
# La ejecución real se haría con comandos gcloud.

configType: GoogleCloudFunctionGen2
functionName: {{function_name}}
region: {{region}}
runtime: {{runtime}}
entryPoint: {{entryPoint}}
trigger:
  type: {{triggerType}}
  # Para HTTP:
  allowUnauthenticated: true # O false
  # Para Eventos (ejemplo Pub/Sub):
  # eventType: google.cloud.pubsub.topic.v1.messagePublished
  # eventResource: projects/YOUR_PROJECT/topics/YOUR_TOPIC
memory: {{memory}}
timeoutSeconds: {{timeout}}
minInstances: {{minInstances}}
maxInstances: {{maxInstances}}
# environmentVariables: # Se inyectarán aquí
#   KEY1: VALUE1
`
};
