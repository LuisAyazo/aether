import React from 'react';
import { NodeProps } from 'reactflow';
import BaseResourceNode from './BaseResourceNode';

// Iconos para AWS
const EC2Icon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.5 6.5L17.5 10.5L13.5 14.5V11.5H10V13.5L6 9.5L10 5.5V7.5H13.5V6.5Z" fill="#FF9900"/>
    <rect x="4" y="4" width="16" height="16" rx="2" stroke="#FF9900" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const S3Icon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 15.5V8.5C5 7.4 5.9 6.5 7 6.5H17C18.1 6.5 19 7.4 19 8.5V15.5C19 16.6 18.1 17.5 17 17.5H7C5.9 17.5 5 16.6 5 15.5Z" fill="#FF9900" stroke="#FF9900"/>
    <rect x="8" y="9.5" width="8" height="5" rx="1" fill="white"/>
  </svg>
);

const LambdaIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L20 18H4L12 4Z" fill="#FF9900"/>
    <path d="M12 9L14 14H10L12 9Z" fill="white"/>
  </svg>
);

const RDSIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="7" width="14" height="10" rx="2" fill="#FF9900"/>
    <rect x="7" y="9" width="10" height="6" rx="1" fill="white"/>
    <circle cx="12" cy="12" r="2" fill="#FF9900"/>
  </svg>
);

// Interfaces para los nodos específicos de AWS
interface AwsNodeProps extends NodeProps {
  data: {
    label: string;
    description?: string;
    properties?: Record<string, any>;
  };
}

export function EC2Node(props: AwsNodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'aws',
        icon: <EC2Icon />,
        label: props.data.label || 'EC2 Instance'
      }}
    />
  );
}

export function S3BucketNode(props: AwsNodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'aws',
        icon: <S3Icon />,
        label: props.data.label || 'S3 Bucket'
      }}
    />
  );
}

export function LambdaFunctionNode(props: AwsNodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'aws',
        icon: <LambdaIcon />,
        label: props.data.label || 'Lambda Function'
      }}
    />
  );
}

export function RDSInstanceNode(props: AwsNodeProps) {
  return (
    <BaseResourceNode
      {...props}
      data={{
        ...props.data,
        provider: 'aws',
        icon: <RDSIcon />,
        label: props.data.label || 'RDS Instance'
      }}
    />
  );
}