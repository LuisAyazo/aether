import React, { useState, useEffect } from 'react';
import { z } from 'zod'; // Importar z
import SidePanel from './SidePanel';
import ResourceConfigForm from './ResourceConfigForm';
import CodeBlock from './CodeBlock';
import SmartBehaviorPanel from './SmartBehaviorPanel';
import { ResourceValues, ResourceType } from "../../types/resourceConfig";
import { 
  getResourceConfig, 
  // validateResourceConfig, // No se usa directamente aquí, se usa el schema.parse
  SupportedProvider 
} from "../../config/schemas";
import { 
  DocumentDuplicateIcon, 
  CheckIcon, 
  CommandLineIcon,
  CloudIcon,
  CogIcon,
  DocumentTextIcon,
  PlayIcon,
  CodeBracketIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface Metadata {
  key: string;
  value: string;
}

interface LifecycleRule {
  age?: number;
  isLive?: boolean;
  matchesStorageClass?: string[];
  type?: string;
  storageClass?: string;
}

interface SmartBehavior {
  conditionals?: Array<{
    property: string;
    conditions: Array<{
      condition: string;
      value: any;
    }>;
    default?: any;
  }>;
  loops?: Array<{
    variable: string;
    values: any[];
    properties: string[];
  }>;
}

interface IaCTemplatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  resourceData: {
    label: string;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    resourceType: ResourceType; // Este es el tipo completo del nodo, ej: gcp_compute_disk
    nodeId?: string; // ID del nodo para actualizar sus datos
    dynamicProperties?: Record<string, any>; // Valores guardados previamente
  };
  environments?: Array<{
    id: string;
    name: string;
    variables: Record<string, any>;
    color?: string;
    description?: string;
  }>;
}

// Main tabs
const MAIN_TABS = [
  { 
    id: 'config', 
    label: 'Configuration', 
    icon: CogIcon, 
    description: 'Basic resource configuration',
    color: 'blue'
  },
  { 
    id: 'smart', 
    label: 'Smart Behavior', 
    icon: SparklesIcon, 
    description: 'Dynamic properties with conditionals and loops',
    color: 'purple'
  },
  { 
    id: 'code', 
    label: 'Generated Code', 
    icon: EyeIcon, 
    description: 'View and export Infrastructure as Code',
    color: 'green'
  }
];

// Code generation tabs (shown when 'code' main tab is active)
const CODE_TABS = [
  { 
    id: 'terraform', 
    label: 'Terraform', 
    icon: CommandLineIcon, 
    description: 'HashiCorp Terraform HCL',
    color: 'purple',
    language: 'hcl'
  },
  { 
    id: 'pulumi', 
    label: 'Pulumi', 
    icon: CloudIcon, 
    description: 'TypeScript/JavaScript SDK',
    color: 'indigo',
    language: 'typescript'
  },
  { 
    id: 'ansible', 
    label: 'Ansible', 
    icon: PlayIcon, 
    description: 'YAML Playbook',
    color: 'red',
    language: 'yaml'
  },
  { 
    id: 'cloudformation', 
    label: 'CloudFormation', 
    icon: DocumentTextIcon, 
    description: 'AWS CloudFormation Template',
    color: 'orange',
    language: 'yaml'
  }
];

