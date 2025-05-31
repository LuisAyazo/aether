import { ResourceTemplate } from '../../../../../types/resourceConfig';

export const networkTemplates: ResourceTemplate[] = [
  {
    name: 'Auto-Mode VPC',
    description: 'Auto-mode VPC with automatic subnet creation',
    config: {
      name: 'auto-vpc',
      project: '${var.project_id}',
      auto_create_subnetworks: true,
      mtu: 1460,
      routing_mode: 'REGIONAL',
      description: 'Auto-mode VPC network'
    }
  },
  {
    name: 'Custom-Mode VPC',
    description: 'Custom-mode VPC for manual subnet control',
    config: {
      name: 'custom-vpc',
      project: '${var.project_id}',
      auto_create_subnetworks: false,
      mtu: 1460,
      routing_mode: 'REGIONAL',
      description: 'Custom-mode VPC network for manual subnet control'
    }
  },
  {
    name: 'Global VPC',
    description: 'Global VPC network with global routing',
    config: {
      name: 'global-vpc',
      project: '${var.project_id}',
      auto_create_subnetworks: false,
      mtu: 1500,
      routing_mode: 'GLOBAL',
      description: 'Global VPC network with cross-region connectivity'
    }
  },
  {
    name: 'Isolated VPC',
    description: 'Isolated VPC without default internet gateway',
    config: {
      name: 'isolated-vpc',
      project: '${var.project_id}',
      auto_create_subnetworks: false,
      mtu: 1460,
      routing_mode: 'REGIONAL',
      delete_default_routes_on_create: true,
      description: 'Isolated VPC without internet gateway'
    }
  }
];
