// GCP Provider schemas and configurations
export * from './compute';
// export * from './storage';     // Para futuros recursos
// export * from './networking';  // Para futuros recursos  
// export * from './database';    // Para futuros recursos
// export * from './functions';   // Para futuros recursos

// Registry of all GCP resource types
export const GCP_RESOURCE_REGISTRY = {
  compute: {
    instance: {
      schema: () => import('./compute').then(m => m.gcpComputeInstanceSchema),
      fields: () => import('./compute').then(m => m.gcpComputeInstanceFields),
      templates: () => import('./compute').then(m => m.generateGCPComputeInstanceTemplates),
      defaults: () => import('./compute').then(m => m.defaultGCPComputeInstanceConfig),
    },
    disk: {
      schema: () => import('./compute').then(m => m.gcpComputeDiskSchema),
      fields: () => import('./compute').then(m => m.gcpComputeDiskFields),
      templates: () => import('./compute').then(m => m.generateGCPComputeDiskTemplates),
      defaults: () => import('./compute').then(m => m.defaultGCPComputeDiskConfig),
    },
    network: {
      schema: () => import('./compute').then(m => m.gcpComputeNetworkSchema),
      fields: () => import('./compute').then(m => m.gcpComputeNetworkFields),
      templates: () => import('./compute').then(m => m.generateGCPComputeNetworkTemplates),
      defaults: () => import('./compute').then(m => m.defaultGCPComputeNetworkConfig),
    },
    firewall: {
      schema: () => import('./compute').then(m => m.gcpComputeFirewallSchema),
      fields: () => import('./compute').then(m => m.gcpComputeFirewallFields),
      templates: () => import('./compute').then(m => m.generateGCPComputeFirewallTemplates),
      defaults: () => import('./compute').then(m => m.defaultGCPComputeFirewallConfig),
    },
    loadBalancer: {
      schema: () => import('./compute').then(m => m.gcpComputeLoadBalancerSchema),
      fields: () => import('./compute').then(m => m.gcpComputeLoadBalancerFields),
      templates: () => import('./compute').then(m => m.generateGCPComputeLoadBalancerTemplates),
      defaults: () => import('./compute').then(m => m.defaultGCPComputeLoadBalancerConfig),
    },
    instanceTemplate: {
      schema: () => import('./compute').then(m => m.gcpComputeInstanceTemplateSchema),
      fields: () => import('./compute').then(m => m.gcpComputeInstanceTemplateFields),
      templates: () => import('./compute').then(m => m.generateGCPComputeInstanceTemplateTemplates),
      defaults: () => import('./compute').then(m => m.defaultGCPComputeInstanceTemplateConfig),
    },
    instanceGroup: {
      schema: () => import('./compute').then(m => m.gcpComputeInstanceGroupSchema),
      fields: () => import('./compute').then(m => m.gcpComputeInstanceGroupFields),
      templates: () => import('./compute').then(m => m.generateGCPComputeInstanceGroupTemplates),
      defaults: () => import('./compute').then(m => m.defaultGCPComputeInstanceGroupConfig),
    },
  },
  // storage: {
  //   bucket: {
  //     schema: () => import('./storage').then(m => m.gcpStorageBucketSchema),
  //     fields: () => import('./storage').then(m => m.gcpStorageBucketFields),
  //     templates: () => import('./storage').then(m => m.generateGCPStorageBucketTemplates),
  //     defaults: () => import('./storage').then(m => m.defaultGCPStorageBucketConfig),
  //   },
  // },
} as const;

export type GCPResourceType = keyof typeof GCP_RESOURCE_REGISTRY;
export type GCPComputeResourceType = keyof typeof GCP_RESOURCE_REGISTRY.compute;
