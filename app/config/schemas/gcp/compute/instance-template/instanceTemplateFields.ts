import { FieldConfig } from '../../../../../types/resourceConfig';

export const instanceTemplateFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Template Name',
    type: 'text',
    required: true,
    placeholder: 'web-server-template',
    description: 'Name of the instance template'
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
    key: 'machine_type',
    label: 'Machine Type',
    type: 'select',
    required: true,
    defaultValue: 'e2-micro',
    options: [
      { value: 'e2-micro', label: 'e2-micro (0.25-2 vCPU, 1 GB RAM)' },
      { value: 'e2-small', label: 'e2-small (0.5-2 vCPU, 2 GB RAM)' },
      { value: 'e2-medium', label: 'e2-medium (1-2 vCPU, 4 GB RAM)' },
      { value: 'e2-standard-2', label: 'e2-standard-2 (2 vCPU, 8 GB RAM)' },
      { value: 'e2-standard-4', label: 'e2-standard-4 (4 vCPU, 16 GB RAM)' },
      { value: 'n1-standard-1', label: 'n1-standard-1 (1 vCPU, 3.75 GB RAM)' },
      { value: 'n1-standard-2', label: 'n1-standard-2 (2 vCPU, 7.5 GB RAM)' },
      { value: 'n1-standard-4', label: 'n1-standard-4 (4 vCPU, 15 GB RAM)' }
    ],
    description: 'Machine type for instances created from this template'
  },
  {
    key: 'region',
    label: 'Region',
    type: 'select',
    required: true,
    defaultValue: 'us-central1',
    options: [
      { value: 'us-central1', label: 'us-central1 (Iowa)' },
      { value: 'us-east1', label: 'us-east1 (South Carolina)' },
      { value: 'us-west1', label: 'us-west1 (Oregon)' },
      { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
      { value: 'asia-east1', label: 'asia-east1 (Taiwan)' }
    ],
    description: 'Region for the template (instance groups will use zones in this region)'
  },
  {
    key: 'disk',
    label: 'Boot Disk',
    type: 'group',
    description: 'Boot disk configuration',
    fields: [
      {
        key: 'size_gb',
        label: 'Disk Size (GB)',
        type: 'number',
        defaultValue: 20,
        description: 'Size of the boot disk in GB'
      },
      {
        key: 'type',
        label: 'Disk Type',
        type: 'select',
        defaultValue: 'pd-standard',
        options: [
          { value: 'pd-standard', label: 'Standard persistent disk' },
          { value: 'pd-ssd', label: 'SSD persistent disk' },
          { value: 'pd-balanced', label: 'Balanced persistent disk' }
        ],
        description: 'Type of the boot disk'
      },
      {
        key: 'auto_delete',
        label: 'Auto Delete',
        type: 'boolean',
        defaultValue: true,
        description: 'Whether to delete the disk when instance is deleted'
      }
    ]
  },
  {
    key: 'image',
    label: 'Boot Image',
    type: 'group',
    required: true,
    description: 'Source image for the boot disk',
    fields: [
      {
        key: 'project',
        label: 'Image Project',
        type: 'text',
        required: true,
        defaultValue: 'ubuntu-os-cloud',
        placeholder: 'ubuntu-os-cloud',
        description: 'Project containing the image'
      },
      {
        key: 'family',
        label: 'Image Family',
        type: 'text',
        required: true,
        defaultValue: 'ubuntu-2004-lts',
        placeholder: 'ubuntu-2004-lts',
        description: 'Image family name'
      }
    ]
  },
  {
    key: 'network_interface',
    label: 'Network Interface',
    type: 'group',
    description: 'Network configuration',
    fields: [
      {
        key: 'network',
        label: 'Network',
        type: 'text',
        required: true,
        defaultValue: 'default',
        placeholder: 'default',
        description: 'VPC network name'
      },
      {
        key: 'subnetwork',
        label: 'Subnetwork',
        type: 'text',
        placeholder: 'default',
        description: 'Subnetwork name (optional for auto-mode VPCs)'
      },
      {
        key: 'access_config',
        label: 'External IP',
        type: 'boolean',
        defaultValue: true,
        description: 'Whether to assign an external IP address'
      }
    ]
  },
  {
    key: 'tags',
    label: 'Network Tags',
    type: 'text',
    placeholder: 'web-server,http-server',
    description: 'Network tags for firewall rules (comma-separated)'
  },
  {
    key: 'metadata',
    label: 'Metadata',
    type: 'group',
    description: 'Instance metadata',
    fields: [
      {
        key: 'startup_script',
        label: 'Startup Script',
        type: 'text',
        placeholder: '#!/bin/bash\napt-get update',
        description: 'Startup script to run when instance boots'
      },
      {
        key: 'ssh_keys',
        label: 'SSH Keys',
        type: 'text',
        placeholder: 'user:ssh-rsa AAAAB3Nza...',
        description: 'SSH public keys for instance access'
      }
    ]
  },
  {
    key: 'service_account',
    label: 'Service Account',
    type: 'group',
    description: 'Service account configuration',
    fields: [
      {
        key: 'email',
        label: 'Service Account Email',
        type: 'text',
        placeholder: 'default',
        description: 'Service account email (use "default" for default service account)'
      },
      {
        key: 'scopes',
        label: 'OAuth Scopes',
        type: 'text',
        defaultValue: 'cloud-platform',
        placeholder: 'cloud-platform,storage-ro',
        description: 'OAuth scopes for the service account (comma-separated)'
      }
    ]
  },
  {
    key: 'labels',
    label: 'Labels',
    type: 'group',
    description: 'Labels for the instances',
    fields: [
      {
        key: 'environment',
        label: 'Environment',
        type: 'select',
        options: [
          { value: 'dev', label: 'Development' },
          { value: 'staging', label: 'Staging' },
          { value: 'prod', label: 'Production' }
        ]
      },
      {
        key: 'team',
        label: 'Team',
        type: 'text',
        placeholder: 'backend'
      }
    ]
  }
];
