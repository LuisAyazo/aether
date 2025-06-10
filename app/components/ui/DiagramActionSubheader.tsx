'use client';

import React, { useState } from 'react';
import { Button, Tooltip, Modal } from 'antd';
import {
  HistoryOutlined,
  UndoOutlined,
  BranchesOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  CodeOutlined,
  MonitorOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  RobotOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useNavigationStore } from '@/app/hooks/useNavigationStore';

// Importar los nuevos módulos
import MonitoringPage from './MonitoringPage';
import SecurityPage from './SecurityPage';
import CostsPage from './CostsPage';
import AIAssistantPage from './AIAssistantPage';
import ResourceCenterPage from './ResourceCenterPage';

export default function DiagramActionSubheader() {
  const environments = useNavigationStore(state => state.environments);
  const dataLoading = useNavigationStore(state => state.dataLoading);
  
  // Estados para los modales de los nuevos módulos
  const [monitoringModalVisible, setMonitoringModalVisible] = useState(false);
  const [securityModalVisible, setSecurityModalVisible] = useState(false);
  const [costsModalVisible, setCostsModalVisible] = useState(false);
  const [aiAssistantModalVisible, setAiAssistantModalVisible] = useState(false);
  const [resourceCenterModalVisible, setResourceCenterModalVisible] = useState(false);
  
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
    <>
      <div className="bg-gray-50 dark:bg-gray-750 py-5 px-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-x-2">
        {/* Nuevos módulos a la izquierda */}
        <div className="flex items-center gap-x-2">
          <Tooltip title='Monitoreo'>
            <Button icon={<MonitorOutlined />} size="small" onClick={() => setMonitoringModalVisible(true)} />
          </Tooltip>
          <Tooltip title='Seguridad & Compliance'>
            <Button icon={<SafetyCertificateOutlined />} size="small" onClick={() => setSecurityModalVisible(true)} />
          </Tooltip>
          <Tooltip title='Centro de Costos'>
            <Button icon={<DollarOutlined />} size="small" onClick={() => setCostsModalVisible(true)} />
          </Tooltip>
          <Tooltip title='AI Assistant'>
            <Button icon={<RobotOutlined />} size="small" onClick={() => setAiAssistantModalVisible(true)} />
          </Tooltip>
          <Tooltip title='Centro de Recursos'>
            <Button icon={<BookOutlined />} size="small" onClick={() => setResourceCenterModalVisible(true)} />
          </Tooltip>
        </div>

        {/* Acciones del diagrama a la derecha */}
        <div className="flex items-center gap-x-2">
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
      </div>

      {/* Modales para los nuevos módulos */}
      <Modal
        title="Monitoreo de Infraestructura"
        open={monitoringModalVisible}
        onCancel={() => setMonitoringModalVisible(false)}
        footer={null}
        width="95%"
        style={{ top: 20 }}
        bodyStyle={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
      >
        <MonitoringPage />
      </Modal>

      <Modal
        title="Seguridad & Compliance"
        open={securityModalVisible}
        onCancel={() => setSecurityModalVisible(false)}
        footer={null}
        width="95%"
        style={{ top: 20 }}
        bodyStyle={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
      >
        <SecurityPage />
      </Modal>

      <Modal
        title="Centro de Costos"
        open={costsModalVisible}
        onCancel={() => setCostsModalVisible(false)}
        footer={null}
        width="95%"
        style={{ top: 20 }}
        bodyStyle={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
      >
        <CostsPage />
      </Modal>

      <Modal
        title="AI Assistant"
        open={aiAssistantModalVisible}
        onCancel={() => setAiAssistantModalVisible(false)}
        footer={null}
        width="95%"
        style={{ top: 20 }}
        bodyStyle={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
      >
        <AIAssistantPage />
      </Modal>

      <Modal
        title="Centro de Recursos"
        open={resourceCenterModalVisible}
        onCancel={() => setResourceCenterModalVisible(false)}
        footer={null}
        width="95%"
        style={{ top: 20 }}
        bodyStyle={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}
      >
        <ResourceCenterPage />
      </Modal>
    </>
  );
}
