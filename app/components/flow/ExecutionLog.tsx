import React from 'react';
import { NodeExecutionState } from '../../utils/customTypes';

interface ExecutionLogProps {
  isVisible: boolean;
  logs: Array<{
    nodeId: string;
    nodeName: string;
    state: NodeExecutionState;
    message: string;
    timestamp: number;
  }>;
  onClose: () => void;
}

const getStateColor = (state: NodeExecutionState): string => {
  switch (state) {
    case 'creating':
      return 'text-green-600';
    case 'updating':
      return 'text-orange-600';
    case 'deleting':
      return 'text-red-600';
    case 'success':
      return 'text-green-600';
    case 'error':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

const getStateIcon = (state: NodeExecutionState): string => {
  switch (state) {
    case 'creating':
      return '🟢';
    case 'updating':
      return '🟠';
    case 'deleting':
      return '🔴';
    case 'success':
      return '✅';
    case 'error':
      return '❌';
    default:
      return '⏳';
  }
};

const ExecutionLog: React.FC<ExecutionLogProps> = ({ isVisible, logs, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg transform transition-transform duration-300 ease-in-out"
         style={{ maxHeight: '40vh', overflowY: 'auto' }}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Log de Ejecución</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-2">
          {logs.map((log, index) => (
            <div
              key={`${log.nodeId}-${index}`}
              className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded"
            >
              <span className="text-lg">{getStateIcon(log.state)}</span>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium">{log.nodeName}</span>
                  <span className={`text-sm ${getStateColor(log.state)}`}>
                    {log.state}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{log.message}</p>
                <span className="text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExecutionLog; 