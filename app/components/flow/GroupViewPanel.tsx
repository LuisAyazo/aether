import { useState } from 'react';
import { 
  ServerIcon, 
  CloudIcon, 
  CircleStackIcon, 
  CodeBracketIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

interface GroupViewPanelProps {
  onAddNode: (type: string, data: any) => void;
}

export default function GroupViewPanel({ onAddNode }: GroupViewPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  const components = [
    {
      type: 'ec2',
      name: 'EC2 Instance',
      description: 'Virtual server in the cloud',
      provider: 'aws',
      icon: <ServerIcon className="w-5 h-5 text-orange-600" />
    },
    {
      type: 'lambda',
      name: 'Lambda Function',
      description: 'Serverless compute service',
      provider: 'aws',
      icon: <CodeBracketIcon className="w-5 h-5 text-orange-600" />
    },
    {
      type: 's3',
      name: 'S3 Bucket',
      description: 'Object storage service',
      provider: 'aws',
      icon: <CloudIcon className="w-5 h-5 text-orange-600" />
    },
    {
      type: 'rds',
      name: 'RDS Database',
      description: 'Managed relational database service',
      provider: 'aws',
      icon: <CircleStackIcon className="w-5 h-5 text-orange-600" />
    },
    {
      type: 'compute',
      name: 'Compute Engine',
      description: 'Virtual machines on Google Cloud',
      provider: 'gcp',
      icon: <ServerIcon className="w-5 h-5 text-blue-600" />
    },
    {
      type: 'generic',
      name: 'Generic Component',
      description: 'Custom component',
      provider: 'generic',
      icon: <CpuChipIcon className="w-5 h-5 text-gray-600" />
    },
  ];

  return (
    <div className={`p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${isOpen ? 'h-[120px]' : 'h-10'}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Componentes disponibles</h3>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {isOpen ? '▼ Ocultar' : '▲ Mostrar'}
        </button>
      </div>
      
      {isOpen && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {components.map((component) => (
            <button
              key={component.type}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 flex flex-col items-center gap-1 min-w-[80px] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => onAddNode(component.type, component)}
              title={component.description}
            >
              <div className={`p-1 rounded-md ${component.provider === 'aws' ? 'bg-orange-50 dark:bg-orange-900/30' : component.provider === 'gcp' ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {component.icon}
              </div>
              <span className="text-xs truncate max-w-full">{component.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
