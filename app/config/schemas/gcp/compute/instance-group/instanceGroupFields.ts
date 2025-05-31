import { FieldConfig } from '../../../../../types/resourceConfig';

export const instanceGroupFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Instance Group Name',
    type: 'text',
    required: true,
    placeholder: 'web-server-group',
    description: 'Name of the managed instance group'
  },
  {
    key: 'project',
    label: 'Project ID',
    type: 'text',
    required: true,
    placeholder: 'my-gcp-project',
    description: 'The GCP project ID'
  },
  {
    key: 'zone',
    label: 'Zone (for zonal groups)',
    type: 'select',
    options: [
      { value: 'us-central1-a', label: 'us-central1-a' },
      { value: 'us-central1-b', label: 'us-central1-b' },
      { value: 'us-central1-c', label: 'us-central1-c' },
      { value: 'us-east1-a', label: 'us-east1-a' },
      { value: 'us-east1-b', label: 'us-east1-b' },
      { value: 'us-west1-a', label: 'us-west1-a' },
      { value: 'us-west1-b', label: 'us-west1-b' },
      { value: 'europe-west1-a', label: 'europe-west1-a' },
      { value: 'europe-west1-b', label: 'europe-west1-b' },
      { value: 'asia-east1-a', label: 'asia-east1-a' },
      { value: 'asia-east1-b', label: 'asia-east1-b' }
    ],
    description: 'Zone for zonal instance groups (leave empty for regional groups)'
  },
  {
    key: 'region',
    label: 'Region (for regional groups)',
    type: 'select',
    options: [
      { value: 'us-central1', label: 'us-central1 (Iowa)' },
      { value: 'us-east1', label: 'us-east1 (South Carolina)' },
      { value: 'us-west1', label: 'us-west1 (Oregon)' },
      { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
      { value: 'asia-east1', label: 'asia-east1 (Taiwan)' }
    ],
    description: 'Region for regional instance groups (leave empty for zonal groups)'
  },
  {
    key: 'base_instance_name',
    label: 'Base Instance Name',
    type: 'text',
    required: true,
    placeholder: 'web-server',
    description: 'Base name for instances created by this group'
  },
  {
    key: 'version',
    label: 'Instance Template',
    type: 'group',
    required: true,
    description: 'Instance template configuration',
    fields: [
      {
        key: 'instance_template',
        label: 'Instance Template',
        type: 'text',
        required: true,
        placeholder: 'web-server-template',
        description: 'Name of the instance template to use'
      },
      {
        key: 'name',
        label: 'Version Name',
        type: 'text',
        defaultValue: 'primary',
        description: 'Name for this template version'
      }
    ]
  },
  {
    key: 'target_size',
    label: 'Target Size',
    type: 'number',
    required: true,
    defaultValue: 3,
    description: 'Target number of instances in the group'
  },
  {
    key: 'auto_healing_policies',
    label: 'Auto Healing',
    type: 'group',
    description: 'Auto healing configuration',
    fields: [
      {
        key: 'health_check',
        label: 'Health Check',
        type: 'text',
        placeholder: 'my-health-check',
        description: 'Name of the health check to use'
      },
      {
        key: 'initial_delay_sec',
        label: 'Initial Delay (seconds)',
        type: 'number',
        defaultValue: 300,
        description: 'Time to wait before checking health of new instances'
      }
    ]
  },
  {
    key: 'update_policy',
    label: 'Update Policy',
    type: 'group',
    description: 'Rolling update configuration',
    fields: [
      {
        key: 'type',
        label: 'Update Type',
        type: 'select',
        defaultValue: 'ROLLING_UPDATE',
        options: [
          { value: 'ROLLING_UPDATE', label: 'Rolling Update' },
          { value: 'OPPORTUNISTIC', label: 'Opportunistic' }
        ],
        description: 'Type of update to perform'
      },
      {
        key: 'minimal_action',
        label: 'Minimal Action',
        type: 'select',
        defaultValue: 'REPLACE',
        options: [
          { value: 'REPLACE', label: 'Replace' },
          { value: 'RESTART', label: 'Restart' }
        ],
        description: 'Minimal action to take when updating instances'
      },
      {
        key: 'max_surge_fixed',
        label: 'Max Surge (fixed)',
        type: 'number',
        defaultValue: 1,
        description: 'Maximum number of instances to create during update'
      },
      {
        key: 'max_unavailable_fixed',
        label: 'Max Unavailable (fixed)',
        type: 'number',
        defaultValue: 1,
        description: 'Maximum number of instances that can be unavailable during update'
      }
    ]
  },
  {
    key: 'named_port',
    label: 'Named Ports',
    type: 'group',
    description: 'Named ports for load balancer backends',
    fields: [
      {
        key: 'name',
        label: 'Port Name',
        type: 'text',
        placeholder: 'http',
        description: 'Name of the port'
      },
      {
        key: 'port',
        label: 'Port Number',
        type: 'number',
        defaultValue: 80,
        description: 'Port number'
      }
    ]
  },
  {
    key: 'target_pools',
    label: 'Target Pools',
    type: 'text',
    placeholder: 'my-target-pool',
    description: 'Target pools for network load balancing (comma-separated)'
  }
];
