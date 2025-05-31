import { FieldConfig } from '../../../../../types/resourceConfig';

export const diskFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Disk Name',
    type: 'text',
    required: true,
    placeholder: 'my-disk',
    description: 'Name of the persistent disk'
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
    label: 'Zone',
    type: 'select',
    required: true,
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
    description: 'The zone where the disk will be created'
  },
  {
    key: 'size',
    label: 'Size (GB)',
    type: 'number',
    required: true,
    defaultValue: 10,
    description: 'Size of the disk in gigabytes'
  },
  {
    key: 'type',
    label: 'Disk Type',
    type: 'select',
    required: true,
    defaultValue: 'pd-standard',
    options: [
      { value: 'pd-standard', label: 'Standard persistent disk' },
      { value: 'pd-ssd', label: 'SSD persistent disk' },
      { value: 'pd-balanced', label: 'Balanced persistent disk' },
      { value: 'pd-extreme', label: 'Extreme persistent disk' }
    ],
    description: 'Type of the persistent disk'
  },
  {
    key: 'image',
    label: 'Source Image (Optional)',
    type: 'group',
    description: 'Source image to create the disk from',
    fields: [
      {
        key: 'project',
        label: 'Image Project',
        type: 'text',
        placeholder: 'ubuntu-os-cloud',
        description: 'Project containing the image'
      },
      {
        key: 'family',
        label: 'Image Family',
        type: 'text',
        placeholder: 'ubuntu-2004-lts',
        description: 'Image family name'
      },
      {
        key: 'name',
        label: 'Specific Image Name',
        type: 'text',
        placeholder: 'ubuntu-2004-focal-v20231101',
        description: 'Specific image name (optional if family is specified)'
      }
    ]
  },
  {
    key: 'snapshot',
    label: 'Source Snapshot (Optional)',
    type: 'text',
    placeholder: 'my-snapshot',
    description: 'Name of the snapshot to create the disk from'
  },
  {
    key: 'labels',
    label: 'Labels',
    type: 'group',
    description: 'Labels to assign to the disk',
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
