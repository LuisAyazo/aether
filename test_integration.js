// Test script to verify all GCP compute resources are properly integrated
const fs = require('fs');
const path = require('path');

console.log('Testing GCP Compute Resources Integration...\n');

// Test 1: Check if all resource files exist
const resourceTypes = ['instance', 'disk', 'network', 'firewall', 'load-balancer', 'instance-template', 'instance-group'];
const computePath = path.join(__dirname, 'app/config/schemas/gcp/compute');

console.log('1. Checking resource file existence:');
resourceTypes.forEach(type => {
  const resourceDir = path.join(computePath, type);
  if (fs.existsSync(resourceDir)) {
    console.log(`  ✓ ${type} directory exists`);
    
    // Check for key files
    const files = fs.readdirSync(resourceDir);
    const hasMainFile = files.some(f => f.includes(type.replace('-', '') || f.includes(type.split('-')[0])));
    console.log(`    ${hasMainFile ? '✓' : '✗'} Has main configuration file`);
  } else {
    console.log(`  ✗ ${type} directory missing`);
  }
});

// Test 2: Check compute index exports
console.log('\n2. Checking compute index exports:');
const computeIndexPath = path.join(computePath, 'index.ts');
if (fs.existsSync(computeIndexPath)) {
  const content = fs.readFileSync(computeIndexPath, 'utf8');
  const expectedExports = [
    'gcpComputeInstanceSchema',
    'gcpComputeDiskSchema', 
    'gcpComputeNetworkSchema',
    'gcpComputeFirewallSchema',
    'gcpComputeLoadBalancerSchema',
    'gcpComputeInstanceTemplateSchema',
    'gcpComputeInstanceGroupSchema'
  ];
  
  expectedExports.forEach(exportName => {
    const hasExport = content.includes(exportName);
    console.log(`  ${hasExport ? '✓' : '✗'} ${exportName}`);
  });
} else {
  console.log('  ✗ compute/index.ts not found');
}

// Test 3: Check resourceSchemas.ts has field configs
console.log('\n3. Checking resource field configurations:');
const resourceSchemasPath = path.join(__dirname, 'app/config/resourceSchemas.ts');
if (fs.existsSync(resourceSchemasPath)) {
  const content = fs.readFileSync(resourceSchemasPath, 'utf8');
  const expectedConfigs = [
    'instance',
    'disk', 
    'network',
    'firewall',
    'loadBalancer',
    'instanceTemplate',
    'instanceGroup'
  ];
  
  expectedConfigs.forEach(configName => {
    const hasConfig = content.includes(configName + ':') || content.includes(`"${configName}":`);
    console.log(`  ${hasConfig ? '✓' : '✗'} ${configName} field configuration`);
  });
} else {
  console.log('  ✗ resourceSchemas.ts not found');
}

// Test 4: Check IaCTemplatePanel default values
console.log('\n4. Checking IaCTemplatePanel default values:');
const iacPanelPath = path.join(__dirname, 'app/components/ui/IaCTemplatePanel.tsx');
if (fs.existsSync(iacPanelPath)) {
  const content = fs.readFileSync(iacPanelPath, 'utf8');
  const expectedDefaults = [
    'defaultGCPComputeInstanceConfig',
    'defaultGCPComputeDiskConfig',
    'defaultGCPComputeNetworkConfig', 
    'defaultGCPComputeFirewallConfig',
    'defaultGCPComputeLoadBalancerConfig',
    'defaultGCPComputeInstanceTemplateConfig',
    'defaultGCPComputeInstanceGroupConfig'
  ];
  
  expectedDefaults.forEach(defaultName => {
    const hasDefault = content.includes(defaultName);
    console.log(`  ${hasDefault ? '✓' : '✗'} ${defaultName}`);
  });
} else {
  console.log('  ✗ IaCTemplatePanel.tsx not found');
}

console.log('\nIntegration test completed!');
