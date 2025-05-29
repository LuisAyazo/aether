"use client";

import React, { useState } from 'react';
import { 
  Cog6ToothIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  KeyIcon,
  ChartBarIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

interface SettingsPageProps {
  companyId?: string;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

export default function SettingsPage({ companyId }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    {
      id: 'deployments',
      label: 'Despliegues',
      description: 'Notificaciones sobre el estado de los despliegues',
      email: true,
      push: true,
      sms: false
    },
    {
      id: 'security',
      label: 'Seguridad',
      description: 'Alertas de seguridad y accesos no autorizados',
      email: true,
      push: true,
      sms: true
    },
    {
      id: 'billing',
      label: 'Facturación',
      description: 'Actualizaciones sobre facturación y pagos',
      email: true,
      push: false,
      sms: false
    },
    {
      id: 'maintenance',
      label: 'Mantenimiento',
      description: 'Ventanas de mantenimiento programado',
      email: true,
      push: true,
      sms: false
    }
  ]);

  const sections = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'profile', name: 'Perfil', icon: UserIcon },
    { id: 'notifications', name: 'Notificaciones', icon: BellIcon },
    { id: 'security', name: 'Seguridad', icon: ShieldCheckIcon },
    { id: 'billing', name: 'Facturación', icon: CreditCardIcon },
    { id: 'api', name: 'API', icon: KeyIcon },
    { id: 'appearance', name: 'Apariencia', icon: PaintBrushIcon }
  ];

  const updateNotification = (id: string, type: 'email' | 'push' | 'sms', value: boolean) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, [type]: value } : notif
      )
    );
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración General</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              defaultValue="Mi Empresa"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zona Horaria
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
              <option>UTC-5 (America/Lima)</option>
              <option>UTC-3 (America/Argentina/Buenos_Aires)</option>
              <option>UTC+0 (Europe/London)</option>
              <option>UTC+1 (Europe/Madrid)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Idioma
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
              <option>Español</option>
              <option>English</option>
              <option>Português</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>PEN (S/)</option>
              <option>ARS ($)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Perfil</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre
            </label>
            <input
              type="text"
              defaultValue="Juan Pérez"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido
            </label>
            <input
              type="text"
              defaultValue="González"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              defaultValue="juan.perez@empresa.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              defaultValue="+51 999 888 777"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo
            </label>
            <input
              type="text"
              defaultValue="DevOps Engineer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preferencias de Notificaciones</h3>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="font-medium text-gray-700">Tipo</div>
            <div className="font-medium text-gray-700 text-center">
              <EnvelopeIcon className="h-5 w-5 mx-auto mb-1" />
              Email
            </div>
            <div className="font-medium text-gray-700 text-center">
              <BellIcon className="h-5 w-5 mx-auto mb-1" />
              Push
            </div>
            <div className="font-medium text-gray-700 text-center">
              <DevicePhoneMobileIcon className="h-5 w-5 mx-auto mb-1" />
              SMS
            </div>
          </div>
          
          {notifications.map((notification) => (
            <div key={notification.id} className="grid grid-cols-4 gap-4 py-3 border-t border-gray-200">
              <div>
                <div className="font-medium text-gray-900">{notification.label}</div>
                <div className="text-sm text-gray-600">{notification.description}</div>
              </div>
              <div className="text-center">
                <input
                  type="checkbox"
                  checked={notification.email}
                  onChange={(e) => updateNotification(notification.id, 'email', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="text-center">
                <input
                  type="checkbox"
                  checked={notification.push}
                  onChange={(e) => updateNotification(notification.id, 'push', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="text-center">
                <input
                  type="checkbox"
                  checked={notification.sms}
                  onChange={(e) => updateNotification(notification.id, 'sms', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Seguridad</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Autenticación de Dos Factores</h4>
              <p className="text-sm text-gray-600">Agrega una capa extra de seguridad a tu cuenta</p>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Habilitado
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Sesiones Activas</h4>
              <p className="text-sm text-gray-600">Gestiona tus sesiones activas en diferentes dispositivos</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ver Sesiones
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Cambiar Contraseña</h4>
              <p className="text-sm text-gray-600">Actualiza tu contraseña regularmente</p>
            </div>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Cambiar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de API</h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Clave API</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type={showApiKey ? "text" : "password"}
                  value="sk-1234567890abcdef1234567890abcdef"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                />
              </div>
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Copiar
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Regenerar
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Usa esta clave para acceder a nuestros APIs. Mantenla segura y no la compartas.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Límites de API</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">1,000</div>
                <div className="text-sm text-gray-600">Solicitudes/hora</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">850</div>
                <div className="text-sm text-gray-600">Usadas este mes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">150</div>
                <div className="text-sm text-gray-600">Restantes</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de Apariencia</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tema
            </label>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="theme" value="light" defaultChecked className="mr-3" />
                <div>
                  <div className="font-medium">Claro</div>
                  <div className="text-sm text-gray-600">Tema claro estándar</div>
                </div>
              </label>
              
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="theme" value="dark" className="mr-3" />
                <div>
                  <div className="font-medium">Oscuro</div>
                  <div className="text-sm text-gray-600">Tema oscuro para los ojos</div>
                </div>
              </label>
              
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="theme" value="auto" className="mr-3" />
                <div>
                  <div className="font-medium">Automático</div>
                  <div className="text-sm text-gray-600">Sigue el sistema</div>
                </div>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Densidad de la Interface
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
              <option>Compacta</option>
              <option>Normal</option>
              <option>Espaciosa</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general':
        return renderGeneralSettings();
      case 'profile':
        return renderProfileSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'security':
        return renderSecuritySettings();
      case 'api':
        return renderApiSettings();
      case 'appearance':
        return renderAppearanceSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Cog6ToothIcon className="h-8 w-8 text-blue-600" />
            Configuración
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona la configuración de tu cuenta y preferencias
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {section.name}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {renderContent()}
              
              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
