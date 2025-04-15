import { useState, useCallback } from 'react';
import { 
  ServerIcon, 
  CloudIcon, 
  CircleStackIcon, 
  CodeBracketIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  QueueListIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface GroupViewPanelProps {
  onAddNode: (type: string, data: any) => void;
}

export default function GroupViewPanel({ onAddNode }: GroupViewPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('aws'); // Por defecto mostrar AWS

  const categories = [
    { id: 'aws', name: 'AWS', color: 'orange' },
    { id: 'gcp', name: 'GCP', color: 'blue' },
    { id: 'azure', name: 'Azure', color: 'lightblue' },
    { id: 'generic', name: 'General', color: 'gray' }
  ];
  
  // Lista completa de componentes
  const components = [
    // Componentes AWS completos
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
      type: 'dynamodb',
      name: 'DynamoDB',
      description: 'NoSQL database service',
      provider: 'aws',
      icon: <QueueListIcon className="w-5 h-5 text-orange-600" />
    },
    {
      type: 'iam',
      name: 'IAM Role',
      description: 'Identity and access management',
      provider: 'aws',
      icon: <ShieldCheckIcon className="w-5 h-5 text-orange-600" />
    },
    {
      type: 'cloudformation',
      name: 'CloudFormation',
      description: 'Infrastructure as code',
      provider: 'aws',
      icon: <DocumentTextIcon className="w-5 h-5 text-orange-600" />
    },
    // Componentes GCP 
    {
      type: 'compute',
      name: 'Compute Engine',
      description: 'Virtual machines on Google Cloud',
      provider: 'gcp',
      icon: <ServerIcon className="w-5 h-5 text-blue-600" />
    },
    {
      type: 'cloudfunction',
      name: 'Cloud Function',
      description: 'Serverless execution environment on GCP',
      provider: 'gcp',
      icon: <CodeBracketIcon className="w-5 h-5 text-blue-600" />
    },
    {
      type: 'storage',
      name: 'Cloud Storage',
      description: 'Object storage for Google Cloud',
      provider: 'gcp',
      icon: <CloudIcon className="w-5 h-5 text-blue-600" />
    },
    {
      type: 'bigquery',
      name: 'BigQuery',
      description: 'Serverless data warehouse',
      provider: 'gcp',
      icon: <CircleStackIcon className="w-5 h-5 text-blue-600" />
    },
    // Componentes Azure
    {
      type: 'vm',
      name: 'Azure VM',
      description: 'Virtual machines on Azure',
      provider: 'azure',
      icon: <ServerIcon className="w-5 h-5 text-blue-400" />
    },
    {
      type: 'function',
      name: 'Azure Function',
      description: 'Serverless compute service on Azure',
      provider: 'azure',
      icon: <CodeBracketIcon className="w-5 h-5 text-blue-400" />
    },
    {
      type: 'blob',
      name: 'Blob Storage',
      description: 'Object storage for Azure',
      provider: 'azure',
      icon: <CloudIcon className="w-5 h-5 text-blue-400" />
    },
    {
      type: 'cosmos',
      name: 'Cosmos DB',
      description: 'Globally distributed database service',
      provider: 'azure',
      icon: <CircleStackIcon className="w-5 h-5 text-blue-400" />
    },
    // Componente genérico
    {
      type: 'generic',
      name: 'Generic Component',
      description: 'Custom component',
      provider: 'generic',
      icon: <CpuChipIcon className="w-5 h-5 text-gray-600" />
    }
  ];

  // Filtrar componentes por búsqueda y categoría
  const filteredComponents = components.filter(component => {
    // Filtrar por término de búsqueda
    const matchesSearch = searchTerm === '' || 
      component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      component.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrar por categoría seleccionada
    const matchesCategory = !selectedCategory || component.provider === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Función para manejar el drag & drop sin error de circularidad
  const handleDragStart = (e: React.DragEvent, component: any) => {
    // Crear un objeto plano sin referencias circulares
    const transferData = {
      type: component.type,
      name: component.name,
      description: component.description,
      provider: component.provider
    };
    
    e.dataTransfer.setData('application/reactflow', JSON.stringify(transferData));
    e.dataTransfer.effectAllowed = 'move';
  };

  // Nuevo diseño con barra lateral
  return (
    <div className={`fixed top-0 bottom-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-l border-gray-200 dark:border-gray-700 transition-all duration-300 z-10 ${isOpen ? 'w-64' : 'w-12'}`}>
      {/* Botón para abrir/cerrar panel */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-1/2 -left-3 transform -translate-y-1/2 h-24 w-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-l-md flex items-center justify-center shadow-md"
        title={isOpen ? "Contraer panel" : "Expandir panel"}
      >
        {isOpen ? 
          <ChevronRightIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" /> : 
          <ChevronLeftIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />}
      </button>
      
      {/* Contenido del panel */}
      <div className={`h-full flex flex-col ${isOpen ? 'p-3' : 'p-0'}`}>
        {isOpen && (
          <>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">Componentes</h3>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full p-1.5 pl-8 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            
            {/* Pestañas de categorías */}
            <div className="flex space-x-1 mb-3 overflow-x-auto pb-1">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`px-2 py-1 text-xs rounded-md whitespace-nowrap ${
                    selectedCategory === category.id 
                      ? category.id === 'aws' ? 'bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-200' 
                      : category.id === 'gcp' ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200' 
                      : category.id === 'azure' ? 'bg-sky-100 border-sky-400 text-sky-800 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-200'
                      : 'bg-gray-200 border-gray-400 text-gray-800 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200'
                      : 'bg-gray-100 border border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                  }`}
                  onClick={() => setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            {/* Lista de componentes */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-2">
                {filteredComponents.map((component) => (
                  <div
                    key={`${component.provider}-${component.type}`}
                    className="p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-grab"
                    onClick={() => onAddNode(component.type, component)}
                    title={component.description}
                    draggable
                    onDragStart={(e) => handleDragStart(e, component)}
                  >
                    <div className={`p-1.5 rounded-md shadow-sm ${
                      component.provider === 'aws' 
                        ? 'bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800' 
                        : component.provider === 'gcp' 
                          ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' 
                          : component.provider === 'azure'
                            ? 'bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800'
                            : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                    }`}>
                      {component.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{component.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{component.description}</p>
                    </div>
                  </div>
                ))}
                
                {filteredComponents.length === 0 && (
                  <div className="flex items-center justify-center h-20 text-gray-500 dark:text-gray-400 text-sm">
                    No se encontraron componentes.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Versión mínima (solo íconos) cuando está contraído */}
        {!isOpen && (
          <div className="flex flex-col items-center py-2 space-y-3">
            {categories.map(category => (
              <button
                key={category.id}
                className={`w-8 h-8 rounded-md flex items-center justify-center ${
                  selectedCategory === category.id 
                    ? category.id === 'aws' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' 
                    : category.id === 'gcp' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                    : category.id === 'azure' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                    : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => {
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  );
                  setIsOpen(true); // Abrir automáticamente al seleccionar categoría
                }}
                title={category.name}
              >
                {category.id === 'aws' ? 'A' : 
                 category.id === 'gcp' ? 'G' : 
                 category.id === 'azure' ? 'Az' : '⚙️'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
