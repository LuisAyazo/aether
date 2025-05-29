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
  childResource?: string;
  level?: number;
  dependencyOf?: string;
  dependencies?: string[];
  completed?: boolean;
  order?: number;
}

const ExecutionLog: React.FC<ExecutionLogProps> = ({ isVisible, logs, onClose, previewData }) => {
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [processedLogs, setProcessedLogs] = useState<LogEntry[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle click outside to close - mejorado para evitar conflictos con modales y stage
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isVisible) return;
      
      const target = event.target as Element;
      const logPanel = target.closest('[data-execution-log-panel]');
      const modal = target.closest('[data-modal]') || target.closest('.ant-modal');
      const reactFlowPane = target.closest('.react-flow__pane');
      const reactFlowStage = target.closest('.react-flow');
      
      // No cerrar si estamos en:
      // - El panel de logs
      // - Un modal
      // - El stage de React Flow
      if (!logPanel && !modal && !reactFlowPane && !reactFlowStage) {
        onClose();
      }
    };

    if (isVisible) {
      // Pequeño delay para evitar cierre inmediato
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

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Procesamiento mejorado de logs con jerarquía padre-hijo y dependencias
  useEffect(() => {
    // Primera pasada: extraer información básica y relaciones
    const firstPass = logs.map((log, index) => {
      const timestamp = Date.now() - (logs.length - index) * 1000;
      const id = `log-${timestamp}-${index}`;
      let status: LogEntry['status'] = 'info';
      let duration: number | undefined;
      let action: LogEntry['action'] | undefined;
      let isParent = false;
      let isChild = false;
      let parentResource = '';
      let childResource = '';
      let level = 0;

      // Detectar relaciones padre-hijo
      if (log.includes('→') || log.includes('->')) {
        const parts = log.split(/→|->/).map(p => p.trim());
        if (parts.length === 2) {
          isChild = true;
          parentResource = parts[0];
          childResource = parts[1];
          level = 1; // Nivel inicial para dependencias
        }
      }

      // Detectar si es un recurso padre
      const nextLog = logs[index + 1];
      if (nextLog && (nextLog.includes('→') || nextLog.includes('->'))) {
        isParent = true;
      }

      if (log.includes('Error')) {
        status = 'error';
      } else if (log.includes('exitosamente') || log.includes('completado')) {
        status = 'success';
        duration = 1500;
      } else if (log.includes('Procesando') || log.includes('Aplicando') || log.includes('Creando') || log.includes('Actualizando') || log.includes('Eliminando')) {
        status = 'processing';
        if (log.includes('crear') || log.includes('Creando')) action = 'create';
        else if (log.includes('actualizar') || log.includes('Actualizando')) action = 'update';
        else if (log.includes('eliminar') || log.includes('Eliminando')) action = 'delete';
      }

      return {
        id,
        message: log,
        timestamp,
        status,
        duration,
        action,
        isParent,
        isChild,
        parentResource,
        childResource,
        level,
        dependencies: [] as string[],
        dependencyOf: undefined as string | undefined,
        completed: status === 'success' || status === 'error',
        order: index
      };
    });

    // Segunda pasada: construir relaciones jerárquicas
    const resourceMap: Record<string, LogEntry> = {};
    const dependencyMap: Record<string, string[]> = {};

    // Identificar recursos y sus dependencias
    firstPass.forEach(log => {
      if (log.isParent) {
        resourceMap[log.message] = log;
        dependencyMap[log.message] = [];
      }
      
      if (log.isChild && log.childResource) {
        if (!dependencyMap[log.parentResource]) {
          dependencyMap[log.parentResource] = [];
        }
        dependencyMap[log.parentResource].push(log.childResource);
      }
    });

    // Asignar dependencias a cada recurso
    firstPass.forEach(log => {
      if (log.isParent && dependencyMap[log.message]) {
        log.dependencies = dependencyMap[log.message];
      }
      if (log.isChild) {
        log.dependencyOf = log.parentResource;
      }
    });

    // Ordenar logs para mostrar primero dependencias y luego padres
    const newProcessedLogs = [...firstPass].sort((a, b) => {
      // Si a es una dependencia y b es un padre, a va primero
      if (a.isChild && b.isParent) return -1;
      // Si a es un padre y b es una dependencia, b va primero
      if (a.isParent && b.isChild) return 1;
      // Si ambos son del mismo tipo, mantener el orden original
      return a.order - b.order;
    });

    // Animar cuando se agregan nuevos logs
    if (newProcessedLogs.length > processedLogs.length) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }

    setProcessedLogs(newProcessedLogs);
  }, [logs, processedLogs.length]);

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
    <>
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes expandLine {
          from {
            height: 0%;
          }
          to {
            height: 100%;
          }
        }
        
        @keyframes expandWidth {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        .log-entry-new {
          animation: slideInFromRight 0.5s ease-out forwards;
        }
        
        .log-entry-processing {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .log-entry-success {
          animation: fadeInUp 0.3s ease-out;
        }
        
        .log-entry-error {
          animation: pulse 0.5s ease-in-out 3;
        }
        
        .dependency-line {
          animation: expandLine 0.5s ease-out forwards;
        }
        
        .dependency-connector {
          animation: expandWidth 0.5s ease-out forwards;
        }
      `}</style>
      <div 
        className="h-full flex flex-col bg-white border-l border-gray-200 shadow-lg" 
        style={{ width: '480px' }}
        data-execution-log-panel
      >
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-lg text-blue-600">📋</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Logs de Ejecución</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">Seguimiento de operaciones</p>
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">v2.0</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">
            {processedLogs.length} entradas
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
        style={{ maxHeight: 'calc(100vh - 64px)' }}
      >
        {processedLogs.map((log, index) => {
          const isEliminando = log.message.includes('Eliminando');
          const isActualizando = log.message.includes('Actualizando');
          const isCreando = log.message.includes('Creando');
          const isNewEntry = index === processedLogs.length - 1 && isAnimating;
          
          // Iconos para cada acción
          let icon = <span className="text-gray-400">•</span>;
          if (log.status === 'error') icon = <span className="text-rose-500">⚠️</span>;
          else if (log.status === 'success') icon = <span className="text-emerald-500">✓</span>;
          else if (isEliminando) icon = <span className="text-rose-500">－</span>;
          else if (isActualizando) icon = <span className="text-amber-500">✎</span>;
          else if (isCreando) icon = <span className="text-emerald-500">＋</span>;
          else if (log.status === 'processing') icon = <span className="text-blue-500 animate-spin">⟳</span>;

          // Colores de fondo y texto con animaciones
          let containerClass = 'bg-white border-gray-200';
          let textClass = 'text-gray-700';
          let animationClass = '';
          
          if (log.status === 'error') {
            containerClass = 'bg-rose-50 border-rose-200';
            textClass = 'text-rose-700';
            animationClass = 'log-entry-error';
          } else if (log.status === 'success') {
            containerClass = 'bg-emerald-50 border-emerald-200';
            textClass = 'text-emerald-700';
            animationClass = 'log-entry-success';
          } else if (isEliminando) {
            containerClass = 'bg-rose-50 border-rose-200';
            textClass = 'text-rose-700';
          } else if (isActualizando) {
            containerClass = 'bg-yellow-50 border-amber-200';
            textClass = 'text-amber-700';
          } else if (isCreando) {
            containerClass = 'bg-emerald-50 border-emerald-200';
            textClass = 'text-emerald-700';
          } else if (log.status === 'processing') {
            containerClass = 'bg-blue-50 border-blue-200';
            textClass = 'text-blue-700';
            animationClass = 'log-entry-processing';
          }

          // Animación de entrada para nuevos logs
          if (isNewEntry) {
            animationClass = 'log-entry-new';
          }

          // Estilos para la jerarquía visual
          const indentLevel = log.level || 0;
          const marginLeft = indentLevel > 0 ? `${indentLevel * 20}px` : '0px';
          
          // Visualización especial para dependencias
          let dependencyIndicator = null;
          if (log.isChild) {
            dependencyIndicator = (
              <div className="absolute left-0 top-0 h-full">
                <div className="h-full border-l-2 border-dotted border-gray-300 ml-6 dependency-line"></div>
              </div>
            );
          }

          return (
            <div
              key={log.id}
              className={`p-3 rounded-lg border text-sm transition-all duration-300 shadow-sm relative ${containerClass} ${animationClass}`}
              style={{
                marginLeft,
                transform: isNewEntry ? 'translateX(0)' : undefined,
                opacity: isNewEntry ? 1 : undefined,
                animationDelay: isNewEntry ? `${index * 100}ms` : undefined,
              }}
            >
              {dependencyIndicator}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5 text-xl">{icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      {log.isParent && (
                        <span 
                          className="px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          title="Recurso principal"
                        >
                          Recurso
                        </span>
                      )}
                      {log.isChild && (
                        <span 
                          className="px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                          title="Dependencia"
                        >
                          Dependencia
                        </span>
                      )}
                      <span className="text-xs font-medium text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    {log.duration && (
                      <span className="text-xs font-medium text-gray-400">
                        {formatDuration(log.duration)}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm whitespace-pre-wrap font-medium ${textClass}`}>
                    {log.message}
                  </p>
                  
                  {/* Mostrar información de dependencias si existen */}
                  {log.isParent && log.dependencies && log.dependencies.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => toggleResourceExpansion(log.id)}>
                        <span>{expandedResources[log.id] ? '▼' : '►'}</span>
                        <span>
                          {log.dependencies.length} dependencia{log.dependencies.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {expandedResources[log.id] && (
                        <div className="pl-4 mt-1 space-y-1 border-l-2 border-gray-200">
                          {log.dependencies.map((dep, i) => (
                            <div key={i} className="text-gray-600">• {dep}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
};

export default ExecutionLog;