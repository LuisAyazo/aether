import { PlatformConfig } from '../types';
import { Deployment } from '@/app/types/deployments'; // Necesario para Deployment['provider'] y Deployment['platform']

export const ecsPlatformConfig: PlatformConfig = {
  provider: 'aws',
  platformType: 'ecs',
  name: 'AWS ECS', 
  icon: '📦', 
  color: 'text-orange-500',
  formFields: [
    { name: 'cpu', type: 'select', label: 'CPU', options: [ { value: '256', label: '0.25 vCPU' }, { value: '512', label: '0.5 vCPU' }, { value: '1024', label: '1 vCPU' }, { value: '2048', label: '2 vCPU' } ], defaultValue: '256', required: true },
    { name: 'memory', type: 'select', label: 'Memoria (MB)', options: [ { value: '512', label: '512 MB' }, { value: '1024', label: '1 GB' }, { value: '2048', label: '2 GB' }, { value: '4096', label: '4 GB' } ], defaultValue: '512', required: true },
    { name: 'port', type: 'number', label: 'Puerto del Contenedor', defaultValue: 80, required: true, help: "Puerto que expone tu aplicación dentro del contenedor." },
    { name: 'minCount', type: 'number', label: 'Mínimo de Tareas', defaultValue: 1, required: true, min: 1 },
    { name: 'maxCount', type: 'number', label: 'Máximo de Tareas', defaultValue: 2, required: true, min: 1 },
    { name: 'image_name', type: 'text', label: 'Nombre de Imagen Docker', defaultValue: 'your-account-id.dkr.ecr.your-region.amazonaws.com/your-repo:latest', required: true, placeholder: 'nginx:latest o ID_CUENTA.dkr.ecr.REGION.amazonaws.com/REPO:TAG' },
    { name: 'container_port', type: 'number', label: 'Puerto del Host (opcional)', defaultValue: 80, help: "Puerto del host que se mapea al puerto del contenedor. Dejar vacío si no es necesario." }
  ],
  yamlTemplate: `version: '3.8' # Docker Compose V3.8 para compatibilidad con ECS CLI
services:
  {{service_name}}: # Nombre del servicio, derivado del nombre del despliegue
    image: {{image_name}}
    ports:
      - "{{container_port}}:{{port}}" # Mapeo de puerto host:contenedor
    # logging: # Configuración de logging para CloudWatch Logs
    #   driver: awslogs
    #   options:
    #     awslogs-group: "/ecs/{{service_name}}"
    #     awslogs-region: "{{region}}" # La región se tomará de la configuración general
    #     awslogs-stream-prefix: "ecs"
    # environment: # Las variables de entorno se inyectarán aquí
    #   - EXAMPLE_VAR=example_value
    # healthcheck: # Ejemplo de healthcheck
    #   test: ["CMD-SHELL", "curl -f http://localhost:{{port}}/health || exit 1"]
    #   interval: 30s
    #   timeout: 5s
    #   retries: 3
    #   start_period: 60s

# Descomentar y configurar si se usa Fargate en lugar de EC2 para ECS
# x-aws-cloudformation:
#   Resources:
#     {{service_name}}TaskDefinition:
#       Type: AWS::ECS::TaskDefinition
#       Properties:
#         Family: {{service_name}}
#         Cpu: {{cpu}} # e.g., 256 (.25 vCPU), 512 (.5 vCPU), 1024 (1 vCPU)
#         Memory: {{memory}} # e.g., 512 (0.5GB), 1024 (1GB), 2048 (2GB)
#         NetworkMode: awsvpc
#         RequiresCompatibilities:
#           - FARGATE
#         ExecutionRoleArn: arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole # Reemplazar YOUR_ACCOUNT_ID
#         ContainerDefinitions:
#           - Name: {{service_name}}
#             Image: {{image_name}}
#             PortMappings:
#               - ContainerPort: {{port}}
#             # LogConfiguration: # Ejemplo para Fargate
#             #   LogDriver: awslogs
#             #   Options:
#             #     awslogs-group: /ecs/{{service_name}}
#             #     awslogs-region: {{region}}
#             #     awslogs-stream-prefix: ecs
#     {{service_name}}Service:
#       Type: AWS::ECS::Service
#       Properties:
#         ServiceName: {{service_name}}
#         Cluster: YOUR_ECS_CLUSTER_ARN_OR_NAME # Reemplazar con tu ARN o nombre de cluster ECS
#         TaskDefinition: !Ref {{service_name}}TaskDefinition
#         DesiredCount: {{minCount}} # Usar minCount como desiredCount inicial
#         LaunchType: FARGATE
#         NetworkConfiguration:
#           AwsvpcConfiguration:
#             Subnets:
#               - subnet-xxxxxxxxxxxxxxxxx # Reemplazar con tus IDs de Subnet
#               - subnet-yyyyyyyyyyyyyyyyy
#             SecurityGroups:
#               - sg-zzzzzzzzzzzzzzzzz # Reemplazar con tu ID de Security Group
#             AssignPublicIp: ENABLED # O DISABLED según necesidad
#         # LoadBalancers: # Ejemplo si se usa un Load Balancer
#         #   - TargetGroupArn: YOUR_TARGET_GROUP_ARN
#         #     ContainerName: {{service_name}}
#         #     ContainerPort: {{port}}
`
};
