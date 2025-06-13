import { NodeProps } from 'reactflow';
import { NodeExecutionState } from "../../utils/customTypes";

const getStateColor = (state: NodeExecutionState): string => {
  switch (state) {
    case 'creating':
      return 'bg-green-500';
    case 'updating':
      return 'bg-orange-500';
    case 'deleting':
      return 'bg-red-500';
    case 'success':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const BaseNode: React.FC<NodeProps> = ({ data, selected }) => {
  const executionStatus = data?.executionStatus;
  
  return (
    <div className={`relative ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      {/* Estado de ejecución */}
      {executionStatus && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className={`w-4 h-4 rounded-full ${getStateColor(executionStatus.state)} shadow-lg`} />
        </div>
      )}
      
      {/* Contenido del nodo */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        {/* ... existing node content ... */}
      </div>
    </div>
  );
};

export default BaseNode; 