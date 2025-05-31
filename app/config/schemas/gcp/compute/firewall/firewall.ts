import { ResourceSchema } from '../../../../../types/resourceConfig';
import { firewallFields } from './firewallFields';
import { firewallTemplates } from './firewallTemplates';

export const firewallSchema: ResourceSchema = {
  type: 'gcp_compute_firewall',
  displayName: 'Firewall Rule',
  description: 'Google Cloud Platform firewall rule for network security',
  category: 'compute',
  fields: firewallFields,
  templates: firewallTemplates,
  documentation: {
    description: 'Firewall rules control incoming and outgoing traffic to your instances',
    examples: [
      'Allow HTTP/HTTPS traffic from internet',
      'Allow SSH access from specific IP ranges',
      'Internal communication between instances'
    ]
  }
};
