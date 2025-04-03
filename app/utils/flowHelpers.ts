import { Node } from 'reactflow';

export const getNodeColorByProvider = (node: Node): string => {
  switch (node.data?.provider) {
    case 'aws': return '#f97316';
    case 'gcp': return '#3b82f6';
    case 'azure': return '#0ea5e9';
    default: return '#94a3b8';
  }
};
