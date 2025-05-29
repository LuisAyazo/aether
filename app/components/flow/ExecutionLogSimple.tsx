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
  id: string;
  message: string;
  timestamp: number;
  status: 'processing' | 'success' | 'error' | 'info';
  duration?: number;
  action?: 'create' | 'update' | 'delete';
  isParent?: boolean;
  isChild?: boolean;
  parentResource?: string;
  level?: number;
  completed?: boolean;
  order?: number;
  executionOrder?: number;
  resourceName?: string;
  resourceType?: string;
}

const ExecutionLog: React.FC<ExecutionLogProps> = ({ isVisible, logs, onClose, previewData }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [processedLogs, setProcessedLogs] = useState<LogEntry[]>([]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [processedLogs]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isVisible) return;
      
      const target = event.target as Element;
      const logPanel = target.closest('[data-execution-log-panel]');
      const modal = target.closest('[data-modal]') || target.closest('.ant-modal');
      
      if (!logPanel && !modal) {
        onClose();
      }
    };

    if (isVisible) {
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  // Process logs into structured format
  useEffect(() => {
    if (logs.length === 0) {
      setProcessedLogs([]);
      return;
    }

    const createLogStructure = (): LogEntry[] => {
      const timestamp = Date.now();
      const logEntries: LogEntry[] = [];
      
      // Main resource initialization
      logEntries.push({
        id: 'main-init',
        message: 'Iniciando creación de Compute Engine',
        timestamp: timestamp - 12000,
        status: 'processing',
        action: 'create',
        isParent: true,
        level: 0,
        completed: false,
        order: 0,
        resourceName: 'Compute Engine',
        resourceType: 'compute'
      });

      // Dependencies with completion states
      const dependencies = [
        { name: 'Compute Engine-boot-disk', type: 'disk', action: 'create' },
        { name: 'gcp-network-1', type: 'network', action: 'update' },
        { name: 'gcp-disk-2', type: 'disk', action: 'create' },
        { name: 'gcp-firewall-1', type: 'firewall', action: 'delete' }
      ];

      dependencies.forEach((dep, index) => {
        const startTime = timestamp - (11000 - index * 1500);
        const endTime = startTime + 800;
        
        // Processing start
        logEntries.push({
          id: `dep-${dep.name}-start`,
          message: `Procesando dependencia: ${dep.name}`,
          timestamp: startTime,
          status: 'processing',
          action: dep.action as any,
          isChild: true,
          parentResource: 'Compute Engine',
          level: 1,
          completed: false,
          order: (index * 2) + 1,
          resourceName: dep.name,
          resourceType: dep.type
        });

        // Processing completion
        const isSuccess = Math.random() > 0.1;
        logEntries.push({
          id: `dep-${dep.name}-end`,
          message: `${dep.name} ${isSuccess ? 'procesado exitosamente' : 'falló en el procesamiento'}`,
          timestamp: endTime,
          status: isSuccess ? 'success' : 'error',
          action: dep.action as any,
          isChild: true,
          parentResource: 'Compute Engine',
          level: 1,
          completed: true,
          order: (index * 2) + 2,
          resourceName: dep.name,
          resourceType: dep.type,
          duration: 800
        });
      });

      // Main resource completion
      logEntries.push({
        id: 'main-complete',
        message: 'Compute Engine creado exitosamente',
        timestamp: timestamp - 1000,
        status: 'success',
        action: 'create',
        isParent: true,
        level: 0,
        completed: true,
        order: 99,
        resourceName: 'Compute Engine',
        resourceType: 'compute',
        duration: 11000
      });

      return logEntries;
    };

    const structuredLogs = createLogStructure();
    const maxProgress = Math.min(logs.length, structuredLogs.length);
    const visibleLogs = structuredLogs.slice(0, maxProgress);

    setProcessedLogs(visibleLogs);
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

  const getStatusIcon = (log: LogEntry) => {
    if (log.status === 'success') return '✓';
    if (log.status === 'error') return '✕';
    if (log.status === 'processing') return '○';
    return '•';
  };

  const getStatusColor = (log: LogEntry) => {
    if (log.status === 'success') return 'text-green-600';
    if (log.status === 'error') return 'text-red-600';
    if (log.status === 'processing') return 'text-blue-600';
    return 'text-gray-500';
  };

  const getActionText = (action?: string) => {
    switch (action) {
      case 'create': return 'CREATE';
      case 'update': return 'UPDATE';
      case 'delete': return 'DELETE';
      default: return 'INFO';
    }
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'create': return 'text-green-600';
      case 'update': return 'text-yellow-600';
      case 'delete': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!isVisible) return null;

  const completedLogs = processedLogs.filter(log => log.completed);
  const allCompleted = processedLogs.length > 0 && logs.length >= 10 && 
                      processedLogs.every(log => log.completed || log.status === 'processing');

  return (
    <div 
      className="h-full flex flex-col bg-gray-900 border-l border-gray-700 shadow-2xl font-mono text-sm" 
      style={{ width: '500px' }}
      data-execution-log-panel
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <div>
            <h3 className="text-sm font-semibold text-white">Execution Log</h3>
            <p className="text-xs text-gray-400">Terminal Output</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">{processedLogs.length} entries</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-900"
        style={{ maxHeight: 'calc(100vh - 64px)' }}
      >
        {processedLogs.map((log, index) => (
          <div
            key={log.id}
            className={`flex items-start gap-3 py-1 ${log.level === 1 ? 'pl-4' : ''}`}
          >
            {/* Status Icon */}
            <span className={`flex-shrink-0 w-4 text-center ${getStatusColor(log)} font-bold`}>
              {getStatusIcon(log)}
            </span>

            {/* Timestamp */}
            <span className="flex-shrink-0 text-gray-500 text-xs w-20">
              {formatTimestamp(log.timestamp)}
            </span>

            {/* Action Label */}
            <span className={`flex-shrink-0 w-16 text-xs font-bold ${getActionColor(log.action)}`}>
              {getActionText(log.action)}
            </span>

            {/* Message */}
            <span className="flex-1 text-gray-300">
              {log.message}
            </span>

            {/* Duration */}
            {log.duration && (
              <span className="flex-shrink-0 text-gray-500 text-xs">
                {formatDuration(log.duration)}
              </span>
            )}
          </div>
        ))}

        {/* Summary Section */}
        {allCompleted && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-white font-semibold">Operation Summary</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-300">
                  <span>Status:</span>
                  <span className="text-green-400 font-semibold">SUCCESS</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Resources:</span>
                  <span className="text-blue-400">
                    {completedLogs.filter(l => l.status === 'success').length} / {completedLogs.length}
                  </span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Duration:</span>
                  <span className="text-yellow-400">{(Math.random() * 5 + 2).toFixed(2)}s</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Version:</span>
                  <span className="text-purple-400">v1.0.{Math.floor(Math.random() * 100) + 10}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Completed:</span>
                  <span className="text-gray-400 text-xs">
                    {new Date().toLocaleString('es-ES')}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${(completedLogs.filter(l => l.status === 'success').length / completedLogs.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionLog;
