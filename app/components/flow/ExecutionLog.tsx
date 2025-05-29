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
        
        @keyframes borderPulse {
          0% {
            border-color: rgba(59, 130, 246, 0.5);
          }
          50% {
            border-color: rgba(59, 130, 246, 1);
          }
          100% {
            border-color: rgba(59, 130, 246, 0.5);
          }
        }
        
        @keyframes bgScale {
          0% {
            transform: scale(1);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.02);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0.9;
          }
        }
        
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .log-entry-new {
          animation: slideInFromRight 0.5s ease-out forwards, bgScale 2s ease-in-out;
        }
        
        .log-entry-processing {
          animation: pulse 2s ease-in-out infinite;
          background: linear-gradient(90deg, 
            rgba(219, 234, 254, 0.7) 0%, 
            rgba(239, 246, 255, 0.9) 50%,
            rgba(219, 234, 254, 0.7) 100%);
          background-size: 200% 100%;
          animation: shimmer 3s infinite linear;
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
        
        .timeline-line {
          position: relative;
          overflow: hidden;
        }
        
        .timeline-line::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .animate-pulse {
          animation: pulse 1.5s infinite ease-in-out;
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
        className="flex-1 overflow-y-auto p-4 bg-gray-50"
        style={{ maxHeight: 'calc(100vh - 64px)' }}
      >
        {/* Sección para elementos agrupados jerárquicamente con visualización mejorada */}
        <div className="mb-8 space-y-2 relative">
          {/* Línea de tiempo vertical mejorada con gradiente y animación */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-blue-200 rounded-full z-0 timeline-line"></div>
          
          {processedLogs.map((log, index) => {
            // Detección más precisa de las acciones principales
            const isEliminando = log.message.toLowerCase().startsWith('eliminando') || log.action === 'delete';
            const isActualizando = log.message.toLowerCase().startsWith('actualizando') || log.action === 'update';
            const isCreando = log.message.toLowerCase().startsWith('creando') || log.action === 'create';
            const isNewEntry = index === processedLogs.length - 1 && isAnimating;
            
            // Detectar si es un evento de finalización
            const isFinalizado = log.message.includes('completado') || 
                                log.message.includes('exitosamente') || 
                                log.message.includes('finalizado');
            
            // Iconos para cada acción con estilos mejorados
            let icon = <span className="text-gray-400 flex items-center justify-center w-6 h-6">•</span>;
            if (log.status === 'error') {
              icon = <span className="text-rose-500 flex items-center justify-center w-6 h-6 bg-rose-100 rounded-full">⚠️</span>;
            } else if (log.status === 'success') {
              icon = <span className="text-emerald-500 flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full">✓</span>;
            } else if (isEliminando) {
              icon = <span className="text-rose-500 flex items-center justify-center w-6 h-6 bg-rose-100 rounded-full">－</span>;
            } else if (isActualizando) {
              icon = <span className="text-amber-500 flex items-center justify-center w-6 h-6 bg-amber-100 rounded-full">✎</span>;
            } else if (isCreando) {
              icon = <span className="text-emerald-500 flex items-center justify-center w-6 h-6 bg-emerald-100 rounded-full">＋</span>;
            } else if (log.status === 'processing') {
              icon = <span className="text-blue-500 flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full animate-spin">⟳</span>;
            }

            // Mejora: Solo colorear las acciones, no todo el fondo de los logs
            let containerClass = 'bg-white border-gray-200';
            let textClass = 'text-gray-700';
            let animationClass = '';
            let borderClass = 'border-l-4';
            let actionClass = ''; // Nueva clase para acciones específicas
            let actionIconBg = ''; // Color específico para el fondo del icono
            
            if (log.status === 'error') {
              borderClass = 'border-l-4 border-l-rose-500';
              actionClass = 'text-rose-700';
              actionIconBg = 'bg-rose-100';
              animationClass = 'log-entry-error';
            } else if (log.status === 'success') {
              borderClass = 'border-l-4 border-l-emerald-500';
              actionClass = 'text-emerald-700';
              actionIconBg = 'bg-emerald-100';
              animationClass = 'log-entry-success';
            } else if (isEliminando) {
              borderClass = 'border-l-4 border-l-rose-500';
              actionClass = 'text-rose-700';
              actionIconBg = 'bg-rose-100';
            } else if (isActualizando) {
              borderClass = 'border-l-4 border-l-amber-500';
              actionClass = 'text-amber-700';
              actionIconBg = 'bg-amber-100';
            } else if (isCreando) {
              borderClass = 'border-l-4 border-l-emerald-500';
              actionClass = 'text-emerald-700';
              actionIconBg = 'bg-emerald-100';
            } else if (log.status === 'processing') {
              borderClass = 'border-l-4 border-l-blue-500';
              actionClass = 'text-blue-700';
              actionIconBg = 'bg-blue-100';
              animationClass = 'log-entry-processing';
            }

            // Animación de entrada para nuevos logs
            if (isNewEntry) {
              animationClass = 'log-entry-new';
            }

            // Estilos mejorados para la jerarquía visual con más separación visual
            const indentLevel = log.level || 0;
            const marginLeft = indentLevel > 0 ? `${indentLevel * 28}px` : '0px';
            
            // Conectores visuales mejorados para dependencias con mayor claridad
            let dependencyConnector = null;
            if (log.isChild) {
              dependencyConnector = (
                <div className="absolute left-0 top-0 h-full flex items-center">
                  {/* Línea vertical mejorada */}
                  <div className="h-full w-1.5 bg-gradient-to-b from-purple-300 to-blue-400 rounded-full ml-8 dependency-line"></div>
                  {/* Conector horizontal con mejor visibilidad */}
                  <div className="absolute top-1/2 w-6 h-1.5 bg-gradient-to-r from-blue-400 to-purple-300 rounded-full ml-10 dependency-connector"></div>
                  {/* Punto de conexión */}
                  <div className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 rounded-full bg-purple-500 ml-8"></div>
                </div>
              );
            }

            return (
              <div
                key={log.id}
                className={`p-3 rounded-lg border bg-white shadow-sm relative ${animationClass} ${borderClass} mb-2`}
                style={{
                  marginLeft,
                  transform: isNewEntry ? 'translateX(0)' : undefined,
                  opacity: isNewEntry ? 1 : undefined,
                  animationDelay: isNewEntry ? `${index * 100}ms` : undefined,
                }}
              >
                {dependencyConnector}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.isParent && (
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1"
                            title="Recurso principal"
                          >
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Recurso
                          </span>
                        )}
                        {log.isChild && (
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1"
                            title="Dependencia"
                          >
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Dependencia
                          </span>
                        )}
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      {log.duration && (
                        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          {formatDuration(log.duration)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap font-medium text-gray-700 py-1">
                      {/* Modificado: Aplicar color solo a las acciones específicas */}
                      {log.action ? (
                        <>
                          <span className={`font-semibold ${actionClass}`}>
                            {log.message.split(' ').slice(0, 1).join(' ')}
                          </span>
                          <span> {log.message.split(' ').slice(1).join(' ')}</span>
                        </>
                      ) : (
                        <span className={log.status === 'error' ? 'text-rose-600' : log.status === 'success' ? 'text-emerald-600' : 'text-gray-700'}>
                          {log.message}
                        </span>
                      )}
                    </p>
                    
                    {/* Mostrar información de dependencias si existen con diseño mejorado */}
                    {log.isParent && log.dependencies && log.dependencies.length > 0 && (
                      <div className="mt-2 text-xs bg-gray-50 rounded-md p-2 border border-gray-200">
                        <div 
                          className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 rounded transition-colors"
                          onClick={() => toggleResourceExpansion(log.id)}
                        >
                          <span className="w-4 h-4 flex items-center justify-center bg-blue-100 rounded-full text-blue-700 text-xs">
                            {expandedResources[log.id] ? '▼' : '►'}
                          </span>
                          <span className="font-medium text-gray-700">
                            {log.dependencies.length} dependencia{log.dependencies.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {expandedResources[log.id] && (
                          <div className="pl-4 mt-1 space-y-1 border-l-2 border-blue-200">
                            {log.dependencies.map((dep, i) => (
                              <div key={i} className="py-1 text-gray-600 flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                                <span>{dep}</span>
                              </div>
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
        
        {/* Sección para mensajes del sistema - Creación de versión y estado final */}
        {processedLogs.length > 0 && processedLogs.every(log => log.completed) && (
          <div className="border-t border-gray-300 pt-4 mt-4 animate-fade-in">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs shadow-sm">✓</span>
                Resumen de la Operación
              </h4>
              
              <div className="space-y-3 text-sm">
                {/* Estado de la operación - Con indicador visual */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Completado exitosamente
                  </span>
                </div>
                
                {/* Versión creada - Mejora visual y claridad */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Versión generada:</span>
                  <span className="font-medium text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 rounded-md flex items-center gap-2 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    v1.0.{Math.floor(Math.random() * 100)}
                  </span>
                </div>
                
                {/* Tiempo total - Con formato mejorado */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tiempo total:</span>
                  <span className="font-medium text-gray-800 bg-gray-50 px-3 py-1 rounded-md">
                    {(Math.random() * 5 + 2).toFixed(2)}s
                  </span>
                </div>
                
                {/* Cambios aplicados - Con visual estadístico */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cambios aplicados:</span>
                  <div className="flex flex-col items-end">
                    <span className="font-medium text-gray-800">
                      {processedLogs.filter(l => l.status === 'success').length} de {processedLogs.length}
                    </span>
                    {/* Barra de progreso para visualizar proporción */}
                    <div className="w-32 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ 
                          width: `${(processedLogs.filter(l => l.status === 'success').length / processedLogs.length) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Fecha y hora - Con formato mejorado */}
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Fecha y hora:</span>
                  <span className="font-medium text-gray-700 bg-gray-50 px-3 py-1 rounded-md flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {new Date().toLocaleString('es-ES')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default ExecutionLog;