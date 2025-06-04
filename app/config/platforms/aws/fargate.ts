import { PlatformConfig } from '../types';

export const fargatePlatformConfig: PlatformConfig = {
  provider: 'aws',
  platformType: 'fargate',
  name: 'AWS Fargate', 
  icon: '💨', 
  color: 'text-teal-500',
  formFields: [
    { name: 'cpu', type: 'select', label: 'vCPU', options: [ { value: '256', label: '0.25 vCPU' }, { value: '512', label: '0.5 vCPU' }, { value: '1024', label: '1 vCPU' }, { value: '2048', label: '2 vCPU' }, { value: '4096', label: '4 vCPU' } ], defaultValue: '256', required: true, help: "Unidades de CPU asignadas a la tarea." },
    { name: 'memory', type: 'select', label: 'Memoria (MB)', options: [ { value: '512', label: '0.5 GB (512MB)' }, { value: '1024', label: '1 GB (1024MB)' }, { value: '2048', label: '2 GB (2048MB)' }, { value: '3072', label: '3 GB (3072MB)' }, { value: '4096', label: '4 GB (4096MB)' }, { value: '8192', label: '8 GB (8192MB)' } ], defaultValue: '512', required: true, help: "Cantidad de memoria asignada a la tarea." },
    { name: 'port', type: 'number', label: 'Puerto del Contenedor', defaultValue: 80, required: true, help: "Puerto que la aplicación expone en el contenedor." },
    { name: 'desiredCount', type: 'number', label: 'Número de Tareas Deseadas', defaultValue: 1, required: true, min: 1, help: "Número de instancias de la tarea a ejecutar." },
    { name: 'image_name', type: 'text', label: 'Nombre de Imagen Docker', defaultValue: 'your-account-id.dkr.ecr.your-region.amazonaws.com/your-repo:latest', required: true, placeholder: 'nginx:latest o ID_CUENTA.dkr.ecr.REGION.amazonaws.com/REPO:TAG' },
    { name: 'executionRoleArn', type: 'text', label: 'ARN del Rol de Ejecución de Tarea', placeholder: 'arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole', help: "ARN del rol IAM que ECS necesita para extraer imágenes y publicar logs." },
    { name: 'taskRoleArn', type: 'text', label: 'ARN del Rol de Tarea (Opcional)', placeholder: 'arn:aws:iam::ACCOUNT_ID:role/MyApplicationTaskRole', help: "ARN del rol IAM para permisos a nivel de aplicación dentro de la tarea." },
    { name: 'clusterName', type: 'text', label: 'Nombre del Cluster ECS', defaultValue: 'default', help: "Nombre del cluster ECS donde se desplegará el servicio. Puede ser un ARN completo." },
    { name: 'subnetIds', type: 'text', label: 'IDs de Subred (separados por coma)', placeholder: 'subnet-xxxx,subnet-yyyy', required: true, help: "Al menos una Subnet ID es requerida." },
    { name: 'securityGroupIds', type: 'text', label: 'IDs de Grupos de Seguridad (separados por coma)', placeholder: 'sg-zzzz', required: true, help: "Al menos un Security Group ID es requerido." },
    { name: 'assignPublicIp', type: 'select', label: 'Asignar IP Pública', options: [{value: 'ENABLED', label: 'Habilitado'}, {value: 'DISABLED', label: 'Deshabilitado'}], defaultValue: 'ENABLED', required: true }
  ],
  yamlTemplate: `AWSTemplateFormatVersion: '2010-09-09'
Description: AWS Fargate deployment for {{service_name}}
Parameters:
  ServiceName:
    Type: String
    Default: {{service_name}}
  ImageName:
    Type: String
    Default: {{image_name}}
  ContainerPort:
    Type: Number
    Default: {{port}}
  CpuUnits:
    Type: String # AWS CFN espera String para CPU/Memory en TaskDef
    Default: "{{cpu}}"
  MemoryUnits:
    Type: String
    Default: "{{memory}}"
  DesiredCount:
    Type: Number
    Default: {{desiredCount}}
  EcsCluster: # Puede ser nombre o ARN
    Type: String
    Default: {{clusterName}}
  ExecutionRole:
    Type: String
    Default: {{executionRoleArn}} # e.g. arn:aws:iam::123456789012:role/ecsTaskExecutionRole
  TaskRole: # Opcional
    Type: String
    Default: "{{taskRoleArn}}" # e.g. arn:aws:iam::123456789012:role/MyApplicationTaskRole
    Description: Optional IAM role for the task itself.
  VpcSubnets: # Comma-delimited list
    Type: CommaDelimitedList
    Default: "{{subnetIds}}" # e.g. subnet-xxxxxxxx,subnet-yyyyyyyy
  SecurityGroups: # Comma-delimited list
    Type: CommaDelimitedList
    Default: "{{securityGroupIds}}" # e.g. sg-zzzzzzzz
  AssignPublicIp:
    Type: String
    Default: {{assignPublicIp}}
    AllowedValues: [ENABLED, DISABLED]

Resources:
  LogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/ecs/$ { Parameters.ServiceName }" # Modificado para que TS no lo interprete como variable
      RetentionInDays: 7

  TaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: !Ref ServiceName
      Cpu: !Ref CpuUnits
      Memory: !Ref MemoryUnits
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      ExecutionRoleArn: !Ref ExecutionRole
      TaskRoleArn: !Ref TaskRole # AWS::NoValue si está vacío
      ContainerDefinitions:
        - Name: !Ref ServiceName
          Image: !Ref ImageName
          PortMappings:
            - ContainerPort: !Ref ContainerPort
              Protocol: tcp
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: !Ref LogGroup
              awslogs-region: !Ref AWS::Region
              awslogs-stream-prefix: ecs
          # environment: # Las variables de entorno se inyectarán aquí
          #   - Name: EXAMPLE_VAR
          #     Value: example_value
          # healthCheck: # Ejemplo
          #   command: [ "CMD-SHELL", "curl -f http://localhost:$ { Parameters.ContainerPort }/health || exit 1" ] # Modificado
          #   interval: 30
          #   timeout: 5
          #   retries: 3
          #   startPeriod: 60
  
  Service:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: !Ref ServiceName
      Cluster: !Ref EcsCluster
      TaskDefinition: !Ref TaskDefinition
      DesiredCount: !Ref DesiredCount
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          Subnets: !Ref VpcSubnets
          SecurityGroups: !Ref SecurityGroups
          AssignPublicIp: !Ref AssignPublicIp
      # LoadBalancers: # Descomentar y configurar si se usa un Load Balancer
      #   - TargetGroupArn: arn:aws:elasticloadbalancing:REGION:ACCOUNT_ID:targetgroup/TARGET_GROUP_NAME/TARGET_GROUP_ID
      #     ContainerName: !Ref ServiceName
      #     ContainerPort: !Ref ContainerPort
      DeploymentConfiguration:
        MinimumHealthyPercent: 100
        MaximumPercent: 200
      PlacementConstraints: []
      PlacementStrategy: []
      HealthCheckGracePeriodSeconds: 60 # Opcional

Outputs:
  ServiceName:
    Description: The name of the ECS Service
    Value: !Ref Service
  TaskDefinitionArn:
    Description: The ARN of the Task Definition
    Value: !Ref TaskDefinition
`
};
