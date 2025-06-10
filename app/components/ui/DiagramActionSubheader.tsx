'use client';

import { Button, Tooltip } from 'antd'; // Divider eliminado
import {
  HistoryOutlined,
  UndoOutlined,
  BranchesOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { useNavigationStore } from '@/app/hooks/useNavigationStore';

export default function DiagramActionSubheader() {
  const environments = useNavigationStore(state => state.environments);
  const dataLoading = useNavigationStore(state => state.dataLoading);
  
  // Obtener los handlers directamente del store
  const handleHistory = useNavigationStore(state => state.handleHistory);
  const handleRollback = useNavigationStore(state => state.handleRollback);
  const handleVersions = useNavigationStore(state => state.handleVersions);
  const handlePreview = useNavigationStore(state => state.handlePreview);
  const handleRun = useNavigationStore(state => state.handleRun);
  const handlePromote = useNavigationStore(state => state.handlePromote);
  const handleDestroy = useNavigationStore(state => state.handleDestroy);

  // Handler para mostrar el código generado
  const handleShowGeneratedCode = () => {
    // Disparar evento para abrir el modal de código generado
    const event = new CustomEvent('showGeneratedCodeModal');
    window.dispatchEvent(event);
  };

  // El subheader solo se muestra si hay un diagrama actual (implícito, ya que estos botones operan sobre él)
  // La lógica para mostrar/ocultar el subheader completo estaría en la página que lo usa (DashboardPage)
  // basada en si `currentDiagram` existe.

  return (
    <div className="bg-gray-50 dark:bg-gray-750 py-5 px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-end gap-x-2"> {/* Padding vertical aumentado a py-5 */}
      <Tooltip title='Historial de Versiones'>
        <Button icon={<HistoryOutlined />} size="small" onClick={handleHistory} disabled={dataLoading} />
      </Tooltip>
      <Tooltip title='Revertir Cambios'>
        <Button icon={<UndoOutlined />} size="small" onClick={handleRollback} disabled={dataLoading} />
      </Tooltip>
      <Tooltip title='Versiones'>
        <Button icon={<BranchesOutlined />} size="small" onClick={handleVersions} disabled={dataLoading} />
      </Tooltip>
      {/* Separador personalizado */}
      <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 self-center"></div>
      <Tooltip title='Previsualizar Cambios'>
        <Button icon={<EyeOutlined />} size="small" onClick={handlePreview} disabled={dataLoading} />
      </Tooltip>
      <Tooltip title='Ejecutar/Desplegar'>
        <Button icon={<PlayCircleOutlined />} type="primary" size="small" onClick={handleRun} disabled={dataLoading} />
      </Tooltip>
      {/* Separador personalizado */}
      <div className="h-5 w-px bg-gray-300 dark:bg-gray-600 self-center"></div>
      <Tooltip title='Código Generado'>
        <Button icon={<CodeOutlined />} size="small" onClick={handleShowGeneratedCode} disabled={dataLoading} />
      </Tooltip>
      <Tooltip title='Promover a Ambiente'>
        <Button 
          icon={<CloudUploadOutlined />} 
          size="small" 
          onClick={handlePromote} 
          disabled={dataLoading || (environments && environments.length <= 1)} 
        />
      </Tooltip>
      <Tooltip title='Limpiar (Destruir Recursos)'>
        <Button icon={<DeleteOutlined />} danger size="small" onClick={handleDestroy} disabled={dataLoading} />
      </Tooltip>
    </div>
  );
}
