'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  SparklesIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { z } from 'zod';
import CodeBlock from './CodeBlock';

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

interface SmartBehaviorPanelProps {
  resourceData: {
    label: string;
    provider: string;
    resourceType: string;
  };
  configValues: any;
  smartBehavior: SmartBehavior;
  onChange: (behavior: SmartBehavior) => void;
  environments?: Environment[]; // Add environments prop
}

// Environment configuration interface
interface Environment {
  id: string;
  name: string;
  variables: Record<string, any>;
  color?: string;
  description?: string;
}

// Default environments if none provided
const DEFAULT_ENVIRONMENTS: Environment[] = [
  {
    id: 'dev',
    name: 'Development',
    variables: { env: 'dev', region: 'us-east1', stage: 'development', tier: 'small' },
    color: 'blue',
    description: 'Development environment'
  },
  {
    id: 'staging',
    name: 'Staging',
    variables: { env: 'staging', region: 'us-west1', stage: 'staging', tier: 'medium' },
    color: 'yellow',
    description: 'Staging environment for testing'
  },
  {
    id: 'prod',
    name: 'Production',
    variables: { env: 'prod', region: 'us-central1', stage: 'production', tier: 'large' },
    color: 'red',
    description: 'Production environment'
  }
];

// Validation schemas
const conditionalSchema = z.object({
  property: z.string().min(1, 'Property name is required'),
  conditions: z.array(z.object({
    condition: z.string().min(1, 'Condition is required'),
    value: z.any()
  })).min(1, 'At least one condition is required'),
  default: z.any().optional()
});

const loopSchema = z.object({
  variable: z.string().min(1, 'Variable name is required'),
  values: z.array(z.any()).min(1, 'At least one value is required'),
  properties: z.array(z.string()).min(1, 'At least one property is required')
});

