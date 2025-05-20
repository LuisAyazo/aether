import React from 'react';
import { NodeProps } from 'reactflow';
import BaseResourceNode from './BaseResourceNode';

// Iconos para GCP
const ComputeEngineIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="#4285F4" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" fill="#4285F4"/>
  </svg>
);

const CloudStorageIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 8L12 4L18 8V16L12 20L6 16V8Z" fill="#4285F4"/>
    <path d="M12 12L18 8M12 12L6 8M12 12V20" stroke="white" strokeWidth="1.5"/>
  </svg>
);

const CloudFunctionsIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 12V6L12 12H6V18H12L20 12Z" fill="#4285F4"/>
    <path d="M4 12L8 8V16L4 12Z" fill="#4285F4"/>
  </svg>
);

const CloudSQLIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="7" width="14" height="10" rx="2" fill="#4285F4"/>
    <path d="M8 10H16V14H8V10Z" fill="white"/>
    <path d="M10 12H14" stroke="#4285F4" strokeWidth="1.5"/>
  </svg>
);

// Interfaces para los nodos específicos de GCP
interface GcpNodeProps extends NodeProps {
  data: {
    label: string;
    description?: string;
    properties?: Record<string, any>;
  };
}

export function ComputeEngineNode(props: GcpNodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <ComputeEngineIcon />,
        label: props.data.label || 'Compute Engine',
        resizable: true,
        userResized: false
      }}
    />
  );
}

export function CloudStorageNode(props: GcpNodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <CloudStorageIcon />,
        label: props.data.label || 'Cloud Storage',
        resizable: true,
        userResized: false
      }}
    />
  );
}

export function CloudFunctionsNode(props: GcpNodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <CloudFunctionsIcon />,
        label: props.data.label || 'Cloud Functions',
        resizable: true,
        userResized: false
      }}
    />
  );
}

export function CloudSQLNode(props: GcpNodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'gcp',
        icon: <CloudSQLIcon />,
        label: props.data.label || 'Cloud SQL'
      }}
    />
  );
}