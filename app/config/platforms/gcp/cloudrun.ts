import { PlatformConfig } from '../types';

export const cloudrunPlatformConfig: PlatformConfig = {
  provider: 'gcp',
  platformType: 'cloud-run',
  name: 'Google Cloud Run', 
  icon: '🏃', 
  color: 'text-blue-500',
  formFields: [
    { name: 'cpu', type: 'select', label: 'CPU', options: [ { value: '0.5', label: '0.5 CPU' }, { value: '1', label: '1 CPU' }, { value: '2', label: '2 CPU' }, { value: '4', label: '4 CPU' } ], defaultValue: '1', required: true },
    { name: 'memory', type: 'select', label: 'Memoria', options: [ { value: '256Mi', label: '256 MiB' }, { value: '512Mi', label: '512 MiB' }, { value: '1Gi', label: '1 GiB' }, { value: '2Gi', label: '2 GiB' } ], defaultValue: '512Mi', required: true },
    { name: 'port', type: 'number', label: 'Puerto del Contenedor', defaultValue: 8080, required: true, help: "Puerto que tu aplicación escucha en el contenedor." },
    { name: 'minInstances', type: 'number', label: 'Mínimo de Instancias', defaultValue: 0, min: 0 },
    { name: 'maxInstances', type: 'number', label: 'Máximo de Instancias', defaultValue: 10, min: 0 },
    { name: 'image_name', type: 'text', label: 'Nombre de Imagen Docker', defaultValue: 'gcr.io/your-project-id/your-image:latest', required: true, placeholder: 'gcr.io/PROJECT_ID/IMAGE_NAME:TAG' },
    { name: 'concurrency', type: 'number', label: 'Concurrencia por instancia', defaultValue: 80, min: 1, max: 1000, help: "Máximo de solicitudes simultáneas por instancia." },
    { name: 'timeoutSeconds', type: 'number', label: 'Timeout de Solicitud (segundos)', defaultValue: 300, min: 1, max: 3600 }
  ],
  yamlTemplate: `apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: {{service_name}}
  namespace: YOUR_NAMESPACE # Opcional, o usa 'default'
  labels:
    cloud.googleapis.com/location: {{region}} # La región se tomará de la config general
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "{{minInstances}}"
        autoscaling.knative.dev/maxScale: "{{maxInstances}}"
    spec:
      containerConcurrency: {{concurrency}}
      timeoutSeconds: {{timeoutSeconds}}
      containers:
        - image: {{image_name}}
          ports:
            - name: http1 # Nombre del puerto es opcional pero buena práctica
              containerPort: {{port}}
          resources:
            limits:
              cpu: "{{cpu}}"
              memory: "{{memory}}"
            # requests: # Opcional, si no se especifica, igual a limits
            #   cpu: "0.5" 
            #   memory: "256Mi"
          # env: # Las variables de entorno se inyectarán aquí
          #   - name: EXAMPLE_VAR
          #     value: "example_value"
          # startupProbe: # Ejemplo de Startup Probe
          #   httpGet:
          #     path: /healthz/startup
          #     port: {{port}}
          #   initialDelaySeconds: 0
          #   timeoutSeconds: 1
          #   periodSeconds: 10
          #   failureThreshold: 3
          # livenessProbe: # Ejemplo de Liveness Probe
          #   httpGet:
          #     path: /healthz/liveness
          #     port: {{port}}
          #   initialDelaySeconds: 0
          #   timeoutSeconds: 1
          #   periodSeconds: 10
          #   failureThreshold: 3
  traffic:
    - percent: 100
      latestRevision: true
`
};
