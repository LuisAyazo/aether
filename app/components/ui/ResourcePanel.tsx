import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Typography, Box, Button, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { IaCCodeService, IaCTemplateOptions } from '@/app/services/iacCodeService';
import CodeBlock from '../ui/CodeBlock';

interface ResourcePanelProps {
  id: string;
  data: {
    label: string;
    provider: 'aws' | 'gcp' | 'azure' | 'generic';
    nodeType?: string;
  };
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`iac-tabpanel-${index}`}
      aria-labelledby={`iac-tab-${index}`}
      {...other}
      style={{ height: '100%', overflowY: 'auto' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ id, data, onClose }) => {
  const [tabValue, setTabValue] = useState(0);
  const [code, setCode] = useState<{
    terraform: string;
    pulumi: string;
    ansible: string;
  }>({
    terraform: '',
    pulumi: '',
    ansible: ''
  });
  
  const [customParams, setCustomParams] = useState<Record<string, string>>({});
  const [availableParams, setAvailableParams] = useState<string[]>([]);
  
  // Template options specific to the resource type
  const [resourceOptions, setResourceOptions] = useState<{
    regions?: string[];
    sizes?: string[];
    images?: string[];
    [key: string]: any;
  }>({});

  // Extract parameters from templates
  useEffect(() => {
    const extractParams = (templateString: string): string[] => {
      const paramRegex = /{{([^}]+)}}/g;
      const matches = [...templateString.matchAll(paramRegex)];
      return matches.map(match => match[1]);
    };

    const initializeResourceOptions = async () => {
      const options: Record<string, any> = {};
      
      // Provider-specific options
      switch (data.provider) {
        case 'aws':
          options.regions = ['us-east-1', 'us-west-1', 'eu-west-1', 'ap-northeast-1'];
          
          if (data.nodeType === 'ec2') {
            options.sizes = ['t2.micro', 't2.small', 't2.medium', 'm5.large'];
            options.images = ['ami-0c55b159cbfafe1f0', 'ami-0b5eea76982371e91'];
          }
          break;
        
        case 'gcp':
          options.regions = ['us-central1', 'us-east1', 'europe-west1', 'asia-east1'];
          
          if (data.nodeType === 'compute') {
            options.sizes = ['e2-micro', 'e2-small', 'e2-medium', 'n1-standard-1'];
            options.images = ['debian-cloud/debian-10', 'ubuntu-os-cloud/ubuntu-2004-lts'];
          }
          break;
        
        case 'azure':
          options.regions = ['eastus', 'westus', 'westeurope', 'southeastasia'];
          
          if (data.nodeType === 'vm') {
            options.sizes = ['Standard_B1s', 'Standard_B2s', 'Standard_DS1_v2', 'Standard_D2s_v3'];
            options.images = [
              'Canonical:UbuntuServer:18.04-LTS:latest',
              'MicrosoftWindowsServer:WindowsServer:2019-Datacenter:latest'
            ];
          }
          break;
      }
      
      setResourceOptions(options);
    };

    // Generate initial code
    const generateCode = () => {
      const options: IaCTemplateOptions = {
        resourceName: data.label || 'resource',
        resourceType: data.nodeType || 'generic',
        provider: data.provider
      };
      
      // Get code for each IaC tool
      setCode({
        terraform: IaCCodeService.generateTerraformCode(options),
        pulumi: IaCCodeService.generatePulumiCode(options),
        ansible: IaCCodeService.generateAnsibleCode(options)
      });
      
      // Extract params from terraform template to use for customization fields
      const terraformTemplate = IaCCodeService.generateTerraformCode(options);
      const params = extractParams(terraformTemplate);
      
      // Filter out common params that are already handled
      const filteredParams = params.filter(
        param => !['resourceName', 'camelResourceName'].includes(param)
      );
      
      setAvailableParams(filteredParams);
    };
    
    generateCode();
    initializeResourceOptions();
  }, [data.label, data.nodeType, data.provider]);

  // Regenerate code when params change
  const regenerateCode = () => {
    const options: IaCTemplateOptions = {
      resourceName: data.label || 'resource',
      resourceType: data.nodeType || 'generic',
      provider: data.provider,
      customParams: customParams
    };
    
    setCode({
      terraform: IaCCodeService.generateTerraformCode(options),
      pulumi: IaCCodeService.generatePulumiCode(options),
      ansible: IaCCodeService.generateAnsibleCode(options)
    });
  };

  const handleParamChange = (param: string, value: string) => {
    setCustomParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <div className="resource-panel h-full flex flex-col" style={{ width: '100%' }}>
      <div className="flex justify-between items-center border-b p-4">
        <Typography variant="h6">
          IaC Template Generator: {data.label}
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={onClose}
        >
          Close
        </Button>
      </div>
      
      {/* Parameters section */}
      <Box className="p-4 border-b">
        <Typography variant="subtitle1" className="mb-3">
          Configure Resource Parameters
        </Typography>
        
        <div className="grid grid-cols-2 gap-4">
          {availableParams.map(param => (
            <TextField
              key={param}
              label={param.charAt(0).toUpperCase() + param.slice(1)}
              value={customParams[param] || ''}
              onChange={(e) => handleParamChange(param, e.target.value)}
              size="small"
              variant="outlined"
              fullWidth
              className="mb-2"
            />
          ))}
          
          {/* Provider-specific dropdowns */}
          {data.provider === 'aws' && data.nodeType === 'ec2' && (
            <>
              <FormControl size="small" fullWidth>
                <InputLabel>Region</InputLabel>
                <Select
                  value={customParams.region || ''}
                  label="Region"
                  onChange={(e) => handleParamChange('region', e.target.value)}
                >
                  {resourceOptions.regions?.map(region => (
                    <MenuItem key={region} value={region}>{region}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" fullWidth>
                <InputLabel>Instance Type</InputLabel>
                <Select
                  value={customParams.instanceType || ''}
                  label="Instance Type"
                  onChange={(e) => handleParamChange('instanceType', e.target.value)}
                >
                  {resourceOptions.sizes?.map(size => (
                    <MenuItem key={size} value={size}>{size}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
        </div>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={regenerateCode}
          className="mt-4"
        >
          Generate Code
        </Button>
      </Box>
      
      {/* Code tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="IaC tabs">
          <Tab label="Terraform" id="iac-tab-0" />
          <Tab label="Pulumi" id="iac-tab-1" />
          <Tab label="Ansible" id="iac-tab-2" />
        </Tabs>
      </Box>
      
      <div className="flex-grow overflow-hidden">
        <TabPanel value={tabValue} index={0}>
          <CodeBlock code={code.terraform} language="hcl" />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <CodeBlock code={code.pulumi} language="typescript" />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <CodeBlock code={code.ansible} language="yaml" />
        </TabPanel>
      </div>
    </div>
  );
};

export default ResourcePanel;
