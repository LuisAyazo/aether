import { ResourceSchema } from '../../../../../types/resourceConfig';
import { diskFields } from './diskFields';
import { diskTemplates } from './diskTemplates';

export const diskSchema: ResourceSchema = {
  type: 'gcp_compute_disk',
  displayName: 'Compute Disk',
  description: 'Google Cloud Platform persistent disk resource',
  category: 'compute',
  fields: diskFields,
  templates: diskTemplates,
  documentation: {
    description: 'A persistent disk resource that can be attached to compute instances',
    examples: [
      'Standard persistent disk for boot volumes',
      'SSD persistent disk for high-performance workloads',
      'Regional persistent disk for high availability'
    ]
  }
};
