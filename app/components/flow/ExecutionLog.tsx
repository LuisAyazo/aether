import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ExecutionLogProps {
  isVisible: boolean;
  logs: string[];
  onClose: () => void;
  previewData?: {
    resourcesToCreate: Array<{
      id: string;
      type: string | undefined;
      name: string;
      provider: string;
      changes: {
        create?: boolean;
        properties: Record<string, unknown>;
      };
    }>;
    resourcesToUpdate: Array<{
      id: string;
      type: string | undefined;
      name: string;
      provider: string;
      changes: {
        create?: boolean;
        update?: boolean;
        properties: Record<string, unknown>;
      };
    }>;
    resourcesToDelete: Array<{
      id: string;
      type: string | undefined;
      name: string;
      provider: string;
    }>;
  } | null;
}

interface LogEntry {
  message: string;
  timestamp: number;
  status: 'processing' | 'success' | 'error' | 'info';
  duration?: number;
  action?: 'create' | 'update' | 'delete';
}

const ExecutionLog: React.FC<ExecutionLogProps> = ({ isVisible, logs, onClose, previewData }) => {
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [processedLogs, setProcessedLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const newProcessedLogs = logs.map((log, index) => {
      const timestamp = Date.now() - (logs.length - index) * 1000;
      let status: LogEntry['status'] = 'info';
      let duration: number | undefined;
      let action: LogEntry['action'] | undefined;

      if (log.includes('Error')) {
        status = 'error';
      } else if (log.includes('exitosamente')) {
        status = 'success';
        duration = 1500;
      } else if (log.includes('Procesando')) {
        status = 'processing';
        if (log.includes('create')) action = 'create';
        else if (log.includes('update')) action = 'update';
        else if (log.includes('delete')) action = 'delete';
      }

      return {
        message: log.replace(/Procesando (create|update|delete)/, (_, action) => {
          switch (action) {
            case 'create': return 'Creando';
            case 'update': return 'Actualizando';
            case 'delete': return 'Eliminando';
            default: return 'Procesando';
          }
        }),
        timestamp,
        status,
        duration,
        action
      };
    });

    setProcessedLogs(newProcessedLogs);
  }, [logs]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (duration: number) => {
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'create': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'update': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'delete': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const toggleResourceExpansion = (resourceId: string) => {
    setExpandedResources(prev => ({
      ...prev,
      [resourceId]: !prev[resourceId]
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200" style={{ width: '420px' }}>
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
            <span className="text-lg text-gray-600">📋</span>
          </div>
          <div>
            <h3 className="text-base font-medium text-gray-900">Logs de Ejecución</h3>
            <p className="text-xs text-gray-500">Seguimiento de operaciones</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight: 'calc(100vh - 64px)' }}
      >
        {processedLogs.map((log, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border text-sm transition-all duration-200 ${
              log.status === 'error' 
                ? 'bg-rose-50 border-rose-200' 
                : log.status === 'success'
                ? 'bg-emerald-50 border-emerald-200'
                : log.status === 'processing'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {log.status === 'error' ? (
                  <span className="text-rose-500">⚠️</span>
                ) : log.status === 'success' ? (
                  <span className="text-emerald-500">✓</span>
                ) : log.status === 'processing' ? (
                  <span className="text-blue-500 animate-spin">⟳</span>
                ) : (
                  <span className="text-gray-500">•</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    {log.action && (
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${getActionColor(log.action)}`}>
                        {log.action === 'create' ? 'Creando' :
                         log.action === 'update' ? 'Actualizando' :
                         log.action === 'delete' ? 'Eliminando' : 'Procesando'}
                      </span>
                    )}
                  </div>
                  {log.duration && (
                    <span className="text-xs font-medium text-gray-500">
                      {formatDuration(log.duration)}
                    </span>
                  )}
                </div>
                <p className={`text-sm whitespace-pre-wrap ${
                  log.status === 'error' 
                    ? 'text-rose-700' 
                    : log.status === 'success'
                    ? 'text-emerald-700'
                    : log.status === 'processing'
                    ? 'text-blue-700'
                    : 'text-gray-700'
                }`}>
                  {log.message}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExecutionLog;