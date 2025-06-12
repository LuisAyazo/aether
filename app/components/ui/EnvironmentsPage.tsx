"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Input, Table, message, Space, Tooltip, Popconfirm, Alert, Spin } from 'antd'; // Typography eliminado
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { FolderIcon } from '@heroicons/react/24/outline'; // Importar FolderIcon
import { EnvironmentDefinition } from '@/app/types/deployments'; 
import { useRouter } from 'next/navigation'; 

interface EnvironmentsPageProps {
  companyId: string;
  isPersonalSpace?: boolean; 
}

const { TextArea } = Input;

export default function EnvironmentsPage({ companyId, isPersonalSpace }: EnvironmentsPageProps) { 
  console.log('EnvironmentsPage: COMPONENTE MONTADO/ACTUALIZADO. companyId prop:', companyId, 'isPersonalSpace:', isPersonalSpace); 
  const router = useRouter(); 
  const [environments, setEnvironments] = useState<EnvironmentDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingEnvironment, setEditingEnvironment] = useState<EnvironmentDefinition | null>(null);
  
  const [formValues, setFormValues] = useState<{ name: string; description?: string; path?: string }>({ name: '', path: '' });

  const fetchEnvironments = useCallback(async () => {
    console.log('EnvironmentsPage: fetchEnvironments INICIADO, companyId:', companyId); 
    setLoading(true);
    setFetchError(null); 
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error("Usuario no autenticado. Por favor, inicie sesión.");
        setLoading(false);
        router.push('/login'); 
        return;
      }
      const response = await fetch(`/api/v1/companies/${companyId}/environments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          message.error("Sesión expirada o inválida. Por favor, inicie sesión de nuevo.");
          router.push('/login');
        } else {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch environments and could not parse error response.' }));
          const detail = errorData.detail || 'Failed to fetch environments';
          setFetchError(detail); 
          throw new Error(detail);
        }
        return; 
      }
      const data: EnvironmentDefinition[] = await response.json();
      console.log('EnvironmentsPage: fetchEnvironments DATOS RECIBIDOS:', data); 
      setEnvironments(data);
    } catch (error) {
      console.error("Error fetching environments:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      message.error(`Error al cargar los ambientes: ${errorMessage}`);
      setFetchError(errorMessage); 
    } finally {
      console.log('EnvironmentsPage: fetchEnvironments finally, antes de setLoading(false). Estado actual de loading:', loading);
      setLoading(false);
      console.log('EnvironmentsPage: fetchEnvironments finally, después de setLoading(false).');
    }
  }, [companyId, router]); 

  useEffect(() => {
    console.log('EnvironmentsPage: useEffect para fetchEnvironments. companyId:', companyId); 
    if (companyId) {
      console.log('EnvironmentsPage: useEffect - companyId es válido, llamando a fetchEnvironments.'); 
      fetchEnvironments();
    } else {
      console.log('EnvironmentsPage: useEffect - companyId NO es válido, NO se llama a fetchEnvironments.'); 
      setLoading(false); 
    }
  }, [companyId, fetchEnvironments]);

  useEffect(() => {
    console.log('EnvironmentsPage: Estado environments actualizado:', environments);
  }, [environments]);

  const handleOpenModal = (environment?: EnvironmentDefinition) => {
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

    // Ya no se fuerza el nombre "Sandbox" para el primer ambiente en espacios personales si se crea desde aquí.
    // La creación automática del "Sandbox" ocurre en DashboardPage si no existe ninguno.
    if (isPersonalSpace && environments.length > 0 && !editingEnvironment) {
        message.error("Los espacios personales solo pueden tener un ambiente.");
        return;
    }

    const trimmedPath = formValues.path?.trim();
    const payload = {
      company_id: companyId, 
      name: formValues.name.trim(),
      description: formValues.description?.trim() || null, // Enviar null si está vacío
      path: trimmedPath ? trimmedPath : null, // Enviar null si está vacío para que se actualice en la BD
    };

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error("Usuario no autenticado. Por favor, inicie sesión.");
        setLoading(false);
        router.push('/login');
        return;
      }

      let response;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      if (editingEnvironment) {
        response = await fetch(`/api/v1/companies/${companyId}/environments/${editingEnvironment.id}`, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify(payload), 
        });
      } else {
        response = await fetch(`/api/v1/companies/${companyId}/environments`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload), 
        });
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          message.error("Sesión expirada o inválida. Por favor, inicie sesión de nuevo.");
          router.push('/login');
        } else {
          const errorData = await response.json().catch(() => ({ detail: `Failed to ${editingEnvironment ? 'update' : 'create'} environment and could not parse error.` }));
          throw new Error(errorData.detail || `Failed to ${editingEnvironment ? 'update' : 'create'} environment`);
        }
        return;
      }
      
      message.success(`Ambiente ${editingEnvironment ? 'actualizado' : 'creado'} exitosamente.`);
      fetchEnvironments(); 
      handleCancelModal();

    } catch (error) {
      console.error("Error submitting environment:", error);
      message.error(`Error al ${editingEnvironment ? 'actualizar' : 'crear'} el ambiente: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (envId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error("Usuario no autenticado. Por favor, inicie sesión.");
        setLoading(false);
        router.push('/login');
        return;
      }
      const response = await fetch(`/api/v1/companies/${companyId}/environments/${envId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          message.error("Sesión expirada o inválida. Por favor, inicie sesión de nuevo.");
          router.push('/login');
        } else {
          const errorData = await response.json().catch(() => ({ detail: 'Failed to delete environment and could not parse error.' }));
          throw new Error(errorData.detail || 'Failed to delete environment');
        }
        return;
      }
      message.success("Ambiente eliminado exitosamente.");
      fetchEnvironments();
    } catch (error) {
      console.error("Error deleting environment:", error);
      message.error(`Error al eliminar el ambiente: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: EnvironmentDefinition, b: EnvironmentDefinition) => a.name.localeCompare(b.name),
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
      sorter: (a: EnvironmentDefinition, b: EnvironmentDefinition) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_text: unknown, record: EnvironmentDefinition) => (
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
            <Button type="primary" onClick={fetchEnvironments}>
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
        confirmLoading={loading}
        okText={editingEnvironment ? "Guardar Cambios" : "Crear"}
        cancelText="Cancelar"
        okButtonProps={{disabled: !formValues.name.trim() || !!(isPersonalSpace && environments.length > 0 && !editingEnvironment) }}
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
        {/* Mensaje eliminado: ya no se fuerza el nombre "Sandbox" aquí. */}
        {isPersonalSpace && environments.length > 0 && !editingEnvironment && (
            <p className="text-sm text-red-500 mt-2">Los espacios personales solo pueden tener un ambiente.</p>
        )}
      </Modal>
    </div>
  );
}