const SmartBehaviorPanel: React.FC<SmartBehaviorPanelProps> = ({
  resourceData,
  configValues,
  smartBehavior,
  onChange,
  environments
}) => {
  const [activeSection, setActiveSection] = useState<'conditionals' | 'loops' | 'yaml'>('conditionals');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  // Use provided environments or fall back to defaults only if none provided
  const [previewEnv, setPreviewEnv] = useState(() => {
    const availableEnvs = environments && environments.length > 0 ? environments : DEFAULT_ENVIRONMENTS;
    return availableEnvs[0]?.id || 'dev';
  });
  const [yamlContent, setYamlContent] = useState('');
  const [yamlError, setYamlError] = useState<string | null>(null);
  const [isEditingYaml, setIsEditingYaml] = useState(false);
  const [showEnvironmentConfig, setShowEnvironmentConfig] = useState(false);

  // Use provided environments or fall back to defaults
  const activeEnvironments = environments && environments.length > 0 ? environments : DEFAULT_ENVIRONMENTS;
  
  // Get current environment from active environments
  const currentEnvironment = activeEnvironments.find(env => env.id === previewEnv) || activeEnvironments[0];

  // Update preview environment when environments change
  useEffect(() => {
    if (environments && environments.length > 0) {
      // If current preview env doesn't exist in new environments, switch to first available
      const envExists = environments.some(env => env.id === previewEnv);
      if (!envExists) {
        setPreviewEnv(environments[0].id);
      }
    }
  }, [environments, previewEnv]);

  // Available properties from config
  const availableProperties = Object.keys(configValues).filter(key => 
    typeof configValues[key] !== 'object' || configValues[key] === null
  );

  useEffect(() => {
    validateBehavior();
  }, [smartBehavior]);

  const validateBehavior = () => {
    const errors: Record<string, string> = {};
    
    // Validate conditionals
    smartBehavior.conditionals?.forEach((conditional, index) => {
      try {
        conditionalSchema.parse(conditional);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors[`conditional-${index}`] = error.errors[0].message;
        }
      }
    });

    // Validate loops
    smartBehavior.loops?.forEach((loop, index) => {
      try {
        loopSchema.parse(loop);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors[`loop-${index}`] = error.errors[0].message;
        }
      }
    });

    setValidationErrors(errors);
  };

  // Convert smart behavior to YAML
  const convertToYaml = (behavior: SmartBehavior): string => {
    const yamlObj: any = {};
    
    // Add resource type and properties
    yamlObj.type = `${resourceData.provider}_${resourceData.resourceType}`;
    yamlObj.props = { ...configValues };
    
    // Add conditionals
    if (behavior.conditionals && behavior.conditionals.length > 0) {
      behavior.conditionals.forEach(conditional => {
        yamlObj.props[conditional.property] = {
          conditionals: conditional.conditions.map(cond => ({
            condition: cond.condition,
            value: cond.value
          })),
          ...(conditional.default !== undefined && { default: conditional.default })
        };
      });
    }
    
    // Add loops
    if (behavior.loops && behavior.loops.length > 0) {
      behavior.loops.forEach(loop => {
        yamlObj.foreach = {
          var: loop.variable,
          in: loop.values
        };
      });
    }
    
    return convertObjectToYaml(yamlObj);
  };

  // Simple YAML converter
  const convertObjectToYaml = (obj: any, indent = 0): string => {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        yaml += `${spaces}${key}: null\n`;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += convertObjectToYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach((item) => {
          if (typeof item === 'object') {
            yaml += `${spaces}  - \n`;
            yaml += convertObjectToYaml(item, indent + 2).replace(/^/gm, `${spaces}    `);
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else if (typeof value === 'string') {
        yaml += `${spaces}${key}: "${value}"\n`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  };

  // Update YAML content when smart behavior changes
  useEffect(() => {
    if (!isEditingYaml) {
      setYamlContent(convertToYaml(smartBehavior));
    }
  }, [smartBehavior, isEditingYaml, configValues, resourceData]);

  const addConditional = () => {
    const newConditional = {
      property: availableProperties[0] || '',
      conditions: [{ condition: 'env == "dev"', value: '' }],
      default: ''
    };

    onChange({
      ...smartBehavior,
      conditionals: [...(smartBehavior.conditionals || []), newConditional]
    });
  };

  const updateConditional = (index: number, updates: any) => {
    const conditionals = [...(smartBehavior.conditionals || [])];
    conditionals[index] = { ...conditionals[index], ...updates };
    
    onChange({
      ...smartBehavior,
      conditionals
    });
  };

  const removeConditional = (index: number) => {
    const conditionals = [...(smartBehavior.conditionals || [])];
    conditionals.splice(index, 1);
    
    onChange({
      ...smartBehavior,
      conditionals
    });
  };

  const addLoop = () => {
    const newLoop = {
      variable: 'region',
      values: ['us-east1', 'us-west1'],
      properties: [availableProperties[0] || 'name']
    };

    onChange({
      ...smartBehavior,
      loops: [...(smartBehavior.loops || []), newLoop]
    });
  };

  const updateLoop = (index: number, updates: any) => {
    const loops = [...(smartBehavior.loops || [])];
    loops[index] = { ...loops[index], ...updates };
    
    onChange({
      ...smartBehavior,
      loops
    });
  };

  const removeLoop = (index: number) => {
    const loops = [...(smartBehavior.loops || [])];
    loops.splice(index, 1);
    
    onChange({
      ...smartBehavior,
      loops
    });
  };

  const getPreviewValue = (conditional: any) => {
    const matchingCondition = conditional.conditions.find((cond: any) => {
      try {
        // Use actual environment variables for evaluation
        const envVars = currentEnvironment?.variables || {};
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

    return matchingCondition ? matchingCondition.value : conditional.default;
  };

  return (
    <div className="h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">Smart Behavior</h3>
              <p className="text-sm text-gray-500">
                Add dynamic properties with conditionals and loops
              </p>
            </div>
          </div>
          
          {/* Enhanced Preview Environment Selector */}
          <div className="flex items-center space-x-3">
            <label className="text-sm font-medium text-gray-700">Preview as:</label>
            <div className="relative">
              <select
                value={previewEnv}
                onChange={(e) => setPreviewEnv(e.target.value)}
                className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {activeEnvironments.map((env) => (
                  <option key={env.id} value={env.id}>
                    {env.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {/* Environment Variables Indicator */}
            {currentEnvironment && (
              <button
                onClick={() => setShowEnvironmentConfig(!showEnvironmentConfig)}
                className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                title="View environment variables"
              >
                <span className={`h-2 w-2 rounded-full mr-1 ${
                  currentEnvironment.color === 'red' ? 'bg-red-500' :
                  currentEnvironment.color === 'yellow' ? 'bg-yellow-500' :
                  currentEnvironment.color === 'blue' ? 'bg-blue-500' : 
                  currentEnvironment.color === 'green' ? 'bg-green-500' :
                  currentEnvironment.color === 'purple' ? 'bg-purple-500' : 'bg-gray-500'
                }`}></span>
                {Object.keys(currentEnvironment.variables).length} vars
              </button>
            )}

            {/* Show if using default environments */}
            {(!environments || environments.length === 0) && (
              <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                Using default environments
              </div>
            )}
          </div>
        </div>
        
        {/* Environment Variables Panel (collapsible) */}
        {showEnvironmentConfig && currentEnvironment && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900">
                {currentEnvironment.name} Variables
              </h4>
              <button
                onClick={() => setShowEnvironmentConfig(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(currentEnvironment.variables).map(([key, value]) => (
                <div key={key} className="bg-white px-2 py-1 rounded border text-xs">
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className="ml-1 text-purple-600">{String(value)}</span>
                </div>
              ))}
            </div>
            {currentEnvironment.description && (
              <p className="mt-2 text-xs text-gray-500">{currentEnvironment.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="border-b border-gray-200 px-6">
        <nav className="flex space-x-6" aria-label="Smart Behavior Sections">
          {[
            { 
              id: 'conditionals', 
              label: 'Conditionals', 
              icon: SparklesIcon,
              count: smartBehavior.conditionals?.length || 0 
            },
            { 
              id: 'loops', 
              label: 'Loops', 
              icon: ArrowPathIcon,
              count: smartBehavior.loops?.length || 0 
            },
            { 
              id: 'yaml', 
              label: 'YAML Editor', 
              icon: DocumentTextIcon,
              count: 0 
            }
          ].map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as any)}
                className={`
                  py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center space-x-2
                  ${activeSection === section.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                <span>{section.label}</span>
                {section.count > 0 && (
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {section.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* YAML Editor Section */}
        {activeSection === 'yaml' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900">YAML Configuration</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Edit your smart behavior configuration directly in YAML format
                </p>
              </div>
              <div className="flex space-x-2">
                {isEditingYaml ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingYaml(false);
                        setYamlContent(convertToYaml(smartBehavior));
                        setYamlError(null);
                      }}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setIsEditingYaml(false)}
                      disabled={!!yamlError}
                      className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditingYaml(true)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit YAML
                  </button>
                )}
              </div>
            </div>

            {/* YAML Content */}
            <div className="space-y-4">
              {isEditingYaml ? (
                <div className="space-y-2">
                  <textarea
                    value={yamlContent}
                    onChange={(e) => setYamlContent(e.target.value)}
                    className={`w-full h-96 px-4 py-3 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                      yamlError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your YAML configuration here..."
                    spellCheck={false}
                  />
                  {yamlError && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <span>{yamlError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg">
                  <CodeBlock
                    code={yamlContent}
                    language="yaml"
                    showCopyButton={true}
                    maxHeight="400px"
                  />
                </div>
              )}
            </div>

            {/* Enhanced YAML Help with environment context */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="text-sm font-medium text-blue-900">YAML Format Guide</h5>
                  <div className="mt-2 text-sm text-blue-800">
                    <p className="mb-2">Your YAML should follow this structure:</p>
                    <pre className="bg-blue-100 p-2 rounded text-xs font-mono overflow-x-auto">
{`type: gcp_compute_instance
props:
  memory:
    conditionals:
      - condition: env == 'prod'
        value: 16GB
      - condition: env == 'dev'  
        value: 4GB
    default: 8GB
  cpu: 2
foreach:
  var: region
  in: [us-east1, us-west1]`}
                    </pre>
                    <div className="mt-2 p-2 bg-blue-100 rounded">
                      <p className="font-medium mb-1">Available variables in {currentEnvironment?.name}:</p>
                      <div className="text-xs space-x-2">
                        {currentEnvironment && Object.entries(currentEnvironment.variables).map(([key, value]) => (
                          <span key={key} className="inline-block bg-white px-2 py-0.5 rounded">
                            {key}="{String(value)}"
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Behavior Summary with environment preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h6 className="text-sm font-medium text-gray-900 mb-2">Active Conditionals</h6>
                {smartBehavior.conditionals && smartBehavior.conditionals.length > 0 ? (
                  <div className="space-y-2">
                    {smartBehavior.conditionals.map((conditional, index) => (
                      <div key={index} className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-purple-600">{conditional.property}</span>
                          <span className="text-gray-500">{conditional.conditions.length} condition(s)</span>
                        </div>
                        <div className="mt-1 p-1 bg-gray-50 rounded">
                          <span className="text-gray-600">Preview: </span>
                          <code className="text-purple-600">{getPreviewValue(conditional)}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No conditionals defined</p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h6 className="text-sm font-medium text-gray-900 mb-2">Active Loops</h6>
                {smartBehavior.loops && smartBehavior.loops.length > 0 ? (
                  <div className="space-y-2">
                    {smartBehavior.loops.map((loop, index) => (
                      <div key={index} className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-purple-600">{loop.variable}</span>
                          <span className="text-gray-500">{loop.values.length} values</span>
                        </div>
                        <div className="mt-1 text-gray-600 space-x-1">
                          {loop.values.map((value, vIndex) => (
                            <span key={vIndex} className="inline-block bg-gray-100 px-1 py-0.5 rounded text-xs">
                              {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No loops defined</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Conditionals Section */}
        {activeSection === 'conditionals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Conditional Properties</h4>
              <button
                onClick={addConditional}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Conditional
              </button>
            </div>

            {(!smartBehavior.conditionals || smartBehavior.conditionals.length === 0) && (
              <div className="text-center py-12">
                <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No conditionals yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add conditional logic to make your infrastructure dynamic
                </p>
              </div>
            )}

            {/* Conditionals Items with enhanced preview */}
            {smartBehavior.conditionals?.map((conditional, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-900">Conditional #{index + 1}</h5>
                  <button
                    onClick={() => removeConditional(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Property Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Property
                  </label>
                  <select
                    value={conditional.property}
                    onChange={(e) => updateConditional(index, { property: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {availableProperties.map(prop => (
                      <option key={prop} value={prop}>{prop}</option>
                    ))}
                  </select>
                </div>

                {/* Conditions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conditions
                  </label>
                  {conditional.conditions.map((condition, condIndex) => (
                    <div key={condIndex} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="env == 'prod'"
                        value={condition.condition}
                        onChange={(e) => {
                          const conditions = [...conditional.conditions];
                          conditions[condIndex] = { ...condition, condition: e.target.value };
                          updateConditional(index, { conditions });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-gray-500">→</span>
                      <input
                        type="text"
                        placeholder="Value"
                        value={condition.value}
                        onChange={(e) => {
                          const conditions = [...conditional.conditions];
                          conditions[condIndex] = { ...condition, value: e.target.value };
                          updateConditional(index, { conditions });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                  
                  <button
                    onClick={() => {
                      const conditions = [...conditional.conditions, { condition: '', value: '' }];
                      updateConditional(index, { conditions });
                    }}
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    + Add condition
                  </button>
                </div>

                {/* Default Value */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Value
                  </label>
                  <input
                    type="text"
                    placeholder="Default value when no conditions match"
                    value={conditional.default || ''}
                    onChange={(e) => updateConditional(index, { default: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Enhanced Preview with environment context */}
                <div className="bg-white rounded border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <InformationCircleIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Preview for {currentEnvironment?.name}:
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Using: {Object.entries(currentEnvironment?.variables || {}).map(([k, v]) => `${k}="${v}"`).join(', ')}
                    </div>
                  </div>
                  <code className="text-sm text-purple-600">
                    {conditional.property} = "{getPreviewValue(conditional)}"
                  </code>
                  
                  {/* Show which condition matched */}
                  {(() => {
                    const envVars = currentEnvironment?.variables || {};
                    const matchingCondition = conditional.conditions.find((cond: any) => {
                      try {
                        let condition = cond.condition;
                        Object.entries(envVars).forEach(([key, value]) => {
                          const regex = new RegExp(`\\b${key}\\b`, 'g');
                          condition = condition.replace(regex, `"${value}"`);
                        });
                        return eval(condition);
                      } catch {
                        return false;
                      }
                    });
                    
                    if (matchingCondition) {
                      return (
                        <div className="mt-1 text-xs text-green-600">
                          ✓ Matches condition: {matchingCondition.condition}
                        </div>
                      );
                    } else {
                      return (
                        <div className="mt-1 text-xs text-gray-500">
                          ℹ Using default value (no conditions matched)
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Validation Errors */}
                {validationErrors[`conditional-${index}`] && (
                  <div className="text-red-600 text-sm">
                    <ExclamationTriangleIcon className="h-4 w-4 inline-block mr-1" />
                    {validationErrors[`conditional-${index}`]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Loops Section */}
        {activeSection === 'loops' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Resource Loops</h4>
              <button
                onClick={addLoop}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Loop
              </button>
            </div>

            {(!smartBehavior.loops || smartBehavior.loops.length === 0) && (
              <div className="text-center py-12">
                <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No loops yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create loops to deploy resources across multiple environments
                </p>
              </div>
            )}

            {/* Loop Items */}
            {smartBehavior.loops?.map((loop, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-900">Loop #{index + 1}</h5>
                  <button
                    onClick={() => removeLoop(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Variable Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Variable Name
                  </label>
                  <input
                    type="text"
                    placeholder="region"
                    value={loop.variable}
                    onChange={(e) => updateLoop(index, { variable: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Values */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Values (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="us-east1, us-west1, europe-west1"
                    value={loop.values.join(', ')}
                    onChange={(e) => {
                      const values = e.target.value.split(',').map(v => v.trim()).filter(v => v);
                      updateLoop(index, { values });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Preview */}
                <div className="bg-white rounded border p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <InformationCircleIcon className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Will create {loop.values.length} instances:</span>
                  </div>
                  <div className="space-y-1">
                    {loop.values.map((value, vIndex) => (
                      <code key={vIndex} className="block text-sm text-purple-600">
                        {resourceData.label}-{value}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-700">
                {(smartBehavior.conditionals?.length || 0) + (smartBehavior.loops?.length || 0)} behaviors defined
              </span>
            </div>
            {Object.keys(validationErrors).length > 0 && (
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-600">
                  {Object.keys(validationErrors).length} validation errors
                </span>
              </div>
            )}
            {activeSection === 'yaml' && isEditingYaml && (
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-blue-600">YAML editing mode active</span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            {activeSection === 'yaml' && !isEditingYaml ? 'Read-only view' : 'Changes are automatically saved'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartBehaviorPanel;
