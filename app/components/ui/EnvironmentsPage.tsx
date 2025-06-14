"use client";

import React, { useState } from 'react';
import { Button, Modal, Input, Table, message, Space, Tooltip, Popconfirm, Alert, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { FolderIcon } from '@heroicons/react/24/outline';

import { useNavigationStore } from '../../stores/useNavigationStore';
import { Environment, updateEnvironment, createEnvironment } from '../../services/diagramService';

interface EnvironmentsPageProps {
  workspaceId: string;
  isPersonalSpace?: boolean;
}

const { TextArea } = Input;

export default function EnvironmentsPage({ workspaceId, isPersonalSpace }: EnvironmentsPageProps) {
  const {
    environments,
    dataLoading: loading,
    dataError: fetchError,
    handleDeleteEnvironment,
    fetchCurrentWorkspaceEnvironments,
  } = useNavigationStore();

  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingEnvironment, setEditingEnvironment] = useState<Environment | null>(null);
  const [formValues, setFormValues] = useState<{ name: string; description?: string; path?: string }>({ name: '', path: '' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleOpenModal = (environment?: Environment) => {
    if (environment) {
      setEditingEnvironment(environment);
      setFormValues({ name: environment.name, description: environment.description, path: environment.path || '' });
    } else {
      setEditingEnvironment(null);
      setFormValues({ name: '', description: '', path: '' });
    }
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingEnvironment(null);
    setFormValues({ name: '', description: '', path: '' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formValues.name.trim()) {
      message.error("El nombre del ambiente es obligatorio.");
      return;
    }

    if (isPersonalSpace && environments.length > 0 && !editingEnvironment) {
      message.error("Los espacios personales solo pueden tener un ambiente.");
      return;
    }

    const basePayload = {
      name: formValues.name.trim(),
      description: formValues.description?.trim() || '',
      path: formValues.path?.trim() || '',
    };

    setIsSubmitting(true);
    try {
      if (editingEnvironment) {
        await updateEnvironment(workspaceId, editingEnvironment.id, basePayload);
        message.success(`Ambiente actualizado exitosamente.`);
      } else {
        await createEnvironment(workspaceId, basePayload);
        message.success(`Ambiente "${basePayload.name}" creado exitosamente.`);
      }

      await fetchCurrentWorkspaceEnvironments();
      handleCancelModal();

    } catch (error) {
      console.error("Error submitting environment:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`Error al ${editingEnvironment ? 'actualizar' : 'crear'} el ambiente: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (envId: string) => {
    await handleDeleteEnvironment(envId);
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Environment, b: Environment) => a.name.localeCompare(b.name),
    },
    {
      title: 'Directorio',
      dataIndex: 'path',
      key: 'path',
      render: (text: string) => text || '-',
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: 'Creado',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => new Date(text).toLocaleDateString(),
      sorter: (a: Environment, b: Environment) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_text: unknown, record: Environment) => (
        <Space size="middle">
          <Tooltip title="Editar Ambiente">
            <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Popconfirm
            title="¿Estás seguro de eliminar este ambiente?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            disabled={isPersonalSpace && record.name.toLowerCase() === 'sandbox'}
          >
            <Tooltip title={isPersonalSpace && record.name.toLowerCase() === 'sandbox' ? "El ambiente Sandbox no se puede eliminar en espacios personales" : "Eliminar Ambiente"}>
              <Button icon={<DeleteOutlined />} danger disabled={isPersonalSpace && record.name.toLowerCase() === 'sandbox'} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-full p-6">
        <Spin size="large" />
        <p className="mt-3 text-slate-500">Cargando ambientes...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-6 h-full flex flex-col items-center justify-center">
        <Alert
          message="Error al Cargar Ambientes"
          description={fetchError}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          action={
            <Button type="primary" onClick={fetchCurrentWorkspaceEnvironments}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-900 shadow-md rounded-lg h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Gestión de Ambientes</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
          disabled={!!(isPersonalSpace && environments.length >= 1)}
        >
          Crear Ambiente
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={environments}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingEnvironment ? "Editar Ambiente" : "Crear Nuevo Ambiente"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancelModal}
        confirmLoading={isSubmitting}
        okText={editingEnvironment ? "Guardar Cambios" : "Crear"}
        cancelText="Cancelar"
        okButtonProps={{disabled: !formValues.name.trim() || !!(isPersonalSpace && environments.length > 0 && !editingEnvironment) || isSubmitting }}
      >
        <Input
          name="name"
          placeholder="Nombre del Ambiente (ej. Sandbox, desarrollo)"
          value={formValues.name}
          onChange={handleFormChange}
          style={{ marginBottom: 16 }}
          disabled={!!(editingEnvironment && isPersonalSpace && editingEnvironment.name.toLowerCase() === 'sandbox')}
        />
        <TextArea
          name="description"
          placeholder="Descripción del ambiente (opcional)"
          value={formValues.description}
          onChange={handleFormChange}
          rows={3}
          style={{ marginBottom: 16 }}
        />
        <Input
          name="path"
          placeholder="Ruta del directorio (ej. frontend/equipo-a, opcional)"
          value={formValues.path}
          onChange={handleFormChange}
          addonBefore={<FolderIcon className="w-4 h-4 text-gray-400 dark:text-slate-500" />}
          style={{ marginBottom: 4 }}
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Organiza tus ambientes en directorios. Usa "/" para crear subdirectorios. <br/>
          Ejemplos: frontend, backend/servicios, data/analytics
        </p>
        {isPersonalSpace && environments.length > 0 && !editingEnvironment && (
            <p className="text-sm text-red-500 mt-2">Los espacios personales solo pueden tener un ambiente.</p>
        )}
      </Modal>
    </div>
  );
}
