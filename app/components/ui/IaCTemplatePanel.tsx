import React, { useState, useEffect } from 'react';
import SidePanel from './SidePanel';
import ResourceConfigForm from './ResourceConfigForm';
import CodeBlock from './CodeBlock';
import SmartBehaviorPanel from './SmartBehaviorPanel';
import { ResourceValues, ResourceType } from '@/app/types/resourceConfig';
import { 
  getResourceConfig, 
  validateResourceConfig, 
  SupportedProvider 
} from '@/app/config/schemas';
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
    resourceType: ResourceType;
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

const getDefaultValues = async (provider: string, resourceType: string): Promise<ResourceValues> => {
  try {
    // Map resourceType to category and specific resource
    const mapping = mapResourceTypeToRegistry(resourceType);
    if (!mapping) {
      return { name: 'resource' };
    }

    const config = await getResourceConfig(
      provider as SupportedProvider, 
      mapping.category, 
      mapping.resourceType
    );
    return config.defaults || { name: 'resource' };
  } catch (error) {
    console.warn('Failed to get default values:', error);
    return { name: 'resource' };
  }
};

// Helper function to map UI resourceType to registry structure
const mapResourceTypeToRegistry = (resourceType: string) => {
  const mappings: Record<string, { category: string; resourceType: string }> = {
    // Compute resources
    'compute': { category: 'compute', resourceType: 'instance' },
    'instance': { category: 'compute', resourceType: 'instance' },
    'disk': { category: 'compute', resourceType: 'disk' },
    'network': { category: 'compute', resourceType: 'network' },
    'firewall': { category: 'compute', resourceType: 'firewall' },
    'loadBalancer': { category: 'compute', resourceType: 'loadBalancer' },
    'instanceTemplate': { category: 'compute', resourceType: 'instanceTemplate' },
    'instanceGroup': { category: 'compute', resourceType: 'instanceGroup' },
    // Add more mappings as needed
  };
  
  return mappings[resourceType];
};

// Helper functions to get provider and resource type icons
const getProviderIcon = (provider: string): string => {
  const icons: Record<string, string> = {
    aws: '☁️',
    gcp: '🌐',
    azure: '🔷',
    generic: '⚙️'
  };
  return icons[provider] || icons.generic;
};

const getResourceTypeIcon = (resourceType: string): string => {
  const icons: Record<string, string> = {
    compute: '💻',
    storage: '💾',
    sql: '🗄️',
    network: '🌐',
    security: '🔒',
    monitoring: '📊',
    generic: '📦'
  };
  return icons[resourceType] || icons.generic;
};

const IaCTemplatePanel: React.FC<IaCTemplatePanelProps> = ({
  isOpen,
  onClose,
  resourceData,
  environments
}) => {
  const [activeMainTab, setActiveMainTab] = useState('config');
  const [activeCodeTab, setActiveCodeTab] = useState('terraform');
  const [configValues, setConfigValues] = useState<ResourceValues>({ name: 'resource' });
  const [resourceConfig, setResourceConfig] = useState<any>(null);
  const [smartBehavior, setSmartBehavior] = useState<SmartBehavior>({});
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Load resource configuration when resource changes
  useEffect(() => {
    const loadResourceConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const mapping = mapResourceTypeToRegistry(resourceData.resourceType);
        if (mapping && resourceData.provider) {
          const config = await getResourceConfig(
            resourceData.provider as SupportedProvider, 
            mapping.category, 
            mapping.resourceType
          );
          setResourceConfig(config);
          setConfigValues(prev => ({
            ...config.defaults,
            name: resourceData.label || prev.name,
          }));
        } else {
          // Fallback for unmapped resource types
          setConfigValues(prev => ({
            name: resourceData.label || prev.name,
          }));
        }
      } catch (error) {
        console.warn('Failed to load resource config:', error);
        setConfigValues(prev => ({
          name: resourceData.label || prev.name,
        }));
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadResourceConfig();
  }, [resourceData.provider, resourceData.resourceType, resourceData.label]);

  const handleConfigChange = (values: ResourceValues) => {
    setConfigValues(values);
  };

  const handleSave = () => {
    console.log('Saving configuration:', configValues);
    // TODO: Implement save logic
  };

  const handleCopyCode = async () => {
    setIsGenerating(true);
    
    try {
      let code = '';
      switch (activeCodeTab) {
        case 'terraform':
          code = generateTerraformCode();
          break;
        case 'pulumi':
          code = generatePulumiCode();
          break;
        case 'ansible':
          code = generateAnsibleCode();
          break;
        case 'cloudformation':
          code = generateCloudFormationCode();
          break;
        default:
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

  const generateCodeWithSmartBehavior = (format: string) => {
    // Apply smart behavior to config values before generating code
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
    const processedValues = { ...values };
    
    // Use the first environment from provided environments, or default
    const currentEnv = environments && environments.length > 0 
      ? environments[0] 
      : { id: 'dev', name: 'Development', variables: { env: 'dev' } };
    
    const envVars = currentEnv.variables;
    
    behavior.conditionals?.forEach(conditional => {
      const matchingCondition = conditional.conditions.find(cond => {
        try {
          let condition = cond.condition;
          // Replace variables in condition with actual values
          Object.entries(envVars).forEach(([key, value]) => {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            condition = condition.replace(regex, `"${value}"`);
          });
          return eval(condition);
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

  const generateTerraformCode = (values: ResourceValues = configValues) => {
    if (!resourceConfig || !resourceConfig.templates) {
      return '// Loading template...';
    }

    try {
      // Get the template generator function
      const templates = resourceConfig.templates(values);
      return templates.terraform || '// No Terraform template available for this resource';
    } catch (error) {
      console.error('Error generating Terraform code:', error);
      return '// Error generating template';
    }
  };

  const generatePulumiCode = (values: ResourceValues = configValues) => {
    if (!resourceConfig || !resourceConfig.templates) {
      return '// Loading template...';
    }

    try {
      // Get the template generator function
      const templates = resourceConfig.templates(values);
      return templates.pulumi || '// No Pulumi template available for this resource';
    } catch (error) {
      console.error('Error generating Pulumi code:', error);
      return '// Error generating template';
    }
  };

  const generateAnsibleCode = (values: ResourceValues = configValues) => {
    if (!resourceConfig || !resourceConfig.templates) {
      return '# Loading template...';
    }

    try {
      // Get the template generator function
      const templates = resourceConfig.templates(values);
      return templates.ansible || '# No Ansible template available for this resource';
    } catch (error) {
      console.error('Error generating Ansible code:', error);
      return '# Error generating template';
    }
  };

  const generateCloudFormationCode = (values: ResourceValues = configValues) => {
    if (!resourceConfig || !resourceConfig.templates) {
      return '// Loading template...';
    }

    try {
      // Get the template generator function
      const templates = resourceConfig.templates(values);
      return templates.cloudformation || '// No CloudFormation template available for this resource';
    } catch (error) {
      console.error('Error generating CloudFormation code:', error);
      return '// Error generating template';
    }
  };

  // Helper functions for the new UI
  const getCodeForActiveTab = () => {
    switch (activeCodeTab) {
      case 'terraform':
        return generateTerraformCode();
      case 'pulumi':
        return generatePulumiCode();
      case 'ansible':
        return generateAnsibleCode();
      case 'cloudformation':
        return generateCloudFormationCode();
      default:
        return '// Select a template type';
    }
  };

  const getCurrentLanguage = () => {
    const currentTab = CODE_TABS.find(tab => tab.id === activeCodeTab);
    return currentTab?.language || 'text';
  };

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

        {/* Code Sub-tabs (shown only when code tab is active) */}
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

        {/* Tab Content */}
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
                    onChange={setConfigValues}
                    fields={resourceConfig?.fields}
                    isLoading={isLoadingConfig}
                  />
                )}
              </div>
              
              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    Configure your resource parameters above
                  </div>
                  <button
                    onClick={() => {}}
                    disabled={isGenerating}
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
                      code={generateCodeWithSmartBehavior(activeCodeTab)}
                      language={CODE_TABS.find(tab => tab.id === activeCodeTab)?.language || 'text'}
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
                          await navigator.clipboard.writeText(generateCodeWithSmartBehavior(activeCodeTab));
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
