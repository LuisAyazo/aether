"use client";

import React, { useState } from 'react';
import { 
  UsersIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  EyeIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  lastActive: string;
  joinedDate: string;
  avatar?: string;
}

interface TeamPageProps {
  companyId?: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    email: 'juan.perez@empresa.com',
    role: 'admin',
    status: 'active',
    lastActive: '2024-01-15T10:30:00Z',
    joinedDate: '2023-06-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'María González',
    email: 'maria.gonzalez@empresa.com',
    role: 'editor',
    status: 'active',
    lastActive: '2024-01-15T09:15:00Z',
    joinedDate: '2023-08-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@empresa.com',
    role: 'viewer',
    status: 'active',
    lastActive: '2024-01-14T16:45:00Z',
    joinedDate: '2023-11-20T00:00:00Z'
  },
  {
    id: '4',
    name: 'Ana Martínez',
    email: 'ana.martinez@empresa.com',
    role: 'editor',
    status: 'pending',
    lastActive: '',
    joinedDate: '2024-01-10T00:00:00Z'
  }
];

const roleConfig = {
  admin: { 
    label: 'Administrador', 
    color: 'text-red-700 bg-red-100', 
    description: 'Acceso completo y gestión de usuarios' 
  },
  editor: { 
    label: 'Editor', 
    color: 'text-blue-700 bg-blue-100', 
    description: 'Puede crear y editar diagramas' 
  },
  viewer: { 
    label: 'Visualizador', 
    color: 'text-green-700 bg-green-100', 
    description: 'Solo puede ver diagramas' 
  }
};

const statusConfig = {
  active: { label: 'Activo', color: 'text-green-600 bg-green-50' },
  pending: { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-50' },
  inactive: { label: 'Inactivo', color: 'text-gray-600 bg-gray-50' }
};

export default function TeamPage({ companyId }: TeamPageProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const filteredMembers = teamMembers.filter(member => {
    const nameMatch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                     member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = selectedRole === 'all' || member.role === selectedRole;
    const statusMatch = selectedStatus === 'all' || member.status === selectedStatus;
    
    return nameMatch && roleMatch && statusMatch;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleInviteUser = () => {
    setIsInviteModalOpen(true);
  };

  const handleRemoveUser = (userId: string) => {
    setTeamMembers(prev => prev.filter(member => member.id !== userId));
  };

  const handleChangeRole = (userId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    setTeamMembers(prev => 
      prev.map(member => 
        member.id === userId ? { ...member, role: newRole } : member
      )
    );
  };

  const getTeamStats = () => {
    const total = teamMembers.length;
    const active = teamMembers.filter(m => m.status === 'active').length;
    const pending = teamMembers.filter(m => m.status === 'pending').length;
    const admins = teamMembers.filter(m => m.role === 'admin').length;
    
    return { total, active, pending, admins };
  };

  const stats = getTeamStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <UsersIcon className="h-8 w-8 text-blue-600" />
                Equipo
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona los miembros de tu equipo y sus permisos
              </p>
            </div>
            <button
              onClick={handleInviteUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserPlusIcon className="h-5 w-5" />
              Invitar Miembro
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Miembros</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <EnvelopeIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Administradores</p>
                <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
              </div>
              <ShieldCheckIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los roles</option>
                <option value="admin">Administrador</option>
                <option value="editor">Editor</option>
                <option value="viewer">Visualizador</option>
              </select>
            </div>
            
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="pending">Pendiente</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div className="space-y-4">
          {filteredMembers.map((member) => {
            const isExpanded = expandedMember === member.id;
            
            return (
              <div
                key={member.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDownIcon 
                          className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      
                      {/* Avatar */}
                      <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {getInitials(member.name)}
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {member.name}
                        </h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Status Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[member.status].color}`}>
                        {statusConfig[member.status].label}
                      </div>
                      
                      {/* Role Badge */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${roleConfig[member.role].color}`}>
                        {roleConfig[member.role].label}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleChangeRole(member.id, e.target.value as 'admin' | 'editor' | 'viewer')}
                          className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        
                        <button
                          onClick={() => {}}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleRemoveUser(member.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Info */}
                  <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      Se unió: {formatDate(member.joinedDate)}
                    </div>
                    {member.lastActive && (
                      <div className="flex items-center gap-2">
                        <EyeIcon className="h-4 w-4" />
                        Última actividad: {formatDate(member.lastActive)}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Permisos</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ver diagramas:</span>
                            <span className="text-green-600">✓</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Crear diagramas:</span>
                            <span className={member.role !== 'viewer' ? 'text-green-600' : 'text-red-600'}>
                              {member.role !== 'viewer' ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gestionar usuarios:</span>
                            <span className={member.role === 'admin' ? 'text-green-600' : 'text-red-600'}>
                              {member.role === 'admin' ? '✓' : '✗'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Actividad Reciente</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div>Editó "Arquitectura Web"</div>
                          <div>Creó "Base de Datos"</div>
                          <div>Comentó en "API Gateway"</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Estadísticas</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Diagramas creados:</span>
                            <span className="text-gray-900">12</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Despliegues:</span>
                            <span className="text-gray-900">8</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Colaboraciones:</span>
                            <span className="text-gray-900">25</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredMembers.length === 0 && (
          <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron miembros
            </h3>
            <p className="text-gray-600 mb-6">
              No hay miembros que coincidan con los filtros seleccionados
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('all');
                setSelectedStatus('all');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        )}

        {/* Invite Modal */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Invitar Nuevo Miembro
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="usuario@empresa.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                    <option value="viewer">Visualizador</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mensaje de bienvenida..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    // Enviar invitación
                    setIsInviteModalOpen(false);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enviar Invitación
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