// Helper function to map UI resourceType to registry structure
const mapResourceTypeToRegistry = (typeFromNode: ResourceType | string) => {
  const inputType: string = typeof typeFromNode === 'string' ? typeFromNode : String(typeFromNode);
  
  let simplifiedResourceType: string = inputType;
  let category = 'unknown';

  // Primero, intentar una coincidencia directa para otros tipos ya simplificados
  const directMatchKeys: Record<string, { category: string; resourceType: string }> = {
    // 'compute' ya se manejó arriba
    'instance': { category: 'compute', resourceType: 'instance' },
    'disk': { category: 'compute', resourceType: 'disk' },
    'network': { category: 'compute', resourceType: 'network' },
    'firewall': { category: 'compute', resourceType: 'firewall' },
    'loadBalancer': { category: 'compute', resourceType: 'loadBalancer' },
    'instanceTemplate': { category: 'compute', resourceType: 'instanceTemplate' },
    'instanceGroup': { category: 'compute', resourceType: 'instanceGroup' },
    'bucket': { category: 'storage', resourceType: 'bucket' }, // Ejemplo
  };

  if (directMatchKeys[inputType]) {
    return directMatchKeys[inputType];
  }

  // Si no hay coincidencia directa, procesar para gcp_... o aws_...
  if (inputType.includes('_')) {
    const parts = inputType.split('_');
    const providerPrefix = parts[0].toLowerCase();

    if (providerPrefix === 'gcp') {
      // Manejo existente para GCP
      const serviceCategory = parts[1].toLowerCase(); 
      const typeParts = parts.slice(2); 

      if (typeParts.length > 0) {
        simplifiedResourceType = typeParts.join('_').toLowerCase(); // ej: "instance", "app"
        category = serviceCategory; // ej: "compute", "appengine"

        // Casos especiales donde el nombre del servicio en la ruta no es la categoría final
        // o el tipo simplificado necesita un ajuste final para coincidir con las claves del registro.
        // Por ejemplo, si tuviéramos gcp_kubernetes_engine_cluster y quisiéramos category: 'gke', resourceType: 'cluster'
        if (serviceCategory === 'appengine' && simplifiedResourceType === 'app') {
          return { category: 'appengine', resourceType: 'app' };
        } else if (serviceCategory === 'gke' && simplifiedResourceType === 'cluster') {
          return { category: 'gke', resourceType: 'cluster' };
        } else if (serviceCategory === 'cloudfunctions' && simplifiedResourceType === 'function') {
          return { category: 'functions', resourceType: 'function' };
        } else if (serviceCategory === 'cloudrun' && simplifiedResourceType === 'service') {
          return { category: 'cloudrun', resourceType: 'service' };
        } else if (serviceCategory === 'cloud' && simplifiedResourceType === 'storage_bucket') {
          return { category: 'storage', resourceType: 'bucket' };
        } else if (serviceCategory === 'sql' && simplifiedResourceType === 'instance') {
          return { category: 'database', resourceType: 'instance' };
        } else if (serviceCategory === 'bigquery' && simplifiedResourceType === 'dataset') {
          return { category: 'database', resourceType: 'dataset' }; 
        } else if (serviceCategory === 'firestore' && simplifiedResourceType === 'database') {
          return { category: 'database', resourceType: 'firestoreDatabase' };
        } else if (serviceCategory === 'memorystore' && simplifiedResourceType === 'instance') {
          return { category: 'cache', resourceType: 'instance' };
        } else if (serviceCategory === 'filestore' && simplifiedResourceType === 'instance') {
          return { category: 'storage', resourceType: 'filestoreInstance' };
        } else if (serviceCategory === 'cloudtasks' && simplifiedResourceType === 'queue') {
          return { category: 'cloudtasks', resourceType: 'queue' };
        } else if (serviceCategory === 'workflows' && simplifiedResourceType === 'workflow') {
          return { category: 'workflows', resourceType: 'workflow' };
        } else if (serviceCategory === 'eventarc' && simplifiedResourceType === 'trigger') {
          return { category: 'eventarc', resourceType: 'trigger' };
        }
        // ... (otros casos de GCP)
      } else if (parts.length === 2) { 
        simplifiedResourceType = parts[1].toLowerCase();
        category = parts[1].toLowerCase(); 
      }
    } else if (providerPrefix === 'aws') {
      // Nuevo manejo para AWS
      if (parts.length > 2) {
        const serviceCategory = parts[1].toLowerCase(); // ej: "ec2", "s3"
        const typeParts = parts.slice(2); // ej: ["instance"], ["bucket"]
        simplifiedResourceType = typeParts.join('_').toLowerCase();
        category = serviceCategory;

        // Casos especiales para AWS (si los nombres de categoría/recurso difieren)
        if (serviceCategory === 'ec2' && simplifiedResourceType === 'instance') {
          return { category: 'ec2', resourceType: 'instance' };
        } else if (serviceCategory === 's3' && simplifiedResourceType === 'bucket') {
          return { category: 's3', resourceType: 'bucket' };
        } else if (serviceCategory === 'lambda' && simplifiedResourceType === 'function') {
          return { category: 'lambda', resourceType: 'function' };
        } else if (serviceCategory === 'rds' && simplifiedResourceType === 'instance') {
          return { category: 'rds', resourceType: 'instance' };
        } else if (serviceCategory === 'elbv2' && simplifiedResourceType === 'load_balancer') {
          return { category: 'elbv2', resourceType: 'loadBalancer' };
        } else if (serviceCategory === 'autoscaling' && simplifiedResourceType === 'group') {
          return { category: 'autoscaling', resourceType: 'group' };
        } else if (serviceCategory === 'elasticbeanstalk' && simplifiedResourceType === 'environment') {
          return { category: 'elasticbeanstalk', resourceType: 'environment' };
        } else if (serviceCategory === 'ecs' && simplifiedResourceType === 'service') {
          return { category: 'ecs', resourceType: 'service' };
        } else if (serviceCategory === 'eks' && simplifiedResourceType === 'cluster') {
          return { category: 'eks', resourceType: 'cluster' };
        } else if (serviceCategory === 'dynamodb' && simplifiedResourceType === 'table') {
          return { category: 'dynamodb', resourceType: 'table' };
        } else if (serviceCategory === 'elasticache' && simplifiedResourceType === 'cluster') {
          return { category: 'elasticache', resourceType: 'cluster' };
        } else if (serviceCategory === 'redshift' && simplifiedResourceType === 'cluster') {
          return { category: 'redshift', resourceType: 'cluster' };
        } else if (serviceCategory === 'efs' && simplifiedResourceType === 'file_system') {
          return { category: 'efs', resourceType: 'fileSystem' };
        } else if (serviceCategory === 'api' && simplifiedResourceType === 'gateway_rest_api') { // Corregido para aws_api_gateway_rest_api
          return { category: 'apigateway', resourceType: 'restApi' };
        } else if (serviceCategory === 'apigateway' && simplifiedResourceType === 'rest_api') { // Mantener por si acaso, pero el anterior debería cubrirlo
          return { category: 'apigateway', resourceType: 'restApi' };
        } else if (serviceCategory === 'sqs' && simplifiedResourceType === 'queue') {
          return { category: 'sqs', resourceType: 'queue' };
        } else if (serviceCategory === 'sns' && simplifiedResourceType === 'topic') {
          return { category: 'sns', resourceType: 'topic' };
        } else if (serviceCategory === 'cloudwatch' && simplifiedResourceType === 'event_rule') { // Terraform usa cloudwatch_event_rule
          return { category: 'eventbridge', resourceType: 'rule' }; // Mapeamos a nuestra categoría eventbridge
        } else if (serviceCategory === 'sfn' && simplifiedResourceType === 'state_machine') {
          return { category: 'sfn', resourceType: 'stateMachine' };
        }
        // Añadir más casos de AWS aquí
      } else if (parts.length === 2) { // ej: aws_ec2
        simplifiedResourceType = parts[1].toLowerCase();
        category = parts[1].toLowerCase();
      }
    } else if (providerPrefix === 'azurerm') {
      // Manejo para Azure
      const serviceCategory = parts[1].toLowerCase(); // ej: "virtualmachine" (si el tipo es azurerm_virtual_machine)
      const typeParts = parts.slice(2); // No siempre habrá más partes para Azure

      if (parts.length >= 2) { // ej: azurerm_virtual_machine
        simplifiedResourceType = parts.slice(1).join('_').toLowerCase(); // ej: "virtual_machine"
        // Para Azure, la categoría podría ser el segundo elemento o necesitar un mapeo más específico.
        // Por ahora, intentaremos un mapeo directo o usaremos el segundo elemento como categoría.
        category = serviceCategory; // ej: "virtualmachine"
        
        if (simplifiedResourceType === 'virtual_machine') {
          return { category: 'compute', resourceType: 'virtualmachine' };
        } else if (simplifiedResourceType === 'linux_virtual_machine_scale_set') {
          return { category: 'compute', resourceType: 'linuxvirtualmachinescaleset' };
        } else if (simplifiedResourceType === 'kubernetes_cluster') {
          return { category: 'compute', resourceType: 'kubernetescluster' };
        } else if (simplifiedResourceType === 'linux_web_app') {
          return { category: 'compute', resourceType: 'linuxwebapp' }; 
        } else if (simplifiedResourceType === 'container_group') {
          return { category: 'compute', resourceType: 'containergroup' };
        } else if (simplifiedResourceType === 'linux_function_app') {
          return { category: 'functions', resourceType: 'linuxfunctionapp' };
        } else if (simplifiedResourceType === 'storage_container') {
          return { category: 'storage', resourceType: 'storagecontainer' };
        } else if (simplifiedResourceType === 'cosmosdb_account') {
          return { category: 'database', resourceType: 'cosmosdbaccount' };
        } else if (simplifiedResourceType === 'mssql_database') {
          return { category: 'database', resourceType: 'mssqldatabase' };
        } else if (simplifiedResourceType === 'redis_cache') {
          return { category: 'cache', resourceType: 'rediscache' };
        } else if (simplifiedResourceType === 'synapse_workspace') {
          return { category: 'analytics', resourceType: 'synapseworkspace' };
        } else if (simplifiedResourceType === 'storage_share') {
          return { category: 'storage', resourceType: 'storageshare' };
        } else if (simplifiedResourceType === 'api_management') { // El tipo de nodo es azurerm_api_management
          return { category: 'apimanagement', resourceType: 'service' }; // El recurso dentro de la categoría es 'service'
        } else if (simplifiedResourceType === 'servicebus_namespace') {
          return { category: 'servicebus', resourceType: 'namespace' };
        } else if (simplifiedResourceType === 'eventgrid_topic') {
          return { category: 'eventgrid', resourceType: 'topic' };
        } else if (simplifiedResourceType === 'logic_app_workflow') {
          return { category: 'logicapp', resourceType: 'workflow' };
        } else if (simplifiedResourceType === 'eventhub_namespace') {
          return { category: 'eventhub', resourceType: 'namespace' };
        } else if (simplifiedResourceType === 'virtual_network') {
          return { category: 'networking', resourceType: 'virtualnetwork' };
        } else if (simplifiedResourceType === 'subnet') {
          return { category: 'networking', resourceType: 'subnet' };
        } else if (simplifiedResourceType === 'network_security_group') {
          return { category: 'networking', resourceType: 'networksecuritygroup' };
        } else if (simplifiedResourceType === 'lb') {
          return { category: 'networking', resourceType: 'loadbalancer' };
        } else if (simplifiedResourceType === 'application_gateway') {
          return { category: 'networking', resourceType: 'applicationgateway' };
        } else if (simplifiedResourceType === 'firewall') {
          return { category: 'networking', resourceType: 'firewall' };
        }
        // Añadir más casos de Azure aquí
      }
    }
    // Aquí category y simplifiedResourceType están establecidos para GCP o AWS (o 'unknown')
  } else {
    // Si no hay guiones bajos (ej. 'ec2', 's3' pasados directamente desde NodeTypes para AWS)
    // Esto es un fallback y podría necesitar ser más robusto o depender del provider.
    // Por ahora, asumimos que estos tipos simples son categorías y tipos de recursos.
    simplifiedResourceType = inputType.toLowerCase();
    category = inputType.toLowerCase(); 
    // Si el provider es AWS y el tipo es 'ec2', mapear a ec2/instance
    // Esta lógica se vuelve compleja aquí. Es mejor que los nodos pasen tipos completos como 'aws_ec2_instance'.
    // O que la lógica de mapeo para tipos simples dependa del provider actual.
  }
  
  // Mapeos específicos para claves que podrían no ser idénticas después de la simplificación
  // (Esta sección podría necesitar ajustes si los tipos de AWS también usan estos mapeos)
  // (e.g., instance_template -> instanceTemplate)
  // Las claves aquí deben estar en minúsculas y ser el 'resourceType' final esperado en el registro
  const finalMappingKeys: Record<string, { category: string; resourceType: string }> = {
    'instance_template': { category: 'compute', resourceType: 'instanceTemplate' }, // gcp_compute_instance_template -> instanceTemplate
    'instance_group_manager': { category: 'compute', resourceType: 'instanceGroup' }, // gcp_compute_instance_group_manager -> instanceGroup
    'app': { category: 'appengine', resourceType: 'app' },         // gcp_appengine_app -> app
    'cluster': { category: 'gke', resourceType: 'cluster' },       // gcp_gke_cluster -> cluster (necesitará registro GKE)
    'function': { category: 'functions', resourceType: 'function' }, // gcp_cloudfunctions_function -> function (necesitará registro Functions)
    'service': { category: 'cloudrun', resourceType: 'service' },   // gcp_cloudrun_service -> service
    // Añadir otros mapeos específicos si el simplifiedResourceType no es la clave final del registro
  };
  
  // Si simplifiedResourceType (después del split y toLowerCase, ej: "app" de "gcp_appengine_app") 
  // está en finalMappingKeys, usar ese mapeo.
  // La 'category' determinada por el split (ej: "appengine") debe coincidir con la del mapeo.
  if (finalMappingKeys[simplifiedResourceType] && category === finalMappingKeys[simplifiedResourceType].category) {
    return { category: category, resourceType: finalMappingKeys[simplifiedResourceType].resourceType };
  }
  
  // Caso especial: si el inputType es gcp_compute_instance, simplifiedResourceType será "instance" y category "compute"
  // y debe ser manejado por directMatchKeys o el siguiente bloque.

  // Si después del split, simplifiedResourceType es una clave directa (ej: "instance" de "gcp_compute_instance")
  // y la categoría también se determinó (ej: "compute" de "gcp_compute_instance")
  if (category !== 'unknown' && directMatchKeys[simplifiedResourceType] && directMatchKeys[simplifiedResourceType].category === category) {
    return { category, resourceType: simplifiedResourceType };
  }
  
  // Fallback final si ninguna de las lógicas anteriores funcionó
  console.warn(`Could not map resourceType: ${typeFromNode} to a known category/resourceType pair. Processed as: simplified='${simplifiedResourceType}', category='${category}'`);
  return undefined;
};

