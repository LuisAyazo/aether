import React, { useMemo, useState } from 'react';
import { 
  XMarkIcon, 
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
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

const getStateIcon = (state: NodeExecutionState): React.ReactNode => {
  const className = "w-5 h-5";
  switch (state) {
    case 'creating':
      return <PlusIcon className={`${className} text-emerald-600`} />;
    case 'updating':
      return <ArrowPathIcon className={`${className} text-amber-600`} />;
    case 'deleting':
      return <TrashIcon className={`${className} text-red-600`} />;
    case 'success':
      return <CheckCircleIcon className={`${className} text-emerald-600`} />;
    case 'error':
      return <XCircleIcon className={`${className} text-red-600`} />;
    case 'pending':
      return <ClockIcon className={`${className} text-blue-600`} />;
    default:
      return <ClockIcon className={`${className} text-slate-600`} />;
  }
};

const getStateBgColor = (state: NodeExecutionState): string => {
  switch (state) {
    case 'creating':
      return 'bg-emerald-50 border-emerald-200';
    case 'updating':
      return 'bg-amber-50 border-amber-200';
    case 'deleting':
      return 'bg-red-50 border-red-200';
    case 'success':
      return 'bg-emerald-50 border-emerald-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'pending':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-slate-50 border-slate-200';
  }
};

const getStateLabel = (state: NodeExecutionState): string => {
  switch (state) {
    case 'creating':
      return 'Creando';
    case 'updating':
      return 'Actualizando';
    case 'deleting':
      return 'Eliminando';
    case 'success':
      return 'Completado';
    case 'error':
      return 'Error';
    case 'pending':
      return 'Pendiente';
    default:
      return 'Procesando';
  }
};

const ExecutionLog: React.FC<ExecutionLogProps> = ({ isVisible, logs, onClose, previewData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState<NodeExecutionState | 'all'>('all');
  const [showAllLogs, setShowAllLogs] = useState(false);

  const totalResources = useMemo(() => {
    if (!previewData) return 0;
    return previewData.resourcesToCreate.length + 
           previewData.resourcesToUpdate.length + 
           previewData.resourcesToDelete.length;
  }, [previewData]);

  const filteredLogs = useMemo(() => {
    let filtered = logs;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.nodeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by state
    if (filterState !== 'all') {
      filtered = filtered.filter(log => log.state === filterState);
    }
    
    return filtered;
  }, [logs, searchTerm, filterState]);

  const displayLogs = useMemo(() => {
    const sortedLogs = [...filteredLogs].sort((a, b) => b.timestamp - a.timestamp);
    return showAllLogs ? sortedLogs : sortedLogs.slice(0, 10);
  }, [filteredLogs, showAllLogs]);

  const exportLogs = () => {
    const logData = logs.map(log => ({
      timestamp: new Date(log.timestamp).toISOString(),
      node: log.nodeName,
      state: log.state,
      message: log.message
    }));
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl transform transition-all duration-300 ease-out z-50"
         style={{ maxHeight: '70vh' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <DocumentTextIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Log de Ejecución</h3>
            <p className="text-sm text-slate-500">
              {logs.length > 0 && `${filteredLogs.length} de ${logs.length} eventos`}
              {previewData && totalResources > 0 && ` • ${totalResources} recursos programados`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {logs.length > 0 && (
            <button
              onClick={exportLogs}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Exportar logs"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Preview Resources Summary - Only show if we have preview data */}
        {previewData && totalResources > 0 && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              {previewData.resourcesToCreate.length > 0 && (
                <div className="flex items-center justify-center space-x-2 text-emerald-700">
                  <PlusIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{previewData.resourcesToCreate.length} crear</span>
                </div>
              )}
              {previewData.resourcesToUpdate.length > 0 && (
                <div className="flex items-center justify-center space-x-2 text-amber-700">
                  <ArrowPathIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{previewData.resourcesToUpdate.length} actualizar</span>
                </div>
              )}
              {previewData.resourcesToDelete.length > 0 && (
                <div className="flex items-center justify-center space-x-2 text-red-700">
                  <TrashIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">{previewData.resourcesToDelete.length} eliminar</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search and Filter Bar */}
        {logs.length > 0 && (
          <div className="px-6 py-4 bg-white border-b border-slate-200">
            <div className="flex items-center space-x-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o mensaje..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full py-2 pl-9 pr-4 text-sm rounded-lg border border-slate-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Filter Dropdown */}
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value as NodeExecutionState | 'all')}
                className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="success">Completados</option>
                <option value="error">Errores</option>
                <option value="creating">Creando</option>
                <option value="updating">Actualizando</option>
                <option value="deleting">Eliminando</option>
                <option value="pending">Pendientes</option>
              </select>

              {/* Show All Toggle */}
              {filteredLogs.length > 10 && (
                <button
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {showAllLogs ? 'Mostrar últimos 10' : `Mostrar todos (${filteredLogs.length})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Execution Logs Section */}
        {logs.length > 0 && (
          <div className="px-6 pb-6 pt-4 space-y-2">
            {displayLogs.map((log, index) => (
              <div
                key={`${log.nodeId}-${log.timestamp}-${index}`}
                className={`flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-sm ${getStateBgColor(log.state)}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getStateIcon(log.state)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-slate-900 truncate">{log.nodeName}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        log.state === 'success' ? 'bg-emerald-100 text-emerald-800' :
                        log.state === 'error' ? 'bg-red-100 text-red-800' :
                        log.state === 'creating' ? 'bg-emerald-100 text-emerald-800' :
                        log.state === 'updating' ? 'bg-amber-100 text-amber-800' :
                        log.state === 'deleting' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {getStateLabel(log.state)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{log.message}</p>
                </div>
              </div>
            ))}
            
            {!showAllLogs && filteredLogs.length > 10 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowAllLogs(true)}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Ver todos los {filteredLogs.length} eventos
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {logs.length === 0 && (!previewData || totalResources === 0) && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <ClockIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-medium text-slate-900 mb-2">Sin actividad</h4>
            <p className="text-slate-500 max-w-sm mx-auto">
              Los eventos de ejecución aparecerán aquí cuando comience el proceso
            </p>
          </div>
        )}

        {/* Filtered Empty State */}
        {logs.length > 0 && filteredLogs.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <MagnifyingGlassIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-medium text-slate-900 mb-2">Sin resultados</h4>
            <p className="text-slate-500 max-w-sm mx-auto">
              No se encontraron eventos que coincidan con los criterios de búsqueda.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterState('all');
              }}
              className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutionLog;