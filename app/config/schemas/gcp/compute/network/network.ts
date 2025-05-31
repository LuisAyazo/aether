import { ResourceSchema } from '../../../../../types/resourceConfig';
import { networkFields } from './networkFields';
import { networkTemplates } from './networkTemplates';

export const networkSchema: ResourceSchema = {
  type: 'gcp_compute_network',
  displayName: 'VPC Network',
  description: 'Google Cloud Platform Virtual Private Cloud network',
  category: 'compute',
  fields: networkFields,
  templates: networkTemplates,
  documentation: {
    description: 'A VPC network provides connectivity for your compute instances',
    examples: [
      'Auto-mode VPC with automatic subnets',
      'Custom-mode VPC with manual subnet control',
      'Legacy network for simple setups'
    ]
  }
};
