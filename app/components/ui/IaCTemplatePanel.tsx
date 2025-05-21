import React, { useState, useEffect, useCallback } from 'react';
import SidePanel from './SidePanel';
import CodeTabs from './CodeTabs';
import CodeBlock from './CodeBlock';
import { IaCTemplateService } from '../../services/iacTemplateService';
import './iacstylez.css'; // Importamos los estilos personalizados

interface IaCTemplatePanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  resourceData: {
    label: string;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    resourceType: string;
  };
}

const IaCTemplatePanel: React.FC<IaCTemplatePanelProps> = ({ 
  isOpen, 
  onClose, 
  resourceData,
  nodeId 
}) => {
  const [terraformCode, setTerraformCode] = useState<string>('');
  const [pulumiCode, setPulumiCode] = useState<string>('');
  const [ansibleCode, setAnsibleCode] = useState<string>('');
  const [cloudFormationCode, setCloudFormationCode] = useState<string>('');
  const [bicepCode, setBicepCode] = useState<string>('');
  const [customParams, setCustomParams] = useState<Record<string, string>>({});
  const [availableParams, setAvailableParams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to load templates wrapped in useCallback to prevent recreation on every render
  const loadTemplates = useCallback(async () => {
    if (!isOpen) return; // Don't load if panel is not open
    
    setIsLoading(true);
    setError(null);

    try {
      console.log("Loading templates for:", resourceData);

      // Generate initial code for all providers
      const options = {
        resourceName: resourceData.label || 'resource',
        resourceType: resourceData.resourceType || 'generic',
        provider: resourceData.provider,
        customParams: customParams
      };

      // Generate code for each provider
      setTerraformCode(IaCTemplateService.generateTerraformCode(options));
      setPulumiCode(IaCTemplateService.generatePulumiCode(options));
      setAnsibleCode(IaCTemplateService.generateAnsibleCode(options));
      setCloudFormationCode(IaCTemplateService.generateCloudFormationCode(options));
      setBicepCode(IaCTemplateService.generateBicepCode(options));

      // Extract parameters from templates
      const paramRegex = /{{([^}]+)}}/g;
      const allParams = new Set<string>();
      
      [terraformCode, pulumiCode, ansibleCode, cloudFormationCode, bicepCode].forEach(code => {
        const matches = [...code.matchAll(paramRegex)];
        matches.forEach(match => {
          if (!['resourceName', 'camelResourceName'].includes(match[1])) {
            allParams.add(match[1]);
          }
        });
      });
      
      setAvailableParams(Array.from(allParams));
    } catch (error) {
      console.error('Error loading templates:', error);
      setError('Failed to load templates. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, resourceData, customParams]);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, loadTemplates]);

  // Handle parameter changes
  const handleParamChange = (param: string, value: string) => {
    setCustomParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // Regenerate code with updated parameters
  const regenerateCode = () => {
    const options = {
      resourceName: resourceData.label || 'resource',
      resourceType: resourceData.resourceType || 'generic',
      provider: resourceData.provider,
      customParams: customParams
    };

    setTerraformCode(IaCTemplateService.generateTerraformCode(options));
    setPulumiCode(IaCTemplateService.generatePulumiCode(options));
    setAnsibleCode(IaCTemplateService.generateAnsibleCode(options));
    setCloudFormationCode(IaCTemplateService.generateCloudFormationCode(options));
    setBicepCode(IaCTemplateService.generateBicepCode(options));
  };

  const tabsData = [
    {
      id: 'terraform',
      label: 'Terraform',
      content: (
        <div className="h-full">
          <CodeBlock 
            code={terraformCode} 
            language="hcl" 
            showCopyButton={true}
            maxHeight="calc(100vh - 350px)"
          />
        </div>
      )
    },
    {
      id: 'pulumi',
      label: 'Pulumi',
      content: (
        <div className="h-full">
          <CodeBlock 
            code={pulumiCode} 
            language="typescript" 
            showCopyButton={true}
            maxHeight="calc(100vh - 350px)"
          />
        </div>
      )
    },
    {
      id: 'ansible',
      label: 'Ansible',
      content: (
        <div className="h-full">
          <CodeBlock 
            code={ansibleCode} 
            language="yaml" 
            showCopyButton={true}
            maxHeight="calc(100vh - 350px)"
          />
        </div>
      )
    },
    {
      id: 'cloudformation',
      label: 'CloudFormation',
      content: (
        <div className="h-full">
          <CodeBlock 
            code={cloudFormationCode} 
            language="json" 
            showCopyButton={true}
            maxHeight="calc(100vh - 350px)"
          />
        </div>
      )
    },
    {
      id: 'bicep',
      label: 'Bicep',
      content: (
        <div className="h-full">
          <CodeBlock 
            code={bicepCode} 
            language="bicep" 
            showCopyButton={true}
            maxHeight="calc(100vh - 350px)"
          />
        </div>
      )
    }
  ];

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`IaC Templates - ${resourceData.label}`}
      width="50%"
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 p-4">{error}</div>
      ) : (
        <div className="space-y-4">
          {availableParams.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-medium mb-2">Custom Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                {availableParams.map(param => (
                  <div key={param} className="flex flex-col">
                    <label className="text-sm font-medium mb-1">{param}</label>
                    <input
                      type="text"
                      value={customParams[param] || ''}
                      onChange={(e) => handleParamChange(param, e.target.value)}
                      className="border rounded px-2 py-1"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={regenerateCode}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Regenerate Code
              </button>
            </div>
          )}
          <CodeTabs tabs={tabsData} />
        </div>
      )}
    </SidePanel>
  );
};

export default IaCTemplatePanel;