// Helper functions to get provider and resource type icons
const getProviderIcon = (provider: string): string => {
  const icons: Record<string, string> = { aws: '☁️', gcp: '🌐', azure: '🔷', generic: '⚙️' };
  return icons[provider] || icons.generic;
};

const getResourceTypeIcon = (resourceType: string): string => {
  const simplifiedMapping = mapResourceTypeToRegistry(resourceType);
  const typeToIcon = simplifiedMapping ? simplifiedMapping.resourceType : resourceType;
  const icons: Record<string, string> = {
    instance: '💻', disk: '💾', network: '🌐', firewall: '🔒', loadBalancer: '⚖️',
    instanceTemplate: '📄', instanceGroup: '👨‍👩‍👧‍👦',
    compute: '💻', storage: '💾', sql: '🗄️', security: '🔒', monitoring: '📊', generic: '📦'
  };
  return icons[typeToIcon] || icons.generic;
};

const IaCTemplatePanel: React.FC<IaCTemplatePanelProps> = ({
  isOpen,
  onClose,
  resourceData,
  environments
}) => {
  const [activeMainTab, setActiveMainTab] = useState('config');
  const [activeCodeTab, setActiveCodeTab] = useState('terraform');
  const [configValues, setConfigValues] = useState<ResourceValues>({ name: resourceData.label || 'resource' });
  const [resourceConfigDefinition, setResourceConfigDefinition] = useState<any>(null); // Almacena el objeto con las funciones
  const [currentFields, setCurrentFields] = useState<any[] | Record<string, any> | undefined>(undefined); // Almacena los campos resueltos, undefined en lugar de null
  const [validationSchema, setValidationSchema] = useState<z.ZodTypeAny | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string[] | undefined>>({});
  const [smartBehavior, setSmartBehavior] = useState<SmartBehavior>({});
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  useEffect(() => {
    const loadResourceConfig = async () => {
      console.log('IaCTemplatePanel: loadResourceConfig called. isOpen:', isOpen, 'resourceData:', JSON.stringify(resourceData));
      if (!resourceData || !resourceData.provider || !resourceData.resourceType) {
        console.warn('IaCTemplatePanel: Missing or incomplete resourceData for loading config.', resourceData);
        setIsLoadingConfig(false);
        setResourceConfigDefinition(null); // Corregido: usar setResourceConfigDefinition
        setCurrentFields(undefined); // Corregido: usar undefined
        setValidationSchema(null);
        setConfigValues({ name: resourceData?.label || 'resource' });
        return;
      }
      setIsLoadingConfig(true);
      setValidationErrors({}); 
      try {
        console.log('IaCTemplatePanel: Attempting to map resourceType:', resourceData.resourceType);
        const mapping = mapResourceTypeToRegistry(resourceData.resourceType);
        console.log('IaCTemplatePanel: Mapping result:', mapping);

        if (mapping && resourceData.provider) {
          console.log(`IaCTemplatePanel: Loading config for: provider=${resourceData.provider}, category=${mapping.category}, type=${mapping.resourceType}`);
          const configObject = await getResourceConfig(
            resourceData.provider as SupportedProvider, 
            mapping.category, 
            mapping.resourceType
          );
          console.log('IaCTemplatePanel: Config object from getResourceConfig:', configObject);

          if (!configObject || typeof configObject.schema !== 'function' || typeof configObject.defaults !== 'function' || typeof configObject.fields !== 'function') {
            console.error('IaCTemplatePanel: Invalid config object received from getResourceConfig:', configObject);
            setResourceConfigDefinition(null); // Corregido: usar setResourceConfigDefinition
            setCurrentFields(undefined); // Corregido: usar undefined
            setValidationSchema(null);
            setConfigValues({ name: resourceData.label || 'resource' });
            setIsLoadingConfig(false);
            return;
          }

          setResourceConfigDefinition(configObject); // Guardar el objeto con las funciones
          const schema = await configObject.schema(); 
          setValidationSchema(schema);
          const defaults = await configObject.defaults(); 
          const fields = await configObject.fields(); // Resolver los campos
          setCurrentFields(fields); // Guardar los campos resueltos

          // Combinar defaults con valores guardados
          const savedValues = resourceData.dynamicProperties || {};
          const initialValues = {
            ...(defaults || {}),
            ...savedValues, // Los valores guardados tienen prioridad
            name: savedValues.name || resourceData.label || defaults?.name || 'resource',
          };
          console.log('📝 [IaCTemplatePanel] Loading initial values:', {
            defaults,
            savedValues,
            initialValues
          });
          setConfigValues(initialValues);
          validateValues(initialValues, schema);
        } else {
          console.warn('Mapping failed for resourceType:', resourceData.resourceType);
          setResourceConfigDefinition(null);
          setCurrentFields(undefined); // Corregido: usar undefined
          setValidationSchema(null);
          setConfigValues({ name: resourceData.label || 'resource' });
          console.log('IaCTemplatePanel: Mapping failed or provider missing. resourceConfigDefinition set to null.');
        }
      } catch (error) {
        console.error('IaCTemplatePanel: Error in loadResourceConfig:', error);
        setResourceConfigDefinition(null);
        setCurrentFields(undefined); // Corregido: usar undefined
        setValidationSchema(null);
        setConfigValues({ name: resourceData.label || 'resource' });
      } finally {
        setIsLoadingConfig(false);
        console.log('IaCTemplatePanel: loadResourceConfig finished.');
      }
    };

    if (isOpen && resourceData) {
      loadResourceConfig();
    } else if (!isOpen) {
      // Optionally reset states when panel is closed if desired
      // setResourceConfig(null);
      // setValidationSchema(null);
      // setConfigValues({ name: 'resource' }); // Reset to a very basic default
      // setValidationErrors({});
    }
  }, [isOpen, resourceData]); // Asegúrate de que resourceData sea una dependencia estable o memoizada si es un objeto

  const validateValues = (values: ResourceValues, schemaToUse: z.ZodTypeAny | null): boolean => {
    if (!schemaToUse) {
      setValidationErrors({});
      console.log('No validation schema present, skipping validation.');
      return true;
    }
    const result = schemaToUse.safeParse(values);
    if (!result.success) {
      const newErrors: Record<string, string[] | undefined> = {};
      result.error.errors.forEach((err: z.ZodIssue) => {
        const path = err.path.join('.');
        if (!newErrors[path]) {
          newErrors[path] = [];
        }
        newErrors[path]?.push(err.message);
      });
      setValidationErrors(newErrors);
      console.log('Validation errors:', newErrors);
      return false;
    }
    setValidationErrors({});
    return true;
  };

  const handleConfigChange = (newValues: ResourceValues) => {
    setConfigValues(newValues);
    validateValues(newValues, validationSchema);
  };

  const handleSave = async () => {
    if (validateValues(configValues, validationSchema)) {
      console.log('📝 [IaCTemplatePanel] Saving configuration:', {
        nodeId: resourceData.nodeId,
        configValues,
        configKeys: Object.keys(configValues)
      });
      setIsGenerating(true);
      try {
        // Emitir evento para que FlowCanvas actualice el nodo
        const event = new CustomEvent('updateNodeData', {
          detail: {
            nodeId: resourceData.nodeId, // ID del nodo para actualizar
            data: {
              dynamicProperties: configValues,
              configuredAt: new Date().toISOString()
            }
          }
        });
        window.dispatchEvent(event);
        console.log('📝 [IaCTemplatePanel] Event dispatched successfully');
        
        // Mostrar mensaje de éxito
        const successEvent = new CustomEvent('showMessage', {
          detail: {
            type: 'success',
            message: 'Configuration saved successfully'
          }
        });
        window.dispatchEvent(successEvent);
        
        // Cerrar el panel después de guardar
        setTimeout(() => {
          onClose();
        }, 500);
      } catch (error) {
        console.error('Error saving configuration:', error);
        const errorEvent = new CustomEvent('showMessage', {
          detail: {
            type: 'error',
            message: 'Failed to save configuration'
          }
        });
        window.dispatchEvent(errorEvent);
      } finally {
        setIsGenerating(false);
      }
    } else {
      console.log('Save prevented due to validation errors.');
      const errorEvent = new CustomEvent('showMessage', {
        detail: {
          type: 'error',
          message: 'Please fix validation errors before saving'
        }
      });
      window.dispatchEvent(errorEvent);
    }
  };

  const handleCopyCode = async () => {
    setIsGenerating(true);
    try {
      let code = '';
      // ... (resto de la lógica de handleCopyCode)
      switch (activeCodeTab) {
        case 'terraform':
          code = await generateTerraformCode();
          break;
        case 'pulumi':
          code = await generatePulumiCode();
          break;
        case 'ansible':
          code = await generateAnsibleCode();
          break;
        case 'cloudformation':
          code = await generateCloudFormationCode();
          break;
        default:
          setIsGenerating(false);
          return;
      }
      await navigator.clipboard.writeText(code);
      setCopySuccess(activeCodeTab);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSmartBehaviorChange = (behavior: SmartBehavior) => {
    setSmartBehavior(behavior);
  };

  const hasSmartBehavior = () => {
    return (smartBehavior.conditionals && smartBehavior.conditionals.length > 0) ||
           (smartBehavior.loops && smartBehavior.loops.length > 0);
  };

  const generateCodeWithSmartBehavior = async (format: string) => {
    const processedValues = applySmartBehavior(configValues, smartBehavior);
    switch (format) {
      case 'terraform':
        return generateTerraformCode(processedValues);
      case 'pulumi':
        return generatePulumiCode(processedValues);
      case 'ansible':
        return generateAnsibleCode(processedValues);
      case 'cloudformation':
        return generateCloudFormationCode(processedValues);
      default:
        return '// Select a template type';
    }
  };

  const applySmartBehavior = (values: ResourceValues, behavior: SmartBehavior): ResourceValues => {
    // ... (código existente sin cambios significativos, asegurar que eval sea seguro o reemplazarlo)
    const processedValues = { ...values };
    const currentEnv = environments && environments.length > 0 
      ? environments[0] 
      : { id: 'dev', name: 'Development', variables: { env: 'dev' } }; // TODO: Permitir seleccionar entorno
    const envVars = currentEnv.variables;
    behavior.conditionals?.forEach(conditional => {
      const matchingCondition = conditional.conditions.find(cond => {
        try {
          let conditionString = cond.condition;
          Object.entries(envVars).forEach(([key, value]) => {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            conditionString = conditionString.replace(regex, typeof value === 'string' ? `"${value}"` : String(value));
          });
          // Cuidado con eval. Considerar alternativas más seguras si es posible.
          return new Function(`return ${conditionString}`)();
        } catch (error) {
          console.warn('Error evaluating condition:', cond.condition, error);
          return false;
        }
      });
      if (matchingCondition) {
        processedValues[conditional.property] = matchingCondition.value;
      } else if (conditional.default !== undefined) {
        processedValues[conditional.property] = conditional.default;
      }
    });
    return processedValues;
  };

  const generateTerraformCode = async (values: ResourceValues = configValues) => {
    console.log('generateTerraformCode: received values:', JSON.stringify(values));
    console.log('generateTerraformCode: resourceConfigDefinition:', resourceConfigDefinition);
    if (!resourceConfigDefinition || !resourceConfigDefinition.templates) {
      console.log('generateTerraformCode: No resourceConfigDefinition or templates function');
      return '// Loading template...';
    }
    try {
      const resolvedTemplates = await resourceConfigDefinition.templates(values);
      console.log('generateTerraformCode: resolvedTemplates:', resolvedTemplates);
      return resolvedTemplates.terraform || '// No Terraform template available';
    } catch (error) { console.error('Error generating Terraform code:', error); return '// Error'; }
  };

  const generatePulumiCode = async (values: ResourceValues = configValues) => {
    if (!resourceConfigDefinition || !resourceConfigDefinition.templates) return '// Loading template...';
    try {
      const resolvedTemplates = await resourceConfigDefinition.templates(values);
      return resolvedTemplates.pulumi || '// No Pulumi template available';
    } catch (error) { console.error('Error generating Pulumi code:', error); return '// Error'; }
  };

  const generateAnsibleCode = async (values: ResourceValues = configValues) => {
    if (!resourceConfigDefinition || !resourceConfigDefinition.templates) return '# Loading template...';
    try {
      const resolvedTemplates = await resourceConfigDefinition.templates(values);
      return resolvedTemplates.ansible || '# No Ansible template available';
    } catch (error) { console.error('Error generating Ansible code:', error); return '# Error'; }
  };

  const generateCloudFormationCode = async (values: ResourceValues = configValues) => {
    if (!resourceConfigDefinition || !resourceConfigDefinition.templates) return '// Loading template...';
    try {
      const resolvedTemplates = await resourceConfigDefinition.templates(values);
      return resolvedTemplates.cloudformation || '// No CloudFormation template available';
    } catch (error) { console.error('Error generating CloudFormation code:', error); return '// Error'; }
  };
  
  const getCodeForActiveTab = () => {
    // Esta función ahora será asíncrona debido a los generadores de código
    // Se manejará directamente en el onClick del botón de copiar o al renderizar CodeBlock
    return "// Code generation is async";
  };

  const [currentCode, setCurrentCode] = useState('// Select a template type');
  useEffect(() => {
    if (activeMainTab === 'code' && resourceConfigDefinition) { // Usar resourceConfigDefinition
      setIsGenerating(true);
      generateCodeWithSmartBehavior(activeCodeTab)
        .then(code => setCurrentCode(code))
        .catch(() => setCurrentCode("// Error generating code"))
        .finally(() => setIsGenerating(false));
    }
  }, [activeMainTab, activeCodeTab, resourceConfigDefinition, configValues, smartBehavior]); // Usar resourceConfigDefinition


  const getCurrentLanguage = () => {
    const currentTab = CODE_TABS.find(tab => tab.id === activeCodeTab);
    return currentTab?.language || 'text';
  };

  if (!isOpen) {
    return null;
  }

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`${getProviderIcon(resourceData.provider)} ${getResourceTypeIcon(resourceData.resourceType)} IaC Templates - ${resourceData.label}`}
      width="60%"
    >
      <div className="h-full flex flex-col">
        {/* Main Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex space-x-1 p-1" aria-label="Main Tabs">
            {MAIN_TABS.map((tab) => {
              const isActive = activeMainTab === tab.id;
              const Icon = tab.icon;
              const hasIndicator = tab.id === 'smart' && hasSmartBehavior();
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveMainTab(tab.id)}
                  className={`
                    group relative min-w-0 flex-1 overflow-hidden rounded-lg py-3 px-4 text-center text-sm font-medium
                    transition-all duration-200 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${isActive 
                      ? `bg-${tab.color}-50 text-${tab.color}-700 border-${tab.color}-200 shadow-sm` 
                      : 'text-gray-600 hover:text-gray-900'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <div className="relative">
                      <Icon className={`h-5 w-5 ${isActive ? `text-${tab.color}-600` : 'text-gray-400'}`} />
                      {hasIndicator && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-purple-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <span className="text-xs font-medium">{tab.label}</span>
                  </div>
                  {isActive && (
                    <span 
                      className={`absolute inset-x-0 bottom-0 h-0.5 bg-${tab.color}-600`}
                      aria-hidden="true" 
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {activeMainTab === 'code' && (
          <div className="border-b border-gray-100 bg-gray-50">
            <nav className="flex space-x-1 px-4 py-2" aria-label="Code Tabs">
              {CODE_TABS.map((tab) => {
                const isActive = activeCodeTab === tab.id;
                const Icon = tab.icon;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCodeTab(tab.id)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 text-xs font-medium rounded-md
                      transition-all duration-200 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${isActive 
                        ? `bg-white text-${tab.color}-700 shadow-sm border border-${tab.color}-200` 
                        : 'text-gray-500 hover:text-gray-700'
                      }
                    `}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? `text-${tab.color}-600` : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-gray-50">
          {activeMainTab === 'config' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-auto bg-white">
                {isLoadingConfig ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-gray-500">Loading configuration...</p>
                    </div>
                  </div>
                ) : (
                  <ResourceConfigForm
                    provider={resourceData.provider}
                    resourceType={resourceData.resourceType} 
                    values={configValues}
                    onChange={handleConfigChange} 
                    fields={currentFields} // Usar currentFields
                    errors={validationErrors} 
                    isLoading={isLoadingConfig}
                  />
                )}
              </div>
              
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {Object.keys(validationErrors).length > 0 
                      ? <span className="text-red-600">Please fix validation errors.</span>
                      : 'Configure your resource parameters above.'}
                  </div>
                  <button
                    onClick={handleSave} 
                    disabled={isGenerating || Object.keys(validationErrors).length > 0}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                             text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                             focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeMainTab === 'smart' && (
            <SmartBehaviorPanel
              resourceData={resourceData}
              configValues={configValues}
              smartBehavior={smartBehavior}
              onChange={handleSmartBehaviorChange}
              environments={environments}
            />
          )}

          {activeMainTab === 'code' && (
            <div className="flex flex-col h-full">
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const currentTab = CODE_TABS.find(tab => tab.id === activeCodeTab);
                      if (!currentTab) return null;
                      const Icon = currentTab.icon;
                      return (
                        <>
                          <Icon className={`h-6 w-6 text-${currentTab.color}-600`} />
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{currentTab.label}</h3>
                            <p className="text-sm text-gray-500">
                              {currentTab.description}
                              {hasSmartBehavior() && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                  <SparklesIcon className="h-3 w-3 mr-1" />
                                  Smart Behavior Applied
                                </span>
                              )}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  
                  {copySuccess === activeCodeTab && (
                    <div className="flex items-center space-x-2 text-green-600 animate-fade-in">
                      <CheckIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">Copied!</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto bg-white">
                <div className="p-6">
                  {isGenerating ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="text-gray-500">Generating {activeCodeTab} template...</p>
                      </div>
                    </div>
                  ) : (
                    <CodeBlock
                      code={currentCode}
                      language={getCurrentLanguage()}
                    />
                  )}
                </div>
              </div>
              
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Ready to deploy with {activeCodeTab}
                    {hasSmartBehavior() && (
                      <span className="block text-purple-600 font-medium">
                        Dynamic behavior will be resolved at deployment time
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={async () => {
                        try {
                          const codeToCopy = await generateCodeWithSmartBehavior(activeCodeTab);
                          await navigator.clipboard.writeText(codeToCopy);
                          setCopySuccess(activeCodeTab);
                          setTimeout(() => setCopySuccess(null), 2000);
                        } catch (error) {
                          console.error('Failed to copy:', error);
                        }
                      }}
                      disabled={isGenerating}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md
                               text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                               focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                      Copy Code
                    </button>
                    <button
                      onClick={() => {}}
                      disabled={isGenerating}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                               text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                               focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <CodeBracketIcon className="h-4 w-4 mr-2" />
                      Deploy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};

export default IaCTemplatePanel;
