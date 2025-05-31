import { ResourceSchema } from '../../../../../types/resourceConfig';
import { instanceGroupFields } from './instanceGroupFields';
import { instanceGroupTemplates } from './instanceGroupTemplates';

export const instanceGroupSchema: ResourceSchema = {
  type: 'gcp_compute_instance_group_manager',
  displayName: 'Instance Group Manager',
  description: 'Google Cloud Platform managed instance group for auto-scaling',
  category: 'compute',
  fields: instanceGroupFields,
  templates: instanceGroupTemplates,
  documentation: {
    description: 'Managed instance groups provide auto-scaling and self-healing for identical VM instances',
    examples: [
      'Auto-scaling web server farm',
      'Regional instance group for high availability',
      'Instance group with load balancer backend'
    ]
  }
};
