import { ResourceSchema } from '../../../../../types/resourceConfig';
import { loadBalancerFields } from './loadBalancerFields';
import { loadBalancerTemplates } from './loadBalancerTemplates';

export const loadBalancerSchema: ResourceSchema = {
  type: 'gcp_compute_load_balancer',
  displayName: 'Load Balancer',
  description: 'Google Cloud Platform HTTP(S) Load Balancer',
  category: 'compute',
  fields: loadBalancerFields,
  templates: loadBalancerTemplates,
  documentation: {
    description: 'Load balancers distribute incoming requests across multiple backend instances',
    examples: [
      'HTTP load balancer for web applications',
      'HTTPS load balancer with SSL certificates',
      'Global load balancer with CDN'
    ]
  }
};
