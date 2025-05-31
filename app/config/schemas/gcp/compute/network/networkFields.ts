import { FieldConfig } from '../../../../../types/resourceConfig';

export const networkFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Network Name',
    type: 'text',
    required: true,
    placeholder: 'my-vpc-network',
    description: 'Name of the VPC network'
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
    key: 'auto_create_subnetworks',
    label: 'Auto Create Subnetworks',
    type: 'boolean',
    defaultValue: true,
    description: 'Whether to automatically create subnetworks in each region'
  },
  {
    key: 'mtu',
    label: 'Maximum Transmission Unit',
    type: 'number',
    defaultValue: 1460,
    description: 'Maximum transmission unit in bytes (1460-1500)'
  },
  {
    key: 'routing_mode',
    label: 'Routing Mode',
    type: 'select',
    defaultValue: 'REGIONAL',
    options: [
      { value: 'REGIONAL', label: 'Regional' },
      { value: 'GLOBAL', label: 'Global' }
    ],
    description: 'The network-wide routing mode'
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    placeholder: 'VPC network for my application',
    description: 'Description of the network'
  },
  {
    key: 'delete_default_routes_on_create',
    label: 'Delete Default Routes',
    type: 'boolean',
    defaultValue: false,
    description: 'Whether to delete the default internet gateway route'
  }
];
