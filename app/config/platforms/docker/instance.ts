import { PlatformConfig } from '../types';

export const dockerInstancePlatformConfig: PlatformConfig = {
  provider: 'docker',
  platformType: 'docker-instance',
  name: 'Docker Instance', 
  icon: '🐳', 
  color: 'text-cyan-500',
  formFields: [
    { name: 'service_name', type: 'text', label: 'Nombre del Servicio', defaultValue: 'my-service', required: true, help: "Nombre del servicio en el archivo docker-compose.yml." },
    { name: 'image_name', type: 'text', label: 'Nombre de Imagen Docker', defaultValue: 'nginx:latest', required: true, placeholder: 'usuario/imagen:tag' },
    { name: 'ports', type: 'text', label: 'Puertos (HOST:CONTAINER)', defaultValue: "80:80", required: true, help: "Ej: 8080:80. Múltiples puertos separados por coma: 80:80,443:443" },
    { name: 'restartPolicy', type: 'select', label: 'Política de Reinicio', options: [ { value: 'no', label: 'No reiniciar (no)' }, { value: 'always', label: 'Siempre reiniciar (always)' }, { value: 'unless-stopped', label: 'Reiniciar a menos que se detenga (unless-stopped)' }, { value: 'on-failure', label: 'Reiniciar en caso de fallo (on-failure)' } ], defaultValue: 'unless-stopped', required: true },
    { name: 'volumes', type: 'text', label: 'Volúmenes (HOST:CONTAINER, opcional)', placeholder: '/ruta/host:/ruta/container,otro/volumen:/app/data', help: "Mapeo de volúmenes, separados por coma."}
  ],
  yamlTemplate: `version: '3.8'
services:
  {{service_name}}:
    image: {{image_name}}
    ports:
      # Los puertos se manejarán dinámicamente si se ingresan múltiples
      - "{{ports}}" 
    # volumes: # Descomentar si se usa el campo de volúmenes
    #   - {{volumes}} 
    # environment: # Las variables de entorno se inyectarán aquí
    #   - EXAMPLE_VAR=example_value
    restart: {{restartPolicy}}
    # healthcheck: # Ejemplo
    #   test: ["CMD", "curl", "-f", "http://localhost/health"] # Ajustar puerto si es necesario
    #   interval: 30s
    #   timeout: 10s
    #   retries: 3
`
};
