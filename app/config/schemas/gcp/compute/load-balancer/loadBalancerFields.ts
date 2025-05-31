import { FieldConfig } from '../../../../../types/resourceConfig';

export const loadBalancerFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Load Balancer Name',
    type: 'text',
    required: true,
    placeholder: 'my-load-balancer',
    description: 'Name of the load balancer'
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
    key: 'load_balancing_scheme',
    label: 'Load Balancing Scheme',
    type: 'select',
    required: true,
    defaultValue: 'EXTERNAL',
    options: [
      { value: 'EXTERNAL', label: 'External (Global)' },
      { value: 'INTERNAL', label: 'Internal (Regional)' },
      { value: 'EXTERNAL_MANAGED', label: 'External Managed (Global)' }
    ],
    description: 'Type of load balancing scheme'
  },
  {
    key: 'protocol',
    label: 'Protocol',
    type: 'select',
    required: true,
    defaultValue: 'HTTP',
    options: [
      { value: 'HTTP', label: 'HTTP' },
      { value: 'HTTPS', label: 'HTTPS' },
      { value: 'TCP', label: 'TCP' },
      { value: 'UDP', label: 'UDP' }
    ],
    description: 'Protocol for the load balancer'
  },
  {
    key: 'port',
    label: 'Port',
    type: 'number',
    required: true,
    defaultValue: 80,
    description: 'Port number for the load balancer'
  },
  {
    key: 'backend_service',
    label: 'Backend Service',
    type: 'group',
    description: 'Backend service configuration',
    fields: [
      {
        key: 'name',
        label: 'Backend Service Name',
        type: 'text',
        required: true,
        placeholder: 'my-backend-service',
        description: 'Name of the backend service'
      },
      {
        key: 'protocol',
        label: 'Backend Protocol',
        type: 'select',
        defaultValue: 'HTTP',
        options: [
          { value: 'HTTP', label: 'HTTP' },
          { value: 'HTTPS', label: 'HTTPS' },
          { value: 'TCP', label: 'TCP' },
          { value: 'UDP', label: 'UDP' }
        ],
        description: 'Protocol for backend communication'
      },
      {
        key: 'port',
        label: 'Backend Port',
        type: 'number',
        defaultValue: 80,
        description: 'Port for backend instances'
      },
      {
        key: 'timeout_sec',
        label: 'Timeout (seconds)',
        type: 'number',
        defaultValue: 30,
        description: 'Request timeout in seconds'
      }
    ]
  },
  {
    key: 'health_check',
    label: 'Health Check',
    type: 'group',
    description: 'Health check configuration',
    fields: [
      {
        key: 'name',
        label: 'Health Check Name',
        type: 'text',
        placeholder: 'my-health-check',
        description: 'Name of the health check'
      },
      {
        key: 'path',
        label: 'Health Check Path',
        type: 'text',
        defaultValue: '/',
        placeholder: '/health',
        description: 'Path for health check requests'
      },
      {
        key: 'port',
        label: 'Health Check Port',
        type: 'number',
        defaultValue: 80,
        description: 'Port for health check'
      },
      {
        key: 'check_interval_sec',
        label: 'Check Interval (seconds)',
        type: 'number',
        defaultValue: 10,
        description: 'How often to check health'
      }
    ]
  },
  {
    key: 'ssl_certificate',
    label: 'SSL Certificate (HTTPS only)',
    type: 'text',
    placeholder: 'my-ssl-cert',
    description: 'Name of the SSL certificate for HTTPS'
  },
  {
    key: 'cdn_policy',
    label: 'Enable CDN',
    type: 'boolean',
    defaultValue: false,
    description: 'Enable Cloud CDN for caching'
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    placeholder: 'Load balancer for web application',
    description: 'Description of the load balancer'
  }
];
