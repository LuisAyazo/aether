'use client';

import React, { useState, useEffect } from 'react';
import { Select, Button, Modal, Form, Input, Space, Divider, message, Spin } from 'antd';
import { PlusOutlined, SettingOutlined, CheckOutlined } from '@ant-design/icons';
import { workspaceService, Workspace, WorkspaceCreate } from '../services/workspaceService';
import { useRouter } from 'next/navigation';

const { Option } = Select;
const { TextArea } = Input;

interface WorkspaceSelectorProps {
  companyId: string;
  currentWorkspaceId?: string;
  onWorkspaceChange?: (workspaceId: string) => void;
}

export default function WorkspaceSelector({ 
  companyId, 
  currentWorkspaceId,
  onWorkspaceChange 
}: WorkspaceSelectorProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | undefined>(currentWorkspaceId);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  useEffect(() => {
    loadWorkspaces();
  }, [companyId]);

  useEffect(() => {
    // Sync with prop changes
    setSelectedWorkspaceId(currentWorkspaceId);
  }, [currentWorkspaceId]);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const data = await workspaceService.listCompanyWorkspaces(companyId);
      setWorkspaces(data);
      
      // If no workspace is selected, select the default one
      if (!selectedWorkspaceId && data.length > 0) {
        const defaultWorkspace = data.find(w => w.is_default) || data[0];
        handleWorkspaceChange(defaultWorkspace.id, true); // Skip reload on initial load
      }
    } catch (error) {
      message.error('Error al cargar workspaces');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceChange = (workspaceId: string, skipReload?: boolean) => {
    setSelectedWorkspaceId(workspaceId);
    workspaceService.setCurrentWorkspace(workspaceId);
    
    if (onWorkspaceChange) {
      onWorkspaceChange(workspaceId);
    }
    
    // Only reload if not skipping (for initial load)
    if (!skipReload) {
      // Reload the page to update context
      window.location.reload();
    }
  };

  const handleCreateWorkspace = async (values: WorkspaceCreate) => {
    setCreating(true);
    try {
      const newWorkspace = await workspaceService.createWorkspace(companyId, values);
      message.success('Workspace creado exitosamente');
      setCreateModalVisible(false);
      form.resetFields();
      
      // Reload workspaces and select the new one
      await loadWorkspaces();
      handleWorkspaceChange(newWorkspace.id);
    } catch (error) {
      message.error('Error al crear workspace');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const goToWorkspaceSettings = () => {
    if (selectedWorkspaceId) {
      router.push(`/workspace/${selectedWorkspaceId}/settings`);
    }
  };

  return (
    <>
      <Space>
        <Select
          value={selectedWorkspaceId}
          onChange={(value) => handleWorkspaceChange(value)}
          loading={loading}
          style={{ minWidth: 200 }}
          placeholder="Seleccionar workspace"
          popupRender={(menu) => (
            <>
              {menu}
              <Divider style={{ margin: '8px 0' }} />
              <Space style={{ padding: '0 8px 4px' }}>
                <Button
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                  style={{ width: '100%' }}
                >
                  Crear nuevo workspace
                </Button>
              </Space>
            </>
          )}
        >
          {workspaces.map((workspace) => (
            <Option key={workspace.id} value={workspace.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{workspace.name}</span>
                {workspace.is_default && (
                  <CheckOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                )}
              </div>
            </Option>
          ))}
        </Select>
        
        {selectedWorkspaceId && (
          <Button
            icon={<SettingOutlined />}
            onClick={goToWorkspaceSettings}
            type="text"
          />
        )}
      </Space>

      <Modal
        title="Crear nuevo workspace"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateWorkspace}
        >
          <Form.Item
            name="name"
            label="Nombre"
            rules={[
              { required: true, message: 'Por favor ingresa un nombre' },
              { max: 50, message: 'El nombre no puede exceder 50 caracteres' }
            ]}
          >
            <Input placeholder="ej. Proyecto Principal" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Descripción"
            rules={[
              { max: 200, message: 'La descripción no puede exceder 200 caracteres' }
            ]}
          >
            <TextArea 
              rows={3} 
              placeholder="Descripción opcional del workspace"
            />
          </Form.Item>

          <Form.Item
            name="is_default"
            valuePropName="checked"
          >
            <Button
              type="link"
              onClick={() => {
                form.setFieldsValue({ is_default: !form.getFieldValue('is_default') });
              }}
              style={{ padding: 0 }}
            >
              Establecer como workspace por defecto
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setCreateModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={creating}
              >
                Crear workspace
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
