import { ResourceSchema } from '../../../../../types/resourceConfig';
import { instanceTemplateFields } from './instanceTemplateFields';
import { instanceTemplateTemplates } from './instanceTemplateTemplates';

export const instanceTemplateSchema: ResourceSchema = {
  type: 'gcp_compute_instance_template',
  displayName: 'Instance Template',
  description: 'Google Cloud Platform instance template for managed instance groups',
  category: 'compute',
  fields: instanceTemplateFields,
  templates: instanceTemplateTemplates,
  documentation: {
    description: 'Instance templates define the configuration for creating identical VM instances',
    examples: [
      'Template for auto-scaling web servers',
      'Template for batch processing workers',
      'Template for container-optimized instances'
    ]
  }
};
