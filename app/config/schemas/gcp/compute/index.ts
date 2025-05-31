// GCP Compute resources definitions for the global registry

import * as instanceDefinition from './instance/instance';
import * as diskDefinition from './disk/disk';
import * as networkDefinition from './network/network';
import * as firewallDefinition from './firewall/firewall';
import * as loadBalancerDefinition from './load-balancer/loadBalancer';
import * as instanceTemplateDefinition from './instance-template/instanceTemplate';
import * as instanceGroupDefinition from './instance-group/instanceGroup';

export const gcpComputeResources = {
  instance: {
    schema: instanceDefinition.schema,
    fields: instanceDefinition.fields,
    templates: instanceDefinition.templates,
    defaults: instanceDefinition.defaults,
  },
  disk: {
    schema: diskDefinition.schema,
    fields: diskDefinition.fields,
    templates: diskDefinition.templates,
    defaults: diskDefinition.defaults,
  },
  network: {
    schema: networkDefinition.schema,
    fields: networkDefinition.fields,
    templates: networkDefinition.templates,
    defaults: networkDefinition.defaults,
  },
  firewall: {
    schema: firewallDefinition.schema,
    fields: firewallDefinition.fields,
    templates: firewallDefinition.templates,
    defaults: firewallDefinition.defaults,
  },
  loadBalancer: {
    schema: loadBalancerDefinition.schema,
    fields: loadBalancerDefinition.fields,
    templates: loadBalancerDefinition.templates,
    defaults: loadBalancerDefinition.defaults,
  },
  instanceTemplate: {
    schema: instanceTemplateDefinition.schema,
    fields: instanceTemplateDefinition.fields,
    templates: instanceTemplateDefinition.templates,
    defaults: instanceTemplateDefinition.defaults,
  },
  instanceGroup: {
    schema: instanceGroupDefinition.schema,
    fields: instanceGroupDefinition.fields,
    templates: instanceGroupDefinition.templates,
    defaults: instanceGroupDefinition.defaults,
  },
} as const;

// Exportar tipos de configuración individuales si se usan directamente en otros lugares
export type { GCPComputeInstanceConfig } from './instance/instance';
export type { GCPComputeDiskConfig } from './disk/disk';
export type { GCPComputeNetworkConfig } from './network/network';
export type { GCPComputeFirewallConfig } from './firewall/firewall';
export type { GCPComputeLoadBalancerConfig } from './load-balancer/loadBalancer';
export type { GCPComputeInstanceTemplateConfig } from './instance-template/instanceTemplate';
export type { GCPComputeInstanceGroupConfig } from './instance-group/instanceGroup';
