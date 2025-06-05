import { PlatformConfig } from '../types';

export const kubernetesDeploymentPlatformConfig: PlatformConfig = {
  provider: 'kubernetes',
  platformType: 'kubernetes', // O podría ser más específico como 'kubernetes-deployment'
  name: 'Kubernetes Deployment', 
  icon: '☸️', 
  color: 'text-indigo-500',
  formFields: [
    { name: 'app_name', type: 'text', label: 'Nombre de la Aplicación', defaultValue: 'my-app', required: true, help: "Nombre usado para labels y selectores." },
    { name: 'image_name', type: 'text', label: 'Nombre de Imagen Docker', defaultValue: 'nginx:latest', required: true, placeholder: 'usuario/imagen:tag' },
    { name: 'replicas', type: 'number', label: 'Réplicas', defaultValue: 3, required: true, min: 1 },
    { name: 'containerPort', type: 'number', label: 'Puerto del Contenedor', defaultValue: 80, required: true },
    { name: 'namespace', type: 'text', label: 'Namespace (Opcional)', defaultValue: 'default', help: "Namespace de Kubernetes donde se desplegará." },
    { name: 'cpuRequest', type: 'select', label: 'CPU Request', options: [ { value: '100m', label: '0.1 CPU (100m)' }, { value: '250m', label: '0.25 CPU (250m)' }, { value: '500m', label: '0.5 CPU (500m)' }, { value: '1000m', label: '1 CPU (1000m)' } ], defaultValue: '100m', help: "CPU solicitada para el pod." },
    { name: 'memoryRequest', type: 'select', label: 'Memoria Request', options: [ { value: '128Mi', label: '128 MiB' }, { value: '256Mi', label: '256 MiB' }, { value: '512Mi', label: '512 MiB' }, { value: '1Gi', label: '1 GiB' } ], defaultValue: '128Mi', help: "Memoria solicitada para el pod." },
    { name: 'cpuLimit', type: 'select', label: 'CPU Limit (Opcional)', options: [ { value: '200m', label: '0.2 CPU (200m)' }, { value: '500m', label: '0.5 CPU (500m)' }, { value: '1000m', label: '1 CPU (1000m)' }, { value: '2000m', label: '2 CPU (2000m)' } ], defaultValue: '500m', help: "Límite de CPU para el pod." },
    { name: 'memoryLimit', type: 'select', label: 'Memoria Limit (Opcional)', options: [ { value: '256Mi', label: '256 MiB' }, { value: '512Mi', label: '512 MiB' }, { value: '1Gi', label: '1 GiB' }, { value: '2Gi', label: '2 GiB' } ], defaultValue: '512Mi', help: "Límite de memoria para el pod." }
  ],
  yamlTemplate: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{app_name}}
  namespace: {{namespace}}
  labels:
    app: {{app_name}}
spec:
  replicas: {{replicas}}
  selector:
    matchLabels:
      app: {{app_name}}
  template:
    metadata:
      labels:
        app: {{app_name}}
    spec:
      containers:
      - name: {{app_name}}
        image: {{image_name}}
        ports:
        - containerPort: {{containerPort}}
        # env: # Las variables de entorno se inyectarán aquí
        # - name: EXAMPLE_VAR
        #   value: "example_value"
        resources:
          requests:
            cpu: {{cpuRequest}}
            memory: {{memoryRequest}}
          limits:
            cpu: {{cpuLimit}}
            memory: {{memoryLimit}}
        # livenessProbe: # Ejemplo
        #   httpGet:
        #     path: /healthz
        #     port: {{containerPort}}
        #   initialDelaySeconds: 15
        #   periodSeconds: 20
        # readinessProbe: # Ejemplo
        #   httpGet:
        #     path: /ready
        #     port: {{containerPort}}
        #   initialDelaySeconds: 5
        #   periodSeconds: 10

---
# Ejemplo de Service para exponer el Deployment (opcional, pero común)
# apiVersion: v1
# kind: Service
# metadata:
#   name: {{app_name}}-service
#   namespace: {{namespace}}
# spec:
#   selector:
#     app: {{app_name}}
#   ports:
#     - protocol: TCP
#       port: 80 # Puerto del Service
#       targetPort: {{containerPort}} # Puerto del contenedor
#   type: LoadBalancer # O ClusterIP, NodePort
`
};
