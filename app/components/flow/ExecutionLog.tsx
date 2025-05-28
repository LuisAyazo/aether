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
  isParent?: boolean;
  isChild?: boolean;
  parentResource?: string;
  childResource?: string;
}

const ExecutionLog: React.FC<ExecutionLogProps> = ({ isVisible, logs, onClose, previewData }) => {
  const [expandedResources, setExpandedResources] = useState<Record<string, boolean>>({});
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [processedLogs, setProcessedLogs] = useState<LogEntry[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle click outside to close - mejorado para React Flow
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isVisible) return;
      
      const target = event.target as Element;
      
      // Identificar elementos que NO deben cerrar el drawer
      const logPanel = target.closest('[data-execution-log-panel]');
      const modal = target.closest('[data-modal]') || target.closest('.ant-modal');
      const dropdown = target.closest('.ant-dropdown') || target.closest('[data-dropdown]');
      const tooltip = target.closest('.ant-tooltip') || target.closest('[data-tooltip]');
      const popover = target.closest('.ant-popover') || target.closest('[data-popover]');
      
      // Elementos específicos de React Flow que SÍ deben cerrar el drawer
      const reactFlowViewport = target.closest('.react-flow__viewport');
      const reactFlowPane = target.closest('.react-flow__pane');
      const reactFlowRenderer = target.closest('.react-flow__renderer');
      
      // Cerrar si:
      // 1. Hacemos click en el viewport/pane de React Flow
      // 2. O hacemos click fuera del panel de logs y no es un modal/dropdown/tooltip
      if (reactFlowViewport || reactFlowPane || reactFlowRenderer || 
          (!logPanel && !modal && !dropdown && !tooltip && !popover)) {
        onClose();
      }
    };

    if (isVisible) {
      // Pequeño delay para evitar cierre inmediato al abrir
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, true);
        document.addEventListener('click', handleClickOutside, true);
      }, 150);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside, true);
        document.removeEventListener('click', handleClickOutside, true);
      };
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [isVisible, onClose]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Procesamiento mejorado de logs con jerarquía padre-hijo
  useEffect(() => {
    const newProcessedLogs = logs.map((log, index) => {
      const timestamp = Date.now() - (logs.length - index) * 1000;
      let status: LogEntry['status'] = 'info';
      let duration: number | undefined;
      let action: LogEntry['action'] | undefined;
      let isParent = false;
      let isChild = false;
      let parentResource = '';
      let childResource = '';

      // Detectar logs de dependencia como hijos
      if (log.toLowerCase().startsWith('dependencia')) {
        isChild = true;
        // Extraer el nombre del recurso después de "Dependencia"
        const match = log.match(/^dependencia\s+([^\s]+)/i);
        if (match) {
          childResource = match[1];
        }
      }

      // Detectar relaciones padre-hijo con flechas (mantenemos para compatibilidad)
      if (log.includes('→') || log.includes('->')) {
        const parts = log.split(/→|->/).map(p => p.trim());
        if (parts.length === 2) {
          isChild = true;
          parentResource = parts[0];
          childResource = parts[1];
        }
      }

      // Detectar si es un recurso padre - si el siguiente log es una dependencia
      const nextLog = logs[index + 1];
      if (nextLog && (nextLog.toLowerCase().startsWith('dependencia') || nextLog.includes('→') || nextLog.includes('->'))) {
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
        message: log,
        timestamp,
        status,
        duration,
        action,
        isParent,
        isChild,
        parentResource,
        childResource
      };
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
        
        @keyframes slideInLeft {
          from {
            transform: translateX(-20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
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
        
        .log-entry-child {
          animation: slideInLeft 0.4s ease-out forwards;
        }
        
        .log-entry-parent {
          border-left: 5px solid #6366f1;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9));
          position: relative;
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.08);
          border-radius: 12px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(99, 102, 241, 0.15);
        }
        
        .log-entry-parent::before {
          content: '▲';
          position: absolute;
          top: 20px;
          left: -14px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          border: 3px solid white;
        }
        
        .log-entry-child-container {
          position: relative;
          margin-left: 1.5rem;
          padding: 1.5rem;
          margin-top: 1rem;
          background: linear-gradient(135deg, rgba(248, 250, 252, 0.6), rgba(241, 245, 249, 0.4));
          border-radius: 16px;
          border: 1px solid rgba(203, 213, 225, 0.5);
          backdrop-filter: blur(5px);
        }
        
        .log-entry-child-container::before {
          content: '';
          position: absolute;
          left: -0.75rem;
          top: 0;
          bottom: 0;
          width: 4px;
          background: linear-gradient(to bottom, #6366f1 0%, #8b5cf6 50%, #d1d5db 100%);
          border-radius: 4px;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
        }
        
        .log-entry-child {
          position: relative;
          margin-bottom: 1rem;
          padding: 0.75rem 1rem;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(248, 250, 252, 0.6));
          border-radius: 10px;
          border: 1px solid rgba(226, 232, 240, 0.7);
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        
        .log-entry-child:hover {
          transform: translateX(4px);
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.8));
          border-color: rgba(99, 102, 241, 0.2);
          box-shadow: 0 4px 16px rgba(99, 102, 241, 0.1);
        }
        
        .log-entry-child::before {
          content: '├─';
          position: absolute;
          left: -2rem;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 16px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
        
        .log-entry-child:last-child::before {
          content: '└─';
        }
        
        .dependency-header {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);
          border: 2px solid rgba(226, 232, 240, 0.8);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        .dependency-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
          border-radius: 4px 4px 0 0;
        }
        
        .resource-badge {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
      <div 
        className="h-full flex flex-col bg-white border-l border-gray-200" 
        style={{ width: '480px', height: '100vh' }}
        data-execution-log-panel
      >
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <span className="text-lg text-blue-600">📋</span>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Logs de Ejecución</h3>
            <p className="text-xs text-gray-500">Seguimiento de operaciones</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        style={{ height: 'calc(100% - 80px)' }}
      >
        {processedLogs.map((log, index) => {
          // Skip child logs as they will be rendered inside parent
          if (log.isChild) return null;
          
          const isEliminando = log.message.includes('Eliminando');
          const isActualizando = log.message.includes('Actualizando');
          const isCreando = log.message.includes('Creando');
          const isNewEntry = index === processedLogs.length - 1 && isAnimating;
          
          // Find children logs for this parent
          const childrenLogs = log.isParent 
            ? processedLogs.filter((childLog, childIndex) => 
                childIndex > index && 
                childLog.isChild && 
                childLog.parentResource && 
                childLog.parentResource.toLowerCase().includes(log.message.toLowerCase().split(' ')[1] || '')
              )
            : [];
          
          // Iconos modernos y más elegantes para cada acción
          let icon = <span className="text-gray-400">●</span>;
          if (log.status === 'error') icon = <span className="text-rose-500">⚠</span>;
          else if (log.status === 'success' && !isCreando) icon = <span className="text-blue-500">✓</span>;
          else if (isEliminando) icon = <span className="text-rose-500">⊖</span>;
          else if (isActualizando) icon = <span className="text-amber-500">⟲</span>;
          else if (isCreando) icon = <span className="text-emerald-500">⊕</span>;
          else if (log.status === 'processing') icon = <span className="text-blue-500 animate-spin">●</span>;

          // Esquema de colores más profesional - solo verde para "creando"
          let containerClass = 'bg-white border-gray-200';
          let textClass = 'text-gray-700';
          let animationClass = '';
          
          if (log.status === 'error') {
            containerClass = 'bg-rose-50 border-rose-200';
            textClass = 'text-rose-700';
            animationClass = 'log-entry-error';
          } else if (log.status === 'success' && isCreando) {
            // Solo verde para "creando exitoso"
            containerClass = 'bg-emerald-50 border-emerald-200';
            textClass = 'text-emerald-700';
            animationClass = 'log-entry-success';
          } else if (log.status === 'success') {
            // Otros éxitos en azul
            containerClass = 'bg-blue-50 border-blue-200';
            textClass = 'text-blue-700';
            animationClass = 'log-entry-success';
          } else if (isEliminando) {
            containerClass = 'bg-rose-50 border-rose-200';
            textClass = 'text-rose-700';
          } else if (isActualizando) {
            containerClass = 'bg-amber-50 border-amber-200';
            textClass = 'text-amber-700';
          } else if (isCreando) {
            // Verde solo para "creando"
            containerClass = 'bg-emerald-50 border-emerald-200';
            textClass = 'text-emerald-700';
          } else if (log.status === 'processing') {
            containerClass = 'bg-slate-50 border-slate-200';
            textClass = 'text-slate-700';
            animationClass = 'log-entry-processing';
          }

          // Animación de entrada para nuevos logs
          if (isNewEntry) {
            animationClass = 'log-entry-new';
          }

          // Add parent styling if this log has children
          if (log.isParent) {
            animationClass += ' log-entry-parent';
          }

          return (
            <div key={index} className="space-y-3">
              <div
                className={`p-3 rounded-lg border text-sm transition-all duration-300 shadow-sm ${containerClass} ${animationClass}`}
                style={{
                  transform: isNewEntry ? 'translateX(0)' : undefined,
                  opacity: isNewEntry ? 1 : undefined,
                  animationDelay: isNewEntry ? `${index * 100}ms` : undefined,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5 text-xl">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                      {log.duration && (
                        <span className="text-xs font-medium text-gray-400">
                          {formatDuration(log.duration)}
                        </span>
                      )}
                      {log.isParent && (
                        <span className="resource-badge">
                          Principal
                        </span>
                      )}
                    </div>
                    <p className={`text-sm whitespace-pre-wrap font-medium ${textClass}`}>
                      {log.message}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Render children logs */}
              {childrenLogs.length > 0 && (
                <div className="log-entry-child-container">
                  <div className="dependency-header">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
                        <span className="text-blue-600 text-xl">⚡</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900 mb-1">
                          Dependencias
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {childrenLogs.length} recurso{childrenLogs.length !== 1 ? 's' : ''} vinculado{childrenLogs.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="resource-badge">
                        {childrenLogs.length}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {childrenLogs.map((childLog, childIndex) => {
                      // Íconos más elegantes y modernos basados en el tipo de recurso
                      const getResourceIcon = (resourceName: string) => {
                        const name = resourceName?.toLowerCase() || '';
                        if (name.includes('disk') || name.includes('volume')) return '💾';
                        if (name.includes('network') || name.includes('vpc')) return '🌐';
                        if (name.includes('security') || name.includes('firewall')) return '🛡';
                        if (name.includes('backup') || name.includes('snapshot')) return '📸';
                        if (name.includes('database') || name.includes('db')) return '🗄';
                        if (name.includes('compute') || name.includes('instance')) return '⚙';
                        if (name.includes('storage') || name.includes('bucket')) return '📦';
                        if (name.includes('load') || name.includes('balancer')) return '⚖';
                        return '🔹';
                      };
                      
                      const childIcon = getResourceIcon(childLog.childResource || '');
                      
                      // Esquema de colores más sutil para logs hijo
                      let childContainerClass = '';
                      let childTextClass = 'text-gray-700';
                      let statusIndicator = '';
                      
                      if (childLog.status === 'error') {
                        childTextClass = 'text-rose-700';
                        statusIndicator = '⚠';
                      } else if (childLog.status === 'success') {
                        if (childLog.message.toLowerCase().includes('crean')) {
                          childTextClass = 'text-emerald-700';
                        } else {
                          childTextClass = 'text-blue-700';
                        }
                        statusIndicator = '✓';
                      } else if (childLog.status === 'processing') {
                        childTextClass = 'text-blue-700';
                        statusIndicator = '●';
                      }

                      return (
                        <div
                          key={`child-${index}-${childIndex}`}
                          className="log-entry-child"
                          style={{
                            animationDelay: `${(index + childIndex) * 150}ms`,
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 shadow-sm">
                              <span className="text-base">{childIcon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-1.5">
                                <span className="font-semibold text-sm text-gray-800 truncate">
                                  {childLog.parentResource || 'Recurso'}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
                                  <span className="text-purple-500 text-xs font-bold">▶</span>
                                </div>
                                <span className="font-semibold text-sm text-purple-700 truncate">
                                  {childLog.childResource || 'Dependencia'}
                                </span>
                                {statusIndicator && (
                                  <div className="ml-auto flex items-center gap-1">
                                    <span className={`text-sm ${childLog.status === 'processing' ? 'animate-pulse' : ''}`}>
                                      {statusIndicator}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className={`text-xs leading-relaxed ${childTextClass}`}>
                                {childLog.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
};

export default ExecutionLog;