import { FieldConfig } from '../../../../../types/resourceConfig';

export const instanceFields: FieldConfig[] = [
  {
    key: 'name',
    label: 'Instance Name',
    type: 'text',
    required: true,
    placeholder: 'my-instance',
    description: 'Name for the compute instance'
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
    defaultValue: 'us-central1-a',
    options: [
      { value: 'us-central1-a', label: 'us-central1-a (Iowa)' },
      { value: 'us-central1-b', label: 'us-central1-b (Iowa)' },
      { value: 'us-central1-c', label: 'us-central1-c (Iowa)' },
      { value: 'us-east1-a', label: 'us-east1-a (South Carolina)' },
      { value: 'us-east1-b', label: 'us-east1-b (South Carolina)' },
      { value: 'us-east1-c', label: 'us-east1-c (South Carolina)' },
      { value: 'us-west1-a', label: 'us-west1-a (Oregon)' },
      { value: 'us-west1-b', label: 'us-west1-b (Oregon)' },
      { value: 'us-west1-c', label: 'us-west1-c (Oregon)' },
      { value: 'europe-west1-a', label: 'europe-west1-a (Belgium)' },
      { value: 'europe-west1-b', label: 'europe-west1-b (Belgium)' },
      { value: 'europe-west1-c', label: 'europe-west1-c (Belgium)' },
      { value: 'asia-east1-a', label: 'asia-east1-a (Taiwan)' },
      { value: 'asia-east1-b', label: 'asia-east1-b (Taiwan)' },
      { value: 'asia-east1-c', label: 'asia-east1-c (Taiwan)' }
    ],
    description: 'Zone where the instance will be created'
  },
  {
    key: 'machine_type',
    label: 'Machine Type',
    type: 'select',
    required: true,
    defaultValue: 'e2-micro',
    options: [
      { value: 'e2-micro', label: 'e2-micro (2 vCPU shared, 1 GB RAM)' },
      { value: 'e2-small', label: 'e2-small (2 vCPU shared, 2 GB RAM)' },
      { value: 'e2-medium', label: 'e2-medium (1 vCPU, 4 GB RAM)' },
      { value: 'e2-standard-2', label: 'e2-standard-2 (2 vCPU, 8 GB RAM)' },
      { value: 'e2-standard-4', label: 'e2-standard-4 (4 vCPU, 16 GB RAM)' },
      { value: 'n2-standard-2', label: 'n2-standard-2 (2 vCPU, 8 GB RAM)' },
      { value: 'n2-standard-4', label: 'n2-standard-4 (4 vCPU, 16 GB RAM)' },
      { value: 'n2-standard-8', label: 'n2-standard-8 (8 vCPU, 32 GB RAM)' }
    ],
    description: 'Machine type defining CPU and memory'
  },
  {
    key: 'image',
    label: 'Boot Disk Image',
    type: 'select',
    required: true,
    defaultValue: 'debian-cloud/debian-11',
    options: [
      { value: 'debian-cloud/debian-11', label: 'Debian 11' },
      { value: 'debian-cloud/debian-12', label: 'Debian 12' },
      { value: 'ubuntu-os-cloud/ubuntu-2004-lts', label: 'Ubuntu 20.04 LTS' },
      { value: 'ubuntu-os-cloud/ubuntu-2204-lts', label: 'Ubuntu 22.04 LTS' },
      { value: 'centos-cloud/centos-7', label: 'CentOS 7' },
      { value: 'centos-cloud/centos-stream-8', label: 'CentOS Stream 8' },
      { value: 'rhel-cloud/rhel-8', label: 'Red Hat Enterprise Linux 8' },
      { value: 'windows-cloud/windows-2019', label: 'Windows Server 2019' },
      { value: 'windows-cloud/windows-2022', label: 'Windows Server 2022' }
    ],
    description: 'Operating system image for the boot disk'
  },
  {
    key: 'disk_size',
    label: 'Boot Disk Size (GB)',
    type: 'number',
    defaultValue: 20,
    min: 10,
    max: 65536,
    description: 'Size of the boot disk in gigabytes'
  },
  {
    key: 'disk_type',
    label: 'Boot Disk Type',
    type: 'select',
    defaultValue: 'pd-standard',
    options: [
      { value: 'pd-standard', label: 'Standard HDD (Lower cost)' },
      { value: 'pd-balanced', label: 'Balanced SSD (Balanced performance)' },
      { value: 'pd-ssd', label: 'SSD (Higher performance)' }
    ],
    description: 'Type of storage for the boot disk'
  },
  {
    key: 'network',
    label: 'Network',
    type: 'text',
    defaultValue: 'default',
    placeholder: 'default',
    description: 'VPC network for the instance'
  },
  {
    key: 'subnetwork',
    label: 'Subnetwork',
    type: 'text',
    placeholder: 'projects/{project}/regions/{region}/subnetworks/default',
    description: 'Specific subnetwork (optional for default network)'
  },
  {
    key: 'external_ip',
    label: 'External IP',
    type: 'boolean',
    defaultValue: true,
    description: 'Assign an external IP address'
  },
  {
    key: 'allow_stopping_for_update',
    label: 'Allow Stopping for Update',
    type: 'boolean',
    defaultValue: true,
    description: 'Allow the instance to be stopped for updates'
  },
  {
    key: 'tags',
    label: 'Network Tags',
    type: 'text',
    placeholder: 'web-server, database',
    description: 'Network tags for firewall rules (comma-separated)'
  },
  {
    key: 'preemptible',
    label: 'Preemptible Instance',
    type: 'boolean',
    defaultValue: false,
    description: 'Low-cost instance that can be terminated at any time'
  },
  {
    key: 'automatic_restart',
    label: 'Automatic Restart',
    type: 'boolean',
    defaultValue: true,
    description: 'Restart automatically if the instance fails'
  },
  {
    key: 'deletion_protection',
    label: 'Deletion Protection',
    type: 'boolean',
    defaultValue: false,
    description: 'Prevent accidental deletion of the instance'
  },
  {
    key: 'startup_script',
    label: 'Startup Script',
    type: 'text',
    placeholder: '#!/bin/bash\necho "Hello World" > /tmp/startup.log',
    description: 'Script that runs when the instance starts'
  },
  {
    key: 'service_account_email',
    label: 'Service Account Email',
    type: 'text',
    placeholder: 'service-account@project.iam.gserviceaccount.com',
    description: 'Service account for authentication (optional)'
  },
  {
    key: 'service_account_scopes',
    label: 'Service Account Scopes',
    type: 'select',
    defaultValue: 'https://www.googleapis.com/auth/cloud-platform',
    options: [
      { value: 'https://www.googleapis.com/auth/cloud-platform', label: 'Full access to Cloud Platform' },
      { value: 'https://www.googleapis.com/auth/compute', label: 'Compute Engine only' },
      { value: 'https://www.googleapis.com/auth/devstorage.read_only', label: 'Storage read-only' },
      { value: 'https://www.googleapis.com/auth/logging.write', label: 'Logging write' },
      { value: 'https://www.googleapis.com/auth/monitoring.write', label: 'Monitoring write' }
    ],
    description: 'Access permissions to Google Cloud APIs'
  },
  {
    key: 'description',
    label: 'Description',
    type: 'text',
    placeholder: 'Instance description...',
    description: 'Optional description of the instance'
  }
];
