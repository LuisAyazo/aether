import React from 'react';
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import { 
  SaveOutlined, 
  PlayCircleOutlined, 
  PlusOutlined, 
  EyeOutlined,
  DownOutlined,
  SettingOutlined
} from '@ant-design/icons';

interface DiagramHeaderProps {
  diagramName: string;
  environmentName?: string;
  onSave?: () => void;
  onRun?: () => void;
  onPreview?: () => void;
  onAddResource?: () => void;
  onSettings?: () => void;
  isSaving?: boolean;
  isModified?: boolean;
  lastSaved?: Date | null;
  status?: 'draft' | 'running' | 'complete' | 'error';
}

const DiagramHeader: React.FC<DiagramHeaderProps> = ({
  diagramName,
  environmentName,
  onSave,
  onRun,
  onPreview,
  onAddResource,
  onSettings,
  isSaving,
  isModified,
  lastSaved,
  status = 'draft'
}) => {
  const statusColors = {
    draft: 'bg-gray-200 text-gray-800',
    running: 'bg-blue-200 text-blue-800',
    complete: 'bg-green-200 text-green-800',
    error: 'bg-red-200 text-red-800'
  };

  const statusLabels = {
    draft: 'Borrador',
    running: 'Ejecutando',
    complete: 'Completado',
    error: 'Error'
  };

  const menu = (
    <Menu>
      <Menu.Item key="settings" onClick={onSettings}>
        <SettingOutlined /> Configuración
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="export-terraform">
        Exportar como Terraform
      </Menu.Item>
      <Menu.Item key="export-cloudformation">
        Exportar como CloudFormation
      </Menu.Item>
      <Menu.Item key="export-arm">
        Exportar como ARM Template
      </Menu.Item>
      <Menu.Item key="export-image">
        Exportar como imagen
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="h-14 min-h-14 max-h-14 px-4 border-b border-gray-200 flex items-center justify-between bg-white">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-lg font-medium text-gray-900 leading-none mb-0.5">{diagramName}</h1>
          <div className="flex items-center text-sm text-gray-500">
            {environmentName && (
              <>
                <span className="mr-2">{environmentName}</span>
                <span className="mr-2">•</span>
              </>
            )}
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${statusColors[status]}`}>
              {statusLabels[status]}
            </span>
            {lastSaved && (
              <>
                <span className="mx-2">•</span>
                <span>
                  {isModified ? 'Modificado' : `Guardado ${lastSaved.toLocaleTimeString()}`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Tooltip title="Añadir recurso">
          <Button 
            type="primary" 
            ghost 
            icon={<PlusOutlined />} 
            onClick={onAddResource}
            size="middle"
          >
            Añadir
          </Button>
        </Tooltip>

        <Tooltip title="Previsualizar">
          <Button 
            type="default" 
            icon={<EyeOutlined />} 
            onClick={onPreview}
          />
        </Tooltip>

        <Tooltip title="Ejecutar">
          <Button 
            type="default" 
            icon={<PlayCircleOutlined />} 
            onClick={onRun}
          />
        </Tooltip>

        <Tooltip title="Guardar">
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={onSave}
            loading={isSaving}
          >
            Guardar
          </Button>
        </Tooltip>

        <Dropdown overlay={menu}>
          <Button>
            Más <DownOutlined />
          </Button>
        </Dropdown>
      </div>
    </div>
  );
};

export default DiagramHeader;
