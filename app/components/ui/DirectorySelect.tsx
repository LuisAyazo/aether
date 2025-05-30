import { useState } from 'react';
import EnvironmentTreeSelect from './EnvironmentTreeSelect';
import { Environment } from '../../services/diagramService';

interface DirectorySelectProps {
  environments: Environment[];
  value?: string;
  onChange: (directory: string) => void;
  onCreateDirectory?: (directoryName: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DirectorySelect({
  environments,
  value,
  onChange,
  onCreateDirectory,
  placeholder = 'Selecciona un directorio',
  className
}: DirectorySelectProps) {
  const [availableDirectories] = useState<string[]>([
    'desarrollo',
    'pruebas', 
    'producción',
    'otros'
  ]);

  // Handle directory creation
  const handleCreateDirectory = (directoryName: string) => {
    if (onCreateDirectory) {
      onCreateDirectory(directoryName);
    }
    // You might want to update availableDirectories here or handle it in the parent component
  };

  return (
    <div className={className}>
      <EnvironmentTreeSelect
        environments={environments}
        value=""
        onChange={() => {}} // Not used in directory mode
        mode="directory"
        selectedDirectory={value}
        onDirectoryChange={onChange}
        onCreateDirectory={handleCreateDirectory}
        placeholder={placeholder}
      />
    </div>
  );
}
