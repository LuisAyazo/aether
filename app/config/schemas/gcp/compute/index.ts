// GCP Compute resources exports

// Instance exports
export {
  gcpComputeInstanceSchema,
  defaultGCPComputeInstanceConfig,
  type GCPComputeInstanceConfig,
} from './instance/instance';

export { instanceFields as gcpComputeInstanceFields } from './instance/instanceFields';

export {
  generateGCPComputeInstanceTemplates,
  type CodeTemplate,
} from './instance/instanceTemplates';

// Disk exports
export { diskSchema as gcpComputeDiskSchema } from './disk/disk';
export { diskFields as gcpComputeDiskFields } from './disk/diskFields';
export { diskTemplates as generateGCPComputeDiskTemplates } from './disk/diskTemplates';

// Network exports
export { networkSchema as gcpComputeNetworkSchema } from './network/network';
export { networkFields as gcpComputeNetworkFields } from './network/networkFields';
export { networkTemplates as generateGCPComputeNetworkTemplates } from './network/networkTemplates';

// Firewall exports
export { firewallSchema as gcpComputeFirewallSchema } from './firewall/firewall';
export { firewallFields as gcpComputeFirewallFields } from './firewall/firewallFields';
export { firewallTemplates as generateGCPComputeFirewallTemplates } from './firewall/firewallTemplates';

// Load Balancer exports
export { loadBalancerSchema as gcpComputeLoadBalancerSchema } from './load-balancer/loadBalancer';
export { loadBalancerFields as gcpComputeLoadBalancerFields } from './load-balancer/loadBalancerFields';
export { loadBalancerTemplates as generateGCPComputeLoadBalancerTemplates } from './load-balancer/loadBalancerTemplates';

// Instance Template exports
export { instanceTemplateSchema as gcpComputeInstanceTemplateSchema } from './instance-template/instanceTemplate';
export { instanceTemplateFields as gcpComputeInstanceTemplateFields } from './instance-template/instanceTemplateFields';
export { instanceTemplateTemplates as generateGCPComputeInstanceTemplateTemplates } from './instance-template/instanceTemplateTemplates';

// Instance Group exports
export { instanceGroupSchema as gcpComputeInstanceGroupSchema } from './instance-group/instanceGroup';
export { instanceGroupFields as gcpComputeInstanceGroupFields } from './instance-group/instanceGroupFields';
export { instanceGroupTemplates as generateGCPComputeInstanceGroupTemplates } from './instance-group/instanceGroupTemplates';

// Default configs (placeholder for now)
export const defaultGCPComputeDiskConfig = {};
export const defaultGCPComputeNetworkConfig = {};
export const defaultGCPComputeFirewallConfig = {};
export const defaultGCPComputeLoadBalancerConfig = {};
export const defaultGCPComputeInstanceTemplateConfig = {};
export const defaultGCPComputeInstanceGroupConfig = {};
