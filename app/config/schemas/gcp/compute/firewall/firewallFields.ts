import { FieldConfig } from '../../../../../types/resourceConfig';

export const firewallFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Firewall Rule Name',
    type: 'text',
    required: true,
    placeholder: 'allow-http',
    description: 'Name of the firewall rule'
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
    key: 'network',
    label: 'Network',
    type: 'text',
    required: true,
    defaultValue: 'default',
    placeholder: 'default',
    description: 'The VPC network this firewall rule applies to'
  },
  {
    key: 'direction',
    label: 'Direction',
    type: 'select',
    required: true,
    defaultValue: 'INGRESS',
    options: [
      { value: 'INGRESS', label: 'Ingress (Inbound)' },
      { value: 'EGRESS', label: 'Egress (Outbound)' }
    ],
    description: 'Direction of traffic this rule applies to'
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'number',
    defaultValue: 1000,
    description: 'Priority of the rule (0-65534, lower numbers have higher priority)'
  },
  {
    key: 'action',
    label: 'Action',
    type: 'select',
    required: true,
    defaultValue: 'allow',
    options: [
      { value: 'allow', label: 'Allow' },
      { value: 'deny', label: 'Deny' }
    ],
    description: 'Action to take when rule matches'
  },
  {
    key: 'source_ranges',
    label: 'Source IP Ranges',
    type: 'text',
    placeholder: '0.0.0.0/0',
    description: 'Source IP ranges (comma-separated). Use 0.0.0.0/0 for all IPs'
  },
  {
    key: 'target_tags',
    label: 'Target Tags',
    type: 'text',
    placeholder: 'web-server,http-server',
    description: 'Target network tags (comma-separated)'
  },
  {
    key: 'source_tags',
    label: 'Source Tags',
    type: 'text',
    placeholder: 'backend,database',
    description: 'Source network tags (comma-separated)'
  },
  {
    key: 'protocols',
    label: 'Protocols and Ports',
    type: 'group',
    description: 'Allowed protocols and ports',
    fields: [
      {
        key: 'tcp',
        label: 'TCP Ports',
        type: 'text',
        placeholder: '80,443,8080-8090',
        description: 'TCP ports (comma-separated, ranges with dash)'
      },
      {
        key: 'udp',
        label: 'UDP Ports',
        type: 'text',
        placeholder: '53,123',
        description: 'UDP ports (comma-separated, ranges with dash)'
      },
      {
        key: 'icmp',
        label: 'Allow ICMP',
        type: 'boolean',
        defaultValue: false,
        description: 'Allow ICMP protocol (ping)'
      },
      {
        key: 'all',
        label: 'Allow All Protocols',
        type: 'boolean',
        defaultValue: false,
        description: 'Allow all IP protocols'
      }
    ]
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    placeholder: 'Allow HTTP traffic from internet',
    description: 'Description of the firewall rule'
  }
];
